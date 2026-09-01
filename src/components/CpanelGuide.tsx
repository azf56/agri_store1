import React from 'react';
import { Server, Database, Terminal, Settings, CheckCircle2, ShieldAlert, Cpu, HardDrive } from 'lucide-react';

export const CpanelGuide: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-[#E8F0EC] text-[#2D4F3E] border border-[#D2E3D8]">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#2D4F3E]">
              راهنمای راه‌اندازی و دیپلوی روی هاست اشتراکی cPanel با "Setup Node.js App"
            </h2>
            <p className="text-xs text-[#8C887D] mt-0.5">
              دستورالعمل کامل استقرار بک‌اند Express.js و اتصال به دیتابیس MySQL در کنترل‌پنل cPanel
            </p>
          </div>
        </div>
      </div>

      {/* Step by Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Step 1: MySQL Database Creation */}
        <div className="bg-white rounded-2xl border border-[#E5E1D8] p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-[#2D4F3E] font-bold text-sm">
            <span className="w-6 h-6 rounded-full bg-[#E8F0EC] text-[#2D4F3E] text-xs flex items-center justify-center font-mono border border-[#D2E3D8]">1</span>
            <h3>ساخت دیتابیس MySQL در cPanel</h3>
          </div>
          <p className="text-xs text-[#6B685E] leading-relaxed">
            از بخش <strong className="text-[#3C3A33]">MySQL Database Wizard</strong> در سی‌پنل یک پایگاه داده جدید به همراه یک نام کاربری بسازید:
          </p>
          <ul className="text-xs text-[#3C3A33] space-y-1.5 list-disc list-inside bg-[#F9F8F6] p-3 rounded-xl border border-[#E5E1D8]">
            <li>نام دیتابیس (مثال: <code className="font-mono text-[#2D4F3E] font-semibold">cpaneluser_agristore</code>)</li>
            <li>نام کاربری دیتابیس (مثال: <code className="font-mono text-[#2D4F3E] font-semibold">cpaneluser_dbuser</code>)</li>
            <li>رمز عبور قوی و اعطای تمام دسترسی‌ها (<strong className="text-[#C27E47]">ALL PRIVILEGES</strong>)</li>
          </ul>
        </div>

        {/* Step 2: Setup Node.js App in cPanel */}
        <div className="bg-white rounded-2xl border border-[#E5E1D8] p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-[#2D4F3E] font-bold text-sm">
            <span className="w-6 h-6 rounded-full bg-[#E8F0EC] text-[#2D4F3E] text-xs flex items-center justify-center font-mono border border-[#D2E3D8]">2</span>
            <h3>پیکربندی "Setup Node.js App"</h3>
          </div>
          <p className="text-xs text-[#6B685E] leading-relaxed">
            در cPanel وارد منوی <strong className="text-[#3C3A33]">Setup Node.js App</strong> شوید و روی <strong className="text-[#3C3A33]">Create Application</strong> کلیک کنید:
          </p>
          <ul className="text-xs text-[#3C3A33] space-y-1.5 list-disc list-inside bg-[#F9F8F6] p-3 rounded-xl border border-[#E5E1D8]">
            <li><strong>Node.js version:</strong> ترجیحاً نسخه 18 یا 20 به بالا</li>
            <li><strong>Application root:</strong> آدرس پوشه پروژه (مثال: <code className="font-mono text-[#2D4F3E] font-semibold">agri_store</code>)</li>
            <li><strong>Application startup file:</strong> فایل <code className="font-mono text-[#2D4F3E] font-semibold">dist/server.cjs</code> یا <code className="font-mono text-[#2D4F3E] font-semibold">server.ts</code></li>
            <li>پورت خودکار توسط cPanel و متغیر <code className="font-mono text-[#2D4F3E] font-semibold">process.env.PORT</code> تزریق می‌شود.</li>
          </ul>
        </div>

        {/* Step 3: Environment Variables (.env) */}
        <div className="bg-white rounded-2xl border border-[#E5E1D8] p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-[#2D4F3E] font-bold text-sm">
            <span className="w-6 h-6 rounded-full bg-[#E8F0EC] text-[#2D4F3E] text-xs flex items-center justify-center font-mono border border-[#D2E3D8]">3</span>
            <h3>تنظیم متغیرهای محیطی در فایل <code className="font-mono">.env</code></h3>
          </div>
          <p className="text-xs text-[#6B685E]">
            در ریشه هاست فایل <code className="font-mono text-[#2D4F3E]">.env</code> را با مشخصات دیتابیس MySQL ایجاد کنید:
          </p>
          <div className="bg-[#1E2E25] text-[#A2D9A1] p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto direction-ltr text-left border border-[#234032] leading-relaxed">
            NODE_ENV=production<br />
            DB_HOST=localhost<br />
            DB_PORT=3306<br />
            DB_NAME=cpaneluser_agristore<br />
            DB_USER=cpaneluser_dbuser<br />
            DB_PASSWORD=your_strong_mysql_password<br />
            DB_DIALECT=mysql<br />
            JWT_SECRET=production_super_secret_jwt_key_2026<br />
          </div>
        </div>

        {/* Step 4: Run NPM Install and Seed */}
        <div className="bg-white rounded-2xl border border-[#E5E1D8] p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-[#2D4F3E] font-bold text-sm">
            <span className="w-6 h-6 rounded-full bg-[#E8F0EC] text-[#2D4F3E] text-xs flex items-center justify-center font-mono border border-[#D2E3D8]">4</span>
            <h3>نصب وابستگی‌ها و اجرای دیتابیس</h3>
          </div>
          <p className="text-xs text-[#6B685E]">
            از بخش Terminal یا با دکمه <strong className="text-[#3C3A33]">Run NPM Install</strong> در پنل Node.js سی‌پنل پکیج‌ها را نصب کنید:
          </p>
          <div className="bg-[#1E2E25] text-[#F4F1EA] p-3.5 rounded-xl font-mono text-[11px] space-y-1.5 direction-ltr text-left border border-[#234032]">
            <div className="text-[#8BA888]"># نصب تمام پکیج‌ها:</div>
            <div className="text-[#A2D9A1]">npm install</div>
            <div className="text-[#8BA888] mt-2"># اجرای ساخت جداول (Sync):</div>
            <div className="text-[#A2D9A1]">npm run db:sync</div>
            <div className="text-[#8BA888] mt-2"># درج محصولات نمونه (Seed):</div>
            <div className="text-[#A2D9A1]">npm run db:seed</div>
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
            <div className="font-bold text-white mb-1">اتصال پایگاه داده واقعی</div>
            <p className="text-[#D7E9D6] leading-relaxed">
              استفاده از Sequelize ORM با Connection Pooling برای بهینه‌سازی منابع سرور و ممانعت کامل از داده‌های فرضی در کلاینت.
            </p>
          </div>

          <div className="bg-[#244133] p-3.5 rounded-xl border border-[#38614D]">
            <div className="font-bold text-white mb-1">اعتبارسنجی ورودی با Joi</div>
            <p className="text-[#D7E9D6] leading-relaxed">
              تمام ورودی‌های API از قبیل قیمت، شماره پروانه، نوع نهاده و شماره موبایل قبل از ورود به دیتابیس اعتبارسنجی می‌شوند.
            </p>
          </div>

          <div className="bg-[#244133] p-3.5 rounded-xl border border-[#38614D]">
            <div className="font-bold text-white mb-1">پورت دینامیک cPanel</div>
            <p className="text-[#D7E9D6] leading-relaxed">
              سرور مستقیماً پورت را از <code className="font-mono text-[#A2D9A1]">process.env.PORT</code> می‌خواند تا با وب‌سرور Phusion Passenger در cPanel کاملاً سازگار باشد.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
