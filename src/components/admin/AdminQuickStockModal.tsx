import React, { useState, useEffect } from 'react';
import { Package, X, RefreshCw, CheckCircle, Plus, Minus, DollarSign } from 'lucide-react';
import { Product } from '../../types/api';
import { apiFetch } from '../../config/api';

interface AdminQuickStockModalProps {
  product: Product | null;
  isOpen: boolean;
  token: string | null;
  onClose: () => void;
  onSuccess: (updatedProduct: Product) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export const AdminQuickStockModal: React.FC<AdminQuickStockModalProps> = ({
  product,
  isOpen,
  token,
  onClose,
  onSuccess,
  showToast,
}) => {
  const [stock, setStock] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setStock(product.stock);
      setPrice(product.price);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleAdjustStock = (delta: number) => {
    setStock((prev) => Math.max(0, prev + delta));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);

    try {
      const res = await apiFetch(`/api/v1/admin/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          stock,
          price,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        showToast(`موجودی و قیمت محصول «${product.name}» با موفقیت در MySQL به‌روزرسانی شد.`, 'success');
        onSuccess(data.data);
        onClose();
      } else {
        showToast(data.message || 'خطا در به‌روزرسانی اطلاعات انبار', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'خطای شبکه در اتصال به پایگاه داده', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-200">
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                شارژ سریع موجودی و اصلاح قیمت انبار
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                محصول #{product.id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-colors font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Quick Info Card */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
          <div className="font-bold text-slate-800 text-xs truncate">{product.name}</div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>نوع نهاده: <strong className="text-slate-700">{product.product_type}</strong></span>
            <span>•</span>
            <span>برند: <strong className="text-slate-700">{product.brand || 'عمومی'}</strong></span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Stock input with fast-adjustment buttons */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-700">موجودی فیزیکی در انبار (عدد/بسته):</label>
              <span className={`text-[11px] font-bold ${stock <= 10 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {stock <= 10 ? 'وضعیت: رو به اتمام' : 'وضعیت: کافی'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAdjustStock(-1)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm"
              >
                <Minus className="w-4 h-4" />
              </button>

              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="flex-1 p-2.5 text-center text-base font-bold font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2D4F3E] outline-none"
              />

              <button
                type="button"
                onClick={() => handleAdjustStock(1)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Increment Chips */}
            <div className="flex items-center justify-between gap-1 pt-1">
              {[5, 10, 25, 50, 100].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => handleAdjustStock(inc)}
                  className="flex-1 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition-colors"
                >
                  +{inc} عدد
                </button>
              ))}
            </div>
          </div>

          {/* Price input */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="font-bold text-slate-700 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
              قیمت مصرف‌کننده مصوب (تومان):
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={price}
              onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full p-2.5 text-sm font-bold font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2D4F3E] outline-none"
            />
            <div className="text-[11px] text-slate-500 font-mono text-left" dir="ltr">
              {price.toLocaleString('fa-IR')} تومان
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#2D4F3E] hover:bg-[#234032] text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              <span>ذخیره در دیتابیس MySQL</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
