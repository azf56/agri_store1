import { Router, Request, Response } from 'express';
import { sequelize, testConnection } from '../config/database.js';
import { Category, Product, User, Order, Cart } from '../models/index.js';
import { seedDatabase } from '../scripts/seed.js';
import { syncDatabase } from '../scripts/syncDb.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { devError } from '../config/env.js';

const router = Router();

/**
 * GET /api/system/status
 * Returns database connection status, dialect, table counts, and environment specs.
 * Notice: host and database_name are redacted for security.
 */
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const conn = await testConnection();
    
    let categoriesCount = 0;
    let productsCount = 0;
    let usersCount = 0;
    let ordersCount = 0;
    let cartItemsCount = 0;

    if (conn.success) {
      categoriesCount = await Category.count().catch(() => 0);
      productsCount = await Product.count().catch(() => 0);
      usersCount = await User.count().catch(() => 0);
      ordersCount = await Order.count().catch(() => 0);
      cartItemsCount = await Cart.count().catch(() => 0);
    }

    res.json({
      success: true,
      database: {
        connected: conn.success,
        dialect: conn.dialect,
        status: conn.success ? 'operational' : 'disconnected',
        connection_pool: {
          max: 10,
          min: 0,
          idle: 10000,
        },
      },
      stats: {
        categories_count: categoriesCount,
        products_count: productsCount,
        users_count: usersCount,
        orders_count: ordersCount,
        cart_items_count: cartItemsCount,
      },
      environment: {
        node_env: process.env.NODE_ENV || 'development',
        cpanel_compatible: true,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت وضعیت پایگاه داده',
      ...devError(error),
    });
  }
});

/**
 * POST /api/system/sync
 * Manually runs Sequelize sync on database tables.
 * Protected: Requires authenticateToken + requireAdmin
 */
router.post('/sync', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    await syncDatabase({ alter: process.env.NODE_ENV !== 'production' });
    res.json({
      success: true,
      message: 'جداول دیتابیس با موفقیت با مدل‌های Sequelize همگام‌سازی (Sync) شدند.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'خطا در همگام‌سازی جداول دیتابیس',
      ...devError(error),
    });
  }
});

/**
 * POST /api/system/seed
 * Populates database with sample agricultural products, categories and test accounts.
 * Protected: Requires authenticateToken + requireAdmin
 */
router.post('/seed', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await seedDatabase();
    res.json({
      success: true,
      message: 'داده‌های اولیه نمونه با موفقیت در پایگاه داده MySQL/Sequelize درج شدند.',
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'خطا در درج داده‌های نمونه در دیتابیس',
      ...devError(error),
    });
  }
});

export default router;
