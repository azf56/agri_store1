import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

// Ensure upload directories exist on server filesystem
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

// Preliminary MIME-type filter based on client HTTP headers
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
 * Validates whether a string URL points to an authorized HTTP(S) location or local /uploads/ directory
 */
export const isValidMediaUrl = (url: unknown): boolean => {
  if (typeof url !== 'string' || !url.trim()) return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/uploads/') ||
    trimmed.startsWith('uploads/')
  );
};

/**
 * Inspects real file content signature (Magic Bytes) to prevent forged MIME-type attacks.
 * Supported:
 * - Images: JPEG (FF D8 FF), PNG (89 50 4E 47 0D 0A 1A 0A), WebP (RIFF....WEBP)
 * - PDF: %PDF- (25 50 44 46 2D)
 */
export const checkMagicBytes = (filePath: string, expectedCategory: 'image' | 'pdf'): boolean => {
  let fd: number | null = null;
  try {
    if (!fs.existsSync(filePath)) return false;
    fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(16);
    const bytesRead = fs.readSync(fd, buffer, 0, 16, 0);

    if (bytesRead < 4) return false;

    if (expectedCategory === 'pdf') {
      // PDF: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
      return (
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46 &&
        buffer[4] === 0x2d
      );
    }

    if (expectedCategory === 'image') {
      // JPEG: FF D8 FF
      if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return true;
      }
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      if (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      ) {
        return true;
      }
      // WebP: RIFF (bytes 0-3) + WEBP (bytes 8-11)
      if (
        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46 &&
        bytesRead >= 12 &&
        buffer.toString('ascii', 8, 12) === 'WEBP'
      ) {
        return true;
      }

      return false;
    }

    return false;
  } catch (err) {
    console.error(`⚠️ [Upload Security] Failed to read magic bytes for ${filePath}:`, err);
    return false;
  } finally {
    if (fd !== null) {
      try {
        fs.closeSync(fd);
      } catch {
        // ignore
      }
    }
  }
};

/**
 * Helper to build an absolute URL for clients and consumers
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

// Raw Multer instance with 10MB overall ceiling
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB absolute ceiling for MSDS documents
  },
});

const rawProductUploadMiddleware = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'image_file', maxCount: 1 },
  { name: 'msds_file', maxCount: 1 },
]);

/**
 * Hardened Admin Product Upload Middleware:
 * 1. Executes multipart parsing
 * 2. Enforces 5MB limit specifically for product image fields (and 10MB for MSDS)
 * 3. Enforces true magic-bytes file signature verification (JPEG, PNG, WebP, PDF)
 * 4. Automatically deletes unauthorized or invalid files from the disk if validation fails
 */
export const adminProductUpload = (req: Request, res: Response, next: NextFunction): void => {
  rawProductUploadMiddleware(req, res, (err: any) => {
    if (err) {
      return next(err);
    }

    // Collect all uploaded files across fields
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const uploadedFileList: Express.Multer.File[] = [];

    if (files) {
      Object.values(files).forEach((arr) => {
        if (Array.isArray(arr)) {
          uploadedFileList.push(...arr);
        }
      });
    } else if (req.file) {
      uploadedFileList.push(req.file);
    }

    // Cleanup helper for aborting upload
    const unlinkAllFiles = () => {
      uploadedFileList.forEach((file) => {
        try {
          if (file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (unlinkErr) {
          console.error(`⚠️ Failed to remove rejected file ${file.path}:`, unlinkErr);
        }
      });
    };

    const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Megabytes
    const MAX_MSDS_SIZE_BYTES = 10 * 1024 * 1024; // 10 Megabytes

    for (const file of uploadedFileList) {
      const isMsds = file.fieldname === 'msds_file' || file.mimetype === 'application/pdf';

      if (isMsds) {
        // 1. Size constraint for MSDS
        if (file.size > MAX_MSDS_SIZE_BYTES) {
          unlinkAllFiles();
          res.status(413).json({
            success: false,
            message: 'حجم برگه اطلاعات ایمنی (MSDS) بیش از حد مجاز (حداکثر ۱۰ مگابایت) است.',
          });
          return;
        }

        // 2. Magic bytes verification for PDF
        if (!checkMagicBytes(file.path, 'pdf')) {
          unlinkAllFiles();
          res.status(400).json({
            success: false,
            message: 'محتوای فایل برگه ایمنی معتبر نیست. امضای فایل با فرمت PDF مطابقت ندارد.',
          });
          return;
        }
      } else {
        // Image field (image, image_file)
        // 1. Specific 5MB size constraint for images
        if (file.size > MAX_IMAGE_SIZE_BYTES) {
          unlinkAllFiles();
          res.status(413).json({
            success: false,
            message: 'حجم تصویر انتخابی بیش از سقف مجاز (حداکثر ۵ مگابایت) است.',
          });
          return;
        }

        // 2. Magic bytes verification for image formats
        if (!checkMagicBytes(file.path, 'image')) {
          unlinkAllFiles();
          res.status(400).json({
            success: false,
            message: 'محتوای فایل تصویر معتبر نیست. امضای فایل با فرمت‌های مجاز تصویری (JPG, PNG, WebP) مطابقت ندارد.',
          });
          return;
        }
      }
    }

    next();
  });
};
