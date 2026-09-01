import { Router } from 'express';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { validate, createCategorySchema, updateCategorySchema } from '../middleware/validator.js';

const router = Router();

// Category CRUD endpoints
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.post('/', validate(createCategorySchema), createCategory);
router.put('/:id', validate(updateCategorySchema), updateCategory);
router.delete('/:id', deleteCategory);

export default router;
