import React, { useEffect, useState } from 'react';
import {
  X,
  PackageCheck,
  Calendar,
  Clock,
  CheckCircle2,
  Layers,
  Truck,
  ShieldCheck,
  AlertCircle,
  MapPin,
  User as UserIcon,
  Phone,
  Tag,
  FileText,
  Printer
} from 'lucide-react';
import { Order, OrderStatus } from '../types/api.js';
import { apiFetch, resolveMediaUrl } from '../config/api.js';

interface OrderDetailModalProps {
  orderId: number | null;
  authToken: string | null;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  orderId,
  authToken,
  onClose,
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId || !authToken) return;

    const fetchOrderDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/api/v1/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const data = await res.json();
        if (data.success && data.data) {
          setOrder(data.data);
        } else {
          setError(data.message || 'خطا در واکشی جزئیات سفارش از سرور');
        }
      } catch (err: any) {
        setError(`خطا در برقراری ارتباط با سرور: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [orderId, authToken]);

  if (!orderId) return null;

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-[#E5E1D8] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EBE7DE] bg-[#F9F8F6]">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-[#2D4F3E]" />
            <h3 className="text-sm sm:text-base font-bold text-[#2D4F3E]">
              جزئیات رسمی سفارش (فراخوانی از GET /api/v1/orders/{orderId})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-[#8C887D] hover:text-[#2D4F3E] hover:bg-[#EBE7DE] transition-colors"
              title="چاپ فاکتور"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#8C887D] hover:text-[#3C3A33] hover:bg-[#EBE7DE] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-3 border-[#2D4F3E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-[#8C887D]">در حال واکشی اطلاعات سفارش از پایگاه داده...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FCDADA] text-[#991B1B] text-xs sm:text-sm flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-[#B04A4A]" />
              <span>{error}</span>
            </div>
          ) : order ? (
            <div className="space-y-5">
              
              {/* Top Order Meta Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#F9F8F6] border border-[#EBE7DE]">
                <div className="space-y-1">
                  <span className="text-[11px] text-[#8C887D] block">کد رهگیری سامانه:</span>
                  <span className="text-sm font-bold font-mono text-[#2D4F3E]">
                    {order.tracking_code || `AGRI-ORD-${order.id}`}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-[#8C887D] block">تاریخ ثبت در دیتابیس:</span>
                  <span className="text-xs font-semibold text-[#3C3A33]">
                    {formatDate(order.created_at)}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-[#8C887D] block">وضعیت فعلی سفارش:</span>
                  <div>{getStatusBadge(order.status)}</div>
                </div>
              </div>

              {/* Farmer and Shipping Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white border border-[#E5E1D8] space-y-2">
                  <span className="font-bold text-[#2D4F3E] flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-[#8BA888]" />
                    <span>اطلاعات خریدار:</span>
                  </span>
                  <p className="text-[#3C3A33]">
                    <strong>نام کشاورز:</strong> {order.user?.full_name || 'ثبت شده در سیستم'}
                  </p>
                  <p className="text-[#3C3A33]">
                    <strong>شماره تماس:</strong> {order.user?.phone_number || 'نامشخص'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-[#E5E1D8] space-y-2">
                  <span className="font-bold text-[#2D4F3E] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#C27E47]" />
                    <span>آدرس و محل تحویل نهاده:</span>
                  </span>
                  <p className="text-[#3C3A33] leading-relaxed">
                    {order.shipping_address || 'آدرس پیش‌فرض مزرعه'}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-[#2D4F3E] flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-[#8BA888]" />
                  <span>اقلام سفارش (جدول OrderItem در MySQL):</span>
                </h4>

                <div className="border border-[#EBE7DE] rounded-2xl overflow-hidden bg-white">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#F9F8F6] text-[#6B685E] border-b border-[#EBE7DE]">
                      <tr>
                        <th className="p-3 font-semibold">محصول</th>
                        <th className="p-3 font-semibold text-center">تعداد</th>
                        <th className="p-3 font-semibold text-center">قیمت مصوب واحد</th>
                        <th className="p-3 font-semibold text-left">مجموع ردیف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EEE8]">
                      {order.items?.map((item) => {
                        const lineTotal = Number(item.unit_price) * item.quantity;
                        return (
                          <tr key={item.id} className="hover:bg-[#F9F8F6]/60">
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={resolveMediaUrl(item.product?.image_url) || 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop&q=80'}
                                  alt={item.product?.name || 'محصول'}
                                  className="w-10 h-10 rounded-lg object-cover border border-[#EBE7DE]"
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <div className="font-bold text-[#2D4F3E]">
                                    {item.product?.name || `محصول #${item.product_id}`}
                                  </div>
                                  <div className="text-[11px] text-[#8C887D]">
                                    {item.product?.brand || item.product?.product_type || 'نهاده کشاورزی'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center font-bold text-[#3C3A33]">
                              {item.quantity.toLocaleString('fa-IR')}
                            </td>
                            <td className="p-3 text-center font-mono text-[#6B685E]">
                              {formatPrice(item.unit_price)}
                            </td>
                            <td className="p-3 text-left font-bold font-mono text-[#2D4F3E]">
                              {formatPrice(lineTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Invoice Breakdown */}
              <div className="p-4 rounded-2xl bg-[#F9F8F6] border border-[#EBE7DE] flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-[#3C3A33]">مبلغ کل فاکتور (تأیید شده سرور):</span>
                <span className="text-base sm:text-lg font-black text-[#C27E47] font-mono">
                  {formatPrice(order.total_price)}
                </span>
              </div>

            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#EBE7DE] bg-[#F9F8F6] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#2D4F3E] text-white text-xs font-bold hover:bg-[#234032] transition-colors"
          >
            بستن
          </button>
        </div>

      </div>
    </div>
  );
};
