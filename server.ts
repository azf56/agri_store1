import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { devError } from './server/config/env.js';
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

  // Trust proxy for Cloud Run, Nginx, cPanel reverse proxy environments
  app.set('trust proxy', 1);

  // Apply Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Preserves Vite SPA scripts, CSS, and HMR in dev and production
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows uploaded product images and MSDS documents cross-origin
      frameguard: false, // Permits rendering inside AI Studio preview iframe
    })
  );

  // CORS Configuration
  const defaultAllowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'https://shop.avinia.ir',
    'https://api.shop.avinia.ir',
    '*.run.app',
    '*.googleusercontent.com',
  ];

  const envAllowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  if (isProduction && envAllowedOrigins.length === 0) {
    console.warn('⚠️ [CORS Warning] ALLOWED_ORIGINS environment variable is not defined in production.');
    console.warn(`⚠️ [CORS Warning] Falling back to default allowed production origins: ${defaultAllowedOrigins.join(', ')}`);
  }

  // Active allowed origins: Use ALLOWED_ORIGINS if configured, otherwise default allowed list
  const allowedOriginsList = envAllowedOrigins.length > 0
    ? envAllowedOrigins
    : defaultAllowedOrigins;

  app.use(
    cors({
      origin: (origin, callback) => {
        // Requests with no origin (mobile apps, Postman, curl, server-to-server) remain allowed
        if (!origin) {
          return callback(null, true);
        }


        // Check if incoming origin matches allowed list
        const isAllowed = allowedOriginsList.some((allowed) => {
          if (allowed === origin) return true;
          if (allowed.startsWith('*.') && origin.endsWith(allowed.slice(1))) {
            return true;
          }
          return false;
        });

        if (isAllowed) {
          callback(null, true);
        } else {
          console.warn(`🚫 [CORS Blocked] Request from unauthorized origin: ${origin}`);
          callback(new Error(`دسترسی CORS برای مبدا ${origin} غیرمجاز است.`));
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
    
    // In production, sync WITHOUT alter to prevent dangerous schema modifications on MySQL
    await syncDatabase({ alter: !isProduction });

    // Auto-seed only in development / non-production
    if (!isProduction) {
      const categoriesCount = await Category.count().catch(() => 0);
      const productsCount = await Product.count().catch(() => 0);
      if (categoriesCount === 0 || productsCount === 0) {
        console.log('ℹ️ [Server] Catalog empty on startup. Running initial seed (dev mode)...');
        await seedDatabase();
      }
    } else {
      console.log('🛡️ [Server] Production mode: Automatic seedDatabase is disabled.');
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
      ...(!isProduction && { error: 'Not Found' }),
    });
  });

  // Centralized Error-handling Middleware (Always returns JSON, never HTML)
  app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    // 1. CORS Policy Violation
    if (err && (err.message?.includes('CORS') || err.message?.includes('مبدا') || err.message?.includes('دامنه'))) {
      res.status(403).json({
        success: false,
        message: err.message || 'دسترسی از این مبدأ (Origin) توسط سیاست امنیتی CORS مسدود شد',
        ...devError(err),
      });
      return;
    }

    // 2. Multer Upload Errors (File size limit, invalid field, file count)
    if (err && (err instanceof multer.MulterError || err.name === 'MulterError')) {
      let statusCode = 400;
      let userMessage = 'خطا در بارگذاری فایل ارسالی';

      if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 413;
        userMessage = 'حجم فایل ارسالی بیش از سقف مجاز (۱۰ مگابایت) است';
      } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        statusCode = 400;
        userMessage = `فیلد ارسالی فایل نامعتبر است: ${err.field || 'نامشخص'}`;
      } else if (err.code === 'LIMIT_FILE_COUNT') {
        statusCode = 400;
        userMessage = 'تعداد فایل‌های ارسالی بیش از حد مجاز است';
      }

      console.warn(`⚠️ [Multer Error] ${err.code}: ${err.message}`);
      res.status(statusCode).json({
        success: false,
        message: userMessage,
        ...devError(err),
      });
      return;
    }

    // 3. Multer file filter custom rejection (e.g. non-image or non-pdf)
    if (err && err.message && (err.message.includes('فرمت تصویر') || err.message.includes('فرمت برگه اطلاعات'))) {
      res.status(400).json({
        success: false,
        message: err.message,
        ...devError(err),
      });
      return;
    }

    // 4. JSON Body Parse Error (Malformed JSON payload)
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(400).json({
        success: false,
        message: 'فرمت داده‌های JSON ارسالی نامعتبر است',
        ...devError(err),
      });
      return;
    }

    // 5. Unhandled / Unexpected Server Errors
    console.error('❌ [Central Error Handler] Unhandled exception:', err);
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: statusCode < 500 && err.message ? err.message : 'خطای داخلی سرور رخ داده است',
      ...devError(err),
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

