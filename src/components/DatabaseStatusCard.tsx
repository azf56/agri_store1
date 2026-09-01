import React, { useState } from 'react';
import { Database, RefreshCw, CheckCircle2, AlertTriangle, Play, Sparkles, Table2, Layers, Package, Users } from 'lucide-react';
import { SystemStatusResponse } from '../types/api.js';

interface DatabaseStatusCardProps {
  status: SystemStatusResponse | null;
  onRefresh: () => void;
  onSeedSuccess: () => void;
}

export const DatabaseStatusCard: React.FC<DatabaseStatusCardProps> = ({
  status,
  onRefresh,
  onSeedSuccess,
}) => {
  const [seeding, setSeeding] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSeedDatabase = async () => {
    if (!confirm('آیا مایلید داده‌های نمونه کشاورزی (کود، سم، بذر، دسته‌ها و کاربران) مستقیماً در دیتابیس درج شوند؟')) {
      return;
    }
    setSeeding(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/system/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionMessage({ text: data.message || 'داده‌های نمونه با موفقیت در دیتابیس درج شدند', type: 'success' });
        onSeedSuccess();
      } else {
        setActionMessage({ text: data.message || 'خطا در درج داده‌های نمونه', type: 'error' });
      }
    } catch (err: any) {
      setActionMessage({ text: `خطا در برقراری ارتباط با سرور: ${err.message}`, type: 'error' });
    } finally {
      setSeeding(false);
    }
  };

  const handleSyncDatabase = async () => {
    setSyncing(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/system/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionMessage({ text: data.message || 'جداول با ساختار مدل‌های Sequelize همگام‌سازی شدند', type: 'success' });
        onRefresh();
      } else {
        setActionMessage({ text: data.message || 'خطا در همگام‌سازی دیتابیس', type: 'error' });
      }
    } catch (err: any) {
      setActionMessage({ text: `خطا در همگام‌سازی: ${err.message}`, type: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  const isConnected = status?.database?.connected;

  return (
    <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-sm p-4 sm:p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#EBE7DE] pb-4">
        
        {/* Left: DB Info */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-[#E8F0EC] text-[#2D4F3E] border border-[#D2E3D8] shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-[#2D4F3E]">
                وضعیت اتصال پایگاه داده و ORM
              </h2>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                isConnected ? 'bg-[#E8F0EC] text-[#2D4F3E] border-[#D2E3D8]' : 'bg-[#FEF2F2] text-[#B04A4A] border-[#FCDADA]'
              }`}>
                {isConnected ? <CheckCircle2 className="w-3.5 h-3.5 text-[#2D4F3E]" /> : <AlertTriangle className="w-3.5 h-3.5 text-[#B04A4A]" />}
                {isConnected ? 'متصل و فعال' : 'قطع ارتباط'}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#EBE7DE] text-[#3C3A33] font-mono border border-[#DCD7CB]">
                {status?.database?.dialect?.toUpperCase()} (Sequelize)
              </span>
            </div>
            <p className="text-xs text-[#8C887D] mt-1">
              تمام کوئری‌های CRUD، فیلترها و عملیات انبار مستقیماً روی جداول دیتابیس MySQL اجرا می‌شوند.
            </p>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            id="seed-db-btn"
            onClick={handleSeedDatabase}
            disabled={seeding || syncing}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#C27E47] hover:bg-[#A96D3C] text-white text-xs font-medium shadow-xs transition-all disabled:opacity-50"
          >
            {seeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>درج محصولات نمونه (Seed)</span>
          </button>

          <button
            id="sync-schema-btn"
            onClick={handleSyncDatabase}
            disabled={seeding || syncing}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#EBE7DE] hover:bg-[#DED9CE] text-[#3C3A33] text-xs font-medium border border-[#DCD7CB] transition-all disabled:opacity-50"
          >
            {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>همگام‌سازی ساختار (Sync)</span>
          </button>
        </div>

      </div>

      {/* Alert banner if message exists */}
      {actionMessage && (
        <div className={`mt-3.5 p-3 rounded-xl text-xs flex items-center gap-2 border ${
          actionMessage.type === 'success' ? 'bg-[#E8F0EC] text-[#2D4F3E] border-[#D2E3D8]' : 'bg-[#FEF2F2] text-[#B04A4A] border-[#FCDADA]'
        }`}>
          {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Database Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-4">
        <div className="bg-[#F9F8F6] rounded-xl p-3.5 border border-[#F0EEE8]">
          <div className="flex items-center justify-between text-[#8C887D] mb-1">
            <span className="text-xs">محصولات ثبت‌شده</span>
            <Package className="w-4 h-4 text-[#C27E47]" />
          </div>
          <div className="text-xl font-bold text-[#3C3A33]">
            {status?.stats?.products_count ?? 0}
          </div>
          <div className="text-[11px] text-[#8C887D] mt-0.5">جدول MySQL: products</div>
        </div>

        <div className="bg-[#F9F8F6] rounded-xl p-3.5 border border-[#F0EEE8]">
          <div className="flex items-center justify-between text-[#8C887D] mb-1">
            <span className="text-xs">دسته‌بندی‌ها</span>
            <Layers className="w-4 h-4 text-[#2D4F3E]" />
          </div>
          <div className="text-xl font-bold text-[#3C3A33]">
            {status?.stats?.categories_count ?? 0}
          </div>
          <div className="text-[11px] text-[#8C887D] mt-0.5">جدول MySQL: categories</div>
        </div>

        <div className="bg-[#F9F8F6] rounded-xl p-3.5 border border-[#F0EEE8]">
          <div className="flex items-center justify-between text-[#8C887D] mb-1">
            <span className="text-xs">کاربران سیستم</span>
            <Users className="w-4 h-4 text-[#8BA888]" />
          </div>
          <div className="text-xl font-bold text-[#3C3A33]">
            {status?.stats?.users_count ?? 0}
          </div>
          <div className="text-[11px] text-[#8C887D] mt-0.5">جدول MySQL: users (bcrypt)</div>
        </div>

        <div className="bg-[#F9F8F6] rounded-xl p-3.5 border border-[#F0EEE8]">
          <div className="flex items-center justify-between text-[#8C887D] mb-1">
            <span className="text-xs">کانکشن پولینگ</span>
            <Table2 className="w-4 h-4 text-[#A96D3C]" />
          </div>
          <div className="text-xs font-mono font-semibold text-[#3C3A33] mt-1">
            Max: {status?.database?.connection_pool?.max || 10} / Idle: {status?.database?.connection_pool?.idle ? `${status.database.connection_pool.idle / 1000}s` : '10s'}
          </div>
          <div className="text-[11px] text-[#8C887D] mt-0.5">مدیریت بهینه حافظه</div>
        </div>
      </div>
    </div>
  );
};
