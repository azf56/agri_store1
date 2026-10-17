import { Request, Response } from 'express';
import { Op } from 'sequelize';
import {
  Product,
  Category,
  Order,
  OrderItem,
  User,
  ProductType,
  OrderStatus,
} from '../models/index.js';
import { buildAbsoluteUploadUrl } from '../middleware/upload.js';
import { devError } from '../config/env.js';


/**
 * Controller for Admin Panel functionalities
 * All endpoints are secured with authenticateToken + requireAdmin
 */

// =========================================================================
// 1. DASHBOARD LIVE STATISTICS (Real MySQL Queries)
// =========================================================================
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const lowStockThreshold = Number(req.query.low_stock_threshold) || 10;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 1. Total Orders count in database
    const totalOrders = await Order.count();

    // 2. Total revenue sum (Sum of total_price for orders not cancelled)
    const rawTotalRevenue = await Order.sum('total_price', {
      where: {
        status: {
          [Op.ne]: 'cancelled',
        },
      },
    });
    const totalRevenue = rawTotalRevenue ? Number(rawTotalRevenue) : 0;

    // 3. Low stock products count
    const lowStockCount = await Product.count({
      where: {
        stock: {
          [Op.lte]: lowStockThreshold,
        },
        is_active: true,
      },
    });

    // 4. New users registered in the last 30 days
    const newUsersLast30Days = await User.count({
      where: {
        created_at: {
          [Op.gte]: thirtyDaysAgo,
        },
      },
    });

    // Supplementary live metrics
    const totalProducts = await Product.count({ where: { is_active: true } });
    const totalUsers = await User.count();

    // Orders breakdown by status (real DB counts)
    const ordersByStatus = {
      pending: await Order.count({ where: { status: 'pending' } }),
      confirmed: await Order.count({ where: { status: 'confirmed' } }),
      processing: await Order.count({ where: { status: 'processing' } }),
      shipped: await Order.count({ where: { status: 'shipped' } }),
      delivered: await Order.count({ where: { status: 'delivered' } }),
      cancelled: await Order.count({ where: { status: 'cancelled' } }),
    };

    // Low stock items list for quick admin restock action
    const lowStockProducts = await Product.findAll({
      where: {
        stock: { [Op.lte]: lowStockThreshold },
        is_active: true,
      },
      attributes: ['id', 'name', 'stock', 'price', 'brand', 'product_type'],
      order: [['stock', 'ASC']],
      limit: 6,
    });

    res.json({
      success: true,
      data: {
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        low_stock_count: lowStockCount,
        new_users_30d: newUsersLast30Days,
        total_products: totalProducts,
        total_users: totalUsers,
        orders_by_status: ordersByStatus,
        low_stock_products: lowStockProducts,
        calculated_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در محاسبه آمار داشبورد از پایگاه داده',
      ...devError(error),
    });
  }
};

// =========================================================================
// 2. PRODUCT MANAGEMENT (CRUD + Image/MSDS Upload + Soft Deactivation)
// =========================================================================
export const adminCreateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      price,
      stock,
      category_id,
      product_type,
      required_permit_number,
      brand,
      package_size,
      image_url: bodyImageUrl,
      msds_file_url: bodyMsdsUrl,
    } = req.body;

    if (!name || !price || !category_id || !product_type) {
      res.status(400).json({
        success: false,
        message: 'فیلدهای نام محصول، قیمت، دسته‌بندی و نوع محصول (کود، سم، بذر) الزامی هستند',
      });
      return;
    }

    // Verify category existence
    const category = await Category.findByPk(category_id);
    if (!category) {
      res.status(400).json({
        success: false,
        message: `دسته‌بندی با شناسه ${category_id} در سیستم موجود نیست`,
      });
      return;
    }

    // Process uploaded files if any
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    let finalImageUrl = bodyImageUrl || null;
    let finalMsdsUrl = bodyMsdsUrl || null;

    if (files) {
      if (files['image'] && files['image'][0]) {
        finalImageUrl = buildAbsoluteUploadUrl(req, `/uploads/products/${files['image'][0].filename}`);
      } else if (files['image_file'] && files['image_file'][0]) {
        finalImageUrl = buildAbsoluteUploadUrl(req, `/uploads/products/${files['image_file'][0].filename}`);
      }

      if (files['msds_file'] && files['msds_file'][0]) {
        finalMsdsUrl = buildAbsoluteUploadUrl(req, `/uploads/msds/${files['msds_file'][0].filename}`);
      }
    } else if (req.file) {
      // Single file fallback
      if (req.file.mimetype === 'application/pdf') {
        finalMsdsUrl = buildAbsoluteUploadUrl(req, `/uploads/msds/${req.file.filename}`);
      } else {
        finalImageUrl = buildAbsoluteUploadUrl(req, `/uploads/products/${req.file.filename}`);
      }
    }

    const newProduct = await Product.create({
      name: name.trim(),
      description: description ? description.trim() : null,
      price: Number(price),
      stock: Number(stock || 0),
      category_id: Number(category_id),
      product_type: product_type as ProductType,
      required_permit_number: required_permit_number ? required_permit_number.trim() : null,
      brand: brand ? brand.trim() : null,
      package_size: package_size ? package_size.trim() : null,
      image_url: finalImageUrl,
      msds_file_url: finalMsdsUrl,
      is_active: true,
    });

    const createdProduct = await Product.findByPk(newProduct.id, {
      include: [{ model: Category, as: 'category' }],
    });

    res.status(201).json({
      success: true,
      message: 'محصول جدید با موفقیت در دیتابیس ثبت شد',
      data: createdProduct,
    });
  } catch (error: any) {
    console.error('Error in adminCreateProduct:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ثبت محصول در دیتابیس',
      ...devError(error),
    });
  }
};

export const adminUpdateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: `محصول با شناسه ${id} یافت نشد`,
      });
      return;
    }

    const {
      name,
      description,
      price,
      stock,
      category_id,
      product_type,
      required_permit_number,
      brand,
      package_size,
      is_active,
      image_url: bodyImageUrl,
      msds_file_url: bodyMsdsUrl,
    } = req.body;

    if (category_id && category_id !== product.category_id) {
      const categoryExists = await Category.findByPk(category_id);
      if (!categoryExists) {
        res.status(400).json({
          success: false,
          message: `دسته‌بندی با شناسه ${category_id} در پایگاه داده یافت نشد`,
        });
        return;
      }
      product.category_id = Number(category_id);
    }

    if (name !== undefined) product.name = name.trim();
    if (description !== undefined) product.description = description ? description.trim() : null;
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);
    if (product_type !== undefined) product.product_type = product_type as ProductType;
    if (required_permit_number !== undefined) product.required_permit_number = required_permit_number ? required_permit_number.trim() : null;
    if (brand !== undefined) product.brand = brand ? brand.trim() : null;
    if (package_size !== undefined) product.package_size = package_size ? package_size.trim() : null;
    if (is_active !== undefined) product.is_active = is_active === 'true' || is_active === true;

    if (bodyImageUrl !== undefined && bodyImageUrl !== '') product.image_url = bodyImageUrl;
    if (bodyMsdsUrl !== undefined && bodyMsdsUrl !== '') product.msds_file_url = bodyMsdsUrl;

    // Check files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    if (files) {
      if (files['image'] && files['image'][0]) {
        product.image_url = buildAbsoluteUploadUrl(req, `/uploads/products/${files['image'][0].filename}`);
      } else if (files['image_file'] && files['image_file'][0]) {
        product.image_url = buildAbsoluteUploadUrl(req, `/uploads/products/${files['image_file'][0].filename}`);
      }

      if (files['msds_file'] && files['msds_file'][0]) {
        product.msds_file_url = buildAbsoluteUploadUrl(req, `/uploads/msds/${files['msds_file'][0].filename}`);
      }
    } else if (req.file) {
      if (req.file.mimetype === 'application/pdf') {
        product.msds_file_url = buildAbsoluteUploadUrl(req, `/uploads/msds/${req.file.filename}`);
      } else {
        product.image_url = buildAbsoluteUploadUrl(req, `/uploads/products/${req.file.filename}`);
      }
    }

    await product.save();

    const updatedProduct = await Product.findByPk(id, {
      include: [{ model: Category, as: 'category' }],
    });

    res.json({
      success: true,
      message: 'اطلاعات محصول با موفقیت در دیتابیس به‌روزرسانی شد',
      data: updatedProduct,
    });
  } catch (error: any) {
    console.error('Error in adminUpdateProduct:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی محصول در دیتابیس',
      ...devError(error),
    });
  }
};

export const adminDeleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: `محصول با شناسه ${id} یافت نشد`,
      });
      return;
    }

    // Check if product is referenced in previous orders
    const orderItemsCount = await OrderItem.count({
      where: { product_id: id },
    });

    if (orderItemsCount > 0) {
      // Deactivate instead of hard delete to preserve order history integrity
      product.is_active = false;
      await product.save();

      res.json({
        success: true,
        action: 'deactivated',
        message: `محصول "${product.name}" در ${orderItemsCount} سطر از سفارش‌های پیشین مشتریان وجود دارد. به منظور حفظ یکپارچگی سوابق حسابداری و سفارشات، این کالا حذف فیزیکی نشد و وضعیت آن به غیرفعال (is_active = false) تغییر یافت.`,
        data: {
          id: product.id,
          name: product.name,
          is_active: false,
          order_references: orderItemsCount,
        },
      });
      return;
    }

    // If not referenced in any orders, hard delete is safe
    await product.destroy();

    res.json({
      success: true,
      action: 'deleted',
      message: `محصول "${product.name}" به طور کامل از دیتابیس حذف گردید.`,
      data: {
        id: Number(id),
      },
    });
  } catch (error: any) {
    console.error('Error in adminDeleteProduct:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در حذف یا غیرفعال‌سازی محصول در دیتابیس',
      ...devError(error),
    });
  }
};

// =========================================================================
// 3. CATEGORY MANAGEMENT
// =========================================================================
export const adminCreateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({
        success: false,
        message: 'نام دسته‌بندی الزامی است',
      });
      return;
    }

    const existing = await Category.findOne({ where: { name: name.trim() } });
    if (existing) {
      res.status(400).json({
        success: false,
        message: 'دسته‌بندی با این نام از قبل وجود دارد',
      });
      return;
    }

    const category = await Category.create({
      name: name.trim(),
      description: description ? description.trim() : null,
    });

    res.status(201).json({
      success: true,
      message: 'دسته‌بندی جدید با موفقیت ایجاد شد',
      data: category,
    });
  } catch (error: any) {
    console.error('Error in adminCreateCategory:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ثبت دسته‌بندی در پایگاه داده',
      ...devError(error),
    });
  }
};

export const adminUpdateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      res.status(404).json({
        success: false,
        message: `دسته‌بندی با شناسه ${id} یافت نشد`,
      });
      return;
    }

    if (name !== undefined) category.name = name.trim();
    if (description !== undefined) category.description = description ? description.trim() : null;

    await category.save();

    res.json({
      success: true,
      message: 'دسته‌بندی با موفقیت به‌روزرسانی شد',
      data: category,
    });
  } catch (error: any) {
    console.error('Error in adminUpdateCategory:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی دسته‌بندی',
      ...devError(error),
    });
  }
};

export const adminDeleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);

    if (!category) {
      res.status(404).json({
        success: false,
        message: `دسته‌بندی با شناسه ${id} یافت نشد`,
      });
      return;
    }

    const linkedProductsCount = await Product.count({
      where: { category_id: id },
    });

    if (linkedProductsCount > 0) {
      res.status(400).json({
        success: false,
        message: `امکان حذف این دسته‌بندی وجود ندارد؛ تعداد ${linkedProductsCount} محصول به آن متصل است. ابتدا محصولات را منتقل یا حذف کنید.`,
      });
      return;
    }

    await category.destroy();

    res.json({
      success: true,
      message: 'دسته‌بندی با موفقیت حذف شد',
      data: { id: Number(id) },
    });
  } catch (error: any) {
    console.error('Error in adminDeleteCategory:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در حذف دسته‌بندی از پایگاه داده',
      ...devError(error),
    });
  }
};

// =========================================================================
// 4. ORDER MANAGEMENT (List with Filters & Pagination + Status Update)
// =========================================================================
export const adminGetAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, page = '1', limit = '15' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 15));
    const offset = (pageNum - 1) * limitNum;

    const whereConditions: any = {};

    if (status && status !== 'all') {
      whereConditions.status = status;
    }

    if (search) {
      const searchTerm = String(search).trim();
      whereConditions[Op.or] = [
        { tracking_code: { [Op.like]: `%${searchTerm}%` } },
        { shipping_address: { [Op.like]: `%${searchTerm}%` } },
      ];
    }

    const { count, rows } = await Order.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'phone_number', 'farm_location'],
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'product_type', 'brand', 'image_url'],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset,
      distinct: true,
    });

    res.json({
      success: true,
      total_count: count,
      total_pages: Math.ceil(count / limitNum),
      current_page: pageNum,
      limit: limitNum,
      data: rows,
    });
  } catch (error: any) {
    console.error('Error in adminGetAllOrders:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت لیست سفارش‌های کاربران از پایگاه داده',
      ...devError(error),
    });
  }
};

export const adminUpdateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `وضعیت سفارش نامعتبر است. مقادیر مجاز: ${validStatuses.join('، ')}`,
      });
      return;
    }

    const order = await Order.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'phone_number'],
        },
      ],
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: `سفارش با شناسه ${id} یافت نشد`,
      });
      return;
    }

    const oldStatus = order.status;
    order.status = status;
    await order.save();

    res.json({
      success: true,
      message: `وضعیت سفارش ${order.tracking_code} با موفقیت از "${oldStatus}" به "${status}" تغییر یافت`,
      data: {
        id: order.id,
        tracking_code: order.tracking_code,
        old_status: oldStatus,
        new_status: order.status,
        updated_at: order.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Error in adminUpdateOrderStatus:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در تغییر وضعیت سفارش در پایگاه داده',
      ...devError(error),
    });
  }
};
