import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, registerUserSchema, loginUserSchema, updateProfileSchema } from '../middleware/validator.js';

const router = Router();

/**
 * Rate Limiter for Login Endpoint to prevent brute-force attacks
 * Max 20 attempts per 15 minutes per IP
 */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر مجدداً امتحان کنید.',
  },
});

// 1. POST /api/auth/register - Register new user
router.post('/register', validate(registerUserSchema), authController.register);

// 2. POST /api/auth/login - Login user (rate limited)
router.post('/login', loginRateLimiter, validate(loginUserSchema), authController.login);

// 3. GET /api/auth/me - Get current user profile (Requires Authorization: Bearer <token>)
router.get('/me', authenticateToken, authController.getMe);

// 4. PUT /api/auth/profile - Update user profile in MySQL (Requires Authorization: Bearer <token>)
router.put('/profile', authenticateToken, validate(updateProfileSchema), authController.updateProfile);

// 5. GET /api/auth/users - Helper to view users in database (workbench/admin)
router.get('/users', authController.listUsers);

export default router;
