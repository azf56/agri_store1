import React, { useState, useEffect } from 'react';
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
  Sparkles,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { CartData, CartItem, User } from '../types/api.js';
import { resolveMediaUrl } from '../config/api.js';

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

  // Requirement: Always trigger a fresh GET /api/v1/cart on cart page open to ensure live DB sync
  useEffect(() => {
    if (authToken) {
      onRefreshCart();
    }
  }, [authToken]);

  // Sync farm location if user loads later
  useEffect(() => {
    if (currentUser?.farm_location && !shippingAddress) {
      setShippingAddress(currentUser.farm_location);
    }
  }, [currentUser]);

  const formatPrice = (price: number) => {
    return Number(price).toLocaleString('fa-IR') + ' تومان';
  };

  const handleQuantityChange = async (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;

    if (item.product && newQty > item.product.stock) {
      setErrorMessage(`حداکثر موجودی کالای «${item.product.name}» در انبار ${item.product.stock} عدد می‌باشد.`);
      return;
    }

    setErrorMessage(null);
    setActionLoadingId(item.id);
    try {
      await onUpdateQuantity(item.id, newQty);
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در تغییر تعداد کالا در پایگاه داده');
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
      setErrorMessage(err.message || 'خطا در حذف آیتم از سبد خرید');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingOrder) return; // Prevent double-submit

    if (!cart || cart.items.length === 0) {
      setErrorMessage('سبد خرید شما در پایگاه داده خالی است.');
      return;
    }

    if (!shippingAddress.trim()) {
      setErrorMessage('لطفاً آدرس دقیق مزرعه یا محل تحویل سفارش را وارد نمایید.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmittingOrder(true);

    try {
      const ok = await onPlaceOrder(shippingAddress.trim());
      if (ok) {
        setSuccessMessage('سفارش شما با موفقیت در پایگاه داده ثبت شد و موجودی انبار کسر گردید.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در ثبت سفارش');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // If user is not logged in, prompt authentication
  if (!authToken || !currentUser) {
    return (
      <div className="bg-white rounded-3xl border border-[#E5E1D8] shadow-xs p-8 sm:p-12 text-center max-w-xl mx-auto space-y-5 my-8">
        <div className="w-16 h-16 bg-[#FDF4EE] rounded-2xl flex items-center justify-center mx-auto text-[#C27E47] border border-[#F7E5D9]">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#2D4F3E] mb-2">
            ورود به حساب کاربری جهت مشاهده سبد خرید
          </h3>
          <p className="text-xs sm:text-sm text-[#6B685E] max-w-md mx-auto leading-relaxed">
            سبد خرید در این سیستم به صورت امن در پایگاه داده ذخیره می‌شود. برای ثبت سفارش و مشاهده اقلام، لطفاً وارد حساب خود شوید.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            id="cart-login-prompt-btn"
            onClick={onNavigateToAuth}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-[#2D4F3E] hover:bg-[#234032] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
          >
            ورود / ثبت‌نام کشاورز
          </button>
          <button
            onClick={onNavigateToCatalog}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-[#F4F1EA] hover:bg-[#EBE7DE] text-[#3C3A33] text-xs sm:text-sm font-semibold border border-[#DCD7CB] transition-colors"
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
      <div className="bg-white rounded-3xl border border-[#E5E1D8] shadow-xs p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base sm:text-lg font-extrabold text-[#2D4F3E] flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#C27E47]" />
              <span>سبد خرید و تسویه سفارش</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#E8F0EC] text-[#2D4F3E] border border-[#D2E3D8]">
              {items.length} کالا
            </span>
          </div>
          <p className="text-xs text-[#6B685E]">
            اقلام سبد خرید مستقیماً در جدول Cart ذخیره شده و محاسبات قیمت از سرور دریافت می‌شود.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            id="refresh-cart-btn"
            onClick={onRefreshCart}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F9F8F6] hover:bg-[#EBE7DE] text-[#3C3A33] text-xs font-semibold border border-[#DCD7CB] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>استعلام مجدد سبد</span>
          </button>

          {items.length > 0 && (
            <button
              id="clear-all-cart-btn"
              onClick={onClearCart}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FEF2F2] hover:bg-[#FCDADA] text-[#B04A4A] text-xs font-semibold border border-[#FCDADA] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>تخلیه سبد خرید</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FCDADA] text-[#991B1B] text-xs sm:text-sm flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-5 h-5 text-[#B04A4A] shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-[#E8F0EC] border border-[#A9C4A6] text-[#234032] text-xs sm:text-sm flex items-center gap-2.5 shadow-xs">
          <ShieldCheck className="w-5 h-5 text-[#2D4F3E] shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E5E1D8]">
          <div className="w-8 h-8 border-3 border-[#2D4F3E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#8C887D]">در حال واکشی سبد خرید از دیتابیس...</p>
        </div>
      ) : items.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-[#E5E1D8] shadow-xs p-10 sm:p-14 text-center space-y-4">
          <div className="w-16 h-16 bg-[#F9F8F6] rounded-2xl flex items-center justify-center mx-auto text-[#8C887D] border border-[#EBE7DE]">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#3C3A33]">
              سبد خرید شما در حال حاضر خالی است
            </h3>
            <p className="text-xs text-[#8C887D] max-w-sm mx-auto leading-relaxed">
              نهاده‌های مورد نیاز زراعت و باغبانی خود را از کاتالوگ انتخاب و به سبد خرید اضافه نمایید.
            </p>
          </div>
          <button
            id="browse-catalog-from-empty-cart-btn"
            onClick={onNavigateToCatalog}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#C27E47] hover:bg-[#A96D3C] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
          >
            <span>مشاهده کاتالوگ و انتخاب نهاده‌ها</span>
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
                  className="bg-white rounded-3xl border border-[#E5E1D8] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs hover:border-[#8BA888]/60 transition-all"
                >
                  {/* Product Info */}
                  <div className="flex items-center gap-3.5 flex-1">
                    <img
                      src={
                        resolveMediaUrl(product?.image_url) ||
                        'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop&q=80'
                      }
                      alt={product?.name || 'محصول'}
                      className="w-16 h-16 rounded-2xl object-cover border border-[#EBE7DE] shrink-0 bg-[#F9F8F6]"
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
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#F4F1EA] text-[#6B685E] border border-[#DCD7CB] font-semibold">
                          {product?.product_type || 'نهاده'}
                        </span>
                        {product?.brand && (
                          <span className="text-xs text-[#C27E47] font-semibold">{product.brand}</span>
                        )}
                      </div>
                      <h4 className="text-sm font-extrabold text-[#2D4F3E] line-clamp-1">
                        {product?.name || `محصول #${item.product_id}`}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-[#6B685E]">
                        <span>قیمت واحد: {formatPrice(item.unit_price)}</span>
                        {product && (
                          <span className={`font-semibold ${product.stock < 5 ? 'text-[#B04A4A]' : 'text-[#2D4F3E]'}`}>
                            (موجودی انبار: {product.stock})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity and Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[#F0EEE8]">
                    
                    {/* Quantity Controller */}
                    <div className="flex items-center border border-[#DCD7CB] rounded-xl bg-[#F9F8F6] p-1 shadow-2xs">
                      <button
                        id={`cart-item-${item.id}-increase-btn`}
                        onClick={() => handleQuantityChange(item, 1)}
                        disabled={isActionLoading || (product ? item.quantity >= product.stock : false)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white hover:bg-[#EBE7DE] text-[#3C3A33] disabled:opacity-30 transition-colors cursor-pointer"
                        title="افزایش تعداد"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      <span className="w-9 text-center text-xs sm:text-sm font-bold text-[#2D4F3E]">
                        {item.quantity.toLocaleString('fa-IR')}
                      </span>

                      <button
                        id={`cart-item-${item.id}-decrease-btn`}
                        onClick={() => handleQuantityChange(item, -1)}
                        disabled={isActionLoading || item.quantity <= 1}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white hover:bg-[#EBE7DE] text-[#3C3A33] disabled:opacity-30 transition-colors cursor-pointer"
                        title="کاهش تعداد"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Line Total (Live Server Calculated) */}
                    <div className="text-left min-w-[110px]">
                      <div className="text-[11px] text-[#8C887D]">مجموع ردیف:</div>
                      <div className="text-xs sm:text-sm font-extrabold text-[#2D4F3E]">
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
            <div className="bg-white rounded-3xl border border-[#E5E1D8] shadow-xs p-5 space-y-5 sticky top-24">
              <h3 className="text-sm sm:text-base font-extrabold text-[#2D4F3E] border-b border-[#F0EEE8] pb-3 flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-[#C27E47]" />
                <span>خلاصه فاکتور و ثبت سفارش</span>
              </h3>

              {/* Price Details (From Server API Response) */}
              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between text-[#6B685E]">
                  <span>تعداد اقلام انتخابی:</span>
                  <span className="font-bold text-[#3C3A33]">{summary.total_items.toLocaleString('fa-IR')} ردیف</span>
                </div>
                <div className="flex items-center justify-between text-[#6B685E]">
                  <span>مجموع تعداد واحد:</span>
                  <span className="font-bold text-[#3C3A33]">{summary.total_quantity.toLocaleString('fa-IR')} عدد/بسته</span>
                </div>
                <div className="flex items-center justify-between text-[#6B685E]">
                  <span>هزینه باربری و ارسال:</span>
                  <span className="text-[#2D4F3E] font-bold">رایگان (تحویل باربری)</span>
                </div>

                <div className="pt-3 border-t border-[#EBE7DE] flex items-center justify-between text-sm sm:text-base font-black text-[#2D4F3E]">
                  <span>مبلغ کل قابل پرداخت:</span>
                  <span className="text-[#C27E47] font-bold font-mono">{summary.total_price_formatted}</span>
                </div>
              </div>

              {/* Shipping Address Form */}
              <form onSubmit={handleSubmitOrder} className="space-y-4 pt-3 border-t border-[#F0EEE8]">
                <div>
                  <label className="block text-xs font-bold text-[#3C3A33] mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#2D4F3E]" />
                    <span>آدرس مزرعه / تحویل باربری:</span>
                  </label>
                  <textarea
                    id="order-shipping-address-input"
                    rows={2}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="استان، شهرستان، نام روستا، آدرس مزرعه یا باغ..."
                    required
                    className="w-full p-2.5 rounded-2xl border border-[#DCD7CB] bg-[#F9F8F6] text-xs sm:text-sm text-[#3C3A33] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E] transition-all"
                  />
                </div>

                {/* Double-Submit Protected Button */}
                <button
                  id="submit-order-transaction-btn"
                  type="submit"
                  disabled={isSubmittingOrder || items.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#2D4F3E] hover:bg-[#234032] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmittingOrder ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال ثبت سفارش در پایگاه داده...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#A2D9A1]" />
                      <span>ثبت نهایی سفارش</span>
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
