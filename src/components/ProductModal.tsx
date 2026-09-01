import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, ShieldCheck, Tag, FileText, Image as ImageIcon } from 'lucide-react';
import { Product, Category, ProductType } from '../types/api.js';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  product: Product | null;
  categories: Category[];
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSaveSuccess,
  product,
  categories,
}) => {
  const isEditing = Boolean(product);

  const [formData, setFormData] = useState<{
    name: string;
    category_id: number | '';
    product_type: ProductType;
    price: number | '';
    stock: number | '';
    description: string;
    brand: string;
    package_size: string;
    required_permit_number: string;
    msds_file_url: string;
    image_url: string;
  }>({
    name: '',
    category_id: categories[0]?.id || '',
    product_type: 'کود',
    price: '',
    stock: 0,
    description: '',
    brand: '',
    package_size: '',
    required_permit_number: '',
    msds_file_url: '',
    image_url: '',
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category_id: product.category_id || categories[0]?.id || '',
        product_type: product.product_type || 'کود',
        price: product.price ?? '',
        stock: product.stock ?? 0,
        description: product.description || '',
        brand: product.brand || '',
        package_size: product.package_size || '',
        required_permit_number: product.required_permit_number || '',
        msds_file_url: product.msds_file_url || '',
        image_url: product.image_url || '',
      });
    } else {
      setFormData({
        name: '',
        category_id: categories[0]?.id || '',
        product_type: 'کود',
        price: '',
        stock: 10,
        description: '',
        brand: '',
        package_size: '',
        required_permit_number: '',
        msds_file_url: '',
        image_url: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop&q=80',
      });
    }
    setErrorMsg(null);
  }, [product, categories, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('لطفاً نام محصول را وارد کنید');
      return;
    }
    if (!formData.category_id) {
      setErrorMsg('لطفاً یک دسته‌بندی معتبر انتخاب کنید');
      return;
    }
    if (formData.price === '' || Number(formData.price) < 0) {
      setErrorMsg('لطفاً قیمت معتبر به تومان وارد کنید');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const payload = {
      name: formData.name.trim(),
      category_id: Number(formData.category_id),
      product_type: formData.product_type,
      price: Number(formData.price),
      stock: Number(formData.stock || 0),
      description: formData.description.trim() || null,
      brand: formData.brand.trim() || null,
      package_size: formData.package_size.trim() || null,
      required_permit_number: formData.required_permit_number.trim() || null,
      msds_file_url: formData.msds_file_url.trim() || null,
      image_url: formData.image_url.trim() || null,
    };

    try {
      const url = isEditing ? `/api/products/${product?.id}` : '/api/products';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || (data.errors && data.errors[0]?.message) || 'خطا در ذخیره‌سازی اطلاعات');
      }

      onSaveSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ارتباط با سرور');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D4F3E]/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#E5E1D8] shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#2D4F3E] text-white border-b border-[#234032] shrink-0">
          <div className="flex items-center gap-2.5">
            <Tag className="w-5 h-5 text-[#A2D9A1]" />
            <h3 className="text-base font-bold">
              {isEditing ? `ویرایش محصول: ${product?.name}` : 'افزودن محصول جدید به پایگاه داده MySQL'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#D7E9D6] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 bg-[#F4F1EA]/30">
          
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FCDADA] text-[#B04A4A] text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#B04A4A]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Row 1: Name & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#3C3A33] mb-1">
                نام کامل محصول <span className="text-[#B04A4A]">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: کود NPK 20-20-20 گرین‌پلاس"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD7CB] bg-[#F9F8F6] text-xs text-[#3C3A33] placeholder:text-[#8C887D] focus:bg-white focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E] outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3C3A33] mb-1">
                دسته‌بندی در دیتابیس <span className="text-[#B04A4A]">*</span>
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD7CB] bg-[#F9F8F6] text-xs text-[#3C3A33] focus:bg-white focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E] outline-none"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Product Type, Price, Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#3C3A33] mb-1">
                نوع نهاده <span className="text-[#B04A4A]">*</span>
              </label>
              <select
                value={formData.product_type}
                onChange={(e) => setFormData({ ...formData, product_type: e.target.value as ProductType })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD7CB] bg-[#F9F8F6] text-xs text-[#3C3A33] focus:bg-white focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E] outline-none font-medium"
              >
                <option value="کود">کود کشاورزی</option>
                <option value="سم">سم دفع آفات و قارچ‌کش</option>
                <option value="بذر">بذر زراعی / گلخانه‌ای</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3C3A33] mb-1">
                قیمت به تومان <span className="text-[#B04A4A]">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value === '' ? '' : Number(e.target.value) })}
                placeholder="مثال: 950000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD7CB] bg-[#F9F8F6] text-xs text-[#3C3A33] placeholder:text-[#8C887D] focus:bg-white focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E] outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3C3A33] mb-1">
                موجودی در انبار
              </label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value === '' ? '' : Number(e.target.value) })}
                placeholder="مثال: 50"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD7CB] bg-[#F9F8F6] text-xs text-[#3C3A33] placeholder:text-[#8C887D] focus:bg-white focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E] outline-none"
              />
            </div>
          </div>

          {/* Row 3: Brand & Package Size */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#3C3A33] mb-1">
                برند / شرکت تولیدکننده
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="مثال: بایر آلمان، گرین‌پلاس، آریا شیمی"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD7CB] bg-[#F9F8F6] text-xs text-[#3C3A33] placeholder:text-[#8C887D] focus:bg-white focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3C3A33] mb-1">
                نوع و وزن بسته‌بندی
              </label>
              <input
                type="text"
                value={formData.package_size}
                onChange={(e) => setFormData({ ...formData, package_size: e.target.value })}
                placeholder="مثال: کیسه ۱۰ کیلوگرمی / بطری ۱ لیتری"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD7CB] bg-[#F9F8F6] text-xs text-[#3C3A33] placeholder:text-[#8C887D] focus:bg-white focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E] outline-none"
              />
            </div>
          </div>

          {/* Row 4: Required Permit Number & MSDS File URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#3C3A33] mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2D4F3E]" />
                <span>شماره پروانه ثبت کودی / مجوز حفظ نباتات</span>
              </label>
              <input
                type="text"
                value={formData.required_permit_number}
                onChange={(e) => setFormData({ ...formData, required_permit_number: e.target.value })}
                placeholder="مثال: سم-۴۱۱۲/ح-ن-۱۴۰۱"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD7CB] bg-[#F9F8F6] text-xs text-[#3C3A33] placeholder:text-[#8C887D] focus:bg-white focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3C3A33] mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-[#C27E47]" />
                <span>آدرس برگه ایمنی شیمیایی (MSDS URL)</span>
              </label>
              <input
                type="text"
                value={formData.msds_file_url}
                onChange={(e) => setFormData({ ...formData, msds_file_url: e.target.value })}
                placeholder="مثال: /uploads/msds/msds-sample.pdf"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD7CB] bg-[#F9F8F6] text-xs text-[#3C3A33] placeholder:text-[#8C887D] focus:bg-white focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E] outline-none"
              />
            </div>
          </div>

          {/* Row 5: Image URL */}
          <div>
            <label className="block text-xs font-semibold text-[#3C3A33] mb-1 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-[#8BA888]" />
              <span>آدرس تصویر محصول (URL)</span>
            </label>
            <input
              type="text"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD7CB] bg-[#F9F8F6] text-xs text-[#3C3A33] placeholder:text-[#8C887D] focus:bg-white focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E] outline-none"
            />
          </div>

          {/* Row 6: Description */}
          <div>
            <label className="block text-xs font-semibold text-[#3C3A33] mb-1">
              توضیحات و نحوه مصرف
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="ترکیبات، دوز مصرف در هکتار، آفات هدف یا ویژگی‌های رقمی..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD7CB] bg-[#F9F8F6] text-xs text-[#3C3A33] placeholder:text-[#8C887D] focus:bg-white focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E] outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EBE7DE]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#DCD7CB] bg-[#EBE7DE] text-[#3C3A33] text-xs font-medium hover:bg-[#DED9CE] transition-colors"
            >
              انصراف
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#C27E47] hover:bg-[#A96D3C] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'در حال ذخیره‌سازی در دیتابیس...' : isEditing ? 'ذخیره تغییرات' : 'ثبت در دیتابیس'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
