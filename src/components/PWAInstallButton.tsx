import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.js';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as standalone PWA, don't show prompt
  if (isInstalled) {
    return null;
  }

  // Android / Chromium / Desktop Install
  if (isInstallable) {
    return (
      <button
        id="pwa-install-btn"
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8BA888]/25 hover:bg-[#8BA888]/40 text-[#D7E9D6] border border-[#A9C4A6]/30 text-xs font-semibold transition-all whitespace-nowrap shadow-xs"
        title="نصب اپلیکیشن روی گوشی یا سیستم"
      >
        <Download className="w-3.5 h-3.5 text-[#A2D9A1]" />
        <span>نصب برنامه روی گوشی</span>
      </button>
    );
  }

  // iOS Safari Guide Flow
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-ios-install-btn"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[#D7E9D6] border border-white/20 text-xs font-medium transition-colors"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#A2D9A1]" />
          <span>نصب روی آیفون (iOS)</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#F4F1EA] p-6 shadow-2xl border border-[#DCD7CB] text-[#3C3A33] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#DCD7CB]">
                <h3 className="text-sm font-bold text-[#2D4F3E] flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#2D4F3E]" />
                  <span>نصب برنامه روی آیفون و آیپد</span>
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-[#8C887D] hover:text-[#3C3A33]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-[#6B685E]">
                <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-[#E5E1D8]">
                  <span className="w-5 h-5 rounded-full bg-[#2D4F3E] text-white flex items-center justify-center font-bold text-[11px] shrink-0">۱</span>
                  <p>در مرورگر سافاری، روی دکمه <strong className="text-[#2D4F3E]">Share (اشتراک‌گذاری)</strong> در نوار پایین ضربه بزنید.</p>
                </div>
                <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-[#E5E1D8]">
                  <span className="w-5 h-5 rounded-full bg-[#2D4F3E] text-white flex items-center justify-center font-bold text-[11px] shrink-0">۲</span>
                  <p>منو را به پایین کشیده و گزینه <strong className="text-[#2D4F3E]">Add to Home Screen (افزودن به صفحه اصلی)</strong> را انتخاب کنید.</p>
                </div>
                <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-[#E5E1D8]">
                  <span className="w-5 h-5 rounded-full bg-[#2D4F3E] text-white flex items-center justify-center font-bold text-[11px] shrink-0">۳</span>
                  <p>روی <strong className="text-[#2D4F3E]">Add</strong> در گوشه بالا ضربه بزنید تا آیکون برنامه در صفحه گوشی شما قرار گیرد.</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-[#2D4F3E] text-white text-xs font-bold hover:bg-[#234032] transition-colors"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
