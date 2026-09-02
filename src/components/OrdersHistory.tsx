import React, { useState, useEffect } from 'react';
import {
  PackageCheck,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  MapPin,
  RefreshCw,
  Tag,
  ShieldCheck,
  Calendar,
  Layers,
  Eye,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { Order, OrderStatus, User } from '../types/api.js';
import { OrderDetailModal } from './OrderDetailModal.js';

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
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Requirement: fetch latest orders on mount from database
  useEffect(() => {
    if (authToken) {
      onRefreshOrders();
    }
  }, [authToken]);

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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
            <Clock className="w-3.5 h-3.5 text-[#D97706]" />
            در انتظار تأیید
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#DBEAFE] text-[#1E40AF] border border-[#BFDBFE]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
            تأیید شده
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F3E8FF] text-[#6B21A8] border border-[#E9D5FF]">
            <Layers className="w-3.5 h-3.5 text-[#9333EA]" />
            در حال پردازش
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
            <Truck className="w-3.5 h-3.5 text-[#0284C7]" />
            ارسال شده
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
            تحویل داده شده
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]">
            <AlertCircle className="w-3.5 h-3.5 text-[#DC2626]" />
            لغو شده
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  // If user is not logged in
  if (!authToken || !currentUser) {
    return (
      <div className="bg-white rounded-3xl border border-[#E5E1D8] shadow-xs p-8 sm:p-12 text-center max-w-xl mx-auto space-y-5 my-8">
        <div className="w-16 h-16 bg-[#FDF4EE] rounded-2xl flex items-center justify-center mx-auto text-[#C27E47] border border-[#F7E5D9]">
          <PackageCheck className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#2D4F3E] mb-2">
            مشاهده سوابق و سفارش‌های ثبت‌شده
          </h3>
          <p className="text-xs sm:text-sm text-[#6B685E] max-w-md mx-auto leading-relaxed">
            جهت مشاهده وضعیت پیگیری سفارش‌ها و فاکتورهای رسمی، لطفاً ابتدا وارد حساب کاربری خود شوید.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            id="orders-login-prompt-btn"
            onClick={onNavigateToAuth}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-[#2D4F3E] hover:bg-[#234032] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
          >
            ورود کشاورزان
          </button>
          <button
            onClick={onNavigateToCatalog}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-[#F4F1EA] hover:bg-[#EBE7DE] text-[#3C3A33] text-xs sm:text-sm font-semibold border border-[#DCD7CB] transition-colors"
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
      <div className="bg-white rounded-3xl border border-[#E5E1D8] shadow-xs p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-[#2D4F3E] flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-[#C27E47]" />
            <span>تاریخچه و وضعیت سفارش‌های کشاورز</span>
          </h2>
          <p className="text-xs text-[#6B685E] mt-1">
            سفارش‌ها با کدهای رهگیری یکتا ثبت و پیگیری مراحل آماده‌سازی و ارسال باربری نمایش داده می‌شود.
          </p>
        </div>

        <button
          id="refresh-orders-list-btn"
          onClick={onRefreshOrders}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F9F8F6] hover:bg-[#EBE7DE] text-[#3C3A33] text-xs font-semibold border border-[#DCD7CB] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>استعلام مجدد از سرور</span>
        </button>
      </div>

      {loading && orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E5E1D8]">
          <div className="w-8 h-8 border-3 border-[#2D4F3E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#8C887D]">در حال دریافت لیست سفارش‌ها از سرور...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E5E1D8] shadow-xs p-10 sm:p-14 text-center space-y-4">
          <div className="w-16 h-16 bg-[#F9F8F6] rounded-2xl flex items-center justify-center mx-auto text-[#8C887D] border border-[#EBE7DE]">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#3C3A33]">
              هنوز هیچ سفارشی برای این حساب ثبت نشده است
            </h3>
            <p className="text-xs text-[#8C887D] max-w-sm mx-auto leading-relaxed">
              می‌توانید نهاده‌های مورد نیاز خود را به سبد خرید اضافه کرده و سفارش رسمی خود را نهایی فرمایید.
            </p>
          </div>
          <button
            onClick={onNavigateToCatalog}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#C27E47] hover:bg-[#A96D3C] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
          >
            مشاهده کاتالوگ و ثبت سفارش
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const items = order.items || [];

            return (
              <div
                key={order.id}
                id={`order-card-${order.id}`}
                onClick={() => setSelectedOrderId(order.id)}
                className="bg-white rounded-3xl border border-[#E5E1D8] shadow-xs overflow-hidden hover:border-[#8BA888] hover:shadow-md transition-all cursor-pointer"
              >
                {/* Order Summary Row */}
                <div className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-[#FAF9F6] border-b border-[#F0EEE8]">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Tracking Code */}
                    <div className="px-3 py-1.5 rounded-xl bg-white border border-[#DCD7CB] shadow-2xs">
                      <span className="text-[11px] text-[#8C887D] block">کد رهگیری:</span>
                      <span className="text-xs sm:text-sm font-extrabold font-mono text-[#2D4F3E]">
                        {order.tracking_code || `AGRI-ORD-${order.id}`}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-xs text-[#6B685E]">
                      <Calendar className="w-3.5 h-3.5 text-[#8BA888]" />
                      <span>{formatDate(order.created_at)}</span>
                    </div>

                    {/* Status with Color Badge */}
                    <div>{getStatusBadge(order.status)}</div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-5 w-full lg:w-auto">
                    {/* Total Price */}
                    <div className="text-right lg:text-left">
                      <span className="text-[11px] text-[#8C887D] block">مبلغ کل سفارش:</span>
                      <span className="text-sm sm:text-base font-black text-[#C27E47] font-mono">
                        {formatPrice(order.total_price)}
                      </span>
                    </div>

                    {/* View Details Button */}
                    <button
                      id={`order-view-details-${order.id}-btn`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrderId(order.id);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#EBE7DE] text-[#2D4F3E] text-xs font-bold border border-[#DCD7CB] transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#2D4F3E]" />
                      <span>مشاهده فاکتور ({items.length} قلم)</span>
                    </button>
                  </div>
                </div>

                {/* Shipping & Farm Location details */}
                <div className="px-5 py-3 bg-white text-xs text-[#6B685E] flex items-center justify-between border-b border-[#F0EEE8]">
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-[#2D4F3E] shrink-0" />
                    <span className="truncate">
                      <strong className="text-[#3C3A33]">محل تحویل:</strong>{' '}
                      {order.shipping_address || 'آدرس پیش‌فرض مزرعه'}
                    </span>
                  </div>

                  <span className="text-[11px] text-[#8C887D] shrink-0">
                    کلیک برای مشاهده جزئیات اقلام (GET /api/v1/orders/{order.id})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          authToken={authToken}
          onClose={() => setSelectedOrderId(null)}
        />
      )}

    </div>
  );
};
