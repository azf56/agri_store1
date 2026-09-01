import React, { useState } from 'react';
import {
  PackageCheck,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  RefreshCw,
  Tag,
  ShieldCheck,
  Calendar,
  Layers,
} from 'lucide-react';
import { Order, OrderStatus, User } from '../types/api.js';

interface OrdersHistoryProps {
  orders: Order[];
  loading: boolean;
  currentUser: User | null;
  authToken: string | null;
  onRefreshOrders: () => void;
  onNavigateToCatalog: () => void;
  onNavigateToAuth: () => void;
}

export const OrdersHistory: React.FC<OrdersHistoryProps> = ({
  orders,
  loading,
  currentUser,
  authToken,
  onRefreshOrders,
  onNavigateToCatalog,
  onNavigateToAuth,
}) => {
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  const formatPrice = (price: number) => {
    return Number(price).toLocaleString('fa-IR') + ' تومان';
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            در انتظار تأیید و انبارداری
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            تأیید شده
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            در حال آماده‌سازی و بسته‌بندی
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <Truck className="w-3.5 h-3.5 text-indigo-600" />
            تحویل به باربری / ارسال شده
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            تحویل داده شده
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            لغو شده
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-800 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  // If user is not logged in
  if (!authToken || !currentUser) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-sm p-8 text-center max-w-2xl mx-auto space-y-5">
        <div className="w-16 h-16 bg-[#FDF4EE] rounded-full flex items-center justify-center mx-auto text-[#C27E47] border border-[#F7E5D9]">
          <PackageCheck className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#2D4F3E] mb-2">
            سوابق سفارش‌های پایگاه داده
          </h3>
          <p className="text-sm text-[#6B685E] max-w-md mx-auto leading-relaxed">
            جهت مشاهده تاریخچه سفارش‌های ثبت‌شده در جدول <span className="font-mono font-bold text-[#2D4F3E]">Order</span> و <span className="font-mono font-bold text-[#2D4F3E]">OrderItem</span>، لطفاً وارد حساب کاربری خود شوید.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            id="orders-login-prompt-btn"
            onClick={onNavigateToAuth}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#2D4F3E] hover:bg-[#234032] text-white text-sm font-semibold shadow-xs transition-colors"
          >
            ورود کشاورزان
          </button>
          <button
            onClick={onNavigateToCatalog}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#EBE7DE] hover:bg-[#DED9CE] text-[#3C3A33] text-sm font-medium border border-[#DCD7CB] transition-colors"
          >
            مشاهده کاتالوگ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#2D4F3E] flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-[#C27E47]" />
            سفارش‌های ثبت شده کشاورز (جداول Order و OrderItem)
          </h2>
          <p className="text-xs text-[#6B685E] mt-1">
            سفارش‌ها پس از اجرای موفق تراکنش ACID در دیتابیس MySQL به طور دائمی ذخیره شده و پس از ری‌استارت نیز پایدار می‌مانند.
          </p>
        </div>

        <button
          id="refresh-orders-list-btn"
          onClick={onRefreshOrders}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F9F8F6] hover:bg-[#EBE7DE] text-[#3C3A33] text-xs font-medium border border-[#DCD7CB] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>استعلام مجدد از دیتابیس</span>
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-sm p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-[#F9F8F6] rounded-full flex items-center justify-center mx-auto text-[#8C887D] border border-[#EBE7DE]">
            <PackageCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#3C3A33] mb-1">
              هنوز هیچ سفارشی برای این حساب ثبت نشده است
            </h3>
            <p className="text-xs text-[#8C887D] max-w-sm mx-auto">
              می‌توانید نهاده‌های مورد نیاز خود را به سبد خرید اضافه کرده و سفارش رسمی خود را ثبت نمایید.
            </p>
          </div>
          <button
            onClick={onNavigateToCatalog}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C27E47] hover:bg-[#A96D3C] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            مشاهده کاتالوگ و ثبت اولین سفارش
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const items = order.items || [];

            return (
              <div
                key={order.id}
                id={`order-card-${order.id}`}
                className="bg-white rounded-2xl border border-[#E5E1D8] shadow-sm overflow-hidden hover:border-[#8BA888]/60 transition-all"
              >
                {/* Order Summary Row */}
                <div className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-[#FAF9F6] border-b border-[#F0EEE8]">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Tracking Code */}
                    <div className="px-3 py-1.5 rounded-xl bg-white border border-[#DCD7CB] shadow-2xs">
                      <span className="text-[11px] text-[#8C887D] block">کد رهگیری رسمی:</span>
                      <span className="text-xs sm:text-sm font-bold font-mono text-[#2D4F3E]">
                        {order.tracking_code || `AGRI-ORD-${order.id}`}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-xs text-[#6B685E]">
                      <Calendar className="w-3.5 h-3.5 text-[#8BA888]" />
                      <span>{formatDate(order.created_at)}</span>
                    </div>

                    {/* Status */}
                    <div>{getStatusBadge(order.status)}</div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-5 w-full lg:w-auto">
                    {/* Total Price */}
                    <div className="text-right lg:text-left">
                      <span className="text-[11px] text-[#8C887D] block">مبلغ کل سفارش:</span>
                      <span className="text-sm sm:text-base font-bold text-[#C27E47] font-mono">
                        {formatPrice(order.total_price)}
                      </span>
                    </div>

                    {/* Expand/Collapse Items Button */}
                    <button
                      id={`order-toggle-${order.id}-btn`}
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-[#EBE7DE] text-[#3C3A33] text-xs font-semibold border border-[#DCD7CB] transition-colors"
                    >
                      <span>{items.length} قلم کالا</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#8C887D]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#8C887D]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Shipping & Farm Location details */}
                <div className="px-5 py-3 bg-white text-xs text-[#6B685E] flex items-center gap-2 border-b border-[#F0EEE8]">
                  <MapPin className="w-3.5 h-3.5 text-[#2D4F3E] shrink-0" />
                  <span>
                    <strong className="text-[#3C3A33]">آدرس و موقعیت تحویل:</strong>{' '}
                    {order.shipping_address || 'آدرس پیش‌فرض کشاورز'}
                  </span>
                </div>

                {/* Order Items Breakdown */}
                {isExpanded && (
                  <div className="p-5 bg-white space-y-3">
                    <h4 className="text-xs font-bold text-[#2D4F3E] mb-2 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#C27E47]" />
                      ریز اقلام خریداری‌شده (جدول OrderItem در MySQL):
                    </h4>

                    <div className="space-y-2">
                      {items.map((it) => {
                        const product = it.product;
                        const lineTotal = it.unit_price * it.quantity;

                        return (
                          <div
                            key={it.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-[#F9F8F6] border border-[#F0EEE8] text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  product?.image_url ||
                                  'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop&q=80'
                                }
                                alt={product?.name || 'محصول'}
                                className="w-11 h-11 rounded-lg object-cover border border-[#EBE7DE] bg-white shrink-0"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLElement).setAttribute(
                                    'src',
                                    'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop&q=80'
                                  );
                                }}
                              />
                              <div>
                                <span className="font-bold text-[#2D4F3E] block">
                                  {product?.name || `کالای #${it.product_id}`}
                                </span>
                                <span className="text-[11px] text-[#8C887D]">
                                  قیمت واحد: {formatPrice(it.unit_price)} × {it.quantity} عدد
                                </span>
                              </div>
                            </div>

                            <div className="text-left font-bold text-[#3C3A33] font-mono">
                              {formatPrice(lineTotal)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
