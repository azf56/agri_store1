import { Router } from 'express';
import {
  getAllCategories,
  getCategoryById,
} from '../controllers/categoryController.js';

const router = Router();

// Public Category Endpoints (No authentication required)
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

export default router;

