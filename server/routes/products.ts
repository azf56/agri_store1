import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
} from '../controllers/productController.js';
import {
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
} from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { adminProductUpload } from '../middleware/upload.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public Product Catalog Endpoints (No authentication required)
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Protected Admin Product Management Endpoints (Requires Token + Admin Role)
router.post('/', authenticateToken, requireAdmin, uploadRateLimiter, adminProductUpload, adminCreateProduct);
router.put('/:id', authenticateToken, requireAdmin, uploadRateLimiter, adminProductUpload, adminUpdateProduct);
router.delete('/:id', authenticateToken, requireAdmin, adminDeleteProduct);

export default router;
