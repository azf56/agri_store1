import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserAttributes } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_agri_store_2026_change_in_production';

export interface AuthenticatedRequest extends Request {
  user?: UserAttributes;
}

/**
 * Middleware to verify JWT token from Authorization header and fetch fresh user record from database.
 * Expected Header: Authorization: Bearer <token>
 */
export const authenticateJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'دسترسی غیرمجاز: لطفاً ابتدا وارد حساب کاربری شوید (توکن Bearer در هدر ارسال نشده است)',
      });
      return;
    }

    const token = authHeader.split(' ')[1]?.trim();
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'دسترسی غیرمجاز: توکن خالی است',
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; phone_number: string; role: 'customer' | 'admin' };

    // Query MySQL database directly on every authenticated request for fresh verification
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash'] },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'کاربر مورد نظر در پایگاه داده یافت نشد یا حذف شده است',
      });
      return;
    }

    req.user = user.toJSON() as UserAttributes;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: 'توکن نامعتبر یا منقضی شده است',
      error: error.message,
    });
  }
};

/**
 * Alias for authenticateJWT as required
 */
export const authenticateToken = authenticateJWT;

/**
 * Optional authentication: If token is provided, decodes user; otherwise continues as guest.
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]?.trim();
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        const user = await User.findByPk(decoded.id, {
          attributes: { exclude: ['password_hash'] },
        });
        if (user) {
          req.user = user.toJSON() as UserAttributes;
        }
      }
    }
    next();
  } catch {
    // Proceed as unauthenticated guest
    next();
  }
};

/**
 * Admin role guard middleware
 * 1. Runs after authenticateToken
 * 2. Checks database (not just decoded token payload) to confirm user role is strictly 'admin'
 * 3. Returns 403 Forbidden if not admin
 */
export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: 'دسترسی غیرمجاز: لطفاً ابتدا وارد حساب کاربری شوید',
      });
      return;
    }

    // Explicitly query the database for fresh user record and role
    const dbUser = await User.findByPk(req.user.id);
    if (!dbUser || dbUser.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'دسترسی ممنوع (403 Forbidden): این بخش منحصراً در اختیار مدیر فروشگاه (Admin) می‌باشد.',
      });
      return;
    }

    // Refresh req.user from DB
    req.user = dbUser.toJSON() as UserAttributes;
    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'خطا در بررسی سطح دسترسی مدیریت در پایگاه داده',
      error: error.message,
    });
  }
};

