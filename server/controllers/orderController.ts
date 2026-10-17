import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sequelize, Order, OrderItem, Cart, Product, Category, User } from '../models/index.js';
import { toAbsoluteImageUrl } from '../utils/urlHelper.js';
import { devError } from '../config/env.js';


/**
 * Helper to generate an official Iranian tracking code
 */
function generateTrackingCode(): string {
  const timestamp = Date.now().toString().slice(-6);
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `AGRI-${timestamp}-${randomDigits}`;
}

/**
 * 1. POST /api/v1/orders
 * Converts the current user's DB cart into an official order.
 * Strictly uses a Sequelize Transaction to guarantee ACID compliance & data integrity.
 * Reads actual product price from database (never trusts client price).
 * Deducts stock from products and clears the user's DB cart.
 */
export const createOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'دسترسی غیرمجاز: لطفاً ابتدا وارد حساب کاربری شوید',
    });
    return;
  }

  const { shipping_address: providedAddress } = req.body;
  const shippingAddress =
    providedAddress && typeof providedAddress === 'string' && providedAddress.trim().length > 0
      ? providedAddress.trim()
      : req.user?.farm_location || 'ثبت شده توسط کشاورز';

  // Start Sequelize Transaction
  const transaction = await sequelize.transaction();

  try {
    // 1. Fetch user's cart from database inside the transaction with ROW LOCK (prevents concurrent double-order creation)
    const cartItems = await Cart.findAll({
      where: { user_id: userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!cartItems || cartItems.length === 0) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: 'سبد خرید شما در پایگاه داده خالی است. لطفاً ابتدا محصولاتی را به سبد خرید اضافه کنید.',
      });
      return;
    }

    let calculatedGrandTotal = 0;
    const itemsToCreate: Array<{
      product_id: number;
      quantity: number;
      unit_price: number;
      product_name: string;
      productInstance: Product;
    }> = [];

    // 2. Validate every cart item against active status, stock and price in DB with row lock
    for (const cartItem of cartItems) {
      const product = await Product.findByPk(cartItem.product_id, {
        transaction,
        lock: transaction.LOCK.UPDATE, // Lock product row for update during transaction to prevent race conditions
      });

      if (!product) {
        await transaction.rollback();
        res.status(400).json({
          success: false,
          message: `کالای با شناسه ${cartItem.product_id} در پایگاه داده موجود نیست یا حذف گردیده است`,
        });
        return;
      }

      // Check if product is active
      if (!product.is_active) {
        await transaction.rollback();
        res.status(400).json({
          success: false,
          message: `ثبت سفارش ناموفق بود: کالای «${product.name}» در حال حاضر غیرفعال است و امکان خرید آن وجود ندارد`,
        });
        return;
      }

      // Check stock availability
      if (product.stock < cartItem.quantity || product.stock <= 0) {
        await transaction.rollback();
        res.status(400).json({
          success: false,
          message: `ثبت سفارش ناموفق بود: موجودی کالای «${product.name}» ناکافی است. (موجودی فعلی در انبار: ${product.stock} عدد، تعداد در سبد شما: ${cartItem.quantity} عدد)`,
        });
        return;
      }

      // Read real price strictly from DB (Immune to client-side manipulation)
      const realUnitPrice = Number(product.price);
      const lineTotal = realUnitPrice * cartItem.quantity;
      calculatedGrandTotal += lineTotal;

      itemsToCreate.push({
        product_id: product.id,
        quantity: cartItem.quantity,
        unit_price: realUnitPrice,
        product_name: product.name,
        productInstance: product,
      });
    }

    // 3. Create the master Order record in DB with retry on unique tracking_code collision
    let newOrder: Order | null = null;
    let attempts = 0;
    const maxAttempts = 5;

    while (!newOrder && attempts < maxAttempts) {
      attempts++;
      const trackingCode = generateTrackingCode();
      try {
        newOrder = await Order.create(
          {
            user_id: userId,
            total_price: calculatedGrandTotal,
            status: 'pending',
            shipping_address: shippingAddress,
            tracking_code: trackingCode,
          },
          { transaction }
        );
      } catch (err: any) {
        const isConstraintError =
          err.name === 'SequelizeUniqueConstraintError' ||
          err.parent?.code === 'ER_DUP_ENTRY' ||
          err.message?.includes('tracking_code');
        if (attempts < maxAttempts && isConstraintError) {
          console.warn(`[Order] Duplicate tracking_code collision (${trackingCode}), retrying attempt ${attempts + 1}...`);
          continue;
        }
        throw err;
      }
    }

    if (!newOrder) {
      await transaction.rollback();
      res.status(500).json({
        success: false,
        message: 'خطا در ایجاد کد رهگیری منحصر‌به‌فرد سفارش در پایگاه داده',
      });
      return;
    }

    // 4. Create OrderItem records and execute atomic decrement on product stock
    for (const item of itemsToCreate) {
      // Create OrderItem
      await OrderItem.create(
        {
          order_id: newOrder.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        },
        { transaction }
      );

      // Atomic decrement of product stock in Product table
      await item.productInstance.decrement('stock', {
        by: item.quantity,
        transaction,
      });
    }

    // 5. Clear all items from the user's DB Cart
    await Cart.destroy({
      where: { user_id: userId },
      transaction,
    });

    // 6. Commit transaction atomically
    await transaction.commit();

    console.log(`✅ [Order] Successfully placed order #${newOrder.id} (${newOrder.tracking_code}) for user #${userId}`);

    // Fetch full order data to return in response
    const createdOrderWithDetails = await Order.findByPk(newOrder.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
            },
          ],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'phone_number', 'full_name', 'farm_location'],
        },
      ],
    });

    // Format absolute image URLs
    const formattedOrder = createdOrderWithDetails?.toJSON() as any;
    if (formattedOrder && formattedOrder.items) {
      formattedOrder.items.forEach((it: any) => {
        if (it.product && it.product.image_url) {
          it.product.image_url = toAbsoluteImageUrl(req, it.product.image_url);
        }
      });
    }

    res.status(201).json({
      success: true,
      message: `سفارش شما با کد پیگیری ${newOrder.tracking_code} با موفقیت در سیستم ثبت گردید`,
      data: formattedOrder || newOrder,
    });
  } catch (error: any) {
    // Ensure rollback on any unexpected runtime error
    if (transaction) {
      await transaction.rollback().catch(() => {});
    }
    console.error('❌ [OrderController] Transaction failed:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سیستمی در ثبت تراکنش سفارش در پایگاه داده',
      ...devError(error),
    });
  }
};

/**
 * 2. GET /api/v1/orders
 * Returns list of orders for the authenticated user, sorted by newest first.
 */
export const getOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'دسترسی غیرمجاز: لطفاً وارد شوید',
      });
      return;
    }

    // Explicitly verify admin role from MySQL database if ?all=true is requested
    let isUserAdmin = false;
    if (req.query.all === 'true') {
      const dbUser = await User.findByPk(userId);
      isUserAdmin = dbUser?.role === 'admin';
    }

    const whereClause = isUserAdmin && req.query.all === 'true' ? {} : { user_id: userId };

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
            },
          ],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'phone_number', 'full_name', 'farm_location'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    const formattedOrders = orders.map((order) => {
      const json = order.toJSON() as any;
      if (json.items) {
        json.items.forEach((it: any) => {
          if (it.product && it.product.image_url) {
            it.product.image_url = toAbsoluteImageUrl(req, it.product.image_url);
          }
        });
      }
      return json;
    });

    res.status(200).json({
      success: true,
      data: formattedOrders,
    });
  } catch (error: any) {
    console.error('❌ [OrderController] Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در واکشی فهرست سفارش‌ها از دیتابیس',
      ...devError(error),
    });
  }
};

/**
 * 3. GET /api/v1/orders/:orderId
 * Fetches single order details by ID, ensuring user ownership or admin permission.
 */
export const getOrderById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const orderId = parseInt(req.params.orderId, 10);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'دسترسی غیرمجاز',
      });
      return;
    }

    if (isNaN(orderId) || orderId <= 0) {
      res.status(400).json({
        success: false,
        message: 'شناسه سفارش نامعتبر است',
      });
      return;
    }

    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
            },
          ],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'phone_number', 'full_name', 'farm_location'],
        },
      ],
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'سفارش مورد نظر در پایگاه داده یافت نشد',
      });
      return;
    }

    // Authorization check: User can only view their own order, unless admin
    if (order.user_id !== userId && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'دسترسی غیرمجاز: شما اجازه مشاهده این سفارش را ندارید',
      });
      return;
    }

    const formattedOrder = order.toJSON() as any;
    if (formattedOrder.items) {
      formattedOrder.items.forEach((it: any) => {
        if (it.product && it.product.image_url) {
          it.product.image_url = toAbsoluteImageUrl(req, it.product.image_url);
        }
      });
    }

    res.status(200).json({
      success: true,
      data: formattedOrder,
    });
  } catch (error: any) {
    console.error('❌ [OrderController] Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت جزئیات سفارش',
      ...devError(error),
    });
  }
};
