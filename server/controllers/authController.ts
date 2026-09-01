import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { User, UserAttributes } from '../models/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'super_secret_jwt_key_for_agri_store_2026_change_in_production';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

/**
 * 1. Register a new user in the MySQL database
 * Route: POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone_number, password, full_name, farm_location } = req.body;

    // Check if phone_number is already registered in MySQL users table
    const existingUser = await User.findOne({
      where: { phone_number },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'این شماره موبایل قبلاً در پایگاه داده ثبت شده است. لطفاً وارد شوید.',
      });
      return;
    }

    // Hash password with bcrypt (10 salt rounds)
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Save new user in MySQL database
    const newUser = await User.create({
      phone_number,
      password_hash,
      full_name,
      farm_location: farm_location || null,
      role: 'customer',
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: newUser.id,
        phone_number: newUser.phone_number,
        role: newUser.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'حساب کاربری کشاورز با موفقیت در پایگاه داده MySQL ایجاد شد',
      token,
      user: {
        id: newUser.id,
        phone_number: newUser.phone_number,
        full_name: newUser.full_name,
        farm_location: newUser.farm_location,
        role: newUser.role,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at,
      },
    });
  } catch (error: any) {
    console.error('❌ Error during user registration:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور در ثبت‌نام کاربر در دیتابیس',
      error: error.message,
    });
  }
};

/**
 * 2. Login user and return JWT token
 * Route: POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone_number, password } = req.body;

    // Search user in MySQL database by phone_number
    const user = await User.findOne({
      where: { phone_number },
    });

    // If user not found, return generic message (prevent user enumeration)
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'شماره موبایل یا رمز عبور اشتباه است',
      });
      return;
    }

    // Compare password with stored bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'شماره موبایل یا رمز عبور اشتباه است',
      });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        phone_number: user.phone_number,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'ورود موفقیت‌آمیز بود',
      token,
      user: {
        id: user.id,
        phone_number: user.phone_number,
        full_name: user.full_name,
        farm_location: user.farm_location,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error: any) {
    console.error('❌ Error during user login:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور در بررسی اطلاعات ورود',
      error: error.message,
    });
  }
};

/**
 * 3. Get current authenticated user profile directly from MySQL
 * Route: GET /api/auth/me
 */
export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: 'کاربر احراز هویت نشده است',
      });
      return;
    }

    // Query MySQL database directly to always get the latest real state
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'کاربر در پایگاه داده MySQL یافت نشد',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'اطلاعات کاربر با موفقیت از پایگاه داده دریافت شد',
      user: user.toJSON(),
    });
  } catch (error: any) {
    console.error('❌ Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور در دریافت اطلاعات کاربر',
      error: error.message,
    });
  }
};

/**
 * 4. Update authenticated user profile in MySQL
 * Route: PUT /api/auth/profile
 */
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: 'کاربر احراز هویت نشده است',
      });
      return;
    }

    const { full_name, farm_location } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'کاربر در پایگاه داده یافت نشد',
      });
      return;
    }

    // Update in MySQL
    await user.update({
      full_name: full_name !== undefined ? full_name : user.full_name,
      farm_location: farm_location !== undefined ? farm_location : user.farm_location,
    });

    // Re-fetch clean updated record from database
    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
    });

    res.status(200).json({
      success: true,
      message: 'اطلاعات پروفایل با موفقیت در پایگاه داده MySQL ذخیره شد',
      user: updatedUser?.toJSON(),
    });
  } catch (error: any) {
    console.error('❌ Error updating profile in MySQL:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور در ویرایش پروفایل',
      error: error.message,
    });
  }
};

/**
 * Helper: List all registered users (for database verification workbench & admin)
 * Route: GET /api/auth/users
 */
export const listUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password_hash'] },
      order: [['id', 'DESC']],
    });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت لیست کاربران',
      error: error.message,
    });
  }
};
