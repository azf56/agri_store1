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
  Eye,
  Info
} from 'lucide-react';
import { Product, Category, ProductType, User } from '../types/api.js';
import { resolveMediaUrl } from '../config/api.js';
import { ProductDetailModal } from './ProductDetailModal.js';

interface ProductCatalogProps {
  products: Product[];
  categories: Category[];
  loading: boolean;
  currentUser?: User | null;
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
  currentUser,
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
  const [addedSuccessId, setAddedSuccessId] = useState<number | null>(null);

  const handleAddToCartClick = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (!onAddToCart) return;
    if (product.stock <= 0) return;

    setAddingCartId(product.id);
    try {
      await onAddToCart(product.id, 1);
      setAddedSuccessId(product.id);
      setTimeout(() => setAddedSuccessId(null), 2000);
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
      <div className="bg-white rounded-3xl border border-[#E5E1D8] shadow-xs p-4 sm:p-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 mb-4">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8C887D] absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="product-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در نام محصول، برند، شماره مجوز حفظ نباتات یا مشخصات..."
              className="w-full pr-10 pl-4 py-2.5 rounded-2xl border border-[#DCD7CB] bg-[#F9F8F6] text-xs sm:text-sm text-[#3C3A33] placeholder:text-[#8C887D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8BA888]/30 focus:border-[#2D4F3E] transition-all"
            />
          </div>

          {/* Add Product Button (if admin) */}
          {currentUser?.role === 'admin' && (
            <button
              id="open-add-product-modal-btn"
              onClick={onAddProduct}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#C27E47] hover:bg-[#A96D3C] text-white text-xs sm:text-sm font-bold shadow-xs transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت محصول جدید در دیتابیس</span>
            </button>
          )}
        </div>

        {/* Filters and Sorting Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-[#EBE7DE] text-xs">
          
          {/* Product Type Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[#8C887D] ml-1 font-medium whitespace-nowrap">نوع نهاده:</span>
            {[
              { id: 'all', label: 'همه انواع' },
              { id: 'کود', label: 'کود کشاورزی' },
              { id: 'سم', label: 'سم و آفت‌کش' },
              { id: 'بذر', label: 'بذر اصلاح‌شده' },
            ].map((item) => (
              <button
                key={item.id}
                id={`filter-type-${item.id}`}
                onClick={() => setSelectedType(item.id)}
                className={`px-3.5 py-1.5 rounded-xl border font-bold transition-all whitespace-nowrap ${
                  selectedType === item.id
                    ? 'bg-[#2D4F3E] text-white border-[#2D4F3E] shadow-xs'
                    : 'bg-[#F4F1EA] text-[#3C3A33] border-[#DCD7CB] hover:bg-[#EBE7DE]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#F4F1EA] px-3 py-1.5 rounded-xl border border-[#DCD7CB]">
              <Layers className="w-3.5 h-3.5 text-[#8C887D]" />
              <select
                id="category-filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-[#3C3A33] text-xs focus:outline-none cursor-pointer font-medium"
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
            <div className="flex items-center gap-1.5 bg-[#F4F1EA] px-3 py-1.5 rounded-xl border border-[#DCD7CB]">
              <TrendingUp className="w-3.5 h-3.5 text-[#8C887D]" />
              <select
                id="sort-products-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-[#3C3A33] text-xs focus:outline-none cursor-pointer font-medium"
              >
                <option value="newest">جدیدترین</option>
                <option value="price_asc">ارزان‌ترین</option>
                <option value="price_desc">گران‌ترین</option>
                <option value="stock">بیشترین موجودی</option>
                <option value="name">نام الفبایی</option>
              </select>
            </div>

            {/* In Stock Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none bg-[#F4F1EA] px-3 py-1.5 rounded-xl border border-[#DCD7CB] hover:bg-[#EBE7DE] transition-colors">
              <input
                id="in-stock-only-checkbox"
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded text-[#2D4F3E] focus:ring-[#8BA888] w-3.5 h-3.5 cursor-pointer"
              />
              <span className="text-[#3C3A33] text-xs font-semibold">فقط کالاهای موجود</span>
            </label>

          </div>
        </div>
      </div>

      {/* Product List Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E5E1D8]">
          <div className="w-8 h-8 border-3 border-[#2D4F3E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#8C887D]">در حال واکشی محصولات از پایگاه داده...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E5E1D8] px-4">
          <div className="w-12 h-12 rounded-full bg-[#F4F1EA] text-[#8C887D] flex items-center justify-center mx-auto mb-3 border border-[#DCD7CB]">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#3C3A33] mb-1">هیچ محصولی یافت نشد</h3>
          <p className="text-xs text-[#8C887D] max-w-md mx-auto mb-4 leading-relaxed">
            محصولی مطابق فیلترهای انتخابی در پایگاه داده پیدا نشد. می‌توانید فیلترها را تغییر داده یا از جستجوی کلمات کلیدی استفاده نمایید.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {products.map((product) => (
            <div
              key={product.id}
              id={`product-card-${product.id}`}
              onClick={() => setSelectedProductDetails(product)}
              className="bg-white rounded-3xl border border-[#E5E1D8] hover:border-[#8BA888] hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group cursor-pointer"
            >
              {/* Product Image and Badges */}
              <div>
                <div className="relative h-48 bg-[#F9F8F6] border-b border-[#F0EEE8] overflow-hidden">
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
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border shadow-xs ${getTypeBadgeColor(product.product_type)}`}>
                      {product.product_type}
                    </span>
                  </div>

                  {/* Stock Status Pill */}
                  <div className="absolute bottom-2.5 right-2.5">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold backdrop-blur-md shadow-xs ${
                      product.stock > 5
                        ? 'bg-[#2D4F3E]/90 text-[#D7E9D6] border border-[#A9C4A6]/30'
                        : product.stock > 0
                        ? 'bg-[#C27E47]/90 text-white'
                        : 'bg-[#B04A4A]/90 text-white'
                    }`}>
                      {product.stock > 5
                        ? `موجودی: ${product.stock}`
                        : product.stock > 0
                        ? `تنها ${product.stock} عدد در انبار`
                        : 'ناموجود'}
                    </span>
                  </div>

                  {/* Hover Quick View Overlay */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-3 py-1.5 rounded-xl bg-white/95 text-[#2D4F3E] text-xs font-bold shadow-md flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>مشاهده مشخصات کامل</span>
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2.5">
                  {/* Category & Brand */}
                  <div className="flex items-center justify-between text-[11px] text-[#8C887D]">
                    <span className="truncate">{product.category?.name || 'کاتالوگ عمومی'}</span>
                    {product.brand && (
                      <span className="text-[#C27E47] font-semibold truncate max-w-[110px]">{product.brand}</span>
                    )}
                  </div>

                  {/* Name */}
                  <h4 className="text-sm font-extrabold text-[#2D4F3E] line-clamp-2 min-h-[40px] leading-snug">
                    {product.name}
                  </h4>

                  {/* Description snippet */}
                  <p className="text-xs text-[#6B685E] line-clamp-2 min-h-[32px] leading-relaxed">
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
                      <div className="flex items-center gap-1 text-[#C27E47] font-medium">
                        <FileText className="w-3.5 h-3.5 text-[#C27E47] shrink-0" />
                        <span>دارای برگه ایمنی شیمیایی (MSDS)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Price and Actions Footer */}
              <div className="p-4 pt-0 space-y-2">
                <div className="flex items-center justify-between bg-[#F9F8F6] p-2.5 rounded-2xl border border-[#F0EEE8]">
                  <span className="text-xs text-[#8C887D]">قیمت:</span>
                  <span className="text-sm font-extrabold text-[#2D4F3E]">
                    {formatPrice(product.price)}
                  </span>
                </div>

                {/* Add to Cart Button */}
                <button
                  id={`add-to-cart-product-${product.id}-btn`}
                  onClick={(e) => handleAddToCartClick(e, product)}
                  disabled={product.stock <= 0 || addingCartId === product.id}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-xs ${
                    product.stock > 0
                      ? 'bg-[#2D4F3E] hover:bg-[#234032] text-white cursor-pointer'
                      : 'bg-[#EBE7DE] text-[#8C887D] cursor-not-allowed'
                  }`}
                >
                  {addedSuccessId === product.id ? (
                    <>
                      <Check className="w-4 h-4 text-[#A2D9A1]" />
                      <span>به سبد اضافه شد!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>
                        {addingCartId === product.id
                          ? 'در حال افزودن...'
                          : product.stock > 0
                          ? 'افزودن به سبد خرید'
                          : 'عدم موجودی در انبار'}
                      </span>
                    </>
                  )}
                </button>

                {/* Admin controls (only if user is admin) */}
                {currentUser?.role === 'admin' && (
                  <div className="flex items-center gap-2 pt-1 border-t border-[#F0EEE8]" onClick={(e) => e.stopPropagation()}>
                    <button
                      id={`edit-product-${product.id}-btn`}
                      onClick={() => onEditProduct(product)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-[#EBE7DE] hover:bg-[#DED9CE] text-[#3C3A33] text-xs font-semibold border border-[#DCD7CB] transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>ویرایش</span>
                    </button>

                    <button
                      id={`delete-product-${product.id}-btn`}
                      onClick={() => onDeleteProduct(product.id, product.name)}
                      className="p-1.5 rounded-xl bg-[#FEF2F2] hover:bg-[#FCDADA] text-[#B04A4A] text-xs border border-[#FCDADA] transition-colors"
                      title="حذف محصول از دیتابیس"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Details Modal */}
      {selectedProductDetails && (
        <ProductDetailModal
          product={selectedProductDetails}
          onClose={() => setSelectedProductDetails(null)}
          onAddToCart={onAddToCart}
        />
      )}

    </div>
  );
};
