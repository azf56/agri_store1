import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  FileText,
  Search,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  Layers,
  Terminal,
  Upload,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  User,
  Category,
  Product,
  ProductType,
  Order,
  OrderStatus,
  AdminDashboardStats,
} from '../types/api';

interface AdminPanelProps {
  user: User | null;
  token: string | null;
  categories: Category[];
  onRefreshCatalog: () => void;
  onNavigateToAuth: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  user,
  token,
  categories,
  onRefreshCatalog,
  onNavigateToAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'categories' | 'terminal'>('dashboard');
  
  // Dashboard state
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersFilterStatus, setOrdersFilterStatus] = useState<string>('all');
  const [ordersSearch, setOrdersSearch] = useState<string>('');
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  // Products state
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState<string>('all');

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category_id: '',
    product_type: 'کود' as ProductType,
    required_permit_number: '',
    brand: '',
    package_size: '',
    image_url: '',
    msds_file_url: '',
  });
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productMsdsFile, setProductMsdsFile] = useState<File | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  // Status/Feedback Toast
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 6000);
  };

  const isAdmin = user && user.role === 'admin';

  // Fetch Stats
  const fetchStats = async () => {
    if (!token || !isAdmin) return;
    setLoadingStats(true);
    setStatsError(null);
    try {
      const res = await fetch('/api/v1/admin/dashboard/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      } else {
        setStatsError(data.message || 'خطا در دریافت آمار');
      }
    } catch (err: any) {
      setStatsError(err.message || 'خطای اتصال به سرور');
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch Admin Orders
  const fetchOrders = async () => {
    if (!token || !isAdmin) return;
    setLoadingOrders(true);
    try {
      const params = new URLSearchParams();
      if (ordersFilterStatus !== 'all') params.append('status', ordersFilterStatus);
      if (ordersSearch.trim()) params.append('search', ordersSearch.trim());
      params.append('limit', '50');

      const res = await fetch(`/api/v1/admin/orders?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch Admin Products
  const fetchAdminProducts = async () => {
    if (!token || !isAdmin) return;
    setLoadingProducts(true);
    try {
      const res = await fetch('/api/v1/products?limit=100', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setAdminProducts(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching admin products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (isAdmin && token) {
      fetchStats();
      fetchOrders();
      fetchAdminProducts();
    }
  }, [isAdmin, token]);

  useEffect(() => {
    if (isAdmin && token && activeTab === 'orders') {
      fetchOrders();
    }
  }, [ordersFilterStatus, activeTab]);

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    if (!token) return;
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/v1/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'وضعیت سفارش با موفقیت در پایگاه داده تغییر یافت.', 'success');
        fetchOrders();
        fetchStats();
      } else {
        showToast(data.message || 'خطا در تغییر وضعیت سفارش', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'خطای شبکه در به‌روزرسانی سفارش', 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Open Product Modal for Create
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProductFormData({
      name: '',
      description: '',
      price: '',
      stock: '20',
      category_id: categories[0]?.id?.toString() || '1',
      product_type: 'کود',
      required_permit_number: '',
      brand: '',
      package_size: '',
      image_url: '',
      msds_file_url: '',
    });
    setProductImageFile(null);
    setProductMsdsFile(null);
    setIsProductModalOpen(true);
  };

  // Open Product Modal for Edit
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductFormData({
      name: prod.name,
      description: prod.description || '',
      price: prod.price.toString(),
      stock: prod.stock.toString(),
      category_id: prod.category_id.toString(),
      product_type: prod.product_type,
      required_permit_number: prod.required_permit_number || '',
      brand: prod.brand || '',
      package_size: prod.package_size || '',
      image_url: prod.image_url || '',
      msds_file_url: prod.msds_file_url || '',
    });
    setProductImageFile(null);
    setProductMsdsFile(null);
    setIsProductModalOpen(true);
  };

  // Save Product (Create or Update with FormData)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingProduct(true);

    try {
      const formData = new FormData();
      formData.append('name', productFormData.name);
      formData.append('description', productFormData.description);
      formData.append('price', productFormData.price);
      formData.append('stock', productFormData.stock);
      formData.append('category_id', productFormData.category_id);
      formData.append('product_type', productFormData.product_type);
      formData.append('required_permit_number', productFormData.required_permit_number);
      formData.append('brand', productFormData.brand);
      formData.append('package_size', productFormData.package_size);
      
      if (productFormData.image_url && !productImageFile) {
        formData.append('image_url', productFormData.image_url);
      }
      if (productFormData.msds_file_url && !productMsdsFile) {
        formData.append('msds_file_url', productFormData.msds_file_url);
      }

      if (productImageFile) {
        formData.append('image', productImageFile);
      }
      if (productMsdsFile) {
        formData.append('msds_file', productMsdsFile);
      }

      const url = editingProduct
        ? `/api/v1/admin/products/${editingProduct.id}`
        : '/api/v1/admin/products';
      
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          editingProduct
            ? 'محصول با موفقیت در دیتابیس MySQL به‌روزرسانی شد.'
            : 'محصول جدید با موفقیت به همراه فایل‌های ضمیمه در دیتابیس ثبت شد.',
          'success'
        );
        setIsProductModalOpen(false);
        fetchAdminProducts();
        fetchStats();
        onRefreshCatalog();
      } else {
        showToast(data.message || 'خطا در ذخیره‌سازی محصول', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'خطای شبکه در ذخیره محصول', 'error');
    } finally {
      setSavingProduct(false);
    }
  };

  // Delete/Deactivate Product
  const handleDeleteProduct = async (product: Product) => {
    if (!token) return;
    const confirmed = window.confirm(
      `آیا از حذف محصول "${product.name}" اطمینان دارید؟\n\nنکته امنیتی: در صورتی که این محصول در سفارش‌های قبلی ثبت شده باشد، سوابق حفظ شده و محصول صرفاً غیرفعال (is_active = false) خواهد شد.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/v1/admin/products/${product.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchAdminProducts();
        fetchStats();
        onRefreshCatalog();
      } else {
        showToast(data.message || 'خطا در حذف محصول', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'خطای شبکه در حذف محصول', 'error');
    }
  };

  // Category Actions
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !categoryName.trim()) return;
    setSavingCategory(true);

    try {
      const url = editingCategory
        ? `/api/v1/admin/categories/${editingCategory.id}`
        : '/api/v1/admin/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: categoryName.trim(),
          description: categoryDesc.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          editingCategory ? 'دسته‌بندی با موفقیت ویرایش شد.' : 'دسته‌بندی جدید با موفقیت ایجاد گردید.',
          'success'
        );
        setIsCategoryModalOpen(false);
        setCategoryName('');
        setCategoryDesc('');
        setEditingCategory(null);
        onRefreshCatalog();
        fetchStats();
      } else {
        showToast(data.message || 'خطا در ثبت دسته‌بندی', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'خطای شبکه', 'error');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!token) return;
    if (!window.confirm(`آیا از حذف دسته‌بندی "${cat.name}" اطمینان دارید؟`)) return;

    try {
      const res = await fetch(`/api/v1/admin/categories/${cat.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const data = await res.json();
      if (data.success) {
        showToast('دسته‌بندی با موفقیت حذف گردید.', 'success');
        onRefreshCatalog();
        fetchStats();
      } else {
        showToast(data.message || 'خطا در حذف دسته‌بندی', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'خطا در ارتباط با سرور', 'error');
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300"><Clock className="w-3 h-3" /> در انتظار تأیید</span>;
      case 'confirmed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300"><CheckCircle className="w-3 h-3" /> تأیید شده</span>;
      case 'processing':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300"><RefreshCw className="w-3 h-3" /> در حال بسته‌بندی</span>;
      case 'shipped':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 border border-cyan-300"><Truck className="w-3 h-3" /> ارسال شده به مزرعه</span>;
      case 'delivered':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300"><CheckCircle className="w-3 h-3" /> تحویل شده</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300"><XCircle className="w-3 h-3" /> لغو شده</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  // If not logged in or role is not admin, show permission gate
  if (!user || user.role !== 'admin') {
    return (
      <div id="admin-forbidden-gate" className="max-w-4xl mx-auto space-y-6 text-right" dir="rtl">
        <div className="bg-white rounded-2xl p-8 border-2 border-rose-200 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-inner">
            <ShieldAlert className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold font-mono">
              HTTP 403 FORBIDDEN - REQUIRE ADMIN
            </span>
            <h2 className="text-2xl font-black text-slate-800">
              دسترسی به پنل مدیریت نیازمند نقش مدیر (Admin) است
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto text-sm leading-relaxed">
              مسیرهای <code className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-700 font-mono text-xs">/api/v1/admin/*</code> مجهز به میدلورهای <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono text-xs">authenticateToken</code> و <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono text-xs">requireAdmin</code> هستند و مستقیماً فیلد <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono text-xs">role</code> را در دیتابیس MySQL اعتبارسنجی می‌کنند.
            </p>
          </div>

          {user ? (
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-right space-y-2 max-w-lg mx-auto text-sm">
              <div className="flex justify-between items-center text-xs text-slate-500 pb-2 border-b border-slate-200">
                <span>وضعیت حساب فعلی شما:</span>
                <span className="font-mono">{user.phone_number}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">نام کاربر:</span>
                <span className="font-bold text-slate-800">{user.full_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">نقش فعلی (Role):</span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">{user.role} (مشتری عادی)</span>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-800 text-sm max-w-lg mx-auto">
              شما در حال حاضر وارد حساب کاربری نشده‌اید. لطفاً با حساب کاربری مدیر وارد شوید.
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              id="admin-go-to-auth-btn"
              onClick={onNavigateToAuth}
              className="px-6 py-3 bg-[#2D4F3E] hover:bg-[#243f32] text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              ورود با حساب کاربری مدیر
            </button>
          </div>

          {/* Terminal Script Instruction */}
          <div className="bg-slate-900 text-slate-200 p-5 rounded-xl text-right font-mono text-xs space-y-3 max-w-2xl mx-auto border border-slate-800">
            <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-slate-800 pb-2">
              <Terminal className="w-4 h-4" />
              <span>ساخت یا ارتقای کاربر مدیر از طریق ترمینال cPanel (بدون API عمومی):</span>
            </div>
            <p className="text-slate-400 text-xs">
              مطابق اصول امنیتی، ساخت ادمین صرفاً از طریق اسکریپت سروری اجرا می‌شود:
            </p>
            <div className="bg-black/50 p-3 rounded text-left font-mono text-emerald-300 overflow-x-auto" dir="ltr">
              node create-admin.js --phone 09121234567 --password admin123456 --name "مدیر کل"
            </div>
            <p className="text-slate-400 text-xs">
              یا با حساب پیش‌فرض از پیش تعریف‌شده وارد شوید:
              <br />
              شماره همراه: <strong className="text-white">09121234567</strong> | رمز عبور: <strong className="text-white">admin123456</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="admin-panel-container" className="space-y-6 text-right" dir="rtl">
      {/* Toast Feedback */}
      {feedback && (
        <div
          id="admin-feedback-toast"
          className={`p-4 rounded-xl flex items-center justify-between shadow-lg text-sm font-medium transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-800 text-white border border-emerald-600'
              : 'bg-rose-800 text-white border border-rose-600'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs underline opacity-80 hover:opacity-100">
            بستن
          </button>
        </div>
      )}

      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#1e3428] to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              مدیر ارشد سامانه (Admin Role Verified)
            </span>
            <span className="text-xs text-slate-400 font-mono">MySQL 8.0 / Sequelize ORM</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            پنل مدیریت و پایش نهاده‌های کشاورزی
          </h1>
          <p className="text-sm text-slate-300">
            مدیریت بلادرنگ محصولات (کود، سم، بذر)، کنترل فاکتورها و تغییر وضعیت سفارشات با اتصال مستقیم به پایگاه داده
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="admin-refresh-stats-btn"
            onClick={() => {
              fetchStats();
              fetchOrders();
              fetchAdminProducts();
              showToast('آمار و اطلاعات از دیتابیس با موفقیت بازخوانی شدند.', 'success');
            }}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} />
            بازخوانی کوئری‌ها
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          id="admin-tab-dashboard"
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'dashboard'
              ? 'bg-[#2D4F3E] text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          داشبورد و آمار زنده
        </button>

        <button
          id="admin-tab-orders"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'bg-[#2D4F3E] text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          مدیریت سفارشات ({stats?.total_orders || orders.length})
        </button>

        <button
          id="admin-tab-products"
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'products'
              ? 'bg-[#2D4F3E] text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          مدیریت محصولات و انبار ({adminProducts.length})
        </button>

        <button
          id="admin-tab-categories"
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'bg-[#2D4F3E] text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          مدیریت دسته‌بندی‌ها ({categories.length})
        </button>

        <button
          id="admin-tab-terminal"
          onClick={() => setActiveTab('terminal')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'terminal'
              ? 'bg-[#2D4F3E] text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          اسکریپت ساخت ادمین
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. DASHBOARD & LIVE STATS VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div id="admin-dashboard-view" className="space-y-6">
          {statsError && (
            <div className="bg-rose-50 text-rose-800 p-4 rounded-xl border border-rose-200 text-sm">
              {statsError}
            </div>
          )}

          {/* 4 Main Real SQL Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Orders */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">تعداد کل سفارش‌ها</span>
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {stats ? stats.total_orders.toLocaleString('fa-IR') : '...'}
              </div>
              <p className="text-xs text-slate-400">
                محاسبه از جدول <code className="font-mono text-slate-600">orders</code>
              </p>
            </div>

            {/* 2. Total Revenue */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">مجموع فروش و درآمد</span>
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-700">
                {stats ? stats.total_revenue.toLocaleString('fa-IR') : '...'}
                <span className="text-xs text-slate-500 font-normal mr-1">تومان</span>
              </div>
              <p className="text-xs text-slate-400">
                مجموع فاکتورهای غیر لغو شده
              </p>
            </div>

            {/* 3. Low Stock Alert */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">موجودی بحرانی (کمتر از ۱۰)</span>
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-600">
                {stats ? stats.low_stock_count.toLocaleString('fa-IR') : '...'}
                <span className="text-xs text-slate-500 font-normal mr-1">محصول</span>
              </div>
              <p className="text-xs text-slate-400">
                نیاز فوری به شارژ انبار
              </p>
            </div>

            {/* 4. New Users 30 Days */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">کاربران جدید (۳۰ روز اخیر)</span>
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-indigo-600">
                {stats ? stats.new_users_30d.toLocaleString('fa-IR') : '...'}
                <span className="text-xs text-slate-500 font-normal mr-1">کشاورز</span>
              </div>
              <p className="text-xs text-slate-400">
                کل کاربران: {stats ? stats.total_users.toLocaleString('fa-IR') : '...'}
              </p>
            </div>
          </div>

          {/* Orders by Status Real Distribution */}
          {stats && stats.orders_by_status && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#2D4F3E]" />
                وضعیت تفکیکی سفارشات در سیستم (بر اساس کوئری MySQL)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <div className="text-xs text-amber-700 font-semibold">در انتظار تأیید</div>
                  <div className="text-xl font-black text-amber-900 mt-1">{stats.orders_by_status.pending.toLocaleString('fa-IR')}</div>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
                  <div className="text-xs text-blue-700 font-semibold">تأیید شده</div>
                  <div className="text-xl font-black text-blue-900 mt-1">{stats.orders_by_status.confirmed.toLocaleString('fa-IR')}</div>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-center">
                  <div className="text-xs text-indigo-700 font-semibold">در حال پردازش</div>
                  <div className="text-xl font-black text-indigo-900 mt-1">{stats.orders_by_status.processing.toLocaleString('fa-IR')}</div>
                </div>
                <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-center">
                  <div className="text-xs text-cyan-700 font-semibold">ارسال شده</div>
                  <div className="text-xl font-black text-cyan-900 mt-1">{stats.orders_by_status.shipped.toLocaleString('fa-IR')}</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <div className="text-xs text-emerald-700 font-semibold">تحویل شده</div>
                  <div className="text-xl font-black text-emerald-900 mt-1">{stats.orders_by_status.delivered.toLocaleString('fa-IR')}</div>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <div className="text-xs text-rose-700 font-semibold">لغو شده</div>
                  <div className="text-xl font-black text-rose-900 mt-1">{stats.orders_by_status.cancelled.toLocaleString('fa-IR')}</div>
                </div>
              </div>
            </div>
          )}

          {/* Low Stock Warning Table */}
          {stats && stats.low_stock_products && stats.low_stock_products.length > 0 && (
            <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  هشدار اقلام رو به اتمام در انبار (موجودی ≤ ۱۰)
                </h3>
                <button
                  onClick={() => setActiveTab('products')}
                  className="text-xs text-[#2D4F3E] font-bold hover:underline"
                >
                  مشاهده همه در بخش محصولات
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-amber-100/70 text-amber-950 font-bold">
                    <tr>
                      <th className="p-3 rounded-r-lg">شناسه</th>
                      <th className="p-3">نام نهاده</th>
                      <th className="p-3">نوع</th>
                      <th className="p-3">برند</th>
                      <th className="p-3">قیمت واحد</th>
                      <th className="p-3">موجودی فعلی</th>
                      <th className="p-3 rounded-l-lg text-center">اقدام</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-200/60">
                    {stats.low_stock_products.map((prod) => (
                      <tr key={prod.id} className="hover:bg-amber-100/40">
                        <td className="p-3 font-mono font-bold">#{prod.id}</td>
                        <td className="p-3 font-bold text-slate-800">{prod.name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-amber-200">
                            {prod.product_type}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{prod.brand || '-'}</td>
                        <td className="p-3 font-mono">{prod.price.toLocaleString('fa-IR')} ت</td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold font-mono">
                            {prod.stock} عدد
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              const found = adminProducts.find((p) => p.id === prod.id);
                              if (found) handleOpenEditProduct(found);
                              else setActiveTab('products');
                            }}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold"
                          >
                            شارژ موجودی
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ORDER MANAGEMENT VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <div id="admin-orders-view" className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-bold text-slate-500">فیلتر وضعیت:</span>
              {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrdersFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    ordersFilterStatus === st
                      ? 'bg-[#2D4F3E] text-white shadow'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {st === 'all' && 'همه سفارش‌ها'}
                  {st === 'pending' && 'در انتظار'}
                  {st === 'confirmed' && 'تأیید شده'}
                  {st === 'processing' && 'در حال پردازش'}
                  {st === 'shipped' && 'ارسال شده'}
                  {st === 'delivered' && 'تحویل شده'}
                  {st === 'cancelled' && 'لغو شده'}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="جستجو با کد رهگیری یا آدرس..."
                value={ordersSearch}
                onChange={(e) => setOrdersSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
                className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D4F3E]"
              />
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loadingOrders ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#2D4F3E]" />
                در حال استعلام سفارشات از MySQL...
              </div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                هیچ سفارشی مطابق با فیلترهای انتخابی یافت نشد.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">کد رهگیری</th>
                      <th className="p-3.5">کشاورز / خریدار</th>
                      <th className="p-3.5">تلفن تماس</th>
                      <th className="p-3.5">مبلغ کل فاکتور</th>
                      <th className="p-3.5">تعداد اقلام</th>
                      <th className="p-3.5">وضعیت</th>
                      <th className="p-3.5">تغییر وضعیت در دیتابیس</th>
                      <th className="p-3.5 text-center">جزئیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((order) => {
                      const isExpanded = expandedOrderId === order.id;
                      const isUpdating = updatingOrderId === order.id;

                      return (
                        <React.Fragment key={order.id}>
                          <tr className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3.5 font-mono font-bold text-indigo-700">
                              {order.tracking_code || `ORD-${order.id}`}
                            </td>
                            <td className="p-3.5 font-bold text-slate-800">
                              {order.user?.full_name || 'کاربر مهمان'}
                            </td>
                            <td className="p-3.5 font-mono text-slate-600">
                              {order.user?.phone_number || '-'}
                            </td>
                            <td className="p-3.5 font-bold text-emerald-800 font-mono">
                              {order.total_price.toLocaleString('fa-IR')} تومان
                            </td>
                            <td className="p-3.5 font-mono text-slate-600">
                              {order.items?.length || 0} قلم
                            </td>
                            <td className="p-3.5">
                              {getStatusBadge(order.status)}
                            </td>
                            <td className="p-3.5">
                              <select
                                disabled={isUpdating}
                                value={order.status}
                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                                className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2D4F3E] font-medium"
                              >
                                <option value="pending">در انتظار تأیید (Pending)</option>
                                <option value="confirmed">تأیید شده (Confirmed)</option>
                                <option value="processing">در حال پردازش (Processing)</option>
                                <option value="shipped">ارسال به مزرعه (Shipped)</option>
                                <option value="delivered">تحویل داده شد (Delivered)</option>
                                <option value="cancelled">لغو سفارش (Cancelled)</option>
                              </select>
                            </td>
                            <td className="p-3.5 text-center">
                              <button
                                onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Order Items Row */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70 border-b border-slate-200">
                              <td colSpan={8} className="p-4 space-y-3">
                                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                    <span>آدرس مقصد ارسال به مزرعه / انبار:</span>
                                    <span className="text-slate-400 font-mono font-normal">
                                      تاریخ ثبت: {new Date(order.created_at).toLocaleDateString('fa-IR')}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    {order.shipping_address || 'آدرس ثبت نشده است'}
                                  </p>

                                  <div className="pt-2">
                                    <div className="text-xs font-bold text-slate-700 mb-2">ریز اقلام فاکتور:</div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                      {order.items?.map((item) => (
                                        <div
                                          key={item.id}
                                          className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-2"
                                        >
                                          <div className="space-y-0.5">
                                            <div className="font-bold text-slate-800 truncate max-w-[160px]">
                                              {item.product?.name || `کالا #${item.product_id}`}
                                            </div>
                                            <div className="text-[11px] text-slate-500">
                                              تعداد: <span className="font-bold font-mono">{item.quantity}</span> × {item.unit_price.toLocaleString('fa-IR')} ت
                                            </div>
                                          </div>
                                          <div className="text-xs font-bold font-mono text-emerald-700">
                                            {(item.quantity * item.unit_price).toLocaleString('fa-IR')} ت
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PRODUCT MANAGEMENT VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <div id="admin-products-view" className="space-y-4">
          {/* Product Actions Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button
                id="admin-add-product-btn"
                onClick={handleOpenCreateProduct}
                className="px-4 py-2.5 bg-[#2D4F3E] hover:bg-[#243f32] text-white font-bold rounded-xl text-xs shadow transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                افزودن محصول جدید (کود، سم، بذر)
              </button>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {['all', 'کود', 'سم', 'بذر'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setProductTypeFilter(type)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      productTypeFilter === type
                        ? 'bg-white text-[#2D4F3E] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {type === 'all' ? 'همه انواع' : type}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="جستجو بر اساس نام، برند، مجوز..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D4F3E]"
              />
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loadingProducts ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#2D4F3E]" />
                در حال بارگذاری لیست محصولات...
              </div>
            ) : adminProducts.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                هیچ محصولی در دیتابیس موجود نیست.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">شناسه</th>
                      <th className="p-3.5">تصویر</th>
                      <th className="p-3.5">نام محصول</th>
                      <th className="p-3.5">نوع</th>
                      <th className="p-3.5">دسته‌بندی</th>
                      <th className="p-3.5">قیمت (تومان)</th>
                      <th className="p-3.5">موجودی انبار</th>
                      <th className="p-3.5">شماره پروانه</th>
                      <th className="p-3.5">فایل MSDS</th>
                      <th className="p-3.5 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {adminProducts
                      .filter((p) => {
                        const matchesType = productTypeFilter === 'all' || p.product_type === productTypeFilter;
                        const matchesSearch =
                          !productSearch.trim() ||
                          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                          (p.brand && p.brand.toLowerCase().includes(productSearch.toLowerCase())) ||
                          (p.required_permit_number && p.required_permit_number.includes(productSearch));
                        return matchesType && matchesSearch;
                      })
                      .map((prod) => (
                        <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-slate-500">#{prod.id}</td>
                          <td className="p-3.5">
                            {prod.image_url ? (
                              <img
                                src={prod.image_url}
                                alt={prod.name}
                                className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-800">{prod.name}</div>
                            {prod.brand && <div className="text-[11px] text-slate-500">{prod.brand}</div>}
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {prod.product_type}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-600">
                            {prod.category?.name || categories.find((c) => c.id === prod.category_id)?.name || '-'}
                          </td>
                          <td className="p-3.5 font-bold font-mono text-slate-900">
                            {prod.price.toLocaleString('fa-IR')}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full font-mono font-bold text-xs ${
                                prod.stock <= 10
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {prod.stock} عدد
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-slate-600 text-[11px]">
                            {prod.required_permit_number || '-'}
                          </td>
                          <td className="p-3.5">
                            {prod.msds_file_url ? (
                              <a
                                href={prod.msds_file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 text-[11px] font-bold"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                دانلود PDF
                              </a>
                            ) : (
                              <span className="text-slate-400 text-[11px]">ندارد</span>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditProduct(prod)}
                                className="p-1.5 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-700 rounded-lg transition-colors"
                                title="ویرایش محصول"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(prod)}
                                className="p-1.5 bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-700 rounded-lg transition-colors"
                                title="حذف یا غیرفعال‌سازی ایمن"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CATEGORY MANAGEMENT VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <div id="admin-categories-view" className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              دسته‌بندی‌های نهاده‌های کشاورزی در پایگاه داده
            </h3>
            <button
              onClick={() => {
                setEditingCategory(null);
                setCategoryName('');
                setCategoryDesc('');
                setIsCategoryModalOpen(true);
              }}
              className="px-4 py-2 bg-[#2D4F3E] hover:bg-[#243f32] text-white font-bold rounded-xl text-xs shadow transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              افزودن دسته‌بندی جدید
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-slate-400 font-bold">شناسه #{cat.id}</span>
                    <h4 className="text-base font-bold text-slate-900">{cat.name}</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setCategoryName(cat.name);
                        setCategoryDesc(cat.description || '');
                        setIsCategoryModalOpen(true);
                      }}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg"
                      title="ویرایش"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed min-h-[40px]">
                  {cat.description || 'بدون توضیحات'}
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>محصولات متصل:</span>
                  <span className="font-bold font-mono">
                    {adminProducts.filter((p) => p.category_id === cat.id).length} کالا
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TERMINAL SCRIPT EXPLANATION VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'terminal' && (
        <div id="admin-terminal-guide" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-2 border-b border-slate-200 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-700" />
              راهنمای اسکریپت امن ساخت و ترفیع کاربر مدیر در cPanel
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              جهت حفظ حداکثری امنیت و جلوگیری از حملات Privilege Escalation، هیچ اندپوینت عمومی برای ثبت‌نام ادمین وجود ندارد. حساب مدیر مستقیماً از طریق اسکریپت CLI سرور ایجاد می‌شود.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl space-y-3 font-mono text-xs">
              <div className="text-emerald-400 font-bold">۱. اجرای اسکریپت در ترمینال cPanel:</div>
              <div className="bg-black/60 p-3 rounded text-left font-mono text-emerald-300 overflow-x-auto" dir="ltr">
                node create-admin.js --phone 09121234567 --password admin123456 --name "مدیر کل سامانه"
              </div>
            </div>

            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl space-y-3 font-mono text-xs">
              <div className="text-emerald-400 font-bold">۲. یا از طریق فرمان npm:</div>
              <div className="bg-black/60 p-3 rounded text-left font-mono text-emerald-300 overflow-x-auto" dir="ltr">
                npm run create-admin -- --phone 09120000000 --password MySecretPass --name "مدیر انبار"
              </div>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-emerald-900 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                تضمین‌های امنیتی پیاده‌سازی شده:
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pr-2">
                <li>اعتبارسنجی مستقیم از دیتابیس MySQL در میدلور <code className="bg-emerald-100/80 px-1 rounded font-mono">requireAdmin</code></li>
                <li>هش‌سازی کلمه عبور با استاندارد Bcrypt Salt Rounds = 10</li>
                <li>جلوگیری از تغییر یا ارتقای نقش کاربر توسط توکن جعلی</li>
                <li>حفظ سوابق سفارشات در زمان حذف کالا (Soft Deactivate با <code className="bg-emerald-100/80 px-1 rounded font-mono">is_active = false</code>)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRODUCT CREATE / EDIT MODAL */}
      {/* ========================================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#2D4F3E]" />
                {editingProduct ? `ویرایش محصول #${editingProduct.id}` : 'افزودن محصول جدید به کاتالوگ'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">نام کامل محصول *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: کود NPK 20-20-20 گرین‌پلاس"
                    value={productFormData.name}
                    onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2D4F3E] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">نوع محصول نهاده *</label>
                  <select
                    value={productFormData.product_type}
                    onChange={(e) => setProductFormData({ ...productFormData, product_type: e.target.value as ProductType })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2D4F3E] outline-none font-bold text-emerald-900"
                  >
                    <option value="کود">کود (شیمیایی، ارگانیک، ریزمغذی)</option>
                    <option value="سم">سم (قارچ‌کش، حشره‌کش، علف‌کش)</option>
                    <option value="بذر">بذر (هیبرید، زراعی، گلخانه‌ای)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">دسته‌بندی *</label>
                  <select
                    value={productFormData.category_id}
                    onChange={(e) => setProductFormData({ ...productFormData, category_id: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2D4F3E] outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">قیمت (تومان) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="مثال: 950000"
                    value={productFormData.price}
                    onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2D4F3E] outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">موجودی اولیه انبار (عدد/بسته) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="مثال: 50"
                    value={productFormData.stock}
                    onChange={(e) => setProductFormData({ ...productFormData, stock: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2D4F3E] outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">شماره مجوز / پروانه ثبت ماده کودی یا سم</label>
                  <input
                    type="text"
                    placeholder="مثال: سم-۹۸۴۱/ح-۱۴۰۱"
                    value={productFormData.required_permit_number}
                    onChange={(e) => setProductFormData({ ...productFormData, required_permit_number: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2D4F3E] outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">برند / شرکت سازنده</label>
                  <input
                    type="text"
                    placeholder="مثال: بایر آلمان، سینجنتا، گرین‌پلاس"
                    value={productFormData.brand}
                    onChange={(e) => setProductFormData({ ...productFormData, brand: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2D4F3E] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">نوع بسته‌بندی</label>
                  <input
                    type="text"
                    placeholder="مثال: کیسه ۱۰ کیلوگرمی، بطری ۱ لیتری"
                    value={productFormData.package_size}
                    onChange={(e) => setProductFormData({ ...productFormData, package_size: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2D4F3E] outline-none"
                  />
                </div>
              </div>

              {/* Uploads Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  آپلود فایل‌های ضمیمه (Multer Multipart Upload)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">تصویر محصول (حداکثر 5MB - فرمت JPG/PNG/WebP):</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => setProductImageFile(e.target.files?.[0] || null)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    {editingProduct?.image_url && !productImageFile && (
                      <div className="text-[11px] text-slate-500 truncate">
                        تصویر فعلی: {editingProduct.image_url}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">برگه اطلاعات ایمنی MSDS (حداکثر 10MB - فرمت PDF):</label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setProductMsdsFile(e.target.files?.[0] || null)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    {editingProduct?.msds_file_url && !productMsdsFile && (
                      <div className="text-[11px] text-slate-500 truncate">
                        فایل MSDS فعلی: {editingProduct.msds_file_url}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">توضیحات و دستورالعمل مصرف گیاه‌پزشکی</label>
                <textarea
                  rows={3}
                  placeholder="نحوه اختلاط، دوز مصرف در هکتار، دوره کارنس و احتیاطات..."
                  value={productFormData.description}
                  onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2D4F3E] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-6 py-2.5 bg-[#2D4F3E] hover:bg-[#243f32] text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2"
                >
                  {savingProduct ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {editingProduct ? 'ذخیره تغییرات در MySQL' : 'ثبت قطعی در دیتابیس'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY CREATE / EDIT MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingCategory ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">نام دسته‌بندی *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: محرک‌های رشد و اسیدهای آمینه"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2D4F3E] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">توضیحات دسته‌بندی</label>
                <textarea
                  rows={3}
                  placeholder="شرح کوتاه درباره نهاده‌های موجود در این دسته..."
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2D4F3E] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="px-5 py-2 bg-[#2D4F3E] hover:bg-[#243f32] text-white rounded-xl font-bold flex items-center gap-1.5 shadow"
                >
                  {savingCategory && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  ذخیره دسته‌بندی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
