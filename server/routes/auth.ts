import { Router } from 'express';
import { loginRateLimiter, registerRateLimiter } from '../middleware/rateLimiter.js';
import * as authController from '../controllers/authController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validate, registerUserSchema, loginUserSchema, updateProfileSchema } from '../middleware/validator.js';

const router = Router();

// 1. POST /api/auth/register - Register new user (rate limited)
router.post('/register', registerRateLimiter, validate(registerUserSchema), authController.register);

// 2. POST /api/auth/login - Login user (rate limited)
router.post('/login', loginRateLimiter, validate(loginUserSchema), authController.login);


// 3. GET /api/auth/me - Get current user profile (Requires Authorization: Bearer <token>)
router.get('/me', authenticateToken, authController.getMe);

// 4. PUT /api/auth/profile - Update user profile in MySQL (Requires Authorization: Bearer <token>)
router.put('/profile', authenticateToken, validate(updateProfileSchema), authController.updateProfile);

// 5. GET /api/auth/users - Protected Admin endpoint to view user list in database
router.get('/users', authenticateToken, requireAdmin, authController.listUsers);

export default router;
