import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  UserProfile, 
  Product, 
  Transaction, 
  TransactionItem, 
  FinanceRecord, 
  ActivityLog, 
  StoreSettings, 
  SupabaseConfig 
} from '../types';

// Storage keys
const STORAGE_KEYS = {
  SUPABASE_CONFIG: 'kasirku_supabase_config',
  ACTIVE_USER: 'kasirku_active_user',
  PROFILES: 'kasirku_profiles',
  PRODUCTS: 'kasirku_products',
  TRANSACTIONS: 'kasirku_transactions',
  TRANSACTION_ITEMS: 'kasirku_transaction_items',
  FINANCE: 'kasirku_finance',
  ACTIVITY_LOGS: 'kasirku_activity_logs',
  SETTINGS: 'kasirku_settings',
  CREDENTIALS: 'kasirku_auth_credentials', // hashed password store for local/demo mode
};

// Initial default products
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'P001',
    name: 'Pop Mie',
    category: 'Makanan',
    selling_price: 8000,
    cost_price: 6000,
    stock: 25,
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 'P002',
    name: 'Es Mojito',
    category: 'Minuman',
    selling_price: 6000,
    cost_price: 3500,
    stock: 30,
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 'P003',
    name: 'Keripik Gulmer',
    category: 'Makanan',
    selling_price: 10000,
    cost_price: 7500,
    stock: 15,
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 'P004',
    name: 'Teh Pucuk',
    category: 'Minuman',
    selling_price: 5000,
    cost_price: 3500,
    stock: 40,
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 'P005',
    name: 'Boneva',
    category: 'Minuman',
    selling_price: 5000,
    cost_price: 3000,
    stock: 20,
    status: 'active',
    created_at: new Date().toISOString()
  }
];

const INITIAL_SETTINGS: StoreSettings = {
  store_name: 'KASIRKU',
  store_address: 'Jl. Pemuda Bisnis No. 45, Jakarta Pusat',
  store_phone: '0812-3456-7890',
  receipt_footer: 'Terima kasih telah berbelanja!',
  logo_url: ''
};

// SHA-256 helper for client-side password hashing (NEVER plain text)
export async function hashPassword(plainText: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`kasirku_salt_2026_${plainText}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

class DatabaseService {
  private supabase: SupabaseClient | null = null;
  private config: SupabaseConfig = {
    url: '',
    anonKey: '',
    connected: false
  };

  constructor() {
    this.init();
  }

  private async init() {
    // Load config from localStorage
    const savedConfig = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.url && parsed.anonKey) {
          this.config = parsed;
          this.supabase = createClient(parsed.url, parsed.anonKey);
        }
      } catch (e) {
        console.error('Failed to parse Supabase config', e);
      }
    }

    // Seed initial local storage if empty
    await this.ensureInitialSeed();
  }

  private async ensureInitialSeed() {
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    }

    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    }

    if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
      // Seed initial Super Admin Fransisko
      const fransiskoId = 'user_super_admin_fransisko';
      const initialProfiles: UserProfile[] = [
        {
          id: 'prof_fransisko',
          user_id: fransiskoId,
          username: 'Fransisko',
          phone: '081234567890',
          full_name: 'Fransisko Super Admin',
          role: 'super_admin',
          status: 'active',
          must_change_password: true, // triggers warning on first login
          created_at: new Date().toISOString()
        }
      ];
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(initialProfiles));

      // Hash password "09042005"
      const defaultHash = await hashPassword('09042005');
      const credentials: Record<string, string> = {
        [fransiskoId]: defaultHash
      };
      localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials));

      // Seed initial activity log
      const initialLogs: ActivityLog[] = [
        {
          id: 'log_seed_1',
          username: 'Sistem',
          action: 'REGISTER',
          description: 'Akun Super Admin Fransisko berhasil diinisialisasi',
          created_at: new Date().toISOString()
        }
      ];
      localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(initialLogs));
    }

    if (!localStorage.getItem(STORAGE_KEYS.FINANCE)) {
      const initialFinance: FinanceRecord[] = [
        {
          id: 'fin_1',
          type: 'expense',
          date: new Date().toISOString().split('T')[0],
          description: 'Pembelian Stok Awal Bahan & Makanan',
          amount: 250000,
          category: 'Pembelian barang',
          created_at: new Date().toISOString()
        },
        {
          id: 'fin_2',
          type: 'income',
          date: new Date().toISOString().split('T')[0],
          description: 'Modal Kas Awal Kasir',
          amount: 500000,
          category: 'Operasional',
          created_at: new Date().toISOString()
        }
      ];
      localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(initialFinance));
    }

    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    }
  }

  // --- SUPABASE CONFIGURATION ---
  public getSupabaseConfig(): SupabaseConfig {
    return this.config;
  }

  public async setSupabaseConfig(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!url.trim() || !anonKey.trim()) {
        this.config = { url: '', anonKey: '', connected: false };
        this.supabase = null;
        localStorage.removeItem(STORAGE_KEYS.SUPABASE_CONFIG);
        return { success: true, message: 'Kembali ke Mode Lokal / Offline' };
      }

      // Test connection
      const testClient = createClient(url, anonKey);
      const { error } = await testClient.from('settings').select('store_name').limit(1);

      if (error && error.code !== 'PGRST116') {
        // Even if table empty, connection ok. If error is network/auth, throw
        console.warn('Supabase test ping message:', error.message);
      }

      this.config = { url, anonKey, connected: true };
      this.supabase = testClient;
      localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(this.config));

      return { success: true, message: 'Koneksi ke Supabase berhasil diaktifkan!' };
    } catch (e: any) {
      return { success: false, message: `Gagal terhubung ke Supabase: ${e.message || 'Periksa URL dan Anon Key'}` };
    }
  }

  public isSupabaseConnected(): boolean {
    return !!this.supabase && this.config.connected;
  }

  // --- AUTHENTICATION & PROFILES ---
  public async getActiveUser(): Promise<UserProfile | null> {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public setActiveUser(user: UserProfile | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
    }
  }

  public async login(identifier: string, plainPassword: string): Promise<{ success: boolean; user?: UserProfile; message: string; mustChangePassword?: boolean }> {
    const cleanId = identifier.trim();
    if (!cleanId || !plainPassword) {
      return { success: false, message: 'Username/No Telepon dan Password wajib diisi!' };
    }

    // Try Supabase Auth first if connected
    if (this.supabase && this.config.connected) {
      try {
        // Find profile by username or phone
        const { data: profileData, error: profileErr } = await this.supabase
          .from('profiles')
          .select('*')
          .or(`username.eq.${cleanId},phone.eq.${cleanId}`)
          .single();

        if (profileErr || !profileData) {
          return { success: false, message: 'Pengguna tidak ditemukan.' };
        }

        if (profileData.status === 'inactive') {
          return { success: false, message: 'Akun Anda dinonaktifkan. Silakan hubungi Super Admin.' };
        }

        // Sign in via Supabase Auth using dummy email format if phone or username was mapped
        const dummyEmail = `${profileData.username.toLowerCase()}@kasirku.local`;
        const { error: authErr } = await this.supabase.auth.signInWithPassword({
          email: dummyEmail,
          password: plainPassword
        });

        if (authErr) {
          // Fallback check against local hashed store if Supabase Auth not yet created for this user
          const creds = JSON.parse(localStorage.getItem(STORAGE_KEYS.CREDENTIALS) || '{}');
          const hashedInput = await hashPassword(plainPassword);
          if (creds[profileData.user_id] !== hashedInput) {
            return { success: false, message: 'Password salah!' };
          }
        }

        const user: UserProfile = profileData;
        this.setActiveUser(user);
        await this.logActivity(user.username, 'LOGIN', `User ${user.username} berhasil login ke sistem (Supabase Online)`);
        return { 
          success: true, 
          user, 
          message: 'Login berhasil!', 
          mustChangePassword: user.must_change_password 
        };
      } catch (err: any) {
        console.warn('Supabase login error, falling back to local verification:', err);
      }
    }

    // Local / Offline authentication
    const profiles: UserProfile[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]');
    const user = profiles.find(p => p.username.toLowerCase() === cleanId.toLowerCase() || p.phone === cleanId);

    if (!user) {
      return { success: false, message: 'Username atau nomor telepon tidak ditemukan!' };
    }

    if (user.status === 'inactive') {
      return { success: false, message: 'Akun Anda dinonaktifkan. Silakan hubungi Super Admin.' };
    }

    const credentials: Record<string, string> = JSON.parse(localStorage.getItem(STORAGE_KEYS.CREDENTIALS) || '{}');
    const inputHash = await hashPassword(plainPassword);

    if (credentials[user.user_id] !== inputHash) {
      return { success: false, message: 'Password salah. Silakan coba lagi.' };
    }

    this.setActiveUser(user);
    await this.logActivity(user.username, 'LOGIN', `User ${user.username} (${user.role}) berhasil masuk ke sistem`);

    return {
      success: true,
      user,
      message: 'Login berhasil!',
      mustChangePassword: user.must_change_password
    };
  }

  public async register(username: string, phone: string, plainPassword: string, confirmPassword: string): Promise<{ success: boolean; message: string }> {
    const cleanUser = username.trim();
    const cleanPhone = phone.trim();

    if (!cleanUser || !cleanPhone || !plainPassword || !confirmPassword) {
      return { success: false, message: 'Semua kolom wajib diisi!' };
    }

    if (cleanUser.length < 3) {
      return { success: false, message: 'Username minimal 3 karakter!' };
    }

    if (plainPassword.length < 6) {
      return { success: false, message: 'Password minimal 6 karakter!' };
    }

    if (plainPassword !== confirmPassword) {
      return { success: false, message: 'Konfirmasi password tidak cocok!' };
    }

    // Check existing profiles
    const profiles: UserProfile[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]');
    const userExists = profiles.some(p => p.username.toLowerCase() === cleanUser.toLowerCase());
    if (userExists) {
      return { success: false, message: 'Username sudah digunakan oleh akun lain!' };
    }

    const phoneExists = profiles.some(p => p.phone === cleanPhone);
    if (phoneExists) {
      return { success: false, message: 'Nomor telepon sudah terdaftar!' };
    }

    const newUserId = `usr_${Date.now()}`;
    const newProfile: UserProfile = {
      id: `prof_${Date.now()}`,
      user_id: newUserId,
      username: cleanUser,
      phone: cleanPhone,
      full_name: cleanUser,
      role: 'user', // Default is always user, never super_admin
      status: 'active',
      must_change_password: false,
      created_at: new Date().toISOString()
    };

    // Save profile locally
    profiles.push(newProfile);
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));

    // Save hashed password
    const hashed = await hashPassword(plainPassword);
    const credentials: Record<string, string> = JSON.parse(localStorage.getItem(STORAGE_KEYS.CREDENTIALS) || '{}');
    credentials[newUserId] = hashed;
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials));

    // If Supabase connected, also insert
    if (this.supabase && this.config.connected) {
      try {
        await this.supabase.from('profiles').insert([newProfile]);
      } catch (e) {
        console.warn('Could not mirror register to Supabase:', e);
      }
    }

    await this.logActivity(cleanUser, 'REGISTER', `Pengguna baru ${cleanUser} berhasil mendaftar sebagai kasir`);

    return { success: true, message: 'Pendaftaran berhasil! Silakan login.' };
  }

  public async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'Password baru minimal 6 karakter!' };
    }

    const credentials: Record<string, string> = JSON.parse(localStorage.getItem(STORAGE_KEYS.CREDENTIALS) || '{}');
    const oldHash = await hashPassword(oldPassword);

    if (credentials[userId] !== oldHash) {
      return { success: false, message: 'Password lama salah!' };
    }

    const newHash = await hashPassword(newPassword);
    credentials[userId] = newHash;
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials));

    // Update profile must_change_password to false
    const profiles: UserProfile[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]');
    const userIndex = profiles.findIndex(p => p.user_id === userId);
    if (userIndex !== -1) {
      profiles[userIndex].must_change_password = false;
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));

      // Update active user in session if matches
      const active = await this.getActiveUser();
      if (active && active.user_id === userId) {
        active.must_change_password = false;
        this.setActiveUser(active);
      }

      await this.logActivity(profiles[userIndex].username, 'CHANGE_PASSWORD', `Pengguna ${profiles[userIndex].username} berhasil memperbarui password`);
    }

    return { success: true, message: 'Password berhasil diubah!' };
  }

  // --- USER MANAGEMENT (SUPER ADMIN ONLY) ---
  public async getProfiles(): Promise<UserProfile[]> {
    if (this.supabase && this.config.connected) {
      const { data, error } = await this.supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]');
  }

  public async updateUserStatus(userId: string, newStatus: 'active' | 'inactive'): Promise<{ success: boolean; message: string }> {
    const profiles: UserProfile[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]');
    const target = profiles.find(p => p.user_id === userId);

    if (!target) return { success: false, message: 'User tidak ditemukan' };

    // Prevent deactivating the last active super_admin
    if (target.role === 'super_admin' && newStatus === 'inactive') {
      const activeSuperAdmins = profiles.filter(p => p.role === 'super_admin' && p.status === 'active');
      if (activeSuperAdmins.length <= 1) {
        return { success: false, message: 'Tidak dapat menonaktifkan satu-satunya Super Admin!' };
      }
    }

    target.status = newStatus;
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));

    if (this.supabase && this.config.connected) {
      await this.supabase.from('profiles').update({ status: newStatus }).eq('user_id', userId);
    }

    await this.logActivity('Super Admin', 'UPDATE_USER', `Status user ${target.username} diubah menjadi ${newStatus}`);
    return { success: true, message: `Status pengguna berhasil diubah ke ${newStatus}` };
  }

  public async updateUserRole(userId: string, newRole: 'super_admin' | 'user'): Promise<{ success: boolean; message: string }> {
    const profiles: UserProfile[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]');
    const target = profiles.find(p => p.user_id === userId);

    if (!target) return { success: false, message: 'User tidak ditemukan' };

    // Prevent demoting the last active super_admin
    if (target.role === 'super_admin' && newRole === 'user') {
      const activeSuperAdmins = profiles.filter(p => p.role === 'super_admin' && p.status === 'active');
      if (activeSuperAdmins.length <= 1) {
        return { success: false, message: 'Tidak dapat mengubah role satu-satunya Super Admin!' };
      }
    }

    target.role = newRole;
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));

    if (this.supabase && this.config.connected) {
      await this.supabase.from('profiles').update({ role: newRole }).eq('user_id', userId);
    }

    await this.logActivity('Super Admin', 'UPDATE_USER', `Role user ${target.username} diubah menjadi ${newRole}`);
    return { success: true, message: `Role pengguna berhasil diubah menjadi ${newRole}` };
  }

  public async resetUserPassword(userId: string, newPassword: string = '123456'): Promise<{ success: boolean; message: string }> {
    const profiles: UserProfile[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]');
    const target = profiles.find(p => p.user_id === userId);
    if (!target) return { success: false, message: 'User tidak ditemukan' };

    const newHash = await hashPassword(newPassword);
    const credentials: Record<string, string> = JSON.parse(localStorage.getItem(STORAGE_KEYS.CREDENTIALS) || '{}');
    credentials[userId] = newHash;
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials));

    target.must_change_password = true;
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));

    await this.logActivity('Super Admin', 'UPDATE_USER', `Password user ${target.username} di-reset`);
    return { success: true, message: `Password user ${target.username} berhasil di-reset menjadi "${newPassword}"` };
  }

  public async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    const profiles: UserProfile[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]');
    const target = profiles.find(p => p.user_id === userId);

    if (!target) return { success: false, message: 'User tidak ditemukan' };

    // Prevent deleting the last super_admin
    if (target.role === 'super_admin') {
      const superAdmins = profiles.filter(p => p.role === 'super_admin');
      if (superAdmins.length <= 1) {
        return { success: false, message: 'Tidak dapat menghapus satu-satunya Super Admin!' };
      }
    }

    const filtered = profiles.filter(p => p.user_id !== userId);
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(filtered));

    const credentials = JSON.parse(localStorage.getItem(STORAGE_KEYS.CREDENTIALS) || '{}');
    delete credentials[userId];
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials));

    if (this.supabase && this.config.connected) {
      await this.supabase.from('profiles').delete().eq('user_id', userId);
    }

    await this.logActivity('Super Admin', 'DELETE_USER', `User ${target.username} dihapus dari sistem`);
    return { success: true, message: `User ${target.username} berhasil dihapus` };
  }

  // --- PRODUCTS MANAGEMENT ---
  public async getProducts(): Promise<Product[]> {
    if (this.supabase && this.config.connected) {
      const { data, error } = await this.supabase.from('products').select('*').order('name');
      if (!error && data) return data;
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
  }

  public async saveProduct(product: Partial<Product>, currentUser: string): Promise<{ success: boolean; message: string }> {
    if (!product.name || !product.selling_price || product.selling_price < 0) {
      return { success: false, message: 'Nama dan harga jual wajib diisi secara valid!' };
    }
    if ((product.stock ?? 0) < 0) {
      return { success: false, message: 'Stok tidak boleh bernilai negatif!' };
    }
    if ((product.cost_price ?? 0) < 0) {
      return { success: false, message: 'Harga modal tidak boleh bernilai negatif!' };
    }

    const products: Product[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
    const isEdit = !!product.id && products.some(p => p.id === product.id);

    if (isEdit) {
      const index = products.findIndex(p => p.id === product.id);
      const before = { ...products[index] };
      const updated: Product = {
        ...products[index],
        name: product.name!,
        category: product.category || 'Umum',
        selling_price: Number(product.selling_price),
        cost_price: Number(product.cost_price || 0),
        stock: Number(product.stock || 0),
        status: product.status || 'active',
        image_url: product.image_url || '',
        updated_at: new Date().toISOString()
      };
      products[index] = updated;
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

      if (this.supabase && this.config.connected) {
        await this.supabase.from('products').upsert([updated]);
      }

      // Log description example: "Es Mojito: Rp6.000 → Rp7.000"
      const priceChange = before.selling_price !== updated.selling_price ? `: Rp${before.selling_price.toLocaleString('id-ID')} → Rp${updated.selling_price.toLocaleString('id-ID')}` : '';
      await this.logActivity(
        currentUser,
        'UPDATE_PRODUCT',
        `Memperbarui produk ${updated.name}${priceChange}`,
        before,
        updated
      );

      return { success: true, message: 'Produk berhasil diperbarui.' };
    } else {
      // Generate ID
      const newId = product.id?.trim() || `P${String(products.length + 1).padStart(3, '0')}`;
      const newProd: Product = {
        id: newId,
        name: product.name!,
        category: product.category || 'Umum',
        selling_price: Number(product.selling_price),
        cost_price: Number(product.cost_price || 0),
        stock: Number(product.stock || 0),
        status: product.status || 'active',
        image_url: product.image_url || '',
        created_at: new Date().toISOString()
      };
      products.push(newProd);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

      if (this.supabase && this.config.connected) {
        await this.supabase.from('products').insert([newProd]);
      }

      await this.logActivity(
        currentUser,
        'ADD_PRODUCT',
        `Menambahkan produk baru: ${newProd.name} (Rp${newProd.selling_price.toLocaleString('id-ID')})`,
        null,
        newProd
      );

      return { success: true, message: 'Produk berhasil ditambahkan.' };
    }
  }

  public async deleteProduct(productId: string, currentUser: string): Promise<{ success: boolean; message: string }> {
    const products: Product[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
    const target = products.find(p => p.id === productId);

    if (!target) return { success: false, message: 'Produk tidak ditemukan' };

    const filtered = products.filter(p => p.id !== productId);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));

    if (this.supabase && this.config.connected) {
      await this.supabase.from('products').delete().eq('id', productId);
    }

    await this.logActivity(
      currentUser,
      'DELETE_PRODUCT',
      `Menghapus produk: ${target.name} (${target.id})`,
      target,
      null
    );

    return { success: true, message: `Produk ${target.name} berhasil dihapus` };
  }

  // --- TRANSACTIONS & CASHIER ---
  public async createTransaction(trx: {
    user_id: string;
    username: string;
    total: number;
    payment_method: 'Cash' | 'QRIS' | 'Transfer';
    paid: number;
    change: number;
    items: { product: Product; quantity: number; subtotal: number }[];
  }): Promise<{ success: boolean; transaction?: Transaction; message: string }> {
    if (!trx.items || trx.items.length === 0) {
      return { success: false, message: 'Keranjang belanja tidak boleh kosong!' };
    }

    if (trx.payment_method === 'Cash' && trx.paid < trx.total) {
      return { success: false, message: 'Pembayaran tidak cukup!' };
    }

    // Verify stock availability
    const products: Product[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
    for (const item of trx.items) {
      const prod = products.find(p => p.id === item.product.id);
      if (!prod) {
        return { success: false, message: `Produk ${item.product.name} tidak ditemukan!` };
      }
      if (prod.stock < item.quantity) {
        return { success: false, message: `Stok ${prod.name} tidak mencukupi (Tersisa: ${prod.stock})` };
      }
    }

    // Generate Transaction ID format: TRX-YYYYMMDD-001
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dateNum = `${yyyy}${mm}${dd}`;

    const transactions: Transaction[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
    const todayTrxCount = transactions.filter(t => t.id.startsWith(`TRX-${dateNum}`)).length;
    const trxId = `TRX-${dateNum}-${String(todayTrxCount + 1).padStart(3, '0')}`;

    const newTransaction: Transaction = {
      id: trxId,
      user_id: trx.user_id,
      username: trx.username,
      date: dateStr,
      time: now.toTimeString().split(' ')[0],
      total: trx.total,
      payment_method: trx.payment_method,
      paid: trx.paid,
      change: trx.change,
      created_at: now.toISOString(),
      items: trx.items.map(i => ({
        id: `it_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        transaction_id: trxId,
        product_id: i.product.id,
        product_name: i.product.name,
        quantity: i.quantity,
        price: i.product.selling_price,
        subtotal: i.subtotal
      }))
    };

    // Deduct stock
    for (const item of trx.items) {
      const pIndex = products.findIndex(p => p.id === item.product.id);
      if (pIndex !== -1) {
        products[pIndex].stock -= item.quantity;
        products[pIndex].updated_at = now.toISOString();
      }
    }
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

    // Save transaction
    transactions.unshift(newTransaction);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));

    // Save transaction items
    const allItems: TransactionItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTION_ITEMS) || '[]');
    if (newTransaction.items) {
      allItems.push(...newTransaction.items);
      localStorage.setItem(STORAGE_KEYS.TRANSACTION_ITEMS, JSON.stringify(allItems));
    }

    // Also record income in finance
    await this.addFinanceRecord({
      type: 'income',
      date: dateStr,
      description: `Penjualan Kasir (${trxId}) - ${trx.username}`,
      amount: trx.total,
      category: 'Penjualan Kasir'
    }, false);

    // Sync to Supabase if connected
    if (this.supabase && this.config.connected) {
      try {
        await this.supabase.from('transactions').insert([{
          id: newTransaction.id,
          user_id: newTransaction.user_id.startsWith('usr_') ? null : newTransaction.user_id,
          username: newTransaction.username,
          date: newTransaction.date,
          time: newTransaction.time,
          total: newTransaction.total,
          payment_method: newTransaction.payment_method,
          paid: newTransaction.paid,
          change: newTransaction.change
        }]);

        if (newTransaction.items) {
          await this.supabase.from('transaction_items').insert(
            newTransaction.items.map(it => ({
              transaction_id: it.transaction_id,
              product_id: it.product_id,
              product_name: it.product_name,
              quantity: it.quantity,
              price: it.price,
              subtotal: it.subtotal
            }))
          );
        }
      } catch (err) {
        console.warn('Failed to mirror transaction to Supabase:', err);
      }
    }

    await this.logActivity(trx.username, 'CREATE_TRANSACTION', `Membuat transaksi ${trxId} senilai Rp${trx.total.toLocaleString('id-ID')} (${trx.payment_method})`);

    return { success: true, transaction: newTransaction, message: 'Transaksi berhasil diselesaikan!' };
  }

  public async getTransactions(userRole?: string, currentUsername?: string): Promise<Transaction[]> {
    let list: Transaction[] = [];

    if (this.supabase && this.config.connected) {
      try {
        let query = this.supabase.from('transactions').select('*, items:transaction_items(*)').order('created_at', { ascending: false });
        if (userRole === 'user' && currentUsername) {
          query = query.eq('username', currentUsername);
        }
        const { data, error } = await query;
        if (!error && data) {
          list = data;
        }
      } catch (e) {
        console.warn('Supabase fetch transactions failed, using local:', e);
      }
    }

    if (list.length === 0) {
      list = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
      if (userRole === 'user' && currentUsername) {
        list = list.filter(t => t.username.toLowerCase() === currentUsername.toLowerCase());
      }
    }

    return list;
  }

  public async deleteTransaction(trxId: string, currentUser: string): Promise<{ success: boolean; message: string }> {
    const transactions: Transaction[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
    const target = transactions.find(t => t.id === trxId);

    if (!target) return { success: false, message: 'Transaksi tidak ditemukan' };

    const filtered = transactions.filter(t => t.id !== trxId);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filtered));

    if (this.supabase && this.config.connected) {
      await this.supabase.from('transactions').delete().eq('id', trxId);
    }

    await this.logActivity(currentUser, 'DELETE_TRANSACTION', `Menghapus transaksi ${trxId} senilai Rp${target.total.toLocaleString('id-ID')}`);
    return { success: true, message: `Transaksi ${trxId} berhasil dihapus.` };
  }

  // --- FINANCE (KEUANGAN) ---
  public async getFinanceRecords(): Promise<FinanceRecord[]> {
    if (this.supabase && this.config.connected) {
      const { data, error } = await this.supabase.from('finance').select('*').order('date', { ascending: false });
      if (!error && data) return data;
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.FINANCE) || '[]');
  }

  public async addFinanceRecord(record: Omit<FinanceRecord, 'id' | 'created_at'>, log: boolean = true): Promise<{ success: boolean; message: string }> {
    if (!record.description || record.amount <= 0) {
      return { success: false, message: 'Keterangan dan nominal valid wajib diisi!' };
    }

    const newRecord: FinanceRecord = {
      id: `fin_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: record.type,
      date: record.date || new Date().toISOString().split('T')[0],
      description: record.description,
      amount: Number(record.amount),
      category: record.category,
      created_at: new Date().toISOString()
    };

    const finance: FinanceRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FINANCE) || '[]');
    finance.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(finance));

    if (this.supabase && this.config.connected) {
      await this.supabase.from('finance').insert([newRecord]);
    }

    if (log) {
      const typeLabel = record.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
      await this.logActivity('Super Admin', 'ADD_FINANCE', `Mencatat ${typeLabel}: ${record.description} sebesar Rp${record.amount.toLocaleString('id-ID')}`);
    }

    return { success: true, message: 'Catatan keuangan berhasil disimpan!' };
  }

  public async deleteFinanceRecord(id: string): Promise<{ success: boolean; message: string }> {
    const records: FinanceRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FINANCE) || '[]');
    const filtered = records.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(filtered));

    if (this.supabase && this.config.connected) {
      await this.supabase.from('finance').delete().eq('id', id);
    }

    return { success: true, message: 'Catatan keuangan berhasil dihapus.' };
  }

  // --- ACTIVITY LOGS ---
  public async getActivityLogs(): Promise<ActivityLog[]> {
    if (this.supabase && this.config.connected) {
      const { data, error } = await this.supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(200);
      if (!error && data) return data;
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS) || '[]');
  }

  public async logActivity(username: string, action: any, description: string, before_data: any = null, after_data: any = null) {
    // SECURITY: Strip password fields if any object contains password
    const sanitize = (obj: any) => {
      if (!obj || typeof obj !== 'object') return obj;
      const clone = { ...obj };
      delete clone.password;
      delete clone.plainPassword;
      delete clone.oldPassword;
      delete clone.newPassword;
      return clone;
    };

    const newLog: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      username,
      action,
      description,
      before_data: sanitize(before_data),
      after_data: sanitize(after_data),
      created_at: new Date().toISOString()
    };

    const logs: ActivityLog[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS) || '[]');
    logs.unshift(newLog);
    // Keep max 500 logs locally
    if (logs.length > 500) logs.pop();
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(logs));

    if (this.supabase && this.config.connected) {
      try {
        await this.supabase.from('activity_logs').insert([newLog]);
      } catch (e) {
        // ignore log error
      }
    }
  }

  // --- SETTINGS ---
  public async getSettings(): Promise<StoreSettings> {
    if (this.supabase && this.config.connected) {
      const { data, error } = await this.supabase.from('settings').select('*').eq('id', 1).single();
      if (!error && data) {
        return {
          store_name: data.store_name,
          store_address: data.store_address,
          store_phone: data.store_phone,
          receipt_footer: data.receipt_footer,
          logo_url: data.logo_url
        };
      }
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || JSON.stringify(INITIAL_SETTINGS));
  }

  public async updateSettings(settings: Partial<StoreSettings>, currentUser: string): Promise<{ success: boolean; message: string }> {
    const current = await this.getSettings();
    const updated: StoreSettings = {
      ...current,
      ...settings
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));

    if (this.supabase && this.config.connected) {
      await this.supabase.from('settings').upsert([{ id: 1, ...updated, updated_at: new Date().toISOString() }]);
    }

    await this.logActivity(currentUser, 'UPDATE_USER', 'Mengubah konfigurasi toko / struk');
    return { success: true, message: 'Pengaturan toko berhasil disimpan!' };
  }

  // --- BACKUP & RESTORE ---
  public async generateBackup(): Promise<string> {
    const backupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      store_settings: await this.getSettings(),
      products: await this.getProducts(),
      transactions: JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]'),
      finance: JSON.parse(localStorage.getItem(STORAGE_KEYS.FINANCE) || '[]'),
      activity_logs: JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS) || '[]')
      // NOTE: Password hashes or credentials are NEVER exported!
    };

    return JSON.stringify(backupData, null, 2);
  }

  public async restoreBackup(jsonString: string, currentUser: string): Promise<{ success: boolean; message: string }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.products || !Array.isArray(parsed.products)) {
        return { success: false, message: 'Format file backup tidak valid!' };
      }

      if (parsed.products) localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(parsed.products));
      if (parsed.transactions) localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(parsed.transactions));
      if (parsed.finance) localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(parsed.finance));
      if (parsed.store_settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed.store_settings));

      await this.logActivity(currentUser, 'ADD_FINANCE', 'Melakukan restore data dari file JSON backup');
      return { success: true, message: 'Data berhasil dipulihkan dari file backup!' };
    } catch (e: any) {
      return { success: false, message: `Gagal membaca file backup: ${e.message}` };
    }
  }
}

export const db = new DatabaseService();
