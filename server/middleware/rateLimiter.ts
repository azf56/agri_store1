import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter for Login Endpoint to prevent brute-force credential stuffing
 * Max 20 attempts per 15 minutes per IP
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    default: false,
  },
  message: {
    success: false,
    message: 'تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر مجدداً امتحان کنید.',
  },
});

/**
 * Rate Limiter for User Registration to prevent account creation spam & bots
 * Max 10 registration requests per 15 minutes per IP
 */
export const registerRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    default: false,
  },
  message: {
    success: false,
    message: 'تعداد درخواست‌های ثبت‌نام بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر مجدداً تلاش کنید.',
  },
});

/**
 * Rate Limiter for File Uploads (Product Images, MSDS documents)
 * Max 30 upload requests per 15 minutes per IP
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    default: false,
  },
  message: {
    success: false,
    message: 'تعداد درخواست‌های آپلود فایل بیش از حد مجاز است. لطفاً کمی بعد مجدداً تلاش فرمایید.',
  },
});
