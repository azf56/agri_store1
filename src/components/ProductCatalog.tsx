import React, { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  Package,
  Edit2,
  Trash2,
  FileText,
  ShieldCheck,
  Tag,
  AlertCircle,
  TrendingUp,
  Layers,
  ShoppingCart,
  Check,
} from 'lucide-react';
import { Product, Category, ProductType } from '../types/api.js';
import { resolveMediaUrl } from '../config/api.js';

interface ProductCatalogProps {
  products: Product[];
  categories: Category[];
  loading: boolean;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: number, name: string) => void;
  onAddToCart?: (productId: number, quantity: number) => Promise<void>;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  inStockOnly: boolean;
  setInStockOnly: (val: boolean) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  categories,
  loading,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onAddToCart,
  selectedCategory,
  setSelectedCategory,
  selectedType,
  setSelectedType,
  searchQuery,
  setSearchQuery,
  inStockOnly,
  setInStockOnly,
  sortBy,
  setSortBy,
}) => {
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);
  const [addingCartId, setAddingCartId] = useState<number | null>(null);

  const handleAddToCartClick = async (product: Product) => {
    if (!onAddToCart) return;
    if (product.stock <= 0) return;

    setAddingCartId(product.id);
    try {
      await onAddToCart(product.id, 1);
    } finally {
      setAddingCartId(null);
    }
  };

  const formatPrice = (price: number) => {
    return Number(price).toLocaleString('fa-IR') + ' تومان';
  };

  const getTypeBadgeColor = (type: ProductType) => {
    switch (type) {
      case 'کود':
        return 'bg-[#FDF4EE] text-[#C27E47] border-[#F7E5D9]';
      case 'سم':
        return 'bg-[#FEF2F2] text-[#B04A4A] border-[#FCDADA]';
      case 'بذر':
        return 'bg-[#E8F0EC] text-[#2D4F3E] border-[#D2E3D8]';
      default:
        return 'bg-[#EBE7DE] text-[#3C3A33] border-[#DCD7CB]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-sm p-4 sm:p-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 mb-4">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8C887D] absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="product-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در نام محصول، برند، شماره مجوز یا توضیحات..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-[#DCD7CB] bg-[#F9F8F6] text-xs sm:text-sm text-[#3C3A33] placeholder:text-[#8C887D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E] transition-all"
            />
          </div>

          {/* Add Product Button */}
          <button
            id="open-add-product-modal-btn"
            onClick={onAddProduct}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#C27E47] hover:bg-[#A96D3C] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت محصول جدید</span>
          </button>
        </div>

        {/* Filters and Sorting Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-[#EBE7DE] text-xs">
          
          {/* Product Type Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[#8C887D] ml-1 font-medium">نوع نهاده:</span>
            {['all', 'کود', 'سم', 'بذر'].map((type) => (
              <button
                key={type}
                id={`filter-type-${type}`}
                onClick={() => setSelectedType(type)}
                className={`px-3.5 py-1.5 rounded-lg border font-medium transition-all ${
                  selectedType === type
                    ? 'bg-[#2D4F3E] text-white border-[#2D4F3E] shadow-xs'
                    : 'bg-[#EBE7DE] text-[#3C3A33] border-[#DCD7CB] hover:bg-[#DED9CE]'
                }`}
              >
                {type === 'all' ? 'همه انواع' : type}
              </button>
            ))}
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#EBE7DE] px-3 py-1.5 rounded-lg border border-[#DCD7CB]">
              <Layers className="w-3.5 h-3.5 text-[#8C887D]" />
              <select
                id="category-filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-[#3C3A33] text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">همه دسته‌بندی‌ها</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#EBE7DE] px-3 py-1.5 rounded-lg border border-[#DCD7CB]">
              <TrendingUp className="w-3.5 h-3.5 text-[#8C887D]" />
              <select
                id="sort-products-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-[#3C3A33] text-xs focus:outline-none cursor-pointer"
              >
                <option value="newest">جدیدترین</option>
                <option value="price_asc">ارزان‌ترین</option>
                <option value="price_desc">گران‌ترین</option>
                <option value="stock">بیشترین موجودی</option>
                <option value="name">نام الفبایی</option>
              </select>
            </div>

            {/* In Stock Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none bg-[#EBE7DE] px-3 py-1.5 rounded-lg border border-[#DCD7CB] hover:bg-[#DED9CE] transition-colors">
              <input
                id="in-stock-only-checkbox"
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded text-[#2D4F3E] focus:ring-[#8BA888] w-3.5 h-3.5 cursor-pointer"
              />
              <span className="text-[#3C3A33] text-xs">فقط کالاهای موجود</span>
            </label>

          </div>
        </div>
      </div>

      {/* Product List Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E5E1D8]">
          <div className="w-8 h-8 border-3 border-[#2D4F3E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#8C887D]">در حال فراخوانی داده‌های محصولات از پایگاه داده MySQL...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E5E1D8] px-4">
          <div className="w-12 h-12 rounded-full bg-[#F4F1EA] text-[#8C887D] flex items-center justify-center mx-auto mb-3 border border-[#DCD7CB]">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-[#3C3A33] mb-1">هیچ محصولی یافت نشد</h3>
          <p className="text-xs text-[#8C887D] max-w-md mx-auto mb-4">
            محصولی مطابق فیلترهای انتخابی در پایگاه داده پیدا نشد. می‌توانید فیلترها را تغییر داده یا از دکمه «درج محصولات نمونه» در بالای صفحه استفاده کنید.
          </p>
          <button
            onClick={onAddProduct}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C27E47] text-white text-xs font-medium hover:bg-[#A96D3C] transition-colors"
          >
            <Plus className="w-4 h-4" />
            ثبت اولین محصول
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {products.map((product) => (
            <div
              key={product.id}
              id={`product-card-${product.id}`}
              className="bg-white rounded-2xl border border-[#E5E1D8] hover:border-[#8BA888] hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
            >
              {/* Product Image and Badges */}
              <div>
                <div className="relative h-44 bg-[#F9F8F6] border-b border-[#F0EEE8] overflow-hidden">
                  <img
                    src={resolveMediaUrl(product.image_url) || 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop&q=80'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop&q=80');
                    }}
                  />
                  
                  {/* Type Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border shadow-xs ${getTypeBadgeColor(product.product_type)}`}>
                      {product.product_type}
                    </span>
                  </div>

                  {/* Stock Badge */}
                  <div className="absolute bottom-2.5 right-2.5">
                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium backdrop-blur-md ${
                      product.stock > 0
                        ? 'bg-[#2D4F3E]/90 text-[#D7E9D6] border border-[#A9C4A6]/30'
                        : 'bg-[#B04A4A]/90 text-white'
                    }`}>
                      {product.stock > 0 ? `موجودی: ${product.stock}` : 'ناموجود'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Category & Brand */}
                  <div className="flex items-center justify-between text-[11px] text-[#8C887D] mb-1">
                    <span className="truncate">{product.category?.name || 'دسته‌بندی نشده'}</span>
                    {product.brand && (
                      <span className="text-[#3C3A33] font-medium truncate max-w-[110px]">{product.brand}</span>
                    )}
                  </div>

                  {/* Name */}
                  <h4 className="text-sm font-bold text-[#2D4F3E] line-clamp-2 min-h-[40px] mb-2">
                    {product.name}
                  </h4>

                  {/* Description snippet */}
                  <p className="text-xs text-[#6B685E] line-clamp-2 mb-3 min-h-[32px] leading-relaxed">
                    {product.description || 'بدون توضیحات تکمیلی.'}
                  </p>

                  {/* Badges / Specs */}
                  <div className="space-y-1.5 pt-2 border-t border-[#EBE7DE] text-[11px]">
                    {product.required_permit_number && (
                      <div className="flex items-center gap-1 text-[#2D4F3E]">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#2D4F3E] shrink-0" />
                        <span className="truncate">مجوز: {product.required_permit_number}</span>
                      </div>
                    )}
                    {product.package_size && (
                      <div className="flex items-center gap-1 text-[#6B685E]">
                        <Tag className="w-3.5 h-3.5 text-[#8BA888] shrink-0" />
                        <span>بسته‌بندی: {product.package_size}</span>
                      </div>
                    )}
                    {product.msds_file_url && (
                      <div className="flex items-center gap-1 text-[#C27E47]">
                        <FileText className="w-3.5 h-3.5 text-[#C27E47] shrink-0" />
                        <span>دارای برگه ایمنی شیمیایی (MSDS)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Price and Actions Footer */}
              <div className="p-4 pt-0 space-y-2">
                <div className="flex items-center justify-between bg-[#F9F8F6] p-2.5 rounded-xl border border-[#F0EEE8]">
                  <span className="text-xs text-[#8C887D]">قیمت:</span>
                  <span className="text-sm font-bold text-[#3C3A33]">
                    {formatPrice(product.price)}
                  </span>
                </div>

                {/* Add to Cart Button */}
                <button
                  id={`add-to-cart-product-${product.id}-btn`}
                  onClick={() => handleAddToCartClick(product)}
                  disabled={product.stock <= 0 || addingCartId === product.id}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                    product.stock > 0
                      ? 'bg-[#2D4F3E] hover:bg-[#234032] text-white cursor-pointer'
                      : 'bg-[#EBE7DE] text-[#8C887D] cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>
                    {addingCartId === product.id
                      ? 'در حال افزودن به دیتابیس...'
                      : product.stock > 0
                      ? 'افزودن به سبد خرید'
                      : 'عدم موجودی در انبار'}
                  </span>
                </button>

                <div className="flex items-center gap-2 pt-1 border-t border-[#F0EEE8]">
                  <button
                    id={`edit-product-${product.id}-btn`}
                    onClick={() => onEditProduct(product)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#EBE7DE] hover:bg-[#DED9CE] text-[#3C3A33] text-xs font-medium border border-[#DCD7CB] transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>ویرایش</span>
                  </button>

                  <button
                    id={`delete-product-${product.id}-btn`}
                    onClick={() => onDeleteProduct(product.id, product.name)}
                    className="p-1.5 rounded-lg bg-[#FEF2F2] hover:bg-[#FCDADA] text-[#B04A4A] text-xs border border-[#FCDADA] transition-colors"
                    title="حذف محصول"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
