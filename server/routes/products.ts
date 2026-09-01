import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadMedia,
} from '../controllers/productController.js';
import { validate, createProductSchema, updateProductSchema } from '../middleware/validator.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Product CRUD and Media Upload endpoints
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', upload.single('image'), validate(createProductSchema), createProduct);
router.put('/:id', upload.single('image'), validate(updateProductSchema), updateProduct);
router.delete('/:id', deleteProduct);
router.post('/upload', upload.single('file'), uploadMedia);

export default router;
