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

