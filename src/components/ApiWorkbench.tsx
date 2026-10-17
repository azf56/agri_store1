import React, { useState } from 'react';
import { Code2, Play, Copy, Check, Send, Sparkles, Terminal, Key, ShieldCheck } from 'lucide-react';
import { apiFetch } from '../config/api';

interface EndpointDoc {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  title: string;
  category: 'auth' | 'admin' | 'products' | 'categories' | 'cart' | 'orders' | 'system';
  description: string;
  defaultBody?: any;
  defaultParams?: string;
  requiresAuth?: boolean;
}

export const ApiWorkbench: React.FC = () => {
  const endpoints: EndpointDoc[] = [
    // Admin Panel Endpoints (Require authenticateToken + requireAdmin)
    {
      method: 'GET',
      path: '/api/v1/admin/dashboard/stats',
      title: 'آمار زنده داشبورد مدیریت (GET /api/v1/admin/dashboard/stats)',
      category: 'admin',
      requiresAuth: true,
      description: 'محاسبه بلادرنگ از دیتابیس MySQL: ۱. تعداد کل سفارش‌ها ۲. مجموع فروش فاکتورها ۳. اقلام با موجودی بحرانی (کمتر از ۱۰) ۴. کاربران ثبت‌نامی ۳۰ روز اخیر',
      defaultParams: '?low_stock_threshold=10',
    },
    {
      method: 'GET',
      path: '/api/v1/admin/orders',
      title: 'لیست تمام سفارش‌های کاربران (GET /api/v1/admin/orders)',
      category: 'admin',
      requiresAuth: true,
      description: 'استعلام تمام سفارش‌ها با امکان فیلتر status (pending, confirmed, processing, shipped, delivered, cancelled) و صفحه‌بندی limit و page',
      defaultParams: '?status=all&limit=20&page=1',
    },
    {
      method: 'PUT',
      path: '/api/v1/admin/orders/1/status',
      title: 'تغییر وضعیت سفارش در دیتابیس (PUT /api/v1/admin/orders/:id/status)',
      category: 'admin',
      requiresAuth: true,
      description: 'به‌روزرسانی فیلد status در جدول Order با اعتبارسنجی مقادیر مجاز ENUM',
      defaultBody: {
        status: 'processing',
      },
    },
    {
      method: 'POST',
      path: '/api/v1/admin/products',
      title: 'افزودن محصول جدید توسط مدیر (POST /api/v1/admin/products)',
      category: 'admin',
      requiresAuth: true,
      description: 'ثبت محصول جدید همراه با ذخیره تصویر در /uploads/products و فایل برگه ایمنی MSDS در /uploads/msds و محاسبه آدرس‌های مطلق',
      defaultBody: {
        name: 'کود زیستی فسفاته بارور-۲ (بسته ۱۰۰ گرمی)',
        description: 'حاوی باکتری‌های حل‌کننده فسفات نامحلول خاک و افزایش جذب فسفر توسط ریشه گیاه',
        price: 320000,
        stock: 45,
        category_id: 1,
        product_type: 'کود',
        required_permit_number: 'کود-۴۵۱۱/زیست-۱۴۰۱',
        brand: 'زیست فناور سبز',
        package_size: 'بسته ۱۰۰ گرمی پودری',
        image_url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
        msds_file_url: '/uploads/msds/msds-npk-20-20-20.pdf',
      },
    },
    {
      method: 'PUT',
      path: '/api/v1/admin/products/1',
      title: 'ویرایش اطلاعات محصول توسط مدیر (PUT /api/v1/admin/products/:id)',
      category: 'admin',
      requiresAuth: true,
      description: 'به‌روزرسانی فیلدهای محصول و تغییر موجودی انبار در MySQL',
      defaultBody: {
        price: 1050000,
        stock: 80,
        package_size: 'کیسه ۱۰ کیلوگرمی استاندارد',
      },
    },
    {
      method: 'DELETE',
      path: '/api/v1/admin/products/1',
      title: 'حذف یا غیرفعال‌سازی ایمن محصول (DELETE /api/v1/admin/products/:id)',
      category: 'admin',
      requiresAuth: true,
      description: 'در صورت وجود این کالا در سوابق سفارشات قبلی مشتریان، جهت جلوگیری از تخریب یکپارچگی سوابق به جای حذف کامل، وضعیت به is_active = false تغییر می‌یابد.',
    },
    {
      method: 'POST',
      path: '/api/v1/admin/categories',
      title: 'افزودن دسته‌بندی جدید (POST /api/v1/admin/categories)',
      category: 'admin',
      requiresAuth: true,
      description: 'درج دسته‌بندی جدید در جدول categories دیتابیس',
      defaultBody: {
        name: 'ادوات تغذیه و محلول‌پاشی تخصصی',
        description: 'انواع سورفکتانت‌ها، مویان‌ها و تنظیم‌کننده‌های pH آب سمپاشی',
      },
    },
    {
      method: 'PUT',
      path: '/api/v1/admin/categories/1',
      title: 'ویرایش دسته‌بندی (PUT /api/v1/admin/categories/:id)',
      category: 'admin',
      requiresAuth: true,
      description: 'به‌روزرسانی نام یا توضیحات دسته‌بندی در دیتابیس',
      defaultBody: {
        name: 'کودهای شیمیایی، ارگانیک و بیولوژیک',
        description: 'کودهای کامل NPK، کلات‌ها و باکتری‌های همزیست تقویت ریشه',
      },
    },
    {
      method: 'DELETE',
      path: '/api/v1/admin/categories/4',
      title: 'حذف دسته‌بندی (DELETE /api/v1/admin/categories/:id)',
      category: 'admin',
      requiresAuth: true,
      description: 'حذف دسته‌بندی با بررسی اولیه جهت عدم وجود محصولات متصل',
    },
    // Cart Endpoints (Database Persisted)
    {
      method: 'GET',
      path: '/api/v1/cart',
      title: 'دریافت سبد خرید کاربر از دیتابیس (GET /api/v1/cart)',
      category: 'cart',
      requiresAuth: true,
      description: 'استعلام تمام اقلام سبد خرید مستقیماً از جدول Cart در MySQL همراه با اطلاعات قیمت و جزئیات کالا و محاسبه مجموع ردیف‌ها',
    },
    {
      method: 'POST',
      path: '/api/v1/cart',
      title: 'افزودن کالا به سبد خرید در دیتابیس (POST /api/v1/cart)',
      category: 'cart',
      requiresAuth: true,
      description: 'افزودن محصول یا تجمیع با رکورد قبلی در جدول Cart، همراه با بررسی دقیق موجودی انبار (stock) در دیتابیس',
      defaultBody: {
        product_id: 1,
        quantity: 2,
      },
    },
    {
      method: 'PUT',
      path: '/api/v1/cart/1',
      title: 'ویرایش تعداد کالا در سبد خرید (PUT /api/v1/cart/:itemId)',
      category: 'cart',
      requiresAuth: true,
      description: 'به‌روزرسانی فیلد quantity در جدول Cart با کنترل مجدد موجودی انبار',
      defaultBody: {
        quantity: 5,
      },
    },
    {
      method: 'DELETE',
      path: '/api/v1/cart/1',
      title: 'حذف یک کالا از سبد خرید (DELETE /api/v1/cart/:itemId)',
      category: 'cart',
      requiresAuth: true,
      description: 'حذف یک ردیف خاص از جدول Cart کاربر احراز هویت شده',
    },
    {
      method: 'DELETE',
      path: '/api/v1/cart',
      title: 'تخلیه کامل سبد خرید کاربر (DELETE /api/v1/cart)',
      category: 'cart',
      requiresAuth: true,
      description: 'حذف تمامی رکوردهای سبد خرید متعلق به کاربر جاری از جدول Cart',
    },
    // Order Endpoints (ACID Transactions)
    {
      method: 'POST',
      path: '/api/v1/orders',
      title: 'ثبت سفارش با تراکنش امن دیتابیس (POST /api/v1/orders)',
      category: 'orders',
      requiresAuth: true,
      description: 'اجرای Sequelize Transaction شامل: ۱. قفل ردیف کالاها ۲. کنترل موجودی ۳. درج ردیف در جدول Order ۴. درج اقلام در جدول OrderItem ۵. کسر موجودی ۶. تخلیه سبد خرید ۷. صدور کد رهگیری',
      defaultBody: {
        shipping_address: 'استان اصفهان، سمیرم، باغات سیب منطقه حنا',
      },
    },
    {
      method: 'GET',
      path: '/api/v1/orders',
      title: 'لیست سفارش‌های کاربر (GET /api/v1/orders)',
      category: 'orders',
      requiresAuth: true,
      description: 'دریافت سوابق سفارش‌های ثبت شده در جدول Order به همراه ریز اقلام خریداری‌شده (OrderItem) و کدهای رهگیری',
    },
    {
      method: 'GET',
      path: '/api/v1/orders/1',
      title: 'جزئیات یک سفارش با شناسه (GET /api/v1/orders/:orderId)',
      category: 'orders',
      requiresAuth: true,
      description: 'دریافت جزئیات کامل سفارش به همراه اقلام و وضعیت ارسال از جداول دیتابیس',
    },
    // Auth Endpoints
    {
      method: 'POST',
      path: '/api/auth/register',
      title: 'ثبت‌نام کاربر جدید (MySQL + bcrypt + JWT)',
      category: 'auth',
      description: 'اعتبارسنجی شماره موبایل ایران (09xxxxxxxxx)، هشینگ پسورد با bcrypt (salt rounds=10)، درج رکورد در جدول users و بازگرداندن توکن JWT',
      defaultBody: {
        phone_number: '09129876543',
        password: 'password123',
        full_name: 'مهندس حسینی (باغدار گردو و بادام)',
        farm_location: 'استان اصفهان، سمیرم',
      },
    },
    {
      method: 'POST',
      path: '/api/auth/login',
      title: 'ورود به حساب کاربری (با Rate Limit و bcrypt.compare)',
      category: 'auth',
      description: 'کوئری مستقیم روی شماره موبایل در جدول users، مقایسه هش پسورد و صدور JWT با انقضای ۷ روز',
      defaultBody: {
        phone_number: '09359876543',
        password: 'farmer123456',
      },
    },
    {
      method: 'GET',
      path: '/api/auth/me',
      title: 'دریافت مشخصات کاربر احراز هویت شده (GET /api/auth/me)',
      category: 'auth',
      requiresAuth: true,
      description: 'استعلام زنده از دیتابیس MySQL بر اساس شناسه ID مستخرج از هدر Authorization: Bearer <token>',
    },
    {
      method: 'PUT',
      path: '/api/auth/profile',
      title: 'ویرایش مشخصات و نام و مزرعه کاربر در دیتابیس',
      category: 'auth',
      requiresAuth: true,
      description: 'به‌روزرسانی فیلدهای full_name و farm_location در رکورد جدول users',
      defaultBody: {
        full_name: 'مهندس احمد کریمی (توسعه باغات پسته رفسنجان)',
        farm_location: 'استان کرمان، رفسنجان، منطقه کبوترخان',
      },
    },
    {
      method: 'GET',
      path: '/api/auth/users',
      title: 'لیست کاربران ذخیره‌شده در MySQL (مخصوص مدیر)',
      category: 'auth',
      requiresAuth: true,
      description: 'استعلام تمام رکوردهای جدول users با اعتبارسنجی توکن ادمین (authenticateToken + requireAdmin)',
    },
    // Product Catalog Endpoints (Public)
    {
      method: 'GET',
      path: '/api/v1/products',
      title: 'دریافت لیست محصولات کاتالوگ (عمومی بدون توکن)',
      category: 'products',
      description: 'امکان فیلتر با category_id, product_type (کود/سم/بذر), search, in_stock, min_price, max_price, sort, page, limit',
      defaultParams: '?product_type=کود&limit=6&sort=newest',
    },
    {
      method: 'GET',
      path: '/api/v1/products/1',
      title: 'دریافت جزئیات یک محصول با شناسه (عمومی)',
      category: 'products',
      description: 'اطلاعات کامل محصول همراه با اطلاعات دسته‌بندی والد (Category) از دیتابیس',
    },
    // Category Endpoints (Public)
    {
      method: 'GET',
      path: '/api/v1/categories',
      title: 'دریافت لیست تمام دسته‌بندی‌ها (عمومی بدون توکن)',
      category: 'categories',
      description: 'همراه با تعداد محصولات وابسته (products_count) به صورت بهینه با GROUP BY',
    },
    {
      method: 'GET',
      path: '/api/v1/categories/1',
      title: 'دریافت مشخصات یک دسته‌بندی با شناسه (عمومی)',
      category: 'categories',
      description: 'اطلاعات دسته‌بندی همراه با لیست محصولات متصل',
    },
    // System Endpoints
    {
      method: 'GET',
      path: '/api/system/status',
      title: 'بررسی وضعیت سلامت دیتابیس و کانکشن پولینگ',
      category: 'system',
      description: 'گزارش دایالکت MySQL، وضعیت کانکشن و تعداد رکوردهای جداول بدون افشای نام دیتابیس و هاست',
    },
    {
      method: 'POST',
      path: '/api/system/seed',
      title: 'اجرای اسکریپت Seed دیتابیس (مخصوص مدیر)',
      category: 'system',
      requiresAuth: true,
      description: 'درج خودکار کاتالوگ واقعی نهاده‌های کشاورزی در دیتابیس (نیاز به توکن مدیر)',
    },
    {
      method: 'POST',
      path: '/api/system/sync',
      title: 'همگام‌سازی ساختار جداول دیتابیس (مخصوص مدیر)',
      category: 'system',
      requiresAuth: true,
      description: 'اجرای sync بر روی ساختار مدل‌های Sequelize (نیاز به توکن مدیر)',
    },
  ];

  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDoc>(endpoints[0]);
  const [customPath, setCustomPath] = useState<string>(endpoints[0].path + (endpoints[0].defaultParams || ''));
  const [requestBody, setRequestBody] = useState<string>(
    endpoints[0].defaultBody ? JSON.stringify(endpoints[0].defaultBody, null, 2) : ''
  );
  const [bearerToken, setBearerToken] = useState<string>(() => localStorage.getItem('agri_jwt_token') || '');
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleSelectEndpoint = (ep: EndpointDoc) => {
    setSelectedEndpoint(ep);
    setCustomPath(ep.path + (ep.defaultParams || ''));
    setRequestBody(ep.defaultBody ? JSON.stringify(ep.defaultBody, null, 2) : '');
    setResponseStatus(null);
    setResponseBody('');
  };

  const handleExecute = async () => {
    setLoading(true);
    setResponseStatus(null);
    setResponseBody('');
    const startTime = performance.now();

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      if (bearerToken.trim()) {
        headers['Authorization'] = `Bearer ${bearerToken.trim()}`;
      }

      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers,
      };

      if (['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && requestBody.trim()) {
        try {
          JSON.parse(requestBody); // validate JSON syntax
          options.body = requestBody;
        } catch {
          setResponseStatus(400);
          setResponseBody(JSON.stringify({ error: 'فرمت JSON وارد شده نامعتبر است' }, null, 2));
          setLoading(false);
          return;
        }
      }

      const res = await apiFetch(customPath, options);
      const elapsed = Math.round(performance.now() - startTime);
      setResponseStatus(res.status);

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await res.json();
        setResponseBody(JSON.stringify(json, null, 2));
        // Auto extract token if returned from register or login
        if (json.token) {
          setBearerToken(json.token);
          localStorage.setItem('agri_jwt_token', json.token);
        }
      } else {
        const text = await res.text();
        setResponseBody(text);
      }
    } catch (err: any) {
      setResponseStatus(500);
      setResponseBody(JSON.stringify({ error: 'خطای شبکه در ارسال درخواست', message: err.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(responseBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'POST':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PUT':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'DELETE':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'admin':
        return 'bg-rose-800 text-white';
      case 'cart':
        return 'bg-emerald-700 text-white';
      case 'orders':
        return 'bg-amber-700 text-white';
      case 'auth':
        return 'bg-[#2D4F3E] text-white';
      case 'products':
        return 'bg-[#C27E47] text-white';
      case 'categories':
        return 'bg-[#8BA888] text-white';
      default:
        return 'bg-[#6B685E] text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-[#E8F0EC] text-[#2D4F3E] border border-[#D2E3D8]">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#2D4F3E]">
              مستندات و تست‌کننده تعاملی API های Express و Sequelize
            </h2>
            <p className="text-xs text-[#8C887D] mt-0.5">
              شامل احراز هویت JWT با bcrypt، دسته‌بندی‌ها و کاتالوگ محصولات با اعتبارسنجی Joi و کوئری‌های واقعی MySQL.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Endpoints List */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E5E1D8] p-4 shadow-sm space-y-2">
          <h3 className="text-xs font-bold text-[#8C887D] uppercase tracking-wider px-2 mb-2">
            لیست مسیرهای API پیاده‌سازی‌شده
          </h3>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {endpoints.map((ep, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectEndpoint(ep)}
                className={`w-full text-right p-3 rounded-xl border text-xs transition-all flex flex-col gap-1.5 ${
                  selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method
                    ? 'bg-[#E8F0EC] border-[#8BA888] shadow-xs'
                    : 'bg-[#F9F8F6] border-[#E5E1D8] hover:bg-[#EBE7DE]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] border ${getMethodColor(ep.method)}`}>
                    {ep.method}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {ep.requiresAuth && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] font-medium flex items-center gap-0.5">
                        <Key className="w-2.5 h-2.5" />
                        Bearer
                      </span>
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${getCategoryBadge(ep.category)}`}>
                      {ep.category}
                    </span>
                  </div>
                </div>

                <div className="font-bold text-[#2D4F3E] text-xs leading-snug">
                  {ep.title}
                </div>

                <div className="font-mono text-[11px] text-[#8C887D] direction-ltr text-left truncate">
                  {ep.path}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Interactive Request Runner */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E5E1D8] p-5 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#2D4F3E] flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#C27E47]" />
                <span>{selectedEndpoint.title}</span>
              </h3>
              <span className={`px-2.5 py-0.5 rounded-md font-mono font-bold text-xs border ${getMethodColor(selectedEndpoint.method)}`}>
                {selectedEndpoint.method}
              </span>
            </div>

            <p className="text-xs text-[#8C887D] leading-relaxed">
              {selectedEndpoint.description}
            </p>

            {/* URL Input */}
            <div>
              <label className="block text-xs font-semibold text-[#3C3A33] mb-1">
                آدرس Endpoint مورد درخواست:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD7CB] bg-[#F9F8F6] font-mono text-xs text-[#3C3A33] focus:bg-white focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E] outline-none direction-ltr text-left"
                />
                <button
                  id="execute-api-req-btn"
                  onClick={handleExecute}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-[#C27E47] hover:bg-[#A96D3C] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all disabled:opacity-50 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? 'در حال ارسال...' : 'ارسال درخواست'}</span>
                </button>
              </div>
            </div>

            {/* Authorization Token Input */}
            <div>
              <label className="block text-xs font-semibold text-[#3C3A33] mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#C27E47]" />
                  <span>هدر احراز هویت (Authorization: Bearer &lt;token&gt;)</span>
                </span>
                {bearerToken && (
                  <span className="text-[10px] text-[#2D4F3E] font-bold">توکن در حافظه بارگذاری شده</span>
                )}
              </label>
              <input
                type="text"
                value={bearerToken}
                onChange={(e) => {
                  setBearerToken(e.target.value);
                  localStorage.setItem('agri_jwt_token', e.target.value);
                }}
                placeholder="توکن JWT دریافتی از /api/auth/login یا /api/auth/register..."
                className="w-full px-3.5 py-2 rounded-xl border border-[#DCD7CB] bg-[#F9F8F6] font-mono text-[11px] text-[#3C3A33] focus:bg-white focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E] outline-none direction-ltr text-left"
              />
            </div>

            {/* Request Body Editor (if POST/PUT) */}
            {['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && (
              <div>
                <label className="block text-xs font-semibold text-[#3C3A33] mb-1">
                  بدنه درخواست (Request Body - JSON):
                </label>
                <textarea
                  rows={7}
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#DCD7CB] bg-[#1E2E25] font-mono text-xs text-[#A2D9A1] focus:ring-2 focus:ring-[#8BA888]/30 outline-none direction-ltr text-left"
                />
              </div>
            )}

            {/* Response Section */}
            {responseStatus !== null && (
              <div className="space-y-2 pt-2 border-t border-[#EBE7DE]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#3C3A33]">پاسخ سرور:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                        responseStatus >= 200 && responseStatus < 300
                          ? 'bg-[#E8F0EC] text-[#2D4F3E] border border-[#8BA888]'
                          : 'bg-[#FEF2F2] text-[#B04A4A] border border-[#FCDADA]'
                      }`}
                    >
                      HTTP {responseStatus}
                    </span>
                  </div>

                  <button
                    onClick={copyResponse}
                    className="flex items-center gap-1 text-xs text-[#8C887D] hover:text-[#2D4F3E] transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#2D4F3E]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'کپی شد' : 'کپی پاسخ'}</span>
                  </button>
                </div>

                <div className="relative">
                  <pre className="p-3.5 rounded-xl bg-[#17241D] text-[#E8F0EC] font-mono text-xs overflow-x-auto max-h-[320px] direction-ltr text-left border border-[#234032]">
                    {responseBody}
                  </pre>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
