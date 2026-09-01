import React, { useState } from 'react';
import { Layers, Plus, Edit2, Trash2, AlertTriangle, CheckCircle2, Package } from 'lucide-react';
import { Category } from '../types/api.js';

interface CategoryManagerProps {
  categories: Category[];
  loading: boolean;
  onRefresh: () => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  loading,
  onRefresh,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleDelete = async (id: number, catName: string) => {
    if (!confirm(`آیا از حذف دسته‌بندی «${catName}» از پایگاه داده اطمینان دارید؟`)) {
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'خطا در حذف دسته‌بندی');
      }
      setSuccessMsg(`دسته‌بندی «${catName}» با موفقیت از دیتابیس حذف شد.`);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در برقراری ارتباط با سرور');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('نام دسته‌بندی الزامی است');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
    };

    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'خطا در ذخیره دسته‌بندی در دیتابیس');
      }

      setSuccessMsg(editingCategory ? 'دسته‌بندی با موفقیت ویرایش شد' : 'دسته‌بندی جدید با موفقیت ایجاد شد');
      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ارتباط با سرور');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add button */}
      <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-[#E8F0EC] text-[#2D4F3E] border border-[#D2E3D8]">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2D4F3E]">
                مدیریت دسته‌بندی‌های نهاده‌های کشاورزی
              </h2>
              <p className="text-xs text-[#8C887D] mt-0.5">
                جداول پایگاه داده MySQL: <span className="font-mono text-[#2D4F3E] font-medium">categories</span> (مرتبط با کلید خارجی در <span className="font-mono text-[#2D4F3E] font-medium">products</span>)
              </p>
            </div>
          </div>

          <button
            id="open-add-category-btn"
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#C27E47] hover:bg-[#A96D3C] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن دسته‌بندی جدید</span>
          </button>
        </div>

        {/* Status Messages */}
        {successMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-[#E8F0EC] border border-[#D2E3D8] text-[#2D4F3E] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2D4F3E] shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FCDADA] text-[#B04A4A] text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#B04A4A] shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Categories Table / Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E5E1D8]">
          <div className="w-8 h-8 border-3 border-[#2D4F3E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#8C887D]">در حال خواندن دسته‌بندی‌ها از پایگاه داده MySQL...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E5E1D8]">
          <Layers className="w-12 h-12 text-[#8C887D] mx-auto mb-3" />
          <p className="text-sm text-[#3C3A33]">هنوز دسته‌بندی‌ای در پایگاه داده ثبت نشده است.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              id={`category-item-${cat.id}`}
              className="bg-white rounded-2xl border border-[#E5E1D8] p-5 hover:border-[#8BA888] hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#E8F0EC] text-[#2D4F3E] font-bold text-xs flex items-center justify-center border border-[#D2E3D8]">
                      #{cat.id}
                    </span>
                    <h3 className="text-sm font-bold text-[#2D4F3E]">{cat.name}</h3>
                  </div>

                  <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[#F9F8F6] text-[#3C3A33] border border-[#E5E1D8] font-medium">
                    <Package className="w-3.5 h-3.5 text-[#C27E47]" />
                    <span>{cat.products_count ?? 0} محصول در دیتابیس</span>
                  </span>
                </div>

                <p className="text-xs text-[#6B685E] line-clamp-3 mb-4 leading-relaxed">
                  {cat.description || 'بدون توضیحات ثبت‌شده.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3.5 border-t border-[#EBE7DE]">
                <button
                  id={`edit-category-${cat.id}-btn`}
                  onClick={() => handleOpenEdit(cat)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#EBE7DE] hover:bg-[#DED9CE] text-[#3C3A33] text-xs font-medium border border-[#DCD7CB] transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>ویرایش</span>
                </button>

                <button
                  id={`delete-category-${cat.id}-btn`}
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FEF2F2] hover:bg-[#FCDADA] text-[#B04A4A] text-xs font-medium border border-[#FCDADA] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D4F3E]/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#E5E1D8] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-[#2D4F3E] text-white">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#A2D9A1]" />
                {editingCategory ? `ویرایش دسته‌بندی: ${editingCategory.name}` : 'افزودن دسته‌بندی جدید به MySQL'}
              </h3>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 bg-[#F4F1EA]/30">
              <div>
                <label className="block text-xs font-semibold text-[#3C3A33] mb-1">
                  نام دسته‌بندی <span className="text-[#B04A4A]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: کودهای بیولوژیک و زیستی"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD7CB] bg-[#F9F8F6] text-xs text-[#3C3A33] placeholder:text-[#8C887D] focus:bg-white focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3C3A33] mb-1">
                  توضیحات دسته‌بندی
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="شرح کوتاه درباره محصولات این گروه..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD7CB] bg-[#F9F8F6] text-xs text-[#3C3A33] placeholder:text-[#8C887D] focus:bg-white focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E] outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-[#EBE7DE]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#DCD7CB] bg-[#EBE7DE] text-[#3C3A33] text-xs font-medium hover:bg-[#DED9CE]"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#C27E47] hover:bg-[#A96D3C] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                >
                  {saving ? 'در حال ثبت در دیتابیس...' : 'ذخیره در دیتابیس'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
