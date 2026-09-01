import { Router } from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../controllers/cartController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// All cart operations require an authenticated user with a valid JWT token
router.use(authenticateToken);

// 1. GET /api/v1/cart - Read user's cart from DB
router.get('/', getCart);

// 2. POST /api/v1/cart - Add product or increment in DB cart
router.post('/', addToCart);

// 3. PUT /api/v1/cart/:itemId - Update item quantity in DB
router.put('/:itemId', updateCartItem);

// 4. DELETE /api/v1/cart/:itemId - Remove specific item from DB
router.delete('/:itemId', removeFromCart);

// 5. DELETE /api/v1/cart - Clear whole cart from DB
router.delete('/', clearCart);

export default router;
