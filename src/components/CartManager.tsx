import React, { useState } from 'react';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  PackageCheck,
  MapPin,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CartData, CartItem, User } from '../types/api.js';

interface CartManagerProps {
  cart: CartData | null;
  loading: boolean;
  currentUser: User | null;
  authToken: string | null;
  onRefreshCart: () => void;
  onUpdateQuantity: (itemId: number, newQty: number) => Promise<void>;
  onRemoveItem: (itemId: number) => Promise<void>;
  onClearCart: () => Promise<void>;
  onPlaceOrder: (shippingAddress: string) => Promise<boolean>;
  onNavigateToCatalog: () => void;
  onNavigateToAuth: () => void;
}

export const CartManager: React.FC<CartManagerProps> = ({
  cart,
  loading,
  currentUser,
  authToken,
  onRefreshCart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onPlaceOrder,
  onNavigateToCatalog,
  onNavigateToAuth,
}) => {
  const [shippingAddress, setShippingAddress] = useState(currentUser?.farm_location || '');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return Number(price).toLocaleString('fa-IR') + ' تومان';
  };

  const handleQuantityChange = async (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    
    // Check local stock boundary
    if (item.product && newQty > item.product.stock) {
      setErrorMessage(`حداکثر موجودی کالای «${item.product.name}» در انبار ${item.product.stock} عدد می‌باشد.`);
      return;
    }

    setErrorMessage(null);
    setActionLoadingId(item.id);
    try {
      await onUpdateQuantity(item.id, newQty);
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در تغییر تعداد');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemove = async (itemId: number) => {
    setErrorMessage(null);
    setActionLoadingId(itemId);
    try {
      await onRemoveItem(itemId);
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در حذف آیتم');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart || cart.items.length === 0) {
      setErrorMessage('سبد خرید شما خالی است.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmittingOrder(true);

    try {
      const ok = await onPlaceOrder(shippingAddress);
      if (ok) {
        setSuccessMessage('سفارش شما با موفقیت در پایگاه داده ثبت شد و موجودی انبار به‌روز گردید.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در ثبت سفارش');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // If user is not logged in, show auth prompt
  if (!authToken || !currentUser) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-sm p-8 text-center max-w-2xl mx-auto space-y-5">
        <div className="w-16 h-16 bg-[#FDF4EE] rounded-full flex items-center justify-center mx-auto text-[#C27E47] border border-[#F7E5D9]">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#2D4F3E] mb-2">
            سبد خرید اختصاصی پایگاه داده
          </h3>
          <p className="text-sm text-[#6B685E] max-w-md mx-auto leading-relaxed">
            سبد خرید در این سامانه منحصراً در جدول <span className="font-mono font-bold text-[#2D4F3E]">Cart</span> دیتابیس MySQL ذخیره می‌شود. جهت مشاهده و مدیریت اقلام، لطفاً ابتدا وارد حساب کاربری خود شوید.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            id="cart-login-prompt-btn"
            onClick={onNavigateToAuth}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#2D4F3E] hover:bg-[#234032] text-white text-sm font-semibold shadow-xs transition-colors"
          >
            ورود / ثبت‌نام کشاورز
          </button>
          <button
            onClick={onNavigateToCatalog}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#EBE7DE] hover:bg-[#DED9CE] text-[#3C3A33] text-sm font-medium border border-[#DCD7CB] transition-colors"
          >
            مشاهده کاتالوگ محصولات
          </button>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];
  const summary = cart?.summary || {
    total_items: 0,
    total_quantity: 0,
    total_price: 0,
    currency: 'تومان',
    total_price_formatted: '۰ تومان',
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-sm p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-[#2D4F3E] flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#C27E47]" />
              سبد خرید کشاورز (جدول دیتابیس: Cart)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F0EC] text-[#2D4F3E] border border-[#D2E3D8]">
              {items.length} کالا
            </span>
          </div>
          <p className="text-xs text-[#6B685E]">
            تمامی اقلام سبد خرید مستقیماً در پایگاه داده MySQL ذخیره شده و با خروج از حساب یا ورود از دستگاه دیگر پایدار می‌مانند.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            id="refresh-cart-btn"
            onClick={onRefreshCart}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F9F8F6] hover:bg-[#EBE7DE] text-[#3C3A33] text-xs font-medium border border-[#DCD7CB] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>به‌روزرسانی سبد</span>
          </button>

          {items.length > 0 && (
            <button
              id="clear-all-cart-btn"
              onClick={onClearCart}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FEF2F2] hover:bg-[#FCDADA] text-[#B04A4A] text-xs font-medium border border-[#FCDADA] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>تخلیه سبد</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {items.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-sm p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-[#F9F8F6] rounded-full flex items-center justify-center mx-auto text-[#8C887D] border border-[#EBE7DE]">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#3C3A33] mb-1">
              سبد خرید شما در پایگاه داده خالی است
            </h3>
            <p className="text-xs text-[#8C887D] max-w-sm mx-auto">
              محصولات مورد نیاز خود نظیر انواع کودها، سموم دفع آفات و بذرهای اصلاح‌شده را از کاتالوگ انتخاب و به سبد اضافه فرمایید.
            </p>
          </div>
          <button
            id="browse-catalog-from-empty-cart-btn"
            onClick={onNavigateToCatalog}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C27E47] hover:bg-[#A96D3C] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <span>مشاهده کاتالوگ و انتخاب محصول</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Cart Content & Checkout Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Items List */}
          <div className="lg:col-span-8 space-y-3.5">
            {items.map((item) => {
              const product = item.product;
              const isActionLoading = actionLoadingId === item.id;

              return (
                <div
                  key={item.id}
                  id={`cart-item-${item.id}`}
                  className="bg-white rounded-2xl border border-[#E5E1D8] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:border-[#8BA888]/60 transition-all"
                >
                  {/* Product Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <img
                      src={
                        product?.image_url ||
                        'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop&q=80'
                      }
                      alt={product?.name || 'محصول'}
                      className="w-16 h-16 rounded-xl object-cover border border-[#EBE7DE] shrink-0 bg-[#F9F8F6]"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).setAttribute(
                          'src',
                          'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop&q=80'
                        );
                      }}
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-[#F9F8F6] text-[#6B685E] border border-[#EBE7DE]">
                          {product?.product_type || 'نهاده'}
                        </span>
                        {product?.brand && (
                          <span className="text-xs text-[#8C887D]">{product.brand}</span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-[#2D4F3E] line-clamp-1">
                        {product?.name || `محصول #${item.product_id}`}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-[#6B685E]">
                        <span>قیمت واحد: {formatPrice(item.unit_price)}</span>
                        {product && (
                          <span className={`font-medium ${product.stock < 5 ? 'text-amber-700' : 'text-[#2D4F3E]'}`}>
                            (موجودی انبار: {product.stock})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity and Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[#F0EEE8]">
                    
                    {/* Quantity Controller */}
                    <div className="flex items-center border border-[#DCD7CB] rounded-xl bg-[#F9F8F6] p-1 shadow-xs">
                      <button
                        id={`cart-item-${item.id}-increase-btn`}
                        onClick={() => handleQuantityChange(item, 1)}
                        disabled={isActionLoading || (product ? item.quantity >= product.stock : false)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white hover:bg-[#EBE7DE] text-[#3C3A33] disabled:opacity-40 transition-colors shadow-2xs"
                        title="افزایش تعداد"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      <span className="w-9 text-center text-xs sm:text-sm font-bold font-mono text-[#2D4F3E]">
                        {item.quantity}
                      </span>

                      <button
                        id={`cart-item-${item.id}-decrease-btn`}
                        onClick={() => handleQuantityChange(item, -1)}
                        disabled={isActionLoading || item.quantity <= 1}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white hover:bg-[#EBE7DE] text-[#3C3A33] disabled:opacity-40 transition-colors shadow-2xs"
                        title="کاهش تعداد"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="text-left min-w-[100px]">
                      <div className="text-[11px] text-[#8C887D]">مجموع ردیف</div>
                      <div className="text-xs sm:text-sm font-bold text-[#2D4F3E]">
                        {formatPrice(item.line_total)}
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      id={`cart-item-${item.id}-delete-btn`}
                      onClick={() => handleRemove(item.id)}
                      disabled={isActionLoading}
                      className="p-2 rounded-xl text-[#B04A4A] hover:bg-[#FEF2F2] border border-transparent hover:border-[#FCDADA] transition-colors"
                      title="حذف از سبد"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Checkout & Summary Form */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-sm p-5 space-y-5 sticky top-24">
              <h3 className="text-base font-bold text-[#2D4F3E] border-b border-[#F0EEE8] pb-3 flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-[#C27E47]" />
                خلاصه فاکتور و ثبت رسمی
              </h3>

              {/* Price Details */}
              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between text-[#6B685E]">
                  <span>تعداد اقلام:</span>
                  <span className="font-bold text-[#3C3A33]">{summary.total_items} ردیف</span>
                </div>
                <div className="flex items-center justify-between text-[#6B685E]">
                  <span>مجموع تعداد واحد:</span>
                  <span className="font-bold text-[#3C3A33]">{summary.total_quantity} عدد/کیسه</span>
                </div>
                <div className="flex items-center justify-between text-[#6B685E]">
                  <span>هزینه بسته‌بندی و ارسال:</span>
                  <span className="text-[#2D4F3E] font-medium">رایگان (تحویل باربری)</span>
                </div>

                <div className="pt-3 border-t border-[#EBE7DE] flex items-center justify-between text-sm sm:text-base font-bold text-[#2D4F3E]">
                  <span>مبلغ کل قابل پرداخت:</span>
                  <span className="text-[#C27E47] font-mono">{summary.total_price_formatted}</span>
                </div>
              </div>

              {/* Shipping Address Form */}
              <form onSubmit={handleSubmitOrder} className="space-y-4 pt-3 border-t border-[#F0EEE8]">
                <div>
                  <label className="block text-xs font-bold text-[#3C3A33] mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#2D4F3E]" />
                    <span>آدرس مزرعه / تحویل سفارش:</span>
                  </label>
                  <textarea
                    id="order-shipping-address-input"
                    rows={2}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="استان، شهرستان، نام روستا، آدرس مزرعه یا باغ..."
                    required
                    className="w-full p-2.5 rounded-xl border border-[#DCD7CB] bg-[#F9F8F6] text-xs sm:text-sm text-[#3C3A33] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E]"
                  />
                </div>

                {/* DB Transaction Guarantee Note */}
                <div className="p-3 rounded-xl bg-[#E8F0EC] border border-[#D2E3D8] text-[11px] text-[#2D4F3E] space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>تضمین سلامت با تراکنش امن (ACID):</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#234032]">
                    قیمت‌ها از نرخ قطعی دیتابیس محاسبه شده، موجودی انبار کسر و سبد خرید تخلیه می‌گردد.
                  </p>
                </div>

                {/* Submit Order Button */}
                <button
                  id="submit-order-transaction-btn"
                  type="submit"
                  disabled={isSubmittingOrder || items.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2D4F3E] hover:bg-[#234032] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmittingOrder ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال اجرای تراکنش در دیتابیس...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#A2D9A1]" />
                      <span>ثبت نهایی سفارش (Sequelize Transaction)</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
