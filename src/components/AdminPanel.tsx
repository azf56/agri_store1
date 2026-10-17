import React, { useState, useEffect, useMemo } from 'react';
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
  Printer,
  DollarSign,
  Filter,
  ArrowUpDown,
  Phone,
  MapPin,
  Box,
  Eye,
  Check,
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
import { apiFetch } from '../config/api';
import { AdminInvoiceModal } from './admin/AdminInvoiceModal';
import { AdminQuickStockModal } from './admin/AdminQuickStockModal';

interface AdminPanelProps {
  user: User | null;
  token: string | null;
  categories: Category[];
  onRefreshCatalog: () => void;
  onNavigateToAuth: () => void;
  onLoginSuccess?: (token: string, user: User) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  user,
  token,
  categories,
  onRefreshCatalog,
  onNavigateToAuth,
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'categories' | 'terminal'>('dashboard');

  // Dashboard Stats State
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersFilterStatus, setOrdersFilterStatus] = useState<string>('all');
  const [ordersSearch, setOrdersSearch] = useState<string>('');
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Products State
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState<string>('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [productStockFilter, setProductStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [productSortBy, setProductSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc'>('newest');

  // Quick Stock Modal State
  const [quickStockProduct, setQuickStockProduct] = useState<Product | null>(null);
  const [isQuickStockOpen, setIsQuickStockOpen] = useState(false);

  // Full Product Create / Edit Modal State
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
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
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

  // 1. Fetch Stats from DB
  const fetchStats = async () => {
    if (!token || !isAdmin) return;
    setLoadingStats(true);
    setStatsError(null);
    try {
      const res = await apiFetch('/api/v1/admin/dashboard/stats', {
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

  // 2. Fetch Admin Orders from DB
  const fetchOrders = async () => {
    if (!token || !isAdmin) return;
    setLoadingOrders(true);
    try {
      const params = new URLSearchParams();
      if (ordersFilterStatus !== 'all') params.append('status', ordersFilterStatus);
      if (ordersSearch.trim()) params.append('search', ordersSearch.trim());
      params.append('limit', '100');

      const res = await apiFetch(`/api/v1/admin/orders?${params.toString()}`, {
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

  // 3. Fetch Admin Products from DB
  const fetchAdminProducts = async () => {
    if (!token || !isAdmin) return;
    setLoadingProducts(true);
    try {
      const res = await apiFetch('/api/v1/products?limit=200&include_inactive=true', {
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

  // Initial load
  useEffect(() => {
    if (isAdmin && token) {
      fetchStats();
      fetchOrders();
      fetchAdminProducts();
    }
  }, [isAdmin, token]);

  // Refetch orders when filter changes
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
      const res = await apiFetch(`/api/v1/admin/orders/${orderId}/status`, {
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

  // Toggle Product Active Status
  const handleToggleProductActive = async (product: Product) => {
    if (!token) return;
    const nextActiveState = !(product.is_active ?? true);
    try {
      const res = await apiFetch(`/api/v1/admin/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          is_active: nextActiveState,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          nextActiveState
            ? `محصول «${product.name}» فعال و در ویترین کاتالوگ نمایش داده شد.`
            : `محصول «${product.name}» غیرفعال و از دید عموم خریداران مخفی شد.`,
          'success'
        );
        fetchAdminProducts();
        onRefreshCatalog();
        fetchStats();
      } else {
        showToast(data.message || 'خطا در تغییر وضعیت محصول', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'خطای شبکه', 'error');
    }
  };

  // Open Product Modal for Create
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProductFormData({
      name: '',
      description: '',
      price: '',
      stock: '25',
      category_id: categories[0]?.id?.toString() || '1',
      product_type: 'کود',
      required_permit_number: '',
      brand: '',
      package_size: '',
      image_url: '',
      msds_file_url: '',
    });
    setProductImageFile(null);
    setProductImagePreview(null);
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
    setProductImagePreview(prod.image_url || null);
    setProductMsdsFile(null);
    setIsProductModalOpen(true);
  };

  // Open Quick Stock Adjuster
  const handleOpenQuickStock = (prod: Product) => {
    setQuickStockProduct(prod);
    setIsQuickStockOpen(true);
  };

  // Save Product (Create or Update with Multipart FormData)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingProduct(true);

    try {
      const formData = new FormData();
      formData.append('name', productFormData.name.trim());
      formData.append('description', productFormData.description.trim());
      formData.append('price', productFormData.price);
      formData.append('stock', productFormData.stock);
      formData.append('category_id', productFormData.category_id);
      formData.append('product_type', productFormData.product_type);
      formData.append('required_permit_number', productFormData.required_permit_number.trim());
      formData.append('brand', productFormData.brand.trim());
      formData.append('package_size', productFormData.package_size.trim());

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

      const res = await apiFetch(url, {
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
      `آیا از حذف محصول "${product.name}" اطمینان دارید؟\n\nنکته امنیتی: در صورتی که این محصول در سفارش‌های قبلی ثبت شده باشد، سوابق حفظ شده و محصول به صورت نرم‌افزاری غیرفعال (is_active = false) خواهد شد.`
    );
    if (!confirmed) return;

    try {
      const res = await apiFetch(`/api/v1/admin/products/${product.id}`, {
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

      const res = await apiFetch(url, {
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
      const res = await apiFetch(`/api/v1/admin/categories/${cat.id}`, {
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

  // Filtered and Sorted Admin Products
  const filteredProducts = useMemo(() => {
    return adminProducts
      .filter((p) => {
        const matchesType = productTypeFilter === 'all' || p.product_type === productTypeFilter;
        const matchesCategory = productCategoryFilter === 'all' || p.category_id.toString() === productCategoryFilter;

        let matchesStock = true;
        if (productStockFilter === 'in_stock') matchesStock = p.stock > 10;
        else if (productStockFilter === 'low_stock') matchesStock = p.stock > 0 && p.stock <= 10;
        else if (productStockFilter === 'out_of_stock') matchesStock = p.stock === 0;

        const term = productSearch.trim().toLowerCase();
        const matchesSearch =
          !term ||
          p.name.toLowerCase().includes(term) ||
          (p.brand && p.brand.toLowerCase().includes(term)) ||
          (p.required_permit_number && p.required_permit_number.toLowerCase().includes(term)) ||
          p.id.toString() === term;

        return matchesType && matchesCategory && matchesStock && matchesSearch;
      })
      .sort((a, b) => {
        if (productSortBy === 'price_asc') return a.price - b.price;
        if (productSortBy === 'price_desc') return b.price - a.price;
        if (productSortBy === 'stock_asc') return a.stock - b.stock;
        if (productSortBy === 'stock_desc') return b.stock - a.stock;
        return b.id - a.id; // default newest
      });
  }, [adminProducts, productTypeFilter, productCategoryFilter, productStockFilter, productSearch, productSortBy]);

  // Order Status Badge
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-700" />
            در انتظار تأیید
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-300">
            <CheckCircle className="w-3 h-3 text-blue-700" />
            تأیید شده
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-900 border border-purple-300">
            <RefreshCw className="w-3 h-3 text-purple-700" />
            در حال بسته‌بندی
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-900 border border-cyan-300">
            <Truck className="w-3 h-3 text-cyan-700" />
            ارسال به مزرعه
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle className="w-3 h-3 text-emerald-700" />
            تحویل شد
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-900 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-700" />
            لغو شده
          </span>
        );
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  // Order Step Indicator Helper
  const getOrderStep = (status: OrderStatus): number => {
    switch (status) {
      case 'pending': return 1;
      case 'confirmed': return 2;
      case 'processing': return 3;
      case 'shipped': return 4;
      case 'delivered': return 5;
      default: return 0;
    }
  };

  // Next status action recommendation
  const getNextStatusAction = (status: OrderStatus): { target: OrderStatus; label: string; color: string } | null => {
    switch (status) {
      case 'pending':
        return { target: 'confirmed', label: 'تأیید فاکتور و ارسال به انبار', color: 'bg-blue-600 hover:bg-blue-700' };
      case 'confirmed':
        return { target: 'processing', label: 'شروع بسته‌بندی و بارگیری', color: 'bg-purple-600 hover:bg-purple-700' };
      case 'processing':
        return { target: 'shipped', label: 'تحویل به باربری و ارسال به مقصد', color: 'bg-cyan-700 hover:bg-cyan-800' };
      case 'shipped':
        return { target: 'delivered', label: 'ثبت تحویل نهایی به کشاورز', color: 'bg-emerald-700 hover:bg-emerald-800' };
      default:
        return null;
    }
  };

  // =========================================================================
  // GATE SCREEN: If user is not logged in or role !== 'admin'
  // =========================================================================
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
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-900 text-sm max-w-lg mx-auto font-medium">
              شما در حال حاضر با حساب مدیر وارد نشده‌اید. برای دسترسی به پنل مدیریت، لطفاً با حساب معتبر خود وارد شوید.
            </div>
          )}

          {/* Navigation to Auth Page */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              id="admin-go-to-auth-btn"
              onClick={onNavigateToAuth}
              className="px-6 py-3 bg-[#2D4F3E] hover:bg-[#234032] text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 text-sm cursor-pointer"
            >
              <Users className="w-5 h-5 text-emerald-300" />
              ورود به حساب کاربری مدیر
            </button>
          </div>

          {/* Terminal Script Instruction */}
          <div className="bg-slate-900 text-slate-200 p-5 rounded-xl text-right font-mono text-xs space-y-3 max-w-2xl mx-auto border border-slate-800">
            <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-slate-800 pb-2">
              <Terminal className="w-4 h-4" />
              <span>ساخت یا ارتقای کاربر مدیر از طریق ترمینال سرور cPanel / SSH:</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              جهت رعایت اصول امنیت پروداکشن، ساخت حساب ادمین بدون مسیر عمومی و صرفاً از خط فرمان ترمینال با رمز عبور اختصاصی انجام می‌شود:
            </p>
            <div className="bg-black/50 p-3 rounded text-left font-mono text-emerald-300 overflow-x-auto" dir="ltr">
              node create-admin.js --phone 0912XXXXXXX --password YOUR_SECURE_PASSWORD --name "نام مدیر"
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pending orders in stats for quick action
  const pendingOrdersList = orders.filter((o) => o.status === 'pending');

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

      {/* Admin Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-[#1b3426] to-slate-950 text-white p-6 rounded-2xl shadow-xl border border-emerald-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              مدیر ارشد سامانه (Role: {user.role})
            </span>
            <span className="text-xs text-slate-400 font-mono">MySQL 8.0 • Sequelize ORM</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            مرکز مدیریت و کنترل نهاده‌های کشاورزی
          </h1>
          <p className="text-sm text-slate-300">
            پایش آمار فروش، انبارداری نهاده‌ها (کود، سم، بذر) و مدیریت چرخه فاکتور و ارسال سفارش‌ها به مزارع
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="admin-refresh-stats-btn"
            onClick={() => {
              fetchStats();
              fetchOrders();
              fetchAdminProducts();
              showToast('آمار و اطلاعات پایگاه داده بازخوانی شدند.', 'success');
            }}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} />
            بازخوانی داده‌ها
          </button>
        </div>
      </div>

      {/* Main Admin Navigation Tabs */}
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
          داشبورد و آمار تحلیلی
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
          id="admin-tab-orders"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'bg-[#2D4F3E] text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          مدیریت سفارش‌ها ({stats?.total_orders || orders.length})
          {stats && stats.orders_by_status.pending > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
              {stats.orders_by_status.pending} در انتظار
            </span>
          )}
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
          دسته‌بندی‌ها ({categories.length})
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
          امنیت و اسکریپت CLI
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
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:border-[#2D4F3E]/40 transition-colors">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">تعداد کل سفارش‌ها</span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <ShoppingCart className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {stats ? stats.total_orders.toLocaleString('fa-IR') : '...'}
              </div>
              <p className="text-xs text-slate-400">
                ثبت شده در جدول <code className="font-mono text-slate-600">orders</code>
              </p>
            </div>

            {/* 2. Total Revenue */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:border-emerald-500/40 transition-colors">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">مجموع فروش و درآمد</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono">
                {stats ? stats.total_revenue.toLocaleString('fa-IR') : '...'}
                <span className="text-xs text-slate-500 font-normal mr-1 font-sans">تومان</span>
              </div>
              <p className="text-xs text-slate-400">
                مجموع فاکتورهای غیر لغو شده
              </p>
            </div>

            {/* 3. Low Stock Alert */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:border-amber-500/40 transition-colors">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">موجودی بحرانی (کمتر از ۱۰)</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-600 font-mono">
                {stats ? stats.low_stock_count.toLocaleString('fa-IR') : '...'}
                <span className="text-xs text-slate-500 font-normal mr-1 font-sans">نهاده</span>
              </div>
              <p className="text-xs text-slate-400">
                اقلام نیازمند شارژ فوری انبار
              </p>
            </div>

            {/* 4. New Users 30 Days */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:border-indigo-500/40 transition-colors">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">کاربران جدید (۳۰ روز اخیر)</span>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-indigo-600 font-mono">
                {stats ? stats.new_users_30d.toLocaleString('fa-IR') : '...'}
                <span className="text-xs text-slate-500 font-normal mr-1 font-sans">کشاورز</span>
              </div>
              <p className="text-xs text-slate-400">
                کل کاربران: {stats ? stats.total_users.toLocaleString('fa-IR') : '...'}
              </p>
            </div>
          </div>

          {/* Interactive Order Status Distribution Bar */}
          {stats && stats.orders_by_status && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#2D4F3E]" />
                  توزیع وضعیت سفارش‌ها در پایگاه داده
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  کل: {stats.total_orders.toLocaleString('fa-IR')} سفارش
                </span>
              </div>

              {/* Progress Bar */}
              {stats.total_orders > 0 && (
                <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100">
                  <div style={{ width: `${(stats.orders_by_status.pending / stats.total_orders) * 100}%` }} className="bg-amber-400" title="در انتظار" />
                  <div style={{ width: `${(stats.orders_by_status.confirmed / stats.total_orders) * 100}%` }} className="bg-blue-500" title="تأیید شده" />
                  <div style={{ width: `${(stats.orders_by_status.processing / stats.total_orders) * 100}%` }} className="bg-purple-500" title="در حال بسته‌بندی" />
                  <div style={{ width: `${(stats.orders_by_status.shipped / stats.total_orders) * 100}%` }} className="bg-cyan-500" title="ارسال شده" />
                  <div style={{ width: `${(stats.orders_by_status.delivered / stats.total_orders) * 100}%` }} className="bg-emerald-500" title="تحویل شده" />
                  <div style={{ width: `${(stats.orders_by_status.cancelled / stats.total_orders) * 100}%` }} className="bg-rose-400" title="لغو شده" />
                </div>
              )}

              {/* Status Chips with Click to Filter */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <button
                  onClick={() => {
                    setOrdersFilterStatus('pending');
                    setActiveTab('orders');
                  }}
                  className="p-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-center transition-colors"
                >
                  <div className="text-xs text-amber-800 font-semibold">در انتظار تأیید</div>
                  <div className="text-xl font-black text-amber-950 mt-1 font-mono">{stats.orders_by_status.pending.toLocaleString('fa-IR')}</div>
                </button>

                <button
                  onClick={() => {
                    setOrdersFilterStatus('confirmed');
                    setActiveTab('orders');
                  }}
                  className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-center transition-colors"
                >
                  <div className="text-xs text-blue-800 font-semibold">تأیید شده</div>
                  <div className="text-xl font-black text-blue-950 mt-1 font-mono">{stats.orders_by_status.confirmed.toLocaleString('fa-IR')}</div>
                </button>

                <button
                  onClick={() => {
                    setOrdersFilterStatus('processing');
                    setActiveTab('orders');
                  }}
                  className="p-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-center transition-colors"
                >
                  <div className="text-xs text-purple-800 font-semibold">در حال پردازش</div>
                  <div className="text-xl font-black text-purple-950 mt-1 font-mono">{stats.orders_by_status.processing.toLocaleString('fa-IR')}</div>
                </button>

                <button
                  onClick={() => {
                    setOrdersFilterStatus('shipped');
                    setActiveTab('orders');
                  }}
                  className="p-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-center transition-colors"
                >
                  <div className="text-xs text-cyan-800 font-semibold">ارسال به مزرعه</div>
                  <div className="text-xl font-black text-cyan-950 mt-1 font-mono">{stats.orders_by_status.shipped.toLocaleString('fa-IR')}</div>
                </button>

                <button
                  onClick={() => {
                    setOrdersFilterStatus('delivered');
                    setActiveTab('orders');
                  }}
                  className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-center transition-colors"
                >
                  <div className="text-xs text-emerald-800 font-semibold">تحویل شده</div>
                  <div className="text-xl font-black text-emerald-950 mt-1 font-mono">{stats.orders_by_status.delivered.toLocaleString('fa-IR')}</div>
                </button>

                <button
                  onClick={() => {
                    setOrdersFilterStatus('cancelled');
                    setActiveTab('orders');
                  }}
                  className="p-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-center transition-colors"
                >
                  <div className="text-xs text-rose-800 font-semibold">لغو شده</div>
                  <div className="text-xl font-black text-rose-950 mt-1 font-mono">{stats.orders_by_status.cancelled.toLocaleString('fa-IR')}</div>
                </button>
              </div>
            </div>
          )}

          {/* Quick Pending Orders Review Panel */}
          {pendingOrdersList.length > 0 && (
            <div className="bg-amber-50/70 p-6 rounded-2xl border border-amber-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-700 animate-pulse" />
                  <h3 className="text-base font-bold text-amber-950">
                    سفارشات نیازمند تعیین تکلیف فوری ({pendingOrdersList.length} سفارش)
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setOrdersFilterStatus('pending');
                    setActiveTab('orders');
                  }}
                  className="text-xs font-bold text-[#2D4F3E] hover:underline"
                >
                  مشاهده همه در بخش سفارش‌ها
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pendingOrdersList.slice(0, 3).map((ord) => (
                  <div key={ord.id} className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono font-bold text-indigo-700">{ord.tracking_code || `ORD-${ord.id}`}</span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {new Date(ord.created_at).toLocaleDateString('fa-IR')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-800 font-bold truncate">
                      {ord.user?.full_name || 'کاربر گرامی'} • <span className="font-mono font-normal text-slate-600">{ord.user?.phone_number}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs font-mono font-bold text-emerald-800 bg-emerald-50/60 p-2 rounded-lg">
                      <span>مبلغ کل:</span>
                      <span>{ord.total_price.toLocaleString('fa-IR')} تومان</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'confirmed')}
                        disabled={updatingOrderId === ord.id}
                        className="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        تأیید فوری
                      </button>

                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'cancelled')}
                        disabled={updatingOrderId === ord.id}
                        className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold border border-rose-200"
                      >
                        رد
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Low Stock Warning Table with Quick Restock Modal Action */}
          {stats && stats.low_stock_products && stats.low_stock_products.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  اقلام نیازمند شارژ انبار (موجودی ≤ ۱۰)
                </h3>
                <button
                  onClick={() => setActiveTab('products')}
                  className="text-xs text-[#2D4F3E] font-bold hover:underline"
                >
                  مدیریت کل انبار
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-amber-50 text-amber-950 font-bold border-b border-amber-200">
                    <tr>
                      <th className="p-3">شناسه</th>
                      <th className="p-3">نام نهاده</th>
                      <th className="p-3">نوع نهاده</th>
                      <th className="p-3">برند</th>
                      <th className="p-3">قیمت واحد</th>
                      <th className="p-3">موجودی فعلی</th>
                      <th className="p-3 text-center">اقدام سریع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.low_stock_products.map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-500">#{prod.id}</td>
                        <td className="p-3 font-bold text-slate-900">{prod.name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                            {prod.product_type}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{prod.brand || '-'}</td>
                        <td className="p-3 font-mono font-bold">{prod.price.toLocaleString('fa-IR')} ت</td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold font-mono">
                            {prod.stock} عدد
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              const found = adminProducts.find((p) => p.id === prod.id);
                              if (found) {
                                handleOpenQuickStock(found);
                              } else {
                                handleOpenQuickStock({
                                  id: prod.id,
                                  name: prod.name,
                                  price: prod.price,
                                  stock: prod.stock,
                                  category_id: 1,
                                  image_url: null,
                                  product_type: prod.product_type,
                                  required_permit_number: null,
                                  msds_file_url: null,
                                  brand: prod.brand,
                                  package_size: null,
                                  description: null,
                                });
                              }
                            }}
                            className="px-3 py-1.5 bg-[#2D4F3E] hover:bg-[#234032] text-white rounded-lg font-bold text-xs shadow-sm transition-all flex items-center gap-1 mx-auto"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            شارژ سریع انبار
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
      {/* 2. PRODUCT MANAGEMENT VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <div id="admin-products-view" className="space-y-4">
          
          {/* Top Actions & Filters Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Add Product Button */}
              <button
                id="admin-add-product-btn"
                onClick={handleOpenCreateProduct}
                className="px-5 py-2.5 bg-[#2D4F3E] hover:bg-[#234032] text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                افزودن محصول جدید (کود، سم، بذر)
              </button>

              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="جستجو بر اساس نام، برند، شناسه، شماره پروانه..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D4F3E]"
                />
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              {/* Type Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {['all', 'کود', 'سم', 'بذر'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setProductTypeFilter(type)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      productTypeFilter === type
                        ? 'bg-white text-[#2D4F3E] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {type === 'all' ? 'همه انواع' : type}
                  </button>
                ))}
              </div>

              {/* Category Filter */}
              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2D4F3E]"
              >
                <option value="all">همه دسته‌بندی‌ها</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id.toString()}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Stock Status Filter */}
              <select
                value={productStockFilter}
                onChange={(e) => setProductStockFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2D4F3E]"
              >
                <option value="all">وضعیت انبار: همه</option>
                <option value="in_stock">موجود در انبار (&gt; ۱۰)</option>
                <option value="low_stock">موجودی بحرانی (۱ تا ۱۰)</option>
                <option value="out_of_stock">ناموجود (۰ عدد)</option>
              </select>

              {/* Sort Order */}
              <select
                value={productSortBy}
                onChange={(e) => setProductSortBy(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2D4F3E]"
              >
                <option value="newest">مرتب‌سازی: جدیدترین</option>
                <option value="price_asc">قیمت: کم به زیاد</option>
                <option value="price_desc">قیمت: زیاد به کم</option>
                <option value="stock_asc">موجودی: کم به زیاد</option>
                <option value="stock_desc">موجودی: زیاد به کم</option>
              </select>

              <span className="text-slate-400 font-mono text-[11px] mr-auto">
                نمایش {filteredProducts.length} از {adminProducts.length} محصول
              </span>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loadingProducts ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#2D4F3E]" />
                در حال بارگذاری لیست محصولات از پایگاه داده MySQL...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm space-y-2">
                <Package className="w-8 h-8 text-slate-400 mx-auto" />
                <p>هیچ محصولی مطابق با فیلترهای انتخابی یافت نشد.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">شناسه</th>
                      <th className="p-3.5">تصویر</th>
                      <th className="p-3.5">نام نهاده و برند</th>
                      <th className="p-3.5">نوع</th>
                      <th className="p-3.5">دسته‌بندی</th>
                      <th className="p-3.5">قیمت واحد (تومان)</th>
                      <th className="p-3.5">موجودی انبار</th>
                      <th className="p-3.5">ویترین</th>
                      <th className="p-3.5">شماره پروانه / مجوز</th>
                      <th className="p-3.5">برگه ایمنی MSDS</th>
                      <th className="p-3.5 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-slate-500">#{prod.id}</td>
                        <td className="p-3.5">
                          {prod.image_url ? (
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200 shadow-xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{prod.name}</div>
                          {prod.brand && <div className="text-[11px] text-slate-500">برند: {prod.brand}</div>}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              prod.product_type === 'کود'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : prod.product_type === 'سم'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                            }`}
                          >
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
                          <button
                            onClick={() => handleOpenQuickStock(prod)}
                            className={`px-2.5 py-1 rounded-full font-mono font-bold text-xs flex items-center gap-1.5 transition-transform hover:scale-105 ${
                              prod.stock <= 0
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : prod.stock <= 10
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                            title="کلیک برای شارژ سریع موجودی"
                          >
                            <span>{prod.stock} عدد</span>
                            <Edit2 className="w-3 h-3 opacity-70" />
                          </button>
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => handleToggleProductActive(prod)}
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors ${
                              (prod.is_active ?? true)
                                ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                            title="تغییر وضعیت نمایش در فروشگاه"
                          >
                            {(prod.is_active ?? true) ? 'فعال' : 'غیرفعال'}
                          </button>
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
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 text-[11px] font-bold"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              PDF
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[11px]">ندارد</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenQuickStock(prod)}
                              className="p-1.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-700 rounded-lg transition-colors"
                              title="شارژ سریع موجودی و اصلاح قیمت"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditProduct(prod)}
                              className="p-1.5 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-700 rounded-lg transition-colors"
                              title="ویرایش کامل محصول و فایل‌ها"
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
      {/* 3. ORDER MANAGEMENT VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <div id="admin-orders-view" className="space-y-4">
          
          {/* Orders Filter & Search Toolbar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Status Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: 'همه سفارش‌ها' },
                  { id: 'pending', label: 'در انتظار' },
                  { id: 'confirmed', label: 'تأیید شده' },
                  { id: 'processing', label: 'در حال پردازش' },
                  { id: 'shipped', label: 'ارسال شده' },
                  { id: 'delivered', label: 'تحویل شده' },
                  { id: 'cancelled', label: 'لغو شده' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setOrdersFilterStatus(st.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      ordersFilterStatus === st.id
                        ? 'bg-[#2D4F3E] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="جستجو با کد رهگیری، نام، تلفن یا آدرس..."
                  value={ordersSearch}
                  onChange={(e) => setOrdersSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
                  className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D4F3E]"
                />
              </div>
            </div>
          </div>

          {/* Orders List / Cards */}
          <div className="space-y-3">
            {loadingOrders ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#2D4F3E]" />
                در حال استعلام سفارش‌های ثبت شده از پایگاه داده MySQL...
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
                هیچ سفارشی مطابق با فیلترهای انتخابی یافت نشد.
              </div>
            ) : (
              orders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const isUpdating = updatingOrderId === order.id;
                const nextAction = getNextStatusAction(order.status);
                const step = getOrderStep(order.status);

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition-colors"
                  >
                    {/* Order Main Header Row */}
                    <div className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      
                      {/* Left Block: Tracking, Date, Customer */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-sm text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                            {order.tracking_code || `AGRI-ORD-${order.id}`}
                          </span>
                          {getStatusBadge(order.status)}
                          <span className="text-xs text-slate-400 font-mono">
                            {new Date(order.created_at).toLocaleDateString('fa-IR', {
                              year: 'numeric',
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="text-sm font-bold text-slate-900 flex items-center gap-2 pt-0.5">
                          <span>{order.user?.full_name || 'کاربر گرامی'}</span>
                          <span className="text-slate-400 font-normal">•</span>
                          <span className="font-mono text-xs font-normal text-slate-600 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {order.user?.phone_number || '-'}
                          </span>
                        </div>
                      </div>

                      {/* Center Block: Total & Items */}
                      <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                        <div>
                          <div className="text-slate-500 text-[11px]">مبلغ کل فاکتور:</div>
                          <div className="font-mono font-bold text-sm text-emerald-800">
                            {order.total_price.toLocaleString('fa-IR')} تومان
                          </div>
                        </div>
                        <div className="border-r border-slate-200 pr-3">
                          <div className="text-slate-500 text-[11px]">تعداد اقلام:</div>
                          <div className="font-mono font-bold text-slate-800">
                            {order.items?.length || 0} قلم
                          </div>
                        </div>
                      </div>

                      {/* Right Block: Status Dropdown, Next Action & Print */}
                      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                        
                        {/* Next Step Quick Action Button */}
                        {nextAction && (
                          <button
                            disabled={isUpdating}
                            onClick={() => handleUpdateOrderStatus(order.id, nextAction.target)}
                            className={`px-3 py-1.5 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 ${nextAction.color}`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            {nextAction.label}
                          </button>
                        )}

                        {/* Status Select */}
                        <select
                          disabled={isUpdating}
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D4F3E] font-medium"
                        >
                          <option value="pending">در انتظار تأیید</option>
                          <option value="confirmed">تأیید شده</option>
                          <option value="processing">در حال پردازش</option>
                          <option value="shipped">ارسال به مزرعه</option>
                          <option value="delivered">تحویل داده شد</option>
                          <option value="cancelled">لغو سفارش</option>
                        </select>

                        {/* Print Invoice Button */}
                        <button
                          onClick={() => {
                            setSelectedInvoiceOrder(order);
                            setIsInvoiceModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                          title="چاپ یا مشاهده فاکتور رسمی"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>فاکتور</span>
                        </button>

                        {/* Toggle Details Expand */}
                        <button
                          onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                          className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
                          title={isExpanded ? 'بستن جزئیات' : 'مشاهده جزئیات'}
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>

                    </div>

                    {/* Visual 5-Stage Stepper */}
                    {order.status !== 'cancelled' && (
                      <div className="px-5 pb-3">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-[11px] font-bold">
                          <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-emerald-700 font-black' : 'text-slate-400'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>1</div>
                            <span>ثبت سفارش</span>
                          </div>
                          <div className={`h-0.5 flex-1 mx-2 ${step >= 2 ? 'bg-emerald-600' : 'bg-slate-200'}`} />

                          <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-emerald-700 font-black' : 'text-slate-400'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>2</div>
                            <span>تأیید فاکتور</span>
                          </div>
                          <div className={`h-0.5 flex-1 mx-2 ${step >= 3 ? 'bg-emerald-600' : 'bg-slate-200'}`} />

                          <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-emerald-700 font-black' : 'text-slate-400'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>3</div>
                            <span>بسته‌بندی</span>
                          </div>
                          <div className={`h-0.5 flex-1 mx-2 ${step >= 4 ? 'bg-emerald-600' : 'bg-slate-200'}`} />

                          <div className={`flex items-center gap-1.5 ${step >= 4 ? 'text-emerald-700 font-black' : 'text-slate-400'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 4 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>4</div>
                            <span>ارسال به باربری</span>
                          </div>
                          <div className={`h-0.5 flex-1 mx-2 ${step >= 5 ? 'bg-emerald-600' : 'bg-slate-200'}`} />

                          <div className={`flex items-center gap-1.5 ${step >= 5 ? 'text-emerald-700 font-black' : 'text-slate-400'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 5 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>5</div>
                            <span>تحویل مزرعه</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Expanded Order Items Row */}
                    {isExpanded && (
                      <div className="bg-slate-50/70 border-t border-slate-200 p-5 space-y-4">
                        
                        {/* Shipping Address */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-emerald-700" />
                            <span>آدرس مقصد ارسال به مزرعه / انبار:</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-medium">
                            {order.shipping_address || 'آدرس ثبت نشده است'}
                          </p>
                        </div>

                        {/* Order Items List */}
                        <div className="space-y-2">
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Box className="w-4 h-4 text-indigo-700" />
                            <span>ریز اقلام خریداری شده در این سفارش:</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {order.items?.map((item) => (
                              <div
                                key={item.id}
                                className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3"
                              >
                                {item.product?.image_url ? (
                                  <img
                                    src={item.product.image_url}
                                    alt={item.product.name}
                                    className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                    <Package className="w-6 h-6" />
                                  </div>
                                )}

                                <div className="flex-1 min-w-0 space-y-0.5 text-xs">
                                  <div className="font-bold text-slate-900 truncate">
                                    {item.product?.name || `کالا #${item.product_id}`}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    تعداد: <span className="font-bold font-mono text-slate-800">{item.quantity}</span> عدد × {item.unit_price.toLocaleString('fa-IR')} ت
                                  </div>
                                  <div className="font-mono font-bold text-emerald-800 text-[11px]">
                                    جمع ردیف: {(item.quantity * item.unit_price).toLocaleString('fa-IR')} ت
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })
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
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                دسته‌بندی‌های نهاده‌های کشاورزی در پایگاه داده
              </h3>
              <p className="text-xs text-slate-500">
                دسته‌بندی‌های رسمی کودها، سموم دفع آفات نباتی و بذور زراعی
              </p>
            </div>

            <button
              onClick={() => {
                setEditingCategory(null);
                setCategoryName('');
                setCategoryDesc('');
                setIsCategoryModalOpen(true);
              }}
              className="px-4 py-2 bg-[#2D4F3E] hover:bg-[#234032] text-white font-bold rounded-xl text-xs shadow transition-all flex items-center gap-2"
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
                      className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                      title="ویرایش"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
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
      {/* QUICK STOCK ADJUSTMENT MODAL */}
      {/* ========================================================================= */}
      <AdminQuickStockModal
        product={quickStockProduct}
        isOpen={isQuickStockOpen}
        token={token}
        onClose={() => setIsQuickStockOpen(false)}
        onSuccess={() => {
          fetchAdminProducts();
          fetchStats();
          onRefreshCatalog();
        }}
        showToast={showToast}
      />

      {/* ========================================================================= */}
      {/* OFFICIAL INVOICE PRINT MODAL */}
      {/* ========================================================================= */}
      <AdminInvoiceModal
        order={selectedInvoiceOrder}
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
      />

      {/* ========================================================================= */}
      {/* FULL PRODUCT CREATE / EDIT MODAL */}
      {/* ========================================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#2D4F3E]" />
                {editingProduct ? `ویرایش نهاده #${editingProduct.id}` : 'افزودن نهاده کشاورزی جدید (کود، سم، بذر)'}
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
                  <label className="font-bold text-slate-700">نام کامل نهاده کشاورزی *</label>
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
                  <label className="font-bold text-slate-700">نوع نهاده *</label>
                  <select
                    value={productFormData.product_type}
                    onChange={(e) => setProductFormData({ ...productFormData, product_type: e.target.value as ProductType })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2D4F3E] outline-none font-bold text-emerald-900"
                  >
                    <option value="کود">کود (شیمیایی، ارگانیک، ریزمغذی، هیومیک)</option>
                    <option value="سم">سم (قارچ‌کش، حشره‌کش، علف‌کش، کنه‌کش)</option>
                    <option value="بذر">بذر (هیبرید، زراعی، سبزی و صیفی، گلخانه‌ای)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">دسته‌بندی در فروشگاه *</label>
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
                  <label className="font-bold text-slate-700">قیمت مصوب (تومان) *</label>
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
                  <label className="font-bold text-slate-700">موجودی اولیه در انبار (عدد/بسته) *</label>
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
                  <label className="font-bold text-slate-700">شماره ثبت ماده کودی یا پروانه بهداشت گیاهی</label>
                  <input
                    type="text"
                    placeholder="مثال: سم-۹۸۴۱/ح-۱۴۰۱"
                    value={productFormData.required_permit_number}
                    onChange={(e) => setProductFormData({ ...productFormData, required_permit_number: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2D4F3E] outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">برند یا شرکت تولیدکننده</label>
                  <input
                    type="text"
                    placeholder="مثال: سینجنتا، بایر آلمان، گرین‌پلاس"
                    value={productFormData.brand}
                    onChange={(e) => setProductFormData({ ...productFormData, brand: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2D4F3E] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">اندازه بسته‌بندی</label>
                  <input
                    type="text"
                    placeholder="مثال: کیسه ۱۰ کیلوگرمی، قوطی ۱ لیتری، پاکت ۵۰۰ گرمی"
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
                  آپلود فایل‌های ضمیمه (Multipart Upload به پوشه uploads سرور)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Image Upload */}
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-medium">تصویر اصلی محصول (JPG، PNG، WebP - حداکثر ۵ مگابایت):</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setProductImageFile(file);
                        if (file) {
                          setProductImagePreview(URL.createObjectURL(file));
                        }
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />

                    {productImagePreview && (
                      <div className="flex items-center gap-2 pt-1">
                        <img
                          src={productImagePreview}
                          alt="پیش‌نمایش"
                          className="w-12 h-12 object-cover rounded-lg border border-slate-300"
                        />
                        <span className="text-[11px] text-slate-500">پیش‌نمایش تصویر انتخابی</span>
                      </div>
                    )}
                  </div>

                  {/* MSDS Upload */}
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-medium">برگه اطلاعات ایمنی مواد شیمیایی MSDS (فایل PDF - حداکثر ۱۰ مگابایت):</label>

                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setProductMsdsFile(e.target.files?.[0] || null)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    {editingProduct?.msds_file_url && !productMsdsFile && (
                      <div className="text-[11px] text-slate-500 truncate">
                        فایل MSDS موجود: {editingProduct.msds_file_url}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">توضیحات و دستورالعمل فنی مصرف گیاه‌پزشکی</label>
                <textarea
                  rows={3}
                  placeholder="نحوه اختلاط، دوز مصرف در هکتار، دوره کارنس و نکات ایمنی کشاورزی..."
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
                  className="px-6 py-2.5 bg-[#2D4F3E] hover:bg-[#234032] text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2"
                >
                  {savingProduct ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {editingProduct ? 'ذخیره تغییرات در MySQL' : 'ثبت قطعی در دیتابیس'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CATEGORY CREATE / EDIT MODAL */}
      {/* ========================================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
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
                  className="px-5 py-2 bg-[#2D4F3E] hover:bg-[#234032] text-white rounded-xl font-bold flex items-center gap-1.5 shadow"
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
