import React, { useState, useEffect, useCallback } from 'react';
import { Header, ActiveTabType } from './components/Header.js';
import { DatabaseStatusCard } from './components/DatabaseStatusCard.js';
import { ProductCatalog } from './components/ProductCatalog.js';
import { ProductModal } from './components/ProductModal.js';
import { CategoryManager } from './components/CategoryManager.js';
import { AuthManager } from './components/AuthManager.js';
import { CartManager } from './components/CartManager.js';
import { OrdersHistory } from './components/OrdersHistory.js';
import { AdminPanel } from './components/AdminPanel.js';
import { ApiWorkbench } from './components/ApiWorkbench.js';
import { CpanelGuide } from './components/CpanelGuide.js';
import { OfflineIndicator } from './components/OfflineIndicator.js';
import { ToastNotification, ToastMessage, ToastType } from './components/ToastNotification.js';
import { Product, Category, SystemStatusResponse, User, CartData, Order } from './types/api.js';
import { apiFetch } from './config/api.js';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTabType>('catalog');
  
  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('agri_jwt_token') || null;
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: ToastType, message: string, title?: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev.slice(-3), { id, type, message, title }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Data states
  const [systemStatus, setSystemStatus] = useState<SystemStatusResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Loading states
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingCart, setLoadingCart] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  // Modals
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // 1. Fetch Cart from MySQL API
  const fetchCart = useCallback(async (token: string) => {
    setLoadingCart(true);
    try {
      const res = await apiFetch('/api/v1/cart', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setCart(json.data);
        }
      } else if (res.status === 401) {
        // Expired token
        localStorage.removeItem('agri_jwt_token');
        setAuthToken(null);
        setCurrentUser(null);
        setCart(null);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoadingCart(false);
    }
  }, []);

  // 2. Fetch Orders from MySQL API
  const fetchOrders = useCallback(async (token: string) => {
    setLoadingOrders(true);
    try {
      const res = await apiFetch('/api/v1/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setOrders(json.data);
        }
      } else if (res.status === 401) {
        localStorage.removeItem('agri_jwt_token');
        setAuthToken(null);
        setCurrentUser(null);
        setOrders([]);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  // Verify and fetch user from DB if token exists
  const verifyTokenAndFetchMe = useCallback(async (token: string) => {
    try {
      const res = await apiFetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          fetchCart(token);
          fetchOrders(token);
          return;
        }
      }
      // Token invalid or expired
      localStorage.removeItem('agri_jwt_token');
      setAuthToken(null);
      setCurrentUser(null);
      setCart(null);
      setOrders([]);
    } catch {
      // Network error or offline
    }
  }, [fetchCart, fetchOrders]);

  // Check auth on startup
  useEffect(() => {
    if (authToken) {
      verifyTokenAndFetchMe(authToken);
    }
  }, [authToken, verifyTokenAndFetchMe]);

  const handleLoginSuccess = (token: string, user: User) => {
    setAuthToken(token);
    setCurrentUser(user);
    localStorage.setItem('agri_jwt_token', token);
    showToast('success', `خوش آمدید ${user.full_name || 'کاربر گرامی'}`, 'ورود موفق');
    fetchCart(token);
    fetchOrders(token);
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setCart(null);
    setOrders([]);
    localStorage.removeItem('agri_jwt_token');
    showToast('info', 'از حساب کاربری خود خارج شدید.', 'خروج');
  };

  const handleUserUpdated = (user: User) => {
    setCurrentUser(user);
  };

  // Fetch System & Database status
  const fetchSystemStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const res = await apiFetch('/api/system/status');
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
      }
    } catch (err) {
      console.error('Error fetching system status:', err);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  // Fetch Categories from MySQL API
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const res = await apiFetch('/api/categories');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCategories(json.data);
        }
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Fetch Products with filters from MySQL API
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category_id', selectedCategory);
      if (selectedType !== 'all') params.append('product_type', selectedType);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (inStockOnly) params.append('in_stock', 'true');
      if (sortBy) params.append('sort', sortBy);
      params.append('limit', '50');

      const res = await apiFetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setProducts(json.data);
        }
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoadingProducts(false);
    }
  }, [selectedCategory, selectedType, searchQuery, inStockOnly, sortBy]);

  // Initial load
  useEffect(() => {
    fetchSystemStatus();
    fetchCategories();
  }, [fetchSystemStatus, fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handler for refreshing all data
  const handleRefreshAll = () => {
    fetchSystemStatus();
    fetchCategories();
    fetchProducts();
    if (authToken) {
      verifyTokenAndFetchMe(authToken);
      fetchCart(authToken);
      fetchOrders(authToken);
    }
  };

  // Switch tab with live data sync
  const handleTabChange = (tab: ActiveTabType) => {
    setActiveTab(tab);
    if (tab === 'cart' && authToken) {
      fetchCart(authToken);
    } else if (tab === 'orders' && authToken) {
      fetchOrders(authToken);
    }
  };

  // Cart Handlers
  const handleAddToCart = async (productId: number, quantity: number = 1) => {
    if (!authToken) {
      showToast('info', 'برای افزودن به سبد خرید ابتدا وارد حساب کاربری خود شوید.', 'ورود به حساب');
      setActiveTab('auth');
      return;
    }

    try {
      const res = await apiFetch('/api/v1/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ product_id: productId, quantity }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setCart(data.data);
        showToast('success', 'محصول با موفقیت به سبد خرید افزوده شد.', 'سبد خرید');
        fetchSystemStatus();
      } else if (res.status === 401) {
        localStorage.removeItem('agri_jwt_token');
        setAuthToken(null);
        setCurrentUser(null);
        setCart(null);
        showToast('error', 'نشست شما منقضی شده است. لطفاً مجدداً وارد شوید.', 'احراز هویت');
        setActiveTab('auth');
      } else {
        showToast('error', data.message || 'خطا در افزودن کالا به سبد خرید', 'خطای موجودی');
      }
    } catch (err: any) {
      showToast('error', `خطا در ارتباط با سرور: ${err.message}`, 'خطای شبکه');
    }
  };

  const handleUpdateCartQty = async (itemId: number, newQty: number) => {
    if (!authToken) return;
    const res = await apiFetch(`/api/v1/cart/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ quantity: newQty }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.data) {
      setCart(data.data);
    } else if (res.status === 401) {
      localStorage.removeItem('agri_jwt_token');
      setAuthToken(null);
      setCurrentUser(null);
      setCart(null);
      showToast('error', 'نشست شما منقضی شده است. لطفاً مجدداً وارد شوید.');
      setActiveTab('auth');
    } else {
      throw new Error(data.message || 'خطا در تغییر تعداد کالا');
    }
  };

  const handleRemoveCartItem = async (itemId: number) => {
    if (!authToken) return;
    const res = await apiFetch(`/api/v1/cart/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    const data = await res.json();
    if (res.ok && data.success && data.data) {
      setCart(data.data);
      showToast('info', 'آیتم از سبد خرید حذف شد.');
      fetchSystemStatus();
    } else if (res.status === 401) {
      localStorage.removeItem('agri_jwt_token');
      setAuthToken(null);
      setCurrentUser(null);
      setCart(null);
      setActiveTab('auth');
    } else {
      throw new Error(data.message || 'خطا در حذف آیتم');
    }
  };

  const handleClearCart = async () => {
    if (!authToken) return;
    const res = await apiFetch('/api/v1/cart', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    const data = await res.json();
    if (res.ok && data.success && data.data) {
      setCart(data.data);
      showToast('info', 'سبد خرید در پایگاه داده به طور کامل تخلیه شد.');
      fetchSystemStatus();
    } else if (res.status === 401) {
      localStorage.removeItem('agri_jwt_token');
      setAuthToken(null);
      setCurrentUser(null);
      setCart(null);
      setActiveTab('auth');
    } else {
      throw new Error(data.message || 'خطا در تخلیه سبد');
    }
  };

  // Place Order Handler with ACID Transaction
  const handlePlaceOrder = async (shippingAddress: string): Promise<boolean> => {
    if (!authToken) {
      showToast('info', 'برای ثبت سفارش ابتدا وارد حساب کاربری خود شوید.');
      setActiveTab('auth');
      return false;
    }

    const res = await apiFetch('/api/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ shipping_address: shippingAddress }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      // Refresh cart (will be empty), orders, products (for stock decrement) and status
      await fetchCart(authToken);
      await fetchOrders(authToken);
      fetchProducts();
      fetchSystemStatus();
      showToast('success', data.message || 'سفارش شما با موفقیت ثبت گردید.', 'ثبت سفارش');
      setActiveTab('orders');
      return true;
    } else if (res.status === 401) {
      localStorage.removeItem('agri_jwt_token');
      setAuthToken(null);
      setCurrentUser(null);
      setCart(null);
      showToast('error', 'نشست شما منقضی شده است. لطفاً مجدداً وارد شوید.');
      setActiveTab('auth');
      return false;
    } else {
      throw new Error(data.message || 'خطا در ثبت سفارش');
    }
  };

  // Product CRUD Handlers
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductModalOpen(true);
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    if (!authToken) {
      showToast('info', 'برای حذف محصول باید با حساب مدیر وارد شوید.');
      return;
    }
    try {
      const res = await apiFetch(`/api/v1/admin/products/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', `محصول «${name}» با موفقیت حذف گردید.`);
        handleRefreshAll();
      } else {
        showToast('error', data.message || 'خطا در حذف محصول');
      }
    } catch (err: any) {
      showToast('error', `خطا در ارتباط با سرور: ${err.message}`);
    }
  };

  const cartItemsCount = cart?.summary?.total_quantity || 0;

  return (
    <div dir="rtl" className="min-h-screen bg-[#F4F1EA] text-[#3C3A33] flex flex-col font-sans selection:bg-[#8BA888]/40 selection:text-[#2D4F3E]">
      
      {/* Toast Notification Container */}
      <ToastNotification toasts={toasts} onDismiss={dismissToast} />

      {/* Top Navbar */}
      <Header
        status={systemStatus}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        currentUser={currentUser}
        cartCount={cartItemsCount}
        onRefresh={handleRefreshAll}
        loading={loadingStatus || loadingProducts || loadingCategories || loadingCart}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Database Status & Health Monitor Card */}
        <DatabaseStatusCard
          status={systemStatus}
          onRefresh={handleRefreshAll}
          onSeedSuccess={handleRefreshAll}
        />

        {/* Dynamic Tab Views */}
        {activeTab === 'catalog' && (
          <ProductCatalog
            products={products}
            categories={categories}
            loading={loadingProducts}
            currentUser={currentUser}
            onAddProduct={handleOpenAddProduct}
            onEditProduct={handleOpenEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onAddToCart={handleAddToCart}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            inStockOnly={inStockOnly}
            setInStockOnly={setInStockOnly}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
        )}

        {activeTab === 'cart' && (
          <CartManager
            cart={cart}
            loading={loadingCart}
            currentUser={currentUser}
            authToken={authToken}
            onRefreshCart={() => authToken && fetchCart(authToken)}
            onUpdateQuantity={handleUpdateCartQty}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onPlaceOrder={handlePlaceOrder}
            onNavigateToCatalog={() => setActiveTab('catalog')}
            onNavigateToAuth={() => setActiveTab('auth')}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersHistory
            orders={orders}
            loading={loadingOrders}
            currentUser={currentUser}
            authToken={authToken}
            onRefreshOrders={() => authToken && fetchOrders(authToken)}
            onNavigateToCatalog={() => setActiveTab('catalog')}
            onNavigateToAuth={() => setActiveTab('auth')}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            user={currentUser}
            token={authToken}
            categories={categories}
            onRefreshCatalog={handleRefreshAll}
            onNavigateToAuth={() => setActiveTab('auth')}
          />
        )}

        {activeTab === 'categories' && (
          <CategoryManager
            categories={categories}
            loading={loadingCategories}
            onRefresh={handleRefreshAll}
            token={authToken}
          />
        )}

        {activeTab === 'auth' && (
          <AuthManager
            currentUser={currentUser}
            authToken={authToken}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
            onUserUpdated={handleUserUpdated}
          />
        )}

        {activeTab === 'api-tester' && <ApiWorkbench />}

        {activeTab === 'cpanel-guide' && <CpanelGuide />}

      </main>

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onSaveSuccess={handleRefreshAll}
        product={editingProduct}
        categories={categories}
        token={authToken}
      />

      {/* Offline Alert Indicator */}
      <OfflineIndicator />

      {/* Footer */}
      <footer className="bg-[#EBE7DE] border-t border-[#DCD7CB] py-5 mt-12 text-center text-xs text-[#6B685E]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>سامانه جامع مدیریت و فروش نهاده‌های کشاورزی (کود، سم، بذر) — Express.js + Sequelize ORM</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#A2D9A1] inline-block"></span>
            <span className="text-[#2D4F3E] font-medium">سبد خرید و تراکنش سفارشات MySQL • احراز هویت امن JWT</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
