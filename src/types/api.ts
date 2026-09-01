export interface Category {
  id: number;
  name: string;
  description: string | null;
  products_count?: number;
  created_at?: string;
  updated_at?: string;
}

export type ProductType = 'کود' | 'سم' | 'بذر';

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category_id: number;
  image_url: string | null;
  product_type: ProductType;
  required_permit_number: string | null;
  msds_file_url: string | null;
  brand: string | null;
  package_size: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  category?: Category;
}

export interface DatabaseStatus {
  connected: boolean;
  dialect: string;
  host: string;
  port: number | string;
  database_name: string;
  connection_pool: {
    max: number;
    min: number;
    idle: number;
  };
}

export interface SystemStats {
  categories_count: number;
  products_count: number;
  users_count: number;
  orders_count: number;
}

export interface SystemStatusResponse {
  success: boolean;
  database: DatabaseStatus;
  stats: SystemStats;
  environment: {
    node_env: string;
    port: number | string;
    cpanel_compatible: boolean;
  };
}

export interface User {
  id: number;
  phone_number: string;
  full_name: string;
  farm_location: string | null;
  role: 'customer' | 'admin';
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  error?: string;
}

export interface CartItemProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
  category_id: number;
  category_name?: string;
  product_type: ProductType;
  brand?: string | null;
  package_size?: string | null;
  required_permit_number?: string | null;
  image_url: string | null;
  in_stock: boolean;
}

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at?: string;
  updated_at?: string;
  product: CartItemProduct | null;
}

export interface CartSummary {
  total_items: number;
  total_quantity: number;
  total_price: number;
  currency: string;
  total_price_formatted: string;
}

export interface CartData {
  items: CartItem[];
  summary: CartSummary;
}

export interface CartResponse {
  success: boolean;
  message?: string;
  data: CartData;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  created_at?: string;
  updated_at?: string;
  product?: Product;
}

export interface Order {
  id: number;
  user_id: number;
  total_price: number;
  status: OrderStatus;
  shipping_address: string | null;
  tracking_code: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  user?: User;
}

export interface OrdersResponse {
  success: boolean;
  message?: string;
  data: Order[];
}

export interface AdminDashboardStats {
  total_orders: number;
  total_revenue: number;
  low_stock_count: number;
  new_users_30d: number;
  total_products: number;
  total_users: number;
  orders_by_status: {
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  low_stock_products: Array<{
    id: number;
    name: string;
    stock: number;
    price: number;
    brand: string | null;
    product_type: ProductType;
  }>;
  calculated_at: string;
}

export interface AdminOrdersResponse {
  success: boolean;
  total_count: number;
  total_pages: number;
  current_page: number;
  limit: number;
  data: Order[];
}



