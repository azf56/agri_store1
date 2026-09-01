import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Ensure upload directories exist
const productsUploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
const msdsUploadDir = path.join(process.cwd(), 'public', 'uploads', 'msds');

[productsUploadDir, msdsUploadDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure disk storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    if (file.fieldname === 'msds_file' || file.mimetype === 'application/pdf') {
      cb(null, msdsUploadDir);
    } else {
      cb(null, productsUploadDir);
    }
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBaseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${file.fieldname}-${safeBaseName}-${uniqueSuffix}${ext}`);
  },
});

// File filter for images (jpg, png, webp) and PDF (MSDS)
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedDocTypes = ['application/pdf'];

  if (file.fieldname === 'image' || file.fieldname === 'image_file') {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('فرمت تصویر نامعتبر است. فقط فرمت‌های JPG، PNG و WebP مجاز می‌باشند.'));
    }
  } else if (file.fieldname === 'msds_file') {
    if (allowedDocTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('فرمت برگه اطلاعات ایمنی MSDS باید فایل PDF باشد.'));
    }
  } else {
    cb(null, true);
  }
};

/**
 * Helper to build an absolute URL (for future Android and external consumer support)
 */
export const buildAbsoluteUploadUrl = (req: Request, relativePath: string): string => {
  if (!relativePath) return '';
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  const baseUrlEnv =
    process.env.BASE_URL ||
    process.env.APP_URL ||
    process.env.SERVER_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://api.shop.avinia.ir' : '');
  if (baseUrlEnv) {
    return `${baseUrlEnv.replace(/\/$/, '')}${cleanPath}`;
  }
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host') || 'localhost:3000';
  return `${protocol}://${host}${cleanPath}`;
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB ceiling
  },
});

// Dedicated upload handler for product creation/editing with image and MSDS file
export const adminProductUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'image_file', maxCount: 1 },
  { name: 'msds_file', maxCount: 1 },
]);
