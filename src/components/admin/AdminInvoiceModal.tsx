import React from 'react';
import { Printer, X, CheckCircle, ShieldCheck, FileText, Calendar, MapPin, User as UserIcon, Phone } from 'lucide-react';
import { Order } from '../../types/api';

interface AdminInvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AdminInvoiceModal: React.FC<AdminInvoiceModalProps> = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.created_at).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 my-8 border border-slate-200">
        
        {/* Modal Top Actions (Hidden on Print) */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                فاکتور رسمی فروش نهاده‌های کشاورزی
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                کد رهگیری: {order.tracking_code || `ORD-${order.id}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#2D4F3E] hover:bg-[#234032] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ فاکتور</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-colors font-bold"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="p-6 border border-slate-300 rounded-xl bg-white space-y-6 text-xs text-slate-800 print:border-none print:p-0">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b-2 border-emerald-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-700" />
                <h1 className="text-lg font-black text-emerald-950">
                  سامانه توزیع و فروش نهاده‌های کشاورزی آوینیا
                </h1>
              </div>
              <p className="text-slate-600 text-[11px]">
                عرضه رسمی انواع کودهای تخصصی، سموم مجاز گیاه‌پزشکی و بذور اصلاح شده زراعی و گلخانه‌ای
              </p>
              <p className="text-slate-500 text-[10px]">
                شناسه ملی: ۱۴۰۰۹۸۷۶۵۴۳ | کد اقتصادی: ۴۱۱۶۵۴۹۸۷۳۲۱ | سامانه مانیتورینگ سموم و کود جهاد کشاورزی
              </p>
            </div>

            <div className="text-left font-mono space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="text-[11px] text-slate-600">
                شماره فاکتور: <strong className="text-slate-900">{order.tracking_code || `ORD-${order.id}`}</strong>
              </div>
              <div className="text-[11px] text-slate-600">
                تاریخ صدور: <span className="text-slate-800">{formattedDate}</span>
              </div>
              <div className="text-[11px]">
                وضعیت: <span className="font-bold text-emerald-800">
                  {order.status === 'delivered' ? 'تحویل شده' :
                   order.status === 'shipped' ? 'ارسال شده به مزرعه' :
                   order.status === 'processing' ? 'در حال بسته‌بندی' :
                   order.status === 'confirmed' ? 'تأیید شده' :
                   order.status === 'cancelled' ? 'لغو شده' : 'در انتظار تأیید'}
                </span>
              </div>
            </div>
          </div>

          {/* Customer & Shipping Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1 text-[13px] border-b border-slate-200 pb-1">
                <UserIcon className="w-3.5 h-3.5 text-emerald-700" />
                مشخصات خریدار / بهره‌بردار کشاورزی:
              </div>
              <div className="text-slate-700">
                نام و نام خانوادگی: <strong className="text-slate-900">{order.user?.full_name || 'کاربر گرامی'}</strong>
              </div>
              <div className="text-slate-700 flex items-center gap-1 font-mono">
                <Phone className="w-3 h-3 text-slate-500" />
                شماره تماس همراه: <strong>{order.user?.phone_number || '-'}</strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1 text-[13px] border-b border-slate-200 pb-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                نشانی مقصد ارسال نهاده به مزرعه / انبار:
              </div>
              <div className="text-slate-700 leading-relaxed">
                {order.shipping_address || 'آدرس ثبت نشده است'}
              </div>
            </div>
          </div>

          {/* Invoice Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-900 text-white font-bold">
                  <th className="p-2.5 border border-emerald-950 text-center w-12">ردیف</th>
                  <th className="p-2.5 border border-emerald-950">شرح نهاده کشاورزی</th>
                  <th className="p-2.5 border border-emerald-950 text-center">نوع</th>
                  <th className="p-2.5 border border-emerald-950 text-center">تعداد / مقدار</th>
                  <th className="p-2.5 border border-emerald-950 text-center">قیمت واحد (تومان)</th>
                  <th className="p-2.5 border border-emerald-950 text-center">مبلغ کل ردیف (تومان)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-2.5 border border-slate-200 text-center font-mono">{index + 1}</td>
                      <td className="p-2.5 border border-slate-200 font-bold text-slate-900">
                        {item.product?.name || `محصول با شناسه #${item.product_id}`}
                        {item.product?.brand && (
                          <span className="text-slate-500 text-[11px] font-normal mr-1.5">
                            (برند: {item.product.brand})
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 border border-slate-200 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-medium">
                          {item.product?.product_type || 'نهاده'}
                        </span>
                      </td>
                      <td className="p-2.5 border border-slate-200 text-center font-mono font-bold text-slate-800">
                        {item.quantity} عدد
                      </td>
                      <td className="p-2.5 border border-slate-200 text-center font-mono text-slate-700">
                        {item.unit_price.toLocaleString('fa-IR')}
                      </td>
                      <td className="p-2.5 border border-slate-200 text-center font-mono font-bold text-emerald-800">
                        {(item.quantity * item.unit_price).toLocaleString('fa-IR')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-500 border border-slate-200">
                      اقلامی برای این سفارش ثبت نشده است
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>معافیت ارزش افزوده: بر اساس بند الف ماده ۹ قانون مالیات بر ارزش افزوده برای کود و بذر کشاورزی.</span>
              </div>
              <p>این فاکتور دارای شناسه رهگیری معتبر در پایگاه داده MySQL فروشگاه می‌باشد.</p>
            </div>

            <div className="w-full sm:w-72 space-y-1.5 border-t sm:border-t-0 pt-2 sm:pt-0">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">جمع فاکتور:</span>
                <span className="font-mono font-bold text-slate-800">
                  {order.total_price.toLocaleString('fa-IR')} تومان
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">تخفیف و مالیات:</span>
                <span className="font-mono text-slate-500">۰ تومان</span>
              </div>
              <div className="flex justify-between items-center text-sm font-black border-t border-slate-300 pt-1.5 text-emerald-900">
                <span>مبلغ نهایی قابل پرداخت:</span>
                <span className="font-mono text-base text-emerald-800">
                  {order.total_price.toLocaleString('fa-IR')} تومان
                </span>
              </div>
            </div>
          </div>

          {/* Footer Signature Box */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center">
            <div className="space-y-10">
              <span className="font-bold text-slate-700">امضا و تأیید خریدار / بهره‌بردار</span>
              <div className="border-b border-dashed border-slate-300 w-32 mx-auto"></div>
            </div>
            <div className="space-y-10">
              <span className="font-bold text-slate-700">مهر و امضای واحد فروش و توزیع نهاده</span>
              <div className="border-b border-dashed border-slate-300 w-32 mx-auto"></div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
