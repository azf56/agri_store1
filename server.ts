import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import categoriesRouter from './server/routes/categories.js';
import productsRouter from './server/routes/products.js';
import authRouter from './server/routes/auth.js';
import cartRouter from './server/routes/cart.js';
import ordersRouter from './server/routes/orders.js';
import adminRouter from './server/routes/admin.js';
import systemRouter from './server/routes/system.js';
import { testConnection } from './server/config/database.js';
import { syncDatabase } from './server/scripts/syncDb.js';
import { seedDatabase } from './server/scripts/seed.js';
import { Category, Product, User } from './server/models/index.js';

dotenv.config();

// Port configuration (defaults to 3000)
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();

  // Android & Web CORS Configuration for shop.avinia.ir and api.shop.avinia.ir
  const defaultAllowedOrigins = [
    'https://shop.avinia.ir',
    'http://shop.avinia.ir',
    'https://api.shop.avinia.ir',
    'http://api.shop.avinia.ir',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ];

  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
  const configuredOrigins = allowedOriginsEnv
    ? allowedOriginsEnv.split(',').map((origin) => origin.trim())
    : ['*'];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow mobile apps (which have no origin or file://) and configured web origins
        if (
          !origin ||
          configuredOrigins.includes('*') ||
          configuredOrigins.includes(origin) ||
          defaultAllowedOrigins.includes(origin)
        ) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static directory for uploaded files (product images, MSDS pdfs)
  const publicDir = path.join(process.cwd(), 'public');
  const uploadsDir = path.join(publicDir, 'uploads');
  app.use('/uploads', express.static(uploadsDir));
  app.use('/public', express.static(publicDir));

  // Initialize Database & Sync
  try {
    console.log('🚀 [Server] Initializing database connection...');
    await testConnection();
    await syncDatabase({ alter: true });

    // Auto-seed if database is empty on first boot
    const categoriesCount = await Category.count().catch(() => 0);
    const productsCount = await Product.count().catch(() => 0);
    if (categoriesCount === 0 || productsCount === 0) {
      console.log('ℹ️ [Server] Catalog empty on startup. Running initial seed...');
      await seedDatabase();
    }
  } catch (dbErr: any) {
    console.error('⚠️ [Server] Database initialization note:', dbErr.message);
  }

  // ==========================================
  // API Routes (v1 & default prefixes)
  // ==========================================
  // Version 1 routes (Recommended for Android & future integrations)
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/categories', categoriesRouter);
  app.use('/api/v1/products', productsRouter);
  app.use('/api/v1/cart', cartRouter);
  app.use('/api/v1/orders', ordersRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/system', systemRouter);

  // Default routes for backward compatibility
  app.use('/api/auth', authRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/cart', cartRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/system', systemRouter);

  // Health check endpoint
  app.get(['/api/health', '/api/v1/health'], (req, res) => {
    res.json({
      success: true,
      status: 'ok',
      service: 'Agri Inputs Store API (کود، سم، بذر)',
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      cpanel_port: PORT,
    });
  });

  // 404 JSON handler for any unmatched /api routes (prevents returning HTML to API callers)
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `مسیر API یافت نشد: ${req.method} ${req.originalUrl}`,
      error: 'Not Found',
    });
  });

  // ==========================================
  // Frontend Serving (Vite dev middleware or Static dist)
  // ==========================================
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');

    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }

    app.get('*', (req, res) => {
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.json({
          status: 'online',
          service: 'AgriStore REST API Server',
          domain: 'api.shop.avinia.ir',
          frontend_domain: 'shop.avinia.ir',
          health_check: '/api/v1/health',
          message: 'Web service is active and ready for client requests.',
        });
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌿 [AgriStore Server] Listening on http://0.0.0.0:${PORT} (PORT=${PORT})`);
    console.log(`📦 Database-backed API v1 Endpoints:`);
    console.log(`   - POST                /api/v1/auth/register, /api/v1/auth/login`);
    console.log(`   - GET/PUT             /api/v1/auth/me, /api/v1/auth/profile`);
    console.log(`   - GET/POST/PUT/DELETE /api/v1/cart`);
    console.log(`   - POST/GET            /api/v1/orders, /api/v1/orders/:orderId`);
    console.log(`   - GET/POST/PUT/DELETE /api/v1/products, /api/v1/categories`);
  });
}

startServer().catch((err) => {
  console.error('❌ Fatal server startup error:', err);
  process.exit(1);
});

