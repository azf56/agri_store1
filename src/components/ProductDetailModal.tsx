import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Tag,
  FileText,
  ShoppingCart,
  Check,
  Plus,
  Minus,
  ExternalLink,
  Package,
  Layers,
  AlertCircle
} from 'lucide-react';
import { Product, ProductType } from '../types/api.js';
import { resolveMediaUrl } from '../config/api.js';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart?: (productId: number, quantity: number) => Promise<void>;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  if (!product) return null;

  const formatPrice = (price: number) => {
    return Number(price).toLocaleString('fa-IR') + ' تومان';
  };

  const getTypeBadgeColor = (type: ProductType) => {
    switch (type) {
      case 'کود':
        return 'bg-[#FDF4EE] text-[#C27E47] border-[#F7E5D9]';
      case 'سم':
        return 'bg-[#FEF2F2] text-[#B04A4A] border-[#FCDADA]';
      case 'بذر':
        return 'bg-[#E8F0EC] text-[#2D4F3E] border-[#D2E3D8]';
      default:
        return 'bg-[#EBE7DE] text-[#3C3A33] border-[#DCD7CB]';
    }
  };

  const handleAddToCart = async () => {
    if (!onAddToCart || product.stock <= 0) return;
    setAdding(true);
    try {
      await onAddToCart(product.id, quantity);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2500);
    } catch {
      // Handled in parent
    } finally {
      setAdding(false);
    }
  };

  const incrementQty = () => {
    if (quantity < product.stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decrementQty = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#E5E1D8] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EBE7DE] bg-[#F9F8F6]">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border shadow-xs ${getTypeBadgeColor(product.product_type)}`}>
              {product.product_type}
            </span>
            <span className="text-xs text-[#8C887D] truncate max-w-[240px]">
              {product.category?.name || 'کاتالوگ عمومی'}
            </span>
          </div>

          <button
            id="close-product-detail-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-[#8C887D] hover:text-[#3C3A33] hover:bg-[#EBE7DE] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
            
            {/* Image Column */}
            <div className="sm:col-span-5">
              <div className="relative h-56 sm:h-64 rounded-2xl overflow-hidden bg-[#F9F8F6] border border-[#EBE7DE]">
                <img
                  src={resolveMediaUrl(product.image_url) || 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop&q=80'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop&q=80');
                  }}
                />

                {/* Stock Status Pill */}
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold backdrop-blur-md shadow-xs ${
                    product.stock > 5
                      ? 'bg-[#2D4F3E]/90 text-[#D7E9D6] border border-[#A9C4A6]/30'
                      : product.stock > 0
                      ? 'bg-[#C27E47]/90 text-white'
                      : 'bg-[#B04A4A]/90 text-white'
                  }`}>
                    {product.stock > 5
                      ? `موجودی در انبار: ${product.stock} عدد`
                      : product.stock > 0
                      ? `فقط ${product.stock} عدد در انبار باقی‌مانده`
                      : 'ناموجود در انبار'}
                  </span>
                </div>
              </div>
            </div>

            {/* Info Column */}
            <div className="sm:col-span-7 space-y-3.5">
              <div>
                {product.brand && (
                  <span className="text-xs font-semibold text-[#C27E47] block mb-1">
                    برند و سازنده: {product.brand}
                  </span>
                )}
                <h3 className="text-base sm:text-lg font-extrabold text-[#2D4F3E] leading-snug">
                  {product.name}
                </h3>
              </div>

              {/* Price Banner */}
              <div className="p-3.5 bg-[#F9F8F6] rounded-2xl border border-[#E5E1D8] flex items-center justify-between">
                <span className="text-xs text-[#8C887D] font-medium">قیمت مصوب کشاورز:</span>
                <span className="text-lg font-black text-[#2D4F3E]">
                  {formatPrice(product.price)}
                </span>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-1 gap-2 text-xs">
                {product.required_permit_number && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#E8F0EC] text-[#2D4F3E] border border-[#D2E3D8]">
                    <ShieldCheck className="w-4 h-4 text-[#2D4F3E] shrink-0" />
                    <span className="font-semibold">شماره ثبت و مجوز سازمان حفظ نباتات:</span>
                    <span className="font-mono mr-auto font-bold">{product.required_permit_number}</span>
                  </div>
                )}

                {product.package_size && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F4F1EA] text-[#3C3A33] border border-[#DCD7CB]">
                    <Tag className="w-4 h-4 text-[#8BA888] shrink-0" />
                    <span>نوع و حجم بسته‌بندی:</span>
                    <span className="font-bold mr-auto">{product.package_size}</span>
                  </div>
                )}

                {product.msds_file_url && (
                  <a
                    href={resolveMediaUrl(product.msds_file_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#FDF4EE] text-[#C27E47] border border-[#F7E5D9] hover:bg-[#FBE8DB] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#C27E47] shrink-0" />
                      <span className="font-bold">برگه اطلاعات ایمنی مواد شیمیایی (MSDS PDF)</span>
                    </div>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

            </div>

          </div>

          {/* Detailed Description */}
          <div className="space-y-2 pt-4 border-t border-[#EBE7DE]">
            <h4 className="text-xs font-bold text-[#2D4F3E] flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#8BA888]" />
              <span>مشخصات فنی و راهنمای مصرف کشاورزی</span>
            </h4>
            <div className="bg-[#F9F8F6] p-4 rounded-2xl border border-[#EBE7DE] text-xs sm:text-sm text-[#3C3A33] leading-relaxed whitespace-pre-line">
              {product.description || 'توضیحات تکمیلی برای این محصول در پایگاه داده ثبت نشده است.'}
            </div>
          </div>

        </div>

        {/* Footer Actions / Add to Cart */}
        <div className="p-4 sm:p-5 border-t border-[#EBE7DE] bg-[#F9F8F6] flex flex-col sm:flex-row items-center justify-between gap-3.5">
          
          {/* Quantity Stepper */}
          {product.stock > 0 ? (
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <span className="text-xs font-semibold text-[#6B685E]">تعداد:</span>
              <div className="flex items-center bg-white rounded-xl border border-[#DCD7CB] p-1 shadow-2xs">
                <button
                  onClick={decrementQty}
                  disabled={quantity <= 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#3C3A33] hover:bg-[#F4F1EA] disabled:opacity-40 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-bold text-sm text-[#2D4F3E]">
                  {quantity.toLocaleString('fa-IR')}
                </span>
                <button
                  onClick={incrementQty}
                  disabled={quantity >= product.stock}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#3C3A33] hover:bg-[#F4F1EA] disabled:opacity-40 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-[#B04A4A] font-bold">
              <AlertCircle className="w-4 h-4" />
              <span>این کالا در حال حاضر در انبار موجود نمی‌باشد</span>
            </div>
          )}

          {/* Add to Cart Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="hidden sm:inline-flex px-4 py-3 rounded-xl border border-[#DCD7CB] bg-white text-xs font-semibold text-[#3C3A33] hover:bg-[#F4F1EA] transition-colors"
            >
              بستن
            </button>

            <button
              id="detail-modal-add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={product.stock <= 0 || adding}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm ${
                product.stock > 0
                  ? 'bg-[#2D4F3E] hover:bg-[#234032] text-white cursor-pointer'
                  : 'bg-[#EBE7DE] text-[#8C887D] cursor-not-allowed'
              }`}
            >
              {addedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-[#A2D9A1]" />
                  <span>به سبد خرید دیتابیس افزوده شد!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>
                    {adding
                      ? 'در حال ذخیره در دیتابیس...'
                      : product.stock > 0
                      ? `افزودن به سبد خرید (${(product.price * quantity).toLocaleString('fa-IR')} تومان)`
                      : 'ناموجود'}
                  </span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
