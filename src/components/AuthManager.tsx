import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Lock,
  Phone,
  MapPin,
  User as UserIcon,
  ShieldCheck,
  LogOut,
  Key,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Edit3,
  Copy,
  Check,
  Database,
  ArrowRight
} from 'lucide-react';
import { User, AuthResponse } from '../types/api.js';

interface AuthManagerProps {
  currentUser: User | null;
  authToken: string | null;
  onLoginSuccess: (token: string, user: User) => void;
  onLogout: () => void;
  onUserUpdated: (user: User) => void;
}

export const AuthManager: React.FC<AuthManagerProps> = ({
  currentUser,
  authToken,
  onLoginSuccess,
  onLogout,
  onUserUpdated,
}) => {
  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');
  
  // Registration form state
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regFarmLocation, setRegFarmLocation] = useState('');
  
  // Login form state
  const [loginPhone, setLoginPhone] = useState('09359876543');
  const [loginPassword, setLoginPassword] = useState('farmer123456');

  // Edit profile state
  const [editFullName, setEditFullName] = useState('');
  const [editFarmLocation, setEditFarmLocation] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Status & loading states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  
  // Live /api/auth/me inspector state
  const [liveMeData, setLiveMeData] = useState<any | null>(null);
  const [inspectingMe, setInspectingMe] = useState(false);

  // Users in MySQL table state
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setEditFullName(currentUser.full_name || '');
      setEditFarmLocation(currentUser.farm_location || '');
    }
  }, [currentUser]);

  // Load all users from MySQL
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/auth/users');
      const data = await res.json();
      if (data.success && data.users) {
        setUsersList(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  // Clear messages after 5 seconds
  const setFlashSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  const setFlashError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg(null);
    setTimeout(() => setErrorMsg(null), 6000);
  };

  // 1. Handle Registration (POST /api/auth/register)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Simple mobile regex check
    const phoneRegex = /^09[0-9]{9}$/;
    if (!phoneRegex.test(regPhone)) {
      setFlashError('شماره موبایل باید ۱۱ رقم و با 09 شروع شود (مثال: 09121234567)');
      return;
    }

    if (regPassword.length < 6) {
      setFlashError('کلمه عبور باید حداقل ۶ کاراکتر باشد');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: regPhone.trim(),
          password: regPassword,
          full_name: regFullName.trim(),
          farm_location: regFarmLocation.trim() || null,
        }),
      });

      const data: AuthResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'خطا در ثبت‌نام کاربر');
      }

      setFlashSuccess(`ثبت‌نام با موفقیت انجام شد! کاربر در جدول users ذخیره و توکن JWT صادر گردید.`);
      if (data.token && data.user) {
        onLoginSuccess(data.token, data.user);
      }
      setRegPassword('');
      fetchUsers();
    } catch (err: any) {
      setFlashError(err.message || 'خطا در برقراری ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Login (POST /api/auth/login)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: loginPhone.trim(),
          password: loginPassword,
        }),
      });

      const data: AuthResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'شماره موبایل یا رمز عبور اشتباه است');
      }

      setFlashSuccess(`ورود با موفقیت انجام شد. خوش‌آمدید، ${data.user?.full_name}`);
      if (data.token && data.user) {
        onLoginSuccess(data.token, data.user);
      }
    } catch (err: any) {
      setFlashError(err.message || 'خطا در ورود به سامانه');
    } finally {
      setLoading(false);
    }
  };

  // 3. Test Live GET /api/auth/me directly with Bearer Token
  const handleInspectMe = async () => {
    if (!authToken) return;
    setInspectingMe(true);
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      setLiveMeData({
        httpStatus: res.status,
        timestamp: new Date().toLocaleTimeString('fa-IR'),
        response: data,
      });
      if (data.success && data.user) {
        onUserUpdated(data.user);
      }
    } catch (err: any) {
      setLiveMeData({
        httpStatus: 500,
        error: err.message,
      });
    } finally {
      setInspectingMe(false);
    }
  };

  // 4. Handle Profile Update (PUT /api/auth/profile)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          full_name: editFullName.trim(),
          farm_location: editFarmLocation.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'خطا در به‌روزرسانی پروفایل در دیتابیس');
      }

      setFlashSuccess('اطلاعات پروفایل و مشخصات مزرعه با موفقیت در MySQL ذخیره شد.');
      if (data.user) {
        onUserUpdated(data.user);
      }
      setIsEditingProfile(false);
      fetchUsers();
    } catch (err: any) {
      setFlashError(err.message || 'خطا در به‌روزرسانی پروفایل');
    } finally {
      setLoading(false);
    }
  };

  const copyTokenToClipboard = () => {
    if (authToken) {
      navigator.clipboard.writeText(authToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-[#E8F0EC] text-[#2D4F3E] border border-[#D2E3D8]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2D4F3E] flex items-center gap-2">
                سیستم احراز هویت و مدیریت کاربران با JWT و bcrypt
              </h2>
              <p className="text-xs text-[#8C887D] mt-0.5">
                جدول پایگاه داده: <span className="font-mono text-[#2D4F3E] font-bold">users</span> • هشینگ امن با salt rounds=10 • اعتبارسنجی توکن در هر درخواست
              </p>
            </div>
          </div>

          {currentUser && (
            <button
              id="logout-btn"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FEF2F2] hover:bg-[#FCDADA] text-[#B04A4A] border border-[#FCDADA] text-xs font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج از حساب کاربری</span>
            </button>
          )}
        </div>

        {/* Global Success / Error notifications */}
        {successMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-[#E8F0EC] border border-[#D2E3D8] text-[#2D4F3E] text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#2D4F3E] shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FCDADA] text-[#B04A4A] text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#B04A4A] shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Left / Top Section: Active User Profile OR Login/Register Tabs */}
        <div className="lg:col-span-7 space-y-6">
          
          {currentUser ? (
            /* Logged in state card */
            <div className="bg-white rounded-2xl border border-[#E5E1D8] p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-[#EBE7DE]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#E8F0EC] border border-[#D2E3D8] flex items-center justify-center text-[#2D4F3E] font-bold text-lg">
                    {currentUser.full_name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#2D4F3E]">{currentUser.full_name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                        currentUser.role === 'admin' 
                          ? 'bg-[#2D4F3E] text-white' 
                          : 'bg-[#C27E47] text-white'
                      }`}>
                        {currentUser.role === 'admin' ? 'مدیر سامانه' : 'کشاورز / مشتری'}
                      </span>
                    </div>
                    <p className="text-xs text-[#8C887D] mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#2D4F3E]" />
                      <span className="font-mono">{currentUser.phone_number}</span>
                    </p>
                  </div>
                </div>

                <button
                  id="toggle-edit-profile-btn"
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4F1EA] hover:bg-[#EBE7DE] text-[#3C3A33] border border-[#DCD7CB] text-xs font-semibold transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#C27E47]" />
                  <span>{isEditingProfile ? 'انصراف' : 'ویرایش پروفایل'}</span>
                </button>
              </div>

              {/* Edit Profile Form (PUT /api/auth/profile) */}
              {isEditingProfile ? (
                <form onSubmit={handleUpdateProfile} className="bg-[#F9F8F6] p-4 rounded-xl border border-[#E5E1D8] space-y-3.5">
                  <h4 className="text-xs font-bold text-[#2D4F3E] flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-[#C27E47]" />
                    <span>ویرایش اطلاعات و ذخیره در MySQL (PUT /api/auth/profile)</span>
                  </h4>
                  <div>
                    <label className="block text-xs font-semibold text-[#3C3A33] mb-1">
                      نام و نام خانوادگی <span className="text-[#B04A4A]">*</span>
                    </label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 rounded-xl border border-[#DCD7CB] bg-white text-xs text-[#3C3A33] focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#3C3A33] mb-1">
                      موقعیت یا استان/شهر مزرعه
                    </label>
                    <input
                      type="text"
                      value={editFarmLocation}
                      onChange={(e) => setEditFarmLocation(e.target.value)}
                      placeholder="مثال: استان فارس، مرودشت، مزرعه گندم و ذرت"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#DCD7CB] bg-white text-xs text-[#3C3A33] focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E] outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3.5 py-1.5 rounded-lg border border-[#DCD7CB] bg-white text-xs text-[#3C3A33]"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-1.5 rounded-lg bg-[#C27E47] hover:bg-[#A96D3C] text-white text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {loading ? 'در حال ذخیره در MySQL...' : 'ذخیره تغییرات در دیتابیس'}
                    </button>
                  </div>
                </form>
              ) : (
                /* Profile attributes details */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-3 rounded-xl bg-[#F9F8F6] border border-[#E5E1D8]">
                    <span className="text-[#8C887D] block mb-1">شناسه کاربر در جدول Users (Primary Key):</span>
                    <span className="font-mono font-bold text-[#2D4F3E]">#{currentUser.id}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F9F8F6] border border-[#E5E1D8]">
                    <span className="text-[#8C887D] block mb-1">موقعیت مزرعه / اقلیم:</span>
                    <span className="font-semibold text-[#3C3A33] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#C27E47]" />
                      {currentUser.farm_location || 'ثبت نشده'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F9F8F6] border border-[#E5E1D8]">
                    <span className="text-[#8C887D] block mb-1">تاریخ ثبت‌نام در دیتابیس:</span>
                    <span className="text-[#3C3A33]">
                      {currentUser.created_at ? new Date(currentUser.created_at).toLocaleDateString('fa-IR') : 'نامشخص'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F9F8F6] border border-[#E5E1D8]">
                    <span className="text-[#8C887D] block mb-1">نوع دسترسی (Role):</span>
                    <span className="text-[#2D4F3E] font-medium font-mono">{currentUser.role}</span>
                  </div>
                </div>
              )}

              {/* JWT Bearer Token Inspection Box */}
              <div className="bg-[#1E2E25] text-[#F4F1EA] p-4 rounded-xl border border-[#234032] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[#A2D9A1] font-bold">
                    <Key className="w-4 h-4" />
                    <span>توکن فعال احراز هویت (JWT Bearer Token - انقضا ۷ روز)</span>
                  </div>
                  <button
                    onClick={copyTokenToClipboard}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#2D4F3E] hover:bg-[#38614D] text-[#E5E1D8] text-[11px] transition-colors"
                  >
                    {copiedToken ? <Check className="w-3.5 h-3.5 text-[#A2D9A1]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedToken ? 'کپی شد' : 'کپی توکن'}</span>
                  </button>
                </div>
                <div className="p-2.5 bg-[#17241D] rounded-lg font-mono text-[11px] text-[#A2D9A1] break-all direction-ltr text-left border border-[#2D4F3E]">
                  {authToken}
                </div>
              </div>

              {/* Live Test GET /api/auth/me */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#2D4F3E]">تست زنده احراز هویت با دیتابیس:</span>
                  <button
                    id="test-auth-me-btn"
                    onClick={handleInspectMe}
                    disabled={inspectingMe}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2D4F3E] hover:bg-[#234032] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${inspectingMe ? 'animate-spin' : ''}`} />
                    <span>اجرای درخواست GET /api/auth/me</span>
                  </button>
                </div>

                {liveMeData && (
                  <div className="bg-[#F9F8F6] border border-[#E5E1D8] p-3 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[#8C887D] text-[11px] border-b border-[#EBE7DE] pb-1">
                      <span>پاسخ سرور در زمان {liveMeData.timestamp}</span>
                      <span className="font-mono text-[#2D4F3E] font-bold">HTTP {liveMeData.httpStatus}</span>
                    </div>
                    <pre className="font-mono text-[11px] text-[#2D4F3E] direction-ltr text-left overflow-x-auto pt-1">
                      {JSON.stringify(liveMeData.response || liveMeData.error, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* Login & Registration Tabs */
            <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-sm overflow-hidden">
              
              {/* Tab Switcher */}
              <div className="flex items-center border-b border-[#EBE7DE] bg-[#F4F1EA]">
                <button
                  id="tab-login-mode-btn"
                  onClick={() => setActiveMode('login')}
                  className={`flex-1 py-3.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                    activeMode === 'login'
                      ? 'border-[#2D4F3E] text-[#2D4F3E] bg-white'
                      : 'border-transparent text-[#8C887D] hover:text-[#3C3A33]'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>ورود به حساب (POST /api/auth/login)</span>
                </button>

                <button
                  id="tab-register-mode-btn"
                  onClick={() => setActiveMode('register')}
                  className={`flex-1 py-3.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                    activeMode === 'register'
                      ? 'border-[#2D4F3E] text-[#2D4F3E] bg-white'
                      : 'border-transparent text-[#8C887D] hover:text-[#3C3A33]'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>ثبت‌نام کشاورز جدید (POST /api/auth/register)</span>
                </button>
              </div>

              {/* Form Content */}
              <div className="p-5 sm:p-6">
                {activeMode === 'login' ? (
                  /* Login Form */
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#3C3A33] mb-1">
                        شماره موبایل کشاورز <span className="text-[#B04A4A]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={loginPhone}
                          onChange={(e) => setLoginPhone(e.target.value)}
                          placeholder="09121234567"
                          className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-[#DCD7CB] bg-[#F9F8F6] text-xs text-[#3C3A33] focus:bg-white focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E] outline-none direction-ltr text-left"
                          required
                        />
                        <Phone className="w-4 h-4 text-[#8C887D] absolute left-3 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#3C3A33] mb-1">
                        کلمه عبور <span className="text-[#B04A4A]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-[#DCD7CB] bg-[#F9F8F6] text-xs text-[#3C3A33] focus:bg-white focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E] outline-none direction-ltr text-left"
                          required
                        />
                        <Lock className="w-4 h-4 text-[#8C887D] absolute left-3 top-3" />
                      </div>
                    </div>

                    {/* Quick Demo Accounts */}
                    <div className="p-3 bg-[#F4F1EA] rounded-xl border border-[#E5E1D8] space-y-1.5">
                      <span className="text-[11px] font-bold text-[#2D4F3E] block">حساب‌های نمونه آماده برای تست سریع:</span>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setLoginPhone('09359876543');
                            setLoginPassword('farmer123456');
                          }}
                          className="px-2.5 py-1 rounded bg-white text-[#3C3A33] border border-[#DCD7CB] text-[11px] hover:bg-[#EBE7DE] transition-colors"
                        >
                          کشاورز: <span className="font-mono text-[#2D4F3E]">09359876543</span> (farmer123456)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLoginPhone('09121234567');
                            setLoginPassword('admin123456');
                          }}
                          className="px-2.5 py-1 rounded bg-white text-[#3C3A33] border border-[#DCD7CB] text-[11px] hover:bg-[#EBE7DE] transition-colors"
                        >
                          مدیر ارشد: <span className="font-mono text-[#2D4F3E]">09121234567</span> (admin123456)
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      id="submit-login-btn"
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl bg-[#2D4F3E] hover:bg-[#234032] text-white text-xs sm:text-sm font-bold shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      <span>{loading ? 'در حال بررسی در پایگاه داده...' : 'ورود و دریافت توکن JWT'}</span>
                    </button>
                  </form>
                ) : (
                  /* Registration Form */
                  <form onSubmit={handleRegister} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-[#3C3A33] mb-1">
                        نام و نام خانوادگی کشاورز / خریدار <span className="text-[#B04A4A]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={regFullName}
                          onChange={(e) => setRegFullName(e.target.value)}
                          placeholder="مثال: مهندس بهرام رضایی"
                          className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-[#DCD7CB] bg-[#F9F8F6] text-xs text-[#3C3A33] focus:bg-white focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E] outline-none"
                          required
                        />
                        <UserIcon className="w-4 h-4 text-[#8C887D] absolute left-3 top-3" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-[#3C3A33] mb-1">
                          شماره موبایل (۱۱ رقم) <span className="text-[#B04A4A]">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            placeholder="09131112233"
                            className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-[#DCD7CB] bg-[#F9F8F6] text-xs text-[#3C3A33] focus:bg-white focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E] outline-none direction-ltr text-left"
                            required
                          />
                          <Phone className="w-4 h-4 text-[#8C887D] absolute left-3 top-3" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#3C3A33] mb-1">
                          کلمه عبور (حداقل ۶ کاراکتر) <span className="text-[#B04A4A]">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="حداقل ۶ کاراکتر"
                            className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-[#DCD7CB] bg-[#F9F8F6] text-xs text-[#3C3A33] focus:bg-white focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E] outline-none direction-ltr text-left"
                            required
                          />
                          <Lock className="w-4 h-4 text-[#8C887D] absolute left-3 top-3" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#3C3A33] mb-1">
                        موقعیت مزرعه یا باغ (استان و شهر)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={regFarmLocation}
                          onChange={(e) => setRegFarmLocation(e.target.value)}
                          placeholder="مثال: استان قزوین، بوئین‌زهرا، باغات پسته"
                          className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-[#DCD7CB] bg-[#F9F8F6] text-xs text-[#3C3A33] focus:bg-white focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E] outline-none"
                        />
                        <MapPin className="w-4 h-4 text-[#8C887D] absolute left-3 top-3" />
                      </div>
                    </div>

                    <p className="text-[11px] text-[#8C887D] leading-relaxed">
                      💡 کلمه عبور قبل از درج در MySQL توسط کتابخانه bcrypt هش می‌شود و هرگز به صورت متن ساده در دیتابیس ذخیره نخواهد شد.
                    </p>

                    <button
                      type="submit"
                      id="submit-register-btn"
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl bg-[#C27E47] hover:bg-[#A96D3C] text-white text-xs sm:text-sm font-bold shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{loading ? 'در حال ثبت در پایگاه داده MySQL...' : 'ثبت‌نام و ایجاد حساب در MySQL'}</span>
                    </button>
                  </form>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Right Section: Users Table in Database Explorer & Security Guidelines */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Registered Users in MySQL */}
          <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-sm p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#EBE7DE]">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#2D4F3E]" />
                <h3 className="text-xs font-bold text-[#2D4F3E]">کاربران ثبت‌شده در جدول MySQL (Users)</h3>
              </div>
              <button
                onClick={fetchUsers}
                disabled={loadingUsers}
                title="تازه سازی لیست کاربران"
                className="p-1 rounded-lg hover:bg-[#F4F1EA] text-[#8C887D] hover:text-[#2D4F3E] transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingUsers ? (
              <div className="text-center py-6 text-xs text-[#8C887D] animate-pulse">
                در حال خواندن کاربران از دیتابیس...
              </div>
            ) : usersList.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#8C887D]">
                هنوز کاربری ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {usersList.map((u) => (
                  <div
                    key={u.id}
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      currentUser?.id === u.id
                        ? 'bg-[#E8F0EC] border-[#8BA888]'
                        : 'bg-[#F9F8F6] border-[#E5E1D8]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="font-bold text-[#2D4F3E] flex items-center gap-1.5">
                        <span>{u.full_name}</span>
                        {currentUser?.id === u.id && (
                          <span className="text-[10px] bg-[#2D4F3E] text-white px-1.5 py-0.2 rounded font-normal">
                            شما
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-[#8C887D]">
                        #{u.id}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#6B685E]">
                      <span className="font-mono">{u.phone_number}</span>
                      <span className="text-[#C27E47] font-medium">{u.farm_location || 'بدون موقعیت'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security & Architectural Highlights */}
          <div className="bg-[#2D4F3E] text-white rounded-2xl p-5 border border-[#234032] space-y-3">
            <h4 className="text-xs font-bold text-[#A2D9A1] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>اصول امنیتی احراز هویت پیاده‌سازی‌شده</span>
            </h4>
            <ul className="text-xs text-[#D7E9D6] space-y-2 list-disc list-inside leading-relaxed">
              <li>
                <strong>عدم ذخیره پسورد متنی:</strong> تمامی کلمات عبور قبل از ذخیره‌سازی با الگوریتم bcrypt و ۱۰ مرحله سالت هش می‌شوند.
              </li>
              <li>
                <strong>محافظت Brute-force:</strong> مسیر <code className="font-mono text-[#A2D9A1]">/api/auth/login</code> دارای Rate Limiting با حداکثر ۲۰ تلاش در ۱۵ دقیقه است.
              </li>
              <li>
                <strong>استعلام دیتابیس در هر درخواست:</strong> میدلور <code className="font-mono text-[#A2D9A1]">authenticateToken</code> در هر کال، هویت کاربر را با شناسه ID مستقیماً از MySQL واکشی می‌کند.
              </li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
};
