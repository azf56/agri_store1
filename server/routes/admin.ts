import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { adminProductUpload } from '../middleware/upload.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';
import {
  getDashboardStats,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminGetAllOrders,
  adminUpdateOrderStatus,
} from '../controllers/adminController.js';

const router = Router();

// =========================================================================
// Global Middleware for ALL /api/v1/admin/* Routes:
// 1. authenticateToken (verify JWT and user existence)
// 2. requireAdmin (strictly verify role === 'admin' directly from MySQL)
// =========================================================================
router.use(authenticateToken);
router.use(requireAdmin);

// 1. Dashboard Statistics
router.get('/dashboard/stats', getDashboardStats);

// 2. Product Management (rate-limited uploads)
router.post('/products', uploadRateLimiter, adminProductUpload, adminCreateProduct);
router.put('/products/:id', uploadRateLimiter, adminProductUpload, adminUpdateProduct);
router.delete('/products/:id', adminDeleteProduct);


// 3. Category Management
router.post('/categories', adminCreateCategory);
router.put('/categories/:id', adminUpdateCategory);
router.delete('/categories/:id', adminDeleteCategory);

// 4. Order Management
router.get('/orders', adminGetAllOrders);
router.put('/orders/:id/status', adminUpdateOrderStatus);

export default router;
