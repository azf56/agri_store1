import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        onDismiss(toasts[0].id);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2.5 w-full max-w-md px-4 pointer-events-none">
      {toasts.map((toast) => {
        let bgClass = 'bg-white border-[#E5E1D8] text-[#3C3A33]';
        let icon = <Info className="w-5 h-5 text-[#8BA888] shrink-0" />;

        if (toast.type === 'success') {
          bgClass = 'bg-[#E8F0EC] border-[#A9C4A6] text-[#234032]';
          icon = <CheckCircle2 className="w-5 h-5 text-[#2D4F3E] shrink-0" />;
        } else if (toast.type === 'error') {
          bgClass = 'bg-[#FEF2F2] border-[#FCDADA] text-[#991B1B]';
          icon = <AlertCircle className="w-5 h-5 text-[#B04A4A] shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border shadow-lg transition-all duration-300 ${bgClass}`}
          >
            <div className="flex items-start gap-2.5">
              {icon}
              <div className="space-y-0.5">
                {toast.title && (
                  <h4 className="text-xs sm:text-sm font-bold">{toast.title}</h4>
                )}
                <p className="text-xs sm:text-sm leading-relaxed">{toast.message}</p>
              </div>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
