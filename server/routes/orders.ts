import { Router } from 'express';
import { createOrder, getOrders, getOrderById } from '../controllers/orderController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// All order operations require an authenticated user with a valid JWT token
router.use(authenticateToken);

// 1. POST /api/v1/orders - Convert DB cart to official order via Sequelize transaction
router.post('/', createOrder);

// 2. GET /api/v1/orders - Get user's order history from DB
router.get('/', getOrders);

// 3. GET /api/v1/orders/:orderId - Get single order details with item breakdown
router.get('/:orderId', getOrderById);

export default router;
