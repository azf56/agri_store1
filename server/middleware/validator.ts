import Joi, { Schema } from 'joi';
import { Request, Response, NextFunction } from 'express';

/**
 * Express middleware to validate request body, params or query with Joi schema.
 */
export const validate = (schema: Schema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        message: detail.message,
        field: detail.path.join('.'),
      }));
      res.status(400).json({
        success: false,
        message: 'خطا در اعتبارسنجی داده‌های ارسالی',
        errors: details,
      });
      return;
    }

    // Replace request payload with sanitized and validated value
    req[property] = value;
    next();
  };
};

// ==========================================
// Category Validation Schemas
// ==========================================
export const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required().messages({
    'string.empty': 'نام دسته‌بندی الزامی است',
    'string.min': 'نام دسته‌بندی باید حداقل ۲ حرف باشد',
    'any.required': 'نام دسته‌بندی الزامی است',
  }),
  description: Joi.string().trim().allow('', null).max(1000).messages({
    'string.max': 'توضیحات نباید بیشتر از ۱۰۰۰ کاراکتر باشد',
  }),
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).optional().messages({
    'string.min': 'نام دسته‌بندی باید حداقل ۲ حرف باشد',
  }),
  description: Joi.string().trim().allow('', null).max(1000).optional(),
}).min(1);

// ==========================================
// Product Validation Schemas
// ==========================================
export const createProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).required().messages({
    'string.empty': 'نام محصول الزامی است',
    'any.required': 'نام محصول الزامی است',
  }),
  description: Joi.string().trim().allow('', null).optional(),
  price: Joi.number().positive().min(0).required().messages({
    'number.base': 'قیمت محصول باید عدد معتبر باشد',
    'number.min': 'قیمت محصول نمی‌تواند منفی باشد',
    'any.required': 'قیمت محصول به تومان الزامی است',
  }),
  stock: Joi.number().integer().min(0).default(0).messages({
    'number.min': 'موجودی انبار نمی‌تواند منفی باشد',
  }),
  category_id: Joi.number().integer().positive().required().messages({
    'number.base': 'شناسه دسته‌بندی الزامی است',
    'any.required': 'شناسه دسته‌بندی الزامی است',
  }),
  image_url: Joi.string().trim().allow('', null).optional(),
  product_type: Joi.string().valid('کود', 'سم', 'بذر').required().messages({
    'any.only': 'نوع محصول باید یکی از موارد «کود»، «سم» یا «بذر» باشد',
    'any.required': 'نوع محصول (کود، سم، بذر) الزامی است',
  }),
  required_permit_number: Joi.string().trim().allow('', null).max(100).optional(),
  msds_file_url: Joi.string().trim().allow('', null).max(500).optional(),
  brand: Joi.string().trim().allow('', null).max(120).optional(),
  package_size: Joi.string().trim().allow('', null).max(100).optional(),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).optional(),
  description: Joi.string().trim().allow('', null).optional(),
  price: Joi.number().positive().min(0).optional(),
  stock: Joi.number().integer().min(0).optional(),
  category_id: Joi.number().integer().positive().optional(),
  image_url: Joi.string().trim().allow('', null).optional(),
  product_type: Joi.string().valid('کود', 'سم', 'بذر').optional(),
  required_permit_number: Joi.string().trim().allow('', null).max(100).optional(),
  msds_file_url: Joi.string().trim().allow('', null).max(500).optional(),
  brand: Joi.string().trim().allow('', null).max(120).optional(),
  package_size: Joi.string().trim().allow('', null).max(100).optional(),
}).min(1);

// ==========================================
// User & Auth Validation Schemas
// ==========================================
export const registerUserSchema = Joi.object({
  phone_number: Joi.string()
    .pattern(/^09[0-9]{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'شماره موبایل باید یک شماره معتبر ۱۱ رقمی ایرانی باشد (مثال: 09121234567)',
      'any.required': 'شماره موبایل الزامی است',
    }),
  password: Joi.string().min(6).max(100).required().messages({
    'string.min': 'کلمه عبور باید حداقل ۶ کاراکتر باشد',
    'any.required': 'کلمه عبور الزامی است',
  }),
  full_name: Joi.string().trim().min(2).max(150).required().messages({
    'any.required': 'نام و نام خانوادگی کشاورز / کاربر الزامی است',
  }),
  farm_location: Joi.string().trim().allow('', null).max(255).optional(),
});

export const loginUserSchema = Joi.object({
  phone_number: Joi.string().pattern(/^09[0-9]{9}$/).required().messages({
    'string.pattern.base': 'شماره موبایل نامعتبر است',
    'any.required': 'شماره موبایل الزامی است',
  }),
  password: Joi.string().required().messages({
    'any.required': 'کلمه عبور الزامی است',
  }),
});

export const updateProfileSchema = Joi.object({
  full_name: Joi.string().trim().min(2).max(150).optional().messages({
    'string.empty': 'نام و نام خانوادگی نمی‌تواند خالی باشد',
    'string.min': 'نام و نام خانوادگی باید حداقل ۲ حرف باشد',
  }),
  farm_location: Joi.string().trim().allow('', null).max(255).optional(),
}).min(1).messages({
  'object.min': 'حداقل یکی از فیلدهای نام و نام خانوادگی یا موقعیت مزرعه برای ویرایش باید ارسال شود',
});

