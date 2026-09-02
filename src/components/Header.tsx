import React from 'react';
import { Database, Sprout, Layers, Code2, BookOpen, RefreshCw, UserCheck, ShoppingCart, PackageCheck, User as UserIcon, ShieldCheck } from 'lucide-react';
import { SystemStatusResponse, User } from '../types/api.js';
import { PWAInstallButton } from './PWAInstallButton.js';

export type ActiveTabType = 'catalog' | 'cart' | 'orders' | 'admin' | 'categories' | 'auth' | 'api-tester' | 'cpanel-guide';

interface HeaderProps {
  status: SystemStatusResponse | null;
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  currentUser: User | null;
  cartCount: number;
  onRefresh: () => void;
  loading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  activeTab,
  setActiveTab,
  currentUser,
  cartCount,
  onRefresh,
  loading,
}) => {
  const isDbConnected = status?.database?.connected;
  const dialect = status?.database?.dialect?.toUpperCase() || 'MYSQL';

  return (
    <header className="bg-[#2D4F3E] text-white border-b border-[#234032] sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-3.5 gap-4">
          
          {/* Brand & Logo */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => setActiveTab('catalog')}>
              <div className="w-11 h-11 bg-[#8BA888] rounded-full flex items-center justify-center border-2 border-[#A9C4A6] shadow-inner text-white">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  سامانه جامع نهاده‌های کشاورزی
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#8BA888]/25 text-[#D7E9D6] font-normal border border-[#A9C4A6]/30">
                    کود • سم • بذر
                  </span>
                </h1>
                <p className="text-xs text-[#D7E9D6]/80">
                  مدیریت سبد خرید و سفارشات مبتنی بر MySQL + Sequelize Transactions
                </p>
              </div>
            </div>

            {/* PWA Install Button & DB Status Badge (Mobile) */}
            <div className="flex md:hidden items-center gap-2">
              <PWAInstallButton />
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/20">
                <span className={`w-2 h-2 rounded-full ${isDbConnected ? 'bg-[#A2D9A1] animate-pulse' : 'bg-rose-400'}`} />
                <span className="text-[#A2D9A1] font-mono">{dialect}</span>
              </div>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center gap-1.5 bg-[#234032]/80 p-1.5 rounded-xl border border-white/10 text-xs sm:text-sm font-medium w-full md:w-auto overflow-x-auto">
            <button
              id="tab-catalog-btn"
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'catalog'
                  ? 'bg-[#C27E47] text-white shadow-sm font-semibold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sprout className="w-4 h-4" />
              کاتالوگ محصولات
            </button>

            <button
              id="tab-cart-btn"
              onClick={() => setActiveTab('cart')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap relative ${
                activeTab === 'cart'
                  ? 'bg-[#C27E47] text-white shadow-sm font-semibold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>سبد خرید دیتابیس</span>
              {cartCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#A2D9A1] text-[#2D4F3E] font-bold text-[10px] font-mono">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              id="tab-orders-btn"
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'bg-[#C27E47] text-white shadow-sm font-semibold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <PackageCheck className="w-4 h-4" />
              <span>سفارش‌های من</span>
            </button>

            <button
              id="tab-admin-btn"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'admin'
                  ? 'bg-emerald-700 text-white shadow-sm font-bold border border-emerald-400/40'
                  : currentUser?.role === 'admin'
                  ? 'bg-emerald-950/60 text-emerald-200 hover:bg-emerald-900 border border-emerald-500/30'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>پنل مدیریت</span>
              {currentUser?.role === 'admin' && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-slate-950 font-black text-[9px]">
                  ADMIN
                </span>
              )}
            </button>

            <button
              id="tab-categories-btn"
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'categories'
                  ? 'bg-[#C27E47] text-white shadow-sm font-semibold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Layers className="w-4 h-4" />
              دسته‌بندی‌ها
            </button>

            <button
              id="tab-auth-btn"
              onClick={() => setActiveTab('auth')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'auth'
                  ? 'bg-[#C27E47] text-white shadow-sm font-semibold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>کاربران و ورود</span>
              {currentUser && (
                <span className="w-2 h-2 rounded-full bg-[#A2D9A1]" />
              )}
            </button>

            <button
              id="tab-api-tester-btn"
              onClick={() => setActiveTab('api-tester')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'api-tester'
                  ? 'bg-[#C27E47] text-white shadow-sm font-semibold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Code2 className="w-4 h-4" />
              تست API
            </button>

            <button
              id="tab-cpanel-guide-btn"
              onClick={() => setActiveTab('cpanel-guide')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'cpanel-guide'
                  ? 'bg-[#C27E47] text-white shadow-sm font-semibold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              cPanel
            </button>
          </nav>

          {/* Right Action & Status (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <PWAInstallButton />
            
            {/* User Quick Button */}
            {currentUser ? (
              <button
                onClick={() => setActiveTab('auth')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-[#8BA888] flex items-center justify-center text-white font-bold text-xs">
                  {currentUser.full_name.charAt(0)}
                </div>
                <span className="text-[#D7E9D6] max-w-[110px] truncate">{currentUser.full_name}</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('auth')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C27E47] hover:bg-[#A96D3C] text-white text-xs font-bold transition-colors"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>ورود کشاورزان</span>
              </button>
            )}

            {/* DB Status */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-xs">
              <Database className="w-4 h-4 text-[#A2D9A1]" />
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isDbConnected ? 'bg-[#A2D9A1] animate-pulse' : 'bg-rose-400'}`} />
                <span className="text-[#A2D9A1] font-mono font-bold">{dialect}</span>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              id="refresh-all-data-btn"
              onClick={onRefresh}
              disabled={loading}
              title="بروزرسانی داده‌ها از دیتابیس"
              className="p-2.5 rounded-xl bg-[#234032] hover:bg-[#1b3227] text-[#D7E9D6] hover:text-white border border-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
