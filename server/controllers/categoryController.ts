import { Request, Response } from 'express';
import { Category, Product } from '../models/index.js';
import { Sequelize } from 'sequelize';
import { devError } from '../config/env.js';

/**
 * Controller for Categories
 */
export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { include_products } = req.query;

    if (include_products === 'true') {
      const categories = await Category.findAll({
        include: [
          {
            model: Product,
            as: 'products',
            attributes: ['id', 'name', 'price', 'stock', 'product_type', 'image_url', 'brand'],
          },
        ],
        order: [['id', 'ASC']],
      });
      res.json({
        success: true,
        count: categories.length,
        data: categories,
      });
      return;
    }

    // Default: return categories with count of products in each category
    const categories = await Category.findAll({
      attributes: {
        include: [
          [Sequelize.fn('COUNT', Sequelize.col('products.id')), 'products_count'],
        ],
      },
      include: [
        {
          model: Product,
          as: 'products',
          attributes: [],
        },
      ],
      group: ['Category.id'],
      order: [['id', 'ASC']],
    });

    res.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت لیست دسته‌بندی‌ها از دیتابیس',
      ...devError(error),
    });
  }
};

export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['id', 'name', 'price', 'stock', 'product_type', 'image_url', 'brand', 'required_permit_number'],
        },
      ],
    });

    if (!category) {
      res.status(404).json({
        success: false,
        message: `دسته‌بندی با شناسه ${id} یافت نشد`,
      });
      return;
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    console.error('Error fetching category by ID:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت اطلاعات دسته‌بندی از دیتابیس',
      ...devError(error),
    });
  }
};

