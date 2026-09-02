import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
} from '../controllers/productController.js';

const router = Router();

// Public Product Catalog Endpoints (No authentication required)
router.get('/', getAllProducts);
router.get('/:id', getProductById);

export default router;

