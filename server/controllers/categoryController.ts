import { Request, Response } from 'express';
import { Category, Product } from '../models/index.js';
import { Sequelize } from 'sequelize';

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
      error: error.message,
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
      error: error.message,
    });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;

    const existing = await Category.findOne({ where: { name: name.trim() } });
    if (existing) {
      res.status(409).json({
        success: false,
        message: 'دسته‌بندی با این نام از قبل در سیستم ثبت شده است',
      });
      return;
    }

    const newCategory = await Category.create({
      name: name.trim(),
      description: description ? description.trim() : null,
    });

    res.status(201).json({
      success: true,
      message: 'دسته‌بندی جدید با موفقیت در دیتابیس ایجاد شد',
      data: newCategory,
    });
  } catch (error: any) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ایجاد دسته‌بندی جدید در دیتابیس',
      error: error.message,
    });
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
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

    if (name && name.trim() !== category.name) {
      const duplicate = await Category.findOne({ where: { name: name.trim() } });
      if (duplicate && duplicate.id !== category.id) {
        res.status(409).json({
          success: false,
          message: 'دسته‌بندی دیگری با این نام از قبل وجود دارد',
        });
        return;
      }
      category.name = name.trim();
    }

    if (description !== undefined) {
      category.description = description ? description.trim() : null;
    }

    await category.save();

    res.json({
      success: true,
      message: 'اطلاعات دسته‌بندی با موفقیت به‌روزرسانی شد',
      data: category,
    });
  } catch (error: any) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی دسته‌بندی',
      error: error.message,
    });
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
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

    // Check if any products are associated with this category
    const productsCount = await Product.count({ where: { category_id: id } });
    if (productsCount > 0) {
      res.status(400).json({
        success: false,
        message: `امکان حذف این دسته‌بندی وجود ندارد زیرا دارای ${productsCount} محصول وابسته است. ابتدا محصولات را حذف یا منتقل کنید.`,
      });
      return;
    }

    await category.destroy();

    res.json({
      success: true,
      message: 'دسته‌بندی با موفقیت از دیتابیس حذف شد',
      data: { id: Number(id) },
    });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در حذف دسته‌بندی از دیتابیس',
      error: error.message,
    });
  }
};
