import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Cart, Product, Category } from '../models/index.js';
import { toAbsoluteImageUrl } from '../utils/urlHelper.js';
import { devError } from '../config/env.js';


/**
 * Helper function to retrieve and calculate the full user cart directly from MySQL database.
 */
export async function getFullCartData(userId: number, req: AuthenticatedRequest) {
  const cartItems = await Cart.findAll({
    where: { user_id: userId },
    include: [
      {
        model: Product,
        as: 'product',
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name'],
          },
        ],
      },
    ],
    order: [['created_at', 'DESC']],
  });

  let totalPrice = 0;
  let totalQuantity = 0;

  const formattedItems = cartItems.map((item) => {
    const product = item.product;
    const unitPrice = product ? Number(product.price) : 0;
    const quantity = item.quantity;
    const lineTotal = unitPrice * quantity;

    totalPrice += lineTotal;
    totalQuantity += quantity;

    return {
      id: item.id,
      user_id: item.user_id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: unitPrice,
      line_total: lineTotal,
      created_at: item.created_at,
      updated_at: item.updated_at,
      product: product
        ? {
            id: product.id,
            name: product.name,
            price: Number(product.price),
            stock: product.stock,
            category_id: product.category_id,
            category_name: product.category?.name || 'عمومی',
            product_type: product.product_type,
            brand: product.brand,
            package_size: product.package_size,
            required_permit_number: product.required_permit_number,
            image_url: toAbsoluteImageUrl(req, product.image_url),
            in_stock: product.stock >= item.quantity,
          }
        : null,
    };
  });

  return {
    items: formattedItems,
    summary: {
      total_items: formattedItems.length,
      total_quantity: totalQuantity,
      total_price: totalPrice,
      currency: 'تومان',
      total_price_formatted: `${totalPrice.toLocaleString('fa-IR')} تومان`,
    },
  };
}

/**
 * 1. GET /api/v1/cart
 * Fetches the authenticated user's cart from the database Cart table,
 * joined with Product and Category details.
 */
export const getCart = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'دسترسی غیرمجاز: لطفاً وارد شوید',
      });
      return;
    }

    const cartData = await getFullCartData(userId, req);

    res.status(200).json({
      success: true,
      data: cartData,
    });
  } catch (error: any) {
    console.error('❌ [CartController] Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در واکشی اطلاعات سبد خرید از پایگاه داده',
      ...devError(error),
    });
  }
};

/**
 * 2. POST /api/v1/cart
 * Adds a product to user's cart in the MySQL database.
 * Returns the updated complete cart data structure.
 */
export const addToCart = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'دسترسی غیرمجاز: لطفاً ابتدا وارد حساب کاربری خود شوید',
      });
      return;
    }

    const { product_id, quantity: rawQuantity } = req.body;
    const productId = parseInt(product_id, 10);
    const quantity = parseInt(rawQuantity, 10) || 1;

    if (!productId || isNaN(productId) || productId <= 0) {
      res.status(400).json({
        success: false,
        message: 'شناسه محصول نامعتبر است',
      });
      return;
    }

    if (quantity <= 0 || isNaN(quantity)) {
      res.status(400).json({
        success: false,
        message: 'تعداد درخواستی باید عددی مثبت و حداقل ۱ باشد',
      });
      return;
    }

    // Verify product exists in database, is active, and has sufficient stock
    const product = await Product.findByPk(productId);
    if (!product) {
      res.status(404).json({
        success: false,
        message: 'محصول مورد نظر در انبار پایگاه داده یافت نشد',
      });
      return;
    }

    if (!product.is_active) {
      res.status(400).json({
        success: false,
        message: `محصول «${product.name}» در حال حاضر غیرفعال است و امکان افزودن آن به سبد خرید وجود ندارد`,
      });
      return;
    }

    if (product.stock <= 0) {
      res.status(400).json({
        success: false,
        message: `محصول «${product.name}» در حال حاضر ناموجود است (موجودی: ۰)`,
      });
      return;
    }

    if (product.stock < quantity) {
      res.status(400).json({
        success: false,
        message: `موجودی انبار کافی نیست. حداکثر موجودی قابل سفارش: ${product.stock} عدد`,
      });
      return;
    }

    // Check if item already exists in user's cart in DB
    const existingCartItem = await Cart.findOne({
      where: {
        user_id: userId,
        product_id: productId,
      },
    });

    if (existingCartItem) {
      const newTotalQuantity = existingCartItem.quantity + quantity;

      if (newTotalQuantity > product.stock) {
        res.status(400).json({
          success: false,
          message: `مجموع تعداد درخواستی (${newTotalQuantity}) از موجودی انبار (${product.stock}) بیشتر است`,
        });
        return;
      }

      await existingCartItem.update({ quantity: newTotalQuantity });
    } else {
      await Cart.create({
        user_id: userId,
        product_id: productId,
        quantity: quantity,
      });
    }

    const fullCart = await getFullCartData(userId, req);

    res.status(201).json({
      success: true,
      message: `محصول «${product.name}» با موفقیت در سبد خرید دیتابیس ثبت شد`,
      data: fullCart,
    });
  } catch (error: any) {
    console.error('❌ [CartController] Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ثبت محصول در سبد خرید پایگاه داده',
      ...devError(error),
    });
  }
};

/**
 * 3. PUT /api/v1/cart/:itemId
 * Updates the quantity of a specific cart item in the database.
 * Returns the updated complete cart data structure.
 */
export const updateCartItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const itemId = parseInt(req.params.itemId, 10);
    const { quantity: rawQuantity } = req.body;
    const quantity = parseInt(rawQuantity, 10);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'دسترسی غیرمجاز',
      });
      return;
    }

    if (isNaN(itemId) || itemId <= 0) {
      res.status(400).json({
        success: false,
        message: 'شناسه آیتم سبد خرید نامعتبر است',
      });
      return;
    }

    if (isNaN(quantity) || quantity <= 0) {
      res.status(400).json({
        success: false,
        message: 'تعداد محصول باید حداقل ۱ باشد. برای حذف از دکمه حذف استفاده کنید',
      });
      return;
    }

    const cartItem = await Cart.findOne({
      where: { id: itemId, user_id: userId },
      include: [{ model: Product, as: 'product' }],
    });

    if (!cartItem) {
      res.status(404).json({
        success: false,
        message: 'آیتم مورد نظر در سبد خرید شما یافت نشد',
      });
      return;
    }

    const product = cartItem.product;
    if (!product) {
      res.status(404).json({
        success: false,
        message: 'محصول مرتبط با این آیتم در پایگاه داده یافت نشد',
      });
      return;
    }

    if (!product.is_active) {
      res.status(400).json({
        success: false,
        message: `محصول «${product.name}» غیرفعال شده است و امکان ویرایش آن در سبد خرید وجود ندارد`,
      });
      return;
    }

    if (quantity > product.stock) {
      res.status(400).json({
        success: false,
        message: `تعداد درخواستی (${quantity}) بیشتر از موجودی انبار (${product.stock}) است`,
      });
      return;
    }

    await cartItem.update({ quantity });

    const fullCart = await getFullCartData(userId, req);

    res.status(200).json({
      success: true,
      message: 'تعداد محصول در سبد خرید با موفقیت به‌روزرسانی شد',
      data: fullCart,
    });
  } catch (error: any) {
    console.error('❌ [CartController] Error updating cart item:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی سبد خرید',
      ...devError(error),
    });
  }
};

/**
 * 4. DELETE /api/v1/cart/:itemId
 * Removes an item from the user's cart in the database.
 * Returns the updated complete cart data structure.
 */
export const removeFromCart = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const itemId = parseInt(req.params.itemId, 10);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'دسترسی غیرمجاز',
      });
      return;
    }

    if (isNaN(itemId) || itemId <= 0) {
      res.status(400).json({
        success: false,
        message: 'شناسه آیتم نامعتبر است',
      });
      return;
    }

    const deletedCount = await Cart.destroy({
      where: {
        id: itemId,
        user_id: userId,
      },
    });

    if (deletedCount === 0) {
      res.status(404).json({
        success: false,
        message: 'آیتم مورد نظر در سبد خرید شما یافت نشد یا قبلاً حذف شده است',
      });
      return;
    }

    const fullCart = await getFullCartData(userId, req);

    res.status(200).json({
      success: true,
      message: 'محصول با موفقیت از سبد خرید حذف شد',
      data: fullCart,
    });
  } catch (error: any) {
    console.error('❌ [CartController] Error removing item from cart:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در حذف آیتم از سبد خرید',
      ...devError(error),
    });
  }
};

/**
 * 5. DELETE /api/v1/cart
 * Clears all items in the user's cart in the database.
 * Returns the updated empty cart data structure.
 */
export const clearCart = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'دسترسی غیرمجاز',
      });
      return;
    }

    const count = await Cart.destroy({
      where: { user_id: userId },
    });

    const fullCart = await getFullCartData(userId, req);

    res.status(200).json({
      success: true,
      message: `سبد خرید شما تخلیه شد (${count} آیتم حذف گردید)`,
      data: fullCart,
    });
  } catch (error: any) {
    console.error('❌ [CartController] Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در پاکسازی سبد خرید',
      ...devError(error),
    });
  }
};
