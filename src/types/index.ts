export type UserRole = 'super_admin' | 'user';
export type UserStatus = 'active' | 'inactive';

export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  phone: string;
  full_name?: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at?: string;
  must_change_password?: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  selling_price: number;
  cost_price: number;
  stock: number;
  status: 'active' | 'inactive';
  image_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export type PaymentMethod = 'Cash' | 'QRIS' | 'Transfer';

export interface Transaction {
  id: string; // e.g. TRX-20260928-001
  user_id: string;
  username: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  total: number;
  payment_method: PaymentMethod;
  paid: number;
  change: number;
  created_at: string;
  items?: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export type FinanceCategory = 'Operasional' | 'Pembelian barang' | 'Transportasi' | 'Peralatan' | 'Lainnya' | 'Penjualan Kasir';
export type FinanceType = 'income' | 'expense';

export interface FinanceRecord {
  id: string;
  type: FinanceType;
  date: string;
  description: string;
  amount: number;
  category: FinanceCategory;
  created_at: string;
}

export type ActivityAction = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'REGISTER' 
  | 'ADD_PRODUCT' 
  | 'UPDATE_PRODUCT' 
  | 'DELETE_PRODUCT' 
  | 'CREATE_TRANSACTION' 
  | 'DELETE_TRANSACTION' 
  | 'ADD_FINANCE' 
  | 'UPDATE_USER' 
  | 'DELETE_USER'
  | 'CHANGE_PASSWORD';

export interface ActivityLog {
  id: string;
  user_id?: string;
  username: string;
  action: ActivityAction;
  description: string;
  before_data?: any;
  after_data?: any;
  created_at: string;
}

export interface StoreSettings {
  store_name: string;
  store_address: string;
  store_phone: string;
  receipt_footer: string;
  logo_url?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  connected: boolean;
}
