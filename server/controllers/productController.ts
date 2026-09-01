import { Request, Response } from 'express';
import { Product, Category, ProductType } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Controller for Products (Agricultural Inputs: Fertilizer, Pesticide, Seed)
 */

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      category_id,
      product_type,
      search,
      min_price,
      max_price,
      in_stock,
      brand,
      sort,
      page = '1',
      limit = '12',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 12));
    const offset = (pageNum - 1) * limitNum;

    // Build Sequelize where conditions
    const whereConditions: any = {};

    if (category_id) {
      whereConditions.category_id = Number(category_id);
    }

    if (product_type && ['کود', 'سم', 'بذر'].includes(product_type as string)) {
      whereConditions.product_type = product_type as ProductType;
    }

    if (brand) {
      whereConditions.brand = { [Op.like]: `%${brand}%` };
    }

    if (in_stock === 'true') {
      whereConditions.stock = { [Op.gt]: 0 };
    }

    if (min_price || max_price) {
      whereConditions.price = {};
      if (min_price) {
        whereConditions.price[Op.gte] = Number(min_price);
      }
      if (max_price) {
        whereConditions.price[Op.lte] = Number(max_price);
      }
    }

    if (search) {
      const searchTerm = String(search).trim();
      whereConditions[Op.or] = [
        { name: { [Op.like]: `%${searchTerm}%` } },
        { description: { [Op.like]: `%${searchTerm}%` } },
        { brand: { [Op.like]: `%${searchTerm}%` } },
        { required_permit_number: { [Op.like]: `%${searchTerm}%` } },
      ];
    }

    // Determine sorting
    let order: any[] = [['id', 'DESC']];
    if (sort === 'price_asc') {
      order = [['price', 'ASC']];
    } else if (sort === 'price_desc') {
      order = [['price', 'DESC']];
    } else if (sort === 'newest') {
      order = [['created_at', 'DESC']];
    } else if (sort === 'stock') {
      order = [['stock', 'DESC']];
    } else if (sort === 'name') {
      order = [['name', 'ASC']];
    }

    const { count, rows } = await Product.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'description'],
        },
      ],
      order,
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
    console.error('Error in getAllProducts:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت لیست محصولات از پایگاه داده',
      error: error.message,
    });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'description'],
        },
      ],
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: `محصولی با شناسه ${id} یافت نشد`,
      });
      return;
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error('Error in getProductById:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت اطلاعات محصول از پایگاه داده',
      error: error.message,
    });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      price,
      stock,
      category_id,
      image_url,
      product_type,
      required_permit_number,
      msds_file_url,
      brand,
      package_size,
    } = req.body;

    // Verify category exists
    const categoryExists = await Category.findByPk(category_id);
    if (!categoryExists) {
      res.status(400).json({
        success: false,
        message: `دسته‌بندی با شناسه ${category_id} در سیستم وجود ندارد`,
      });
      return;
    }

    // Default image if none provided
    const resolvedImageUrl = image_url || (req.file ? `/uploads/products/${req.file.filename}` : null);

    const newProduct = await Product.create({
      name: name.trim(),
      description: description ? description.trim() : null,
      price: Number(price),
      stock: Number(stock || 0),
      category_id: Number(category_id),
      image_url: resolvedImageUrl,
      product_type,
      required_permit_number: required_permit_number ? required_permit_number.trim() : null,
      msds_file_url: msds_file_url ? msds_file_url.trim() : null,
      brand: brand ? brand.trim() : null,
      package_size: package_size ? package_size.trim() : null,
    });

    // Return created product with its category
    const fullProduct = await Product.findByPk(newProduct.id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'محصول با موفقیت در پایگاه داده ایجاد شد',
      data: fullProduct,
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ذخیره‌سازی محصول در پایگاه داده',
      error: error.message,
    });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      stock,
      category_id,
      image_url,
      product_type,
      required_permit_number,
      msds_file_url,
      brand,
      package_size,
    } = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404).json({
        success: false,
        message: `محصول با شناسه ${id} یافت نشد`,
      });
      return;
    }

    // Verify category if changed
    if (category_id && category_id !== product.category_id) {
      const categoryExists = await Category.findByPk(category_id);
      if (!categoryExists) {
        res.status(400).json({
          success: false,
          message: `دسته‌بندی با شناسه ${category_id} در سیستم وجود ندارد`,
        });
        return;
      }
      product.category_id = Number(category_id);
    }

    if (name !== undefined) product.name = name.trim();
    if (description !== undefined) product.description = description ? description.trim() : null;
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);
    if (image_url !== undefined) product.image_url = image_url;
    if (product_type !== undefined) product.product_type = product_type;
    if (required_permit_number !== undefined) product.required_permit_number = required_permit_number ? required_permit_number.trim() : null;
    if (msds_file_url !== undefined) product.msds_file_url = msds_file_url ? msds_file_url.trim() : null;
    if (brand !== undefined) product.brand = brand ? brand.trim() : null;
    if (package_size !== undefined) product.package_size = package_size ? package_size.trim() : null;

    if (req.file) {
      product.image_url = `/uploads/products/${req.file.filename}`;
    }

    await product.save();

    const updatedProduct = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
      ],
    });

    res.json({
      success: true,
      message: 'محصول با موفقیت در دیتابیس به‌روزرسانی شد',
      data: updatedProduct,
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی محصول در دیتابیس',
      error: error.message,
    });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
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

    await product.destroy();

    res.json({
      success: true,
      message: 'محصول با موفقیت از پایگاه داده حذف شد',
      data: { id: Number(id) },
    });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در حذف محصول از دیتابیس',
      error: error.message,
    });
  }
};

export const uploadMedia = (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'هیچ فایلی برای آپلود ارسال نشده است',
      });
      return;
    }

    const subPath = req.file.fieldname === 'msds_file' || req.file.mimetype === 'application/pdf'
      ? 'msds'
      : 'products';

    const fileUrl = `/uploads/${subPath}/${req.file.filename}`;

    res.json({
      success: true,
      message: 'فایل با موفقیت در سرور آپلود شد',
      data: {
        filename: req.file.filename,
        original_name: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl,
      },
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در بارگذاری فایل در سرور',
      error: error.message,
    });
  }
};
