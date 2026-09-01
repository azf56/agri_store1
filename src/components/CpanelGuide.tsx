import React, { useState } from 'react';
import { Server, Database, Terminal, Settings, CheckCircle2, ShieldAlert, Globe, Copy, Check, ExternalLink, Cpu, Layers } from 'lucide-react';

export const CpanelGuide: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const envContent = `# تنظیمات دامنه و سرور در cPanel
NODE_ENV=production
PORT=3000
BASE_URL=https://api.shop.avinia.ir
ALLOWED_ORIGINS=https://shop.avinia.ir,http://shop.avinia.ir,https://api.shop.avinia.ir

# دیتابیس MySQL در cPanel
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cpaneluser_agristore
DB_USER=cpaneluser_dbuser
DB_PASSWORD=your_strong_mysql_password
DB_DIALECT=mysql
DB_ENABLE_SQLITE_FALLBACK=false

# احراز هویت و توکن JWT
JWT_SECRET=production_super_secret_jwt_key_avinia_2026
JWT_EXPIRES_IN=7d

# آپلود فایل
UPLOAD_MAX_SIZE_MB=10`;

  const htaccessFrontend = `# .htaccess برای ساب‌دامین فرانت‌اند (shop.avinia.ir)
# هدایت تمام مسیرها به index.html (React Router / Vite SPA)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# فعال‌سازی کش و Gzip برای سرعت بارگذاری
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript application/json
</IfModule>`;

  const htaccessBackend = `# .htaccess برای ساب‌دامین بک‌اند (api.shop.avinia.ir)
# پیکربندی Passenger یا ریدایرکت درخواست‌ها به پورت Node.js
PassengerAppRoot "/home/cpaneluser/agri_backend"
PassengerAppType node
PassengerStartupFile dist/server.cjs
PassengerNodejs "/home/cpaneluser/nodevenv/agri_backend/20/bin/node"

# فعال‌سازی هدرهای امنیتی و CORS
<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "https://shop.avinia.ir"
  Header set Access-Control-Allow-Credentials "true"
  Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, Accept, Origin"
</IfModule>`;

  return (
    <div className="space-y-6">
      {/* Header Banner with Custom Domain Info */}
      <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-sm p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-[#E8F0EC] text-[#2D4F3E] border border-[#D2E3D8]">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2D4F3E]">
                راهنمای استقرار روی ساب‌دامین‌های <span className="font-mono text-emerald-800">avinia.ir</span>
              </h2>
              <p className="text-xs text-[#8C887D] mt-0.5">
                پیکربندی تفکیک‌شده فرانت‌اند روی <code className="font-mono text-[#2D4F3E] font-bold">shop.avinia.ir</code> و وب‌سرویس API روی <code className="font-mono text-[#2D4F3E] font-bold">api.shop.avinia.ir</code>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-mono font-bold border border-emerald-200">
              API: https://api.shop.avinia.ir
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 text-xs font-mono font-bold border border-blue-200">
              WEB: https://shop.avinia.ir
            </span>
          </div>
        </div>
      </div>

      {/* Domain Architecture Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-[#F8FAF9] to-white p-5 rounded-2xl border border-[#D5E5DC] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-700" />
              <h3 className="text-sm font-bold text-[#1E3A2B]">۱. وب‌سرویس بک‌اند (Backend)</h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">Node.js / Express</span>
          </div>
          <div className="text-xs text-[#4A6657] space-y-1.5">
            <p><strong>آدرس دامنه:</strong> <code className="font-mono bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-900 font-bold">https://api.shop.avinia.ir</code></p>
            <p><strong>روش اجرا:</strong> ایجاد ساب‌دامین در cPanel و اتصال آن به منوی <span className="font-semibold text-slate-800">"Setup Node.js App"</span></p>
            <p><strong>فایل استارت:</strong> <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">dist/server.cjs</code> یا <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">server.ts</code></p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#F8FAFC] to-white p-5 rounded-2xl border border-[#D5E1F0] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-700" />
              <h3 className="text-sm font-bold text-[#1E2E4A]">۲. رابط کاربری فرانت‌اند (Frontend)</h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">Vite / React SPA</span>
          </div>
          <div className="text-xs text-[#4A5D7A] space-y-1.5">
            <p><strong>آدرس دامنه:</strong> <code className="font-mono bg-blue-50 px-1.5 py-0.5 rounded text-blue-900 font-bold">https://shop.avinia.ir</code></p>
            <p><strong>روش اجرا:</strong> خروجی گرفتن با <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">npm run build</code> و آپلود محتویات پوشه <code className="font-mono text-blue-800 font-bold">dist/</code> در پوشه ساب‌دامین</p>
            <p><strong>تنظیم SPA:</strong> قرار دادن فایل <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">.htaccess</code> جهت روتینگ صحیح مرورگر</p>
          </div>
        </div>
      </div>

      {/* Step by Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Step 1: Subdomains & MySQL */}
        <div className="bg-white rounded-2xl border border-[#E5E1D8] p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-[#2D4F3E] font-bold text-sm">
            <span className="w-6 h-6 rounded-full bg-[#E8F0EC] text-[#2D4F3E] text-xs flex items-center justify-center font-mono border border-[#D2E3D8]">1</span>
            <h3>ایجاد ساب‌دامین‌ها و دیتابیس MySQL</h3>
          </div>
          <p className="text-xs text-[#6B685E] leading-relaxed">
            در پنل cPanel ابتدا دو ساب‌دامین <code className="font-mono text-emerald-800 font-bold">shop.avinia.ir</code> و <code className="font-mono text-emerald-800 font-bold">api.shop.avinia.ir</code> را از بخش <strong className="text-[#3C3A33]">Domains / Subdomains</strong> بسازید. سپس از بخش <strong className="text-[#3C3A33]">MySQL Database Wizard</strong> دیتابیس را تعریف کنید:
          </p>
          <ul className="text-xs text-[#3C3A33] space-y-1.5 list-disc list-inside bg-[#F9F8F6] p-3 rounded-xl border border-[#E5E1D8]">
            <li>نام دیتابیس (مثال: <code className="font-mono text-[#2D4F3E] font-semibold">avinia_agristore</code>)</li>
            <li>نام کاربر دیتابیس (مثال: <code className="font-mono text-[#2D4F3E] font-semibold">avinia_dbuser</code>)</li>
            <li>اعطای دسترسی کامل (<strong className="text-[#C27E47]">ALL PRIVILEGES</strong>) به کاربر برای دیتابیس</li>
          </ul>
        </div>

        {/* Step 2: Setup Node.js App */}
        <div className="bg-white rounded-2xl border border-[#E5E1D8] p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-[#2D4F3E] font-bold text-sm">
            <span className="w-6 h-6 rounded-full bg-[#E8F0EC] text-[#2D4F3E] text-xs flex items-center justify-center font-mono border border-[#D2E3D8]">2</span>
            <h3>راه‌اندازی بک‌اند در "Setup Node.js App"</h3>
          </div>
          <p className="text-xs text-[#6B685E] leading-relaxed">
            در بخش <strong className="text-[#3C3A33]">Setup Node.js App</strong> روی <strong className="text-[#3C3A33]">Create Application</strong> کلیک کنید:
          </p>
          <ul className="text-xs text-[#3C3A33] space-y-1.5 list-disc list-inside bg-[#F9F8F6] p-3 rounded-xl border border-[#E5E1D8]">
            <li><strong>Application URL:</strong> دامنه <code className="font-mono text-emerald-800 font-bold">api.shop.avinia.ir</code> را انتخاب نمایید.</li>
            <li><strong>Node.js version:</strong> نسخه 18 یا 20 یا 22 LTS</li>
            <li><strong>Application root:</strong> مسیر پوشه بک‌اند (مثال: <code className="font-mono text-[#2D4F3E] font-semibold">agri_backend</code>)</li>
            <li><strong>Application startup file:</strong> مقدار <code className="font-mono text-[#2D4F3E] font-semibold">dist/server.cjs</code></li>
          </ul>
        </div>

        {/* Step 3: Environment Variables */}
        <div className="bg-white rounded-2xl border border-[#E5E1D8] p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-[#2D4F3E] font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-[#E8F0EC] text-[#2D4F3E] text-xs flex items-center justify-center font-mono border border-[#D2E3D8]">3</span>
              <h3>متغیرهای محیطی (<code className="font-mono">.env</code>)</h3>
            </div>
            <button
              onClick={() => handleCopy(envContent, 'env')}
              className="flex items-center gap-1 text-[11px] font-sans text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200 transition-all"
            >
              {copiedKey === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'env' ? 'کپی شد' : 'کپی تنظیمات'}</span>
            </button>
          </div>
          <p className="text-xs text-[#6B685E]">
            فایل <code className="font-mono text-[#2D4F3E]">.env</code> را در پوشه ریشه بک‌اند قرار دهید:
          </p>
          <div className="bg-[#1E2E25] text-[#A2D9A1] p-3 rounded-xl font-mono text-[11px] overflow-x-auto direction-ltr text-left border border-[#234032] leading-relaxed max-h-48">
            <pre>{envContent}</pre>
          </div>
        </div>

        {/* Step 4: Build & Deployment Commands */}
        <div className="bg-white rounded-2xl border border-[#E5E1D8] p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-[#2D4F3E] font-bold text-sm">
            <span className="w-6 h-6 rounded-full bg-[#E8F0EC] text-[#2D4F3E] text-xs flex items-center justify-center font-mono border border-[#D2E3D8]">4</span>
            <h3>دستورات Terminal و ساخت دیتابیس</h3>
          </div>
          <p className="text-xs text-[#6B685E]">
            در تب ترمینال cPanel یا با SSH دستورات زیر را به ترتیب اجرا کنید:
          </p>
          <div className="bg-[#1E2E25] text-[#F4F1EA] p-3 rounded-xl font-mono text-[11px] space-y-1.5 direction-ltr text-left border border-[#234032]">
            <div className="text-[#8BA888]"># ۱. نصب پکیج‌ها:</div>
            <div className="text-[#A2D9A1]">npm install</div>
            <div className="text-[#8BA888] mt-1.5"># ۲. بیلد فرانت‌اند و بک‌اند:</div>
            <div className="text-[#A2D9A1]">npm run build</div>
            <div className="text-[#8BA888] mt-1.5"># ۳. ساخت جداول در MySQL:</div>
            <div className="text-[#A2D9A1]">npm run db:sync</div>
            <div className="text-[#8BA888] mt-1.5"># ۴. ایجاد کاربر مدیر اولیه:</div>
            <div className="text-[#A2D9A1]">node create-admin.js --phone 09121234567 --password admin123456</div>
          </div>
        </div>

      </div>

      {/* Configuration for .htaccess (Apache) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Frontend .htaccess */}
        <div className="bg-white rounded-2xl border border-[#E5E1D8] p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-700" />
              <h4 className="text-xs font-bold text-slate-900">فایل <code className="font-mono text-blue-800">.htaccess</code> فرانت‌اند (shop.avinia.ir)</h4>
            </div>
            <button
              onClick={() => handleCopy(htaccessFrontend, 'ht-front')}
              className="flex items-center gap-1 text-[11px] text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg border border-blue-200 transition-all"
            >
              {copiedKey === 'ht-front' ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'ht-front' ? 'کپی شد' : 'کپی'}</span>
            </button>
          </div>
          <div className="bg-slate-950 text-slate-200 p-3 rounded-xl font-mono text-[10px] overflow-x-auto direction-ltr text-left border border-slate-800 leading-relaxed max-h-40">
            <pre>{htaccessFrontend}</pre>
          </div>
        </div>

        {/* Backend .htaccess / CORS */}
        <div className="bg-white rounded-2xl border border-[#E5E1D8] p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-700" />
              <h4 className="text-xs font-bold text-slate-900">فایل <code className="font-mono text-emerald-800">.htaccess</code> بک‌اند (api.shop.avinia.ir)</h4>
            </div>
            <button
              onClick={() => handleCopy(htaccessBackend, 'ht-back')}
              className="flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200 transition-all"
            >
              {copiedKey === 'ht-back' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'ht-back' ? 'کپی شد' : 'کپی'}</span>
            </button>
          </div>
          <div className="bg-slate-950 text-slate-200 p-3 rounded-xl font-mono text-[10px] overflow-x-auto direction-ltr text-left border border-slate-800 leading-relaxed max-h-40">
            <pre>{htaccessBackend}</pre>
          </div>
        </div>

      </div>

      {/* Security and Architecture Highlights */}
      <div className="bg-[#2D4F3E] text-white rounded-2xl p-5 sm:p-6 border border-[#234032] shadow-sm">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-[#A2D9A1]">
          <ShieldAlert className="w-5 h-5 text-[#A2D9A1]" />
          ویژگی‌های امنیتی و معماری اعمال‌شده در پروژه
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#D7E9D6]">
          <div className="bg-[#244133] p-3.5 rounded-xl border border-[#38614D]">
            <div className="font-bold text-white mb-1">CORS چنددامنه‌ای ایمن</div>
            <p className="text-[#D7E9D6] leading-relaxed">
              پیکربندی مجاز برای تبادل کوکی و توکن بین <code className="font-mono text-emerald-300">shop.avinia.ir</code> و <code className="font-mono text-emerald-300">api.shop.avinia.ir</code> با اعتبارسنجی هدر Origin.
            </p>
          </div>

          <div className="bg-[#244133] p-3.5 rounded-xl border border-[#38614D]">
            <div className="font-bold text-white mb-1">اعتبارسنجی دیتابیس با Joi</div>
            <p className="text-[#D7E9D6] leading-relaxed">
              تمام ورودی‌های API از قبیل قیمت، شماره پروانه، نوع نهاده و شماره موبایل قبل از ورود به دیتابیس اعتبارسنجی می‌شوند.
            </p>
          </div>

          <div className="bg-[#244133] p-3.5 rounded-xl border border-[#38614D]">
            <div className="font-bold text-white mb-1">مسیرهای مطلق آپلود چندرسانه‌ای</div>
            <p className="text-[#D7E9D6] leading-relaxed">
              فایل‌های تصاویر و PDF های MSDS با دامنه کامل <code className="font-mono text-emerald-300">api.shop.avinia.ir/uploads/...</code> ذخیره و بازگردانده می‌شوند.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
