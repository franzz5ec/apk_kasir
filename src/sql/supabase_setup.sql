-- ==============================================================================
-- KASIRKU - SISTEM KASIR & PENCATATAN KEUANGAN
-- PostgreSQL & Supabase Database Setup Script dengan Row Level Security (RLS)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL PROFILES (Terhubung dengan Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    phone VARCHAR(25) NOT NULL UNIQUE,
    full_name VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'user')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    must_change_password BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index untuk performa pencarian username & phone saat login
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 3. TABEL PRODUCTS (Manajemen Barang)
CREATE TABLE IF NOT EXISTS public.products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    selling_price NUMERIC(12, 2) NOT NULL CHECK (selling_price >= 0),
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- 4. TABEL TRANSACTIONS (Pencatatan Transaksi Kasir)
CREATE TABLE IF NOT EXISTS public.transactions (
    id VARCHAR(50) PRIMARY KEY, -- Contoh: TRX-20260928-001
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    username VARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time TIME NOT NULL DEFAULT CURRENT_TIME,
    total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('Cash', 'QRIS', 'Transfer')),
    paid NUMERIC(12, 2) NOT NULL CHECK (paid >= 0),
    change NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (change >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);

-- 5. TABEL TRANSACTION ITEMS (Detail Item Penjualan)
CREATE TABLE IF NOT EXISTS public.transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(50) NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_transaction_items_trx ON public.transaction_items(transaction_id);

-- 6. TABEL FINANCE (Pemasukan & Pengeluaran)
CREATE TABLE IF NOT EXISTS public.finance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    category VARCHAR(50) NOT NULL CHECK (category IN ('Operasional', 'Pembelian barang', 'Transportasi', 'Peralatan', 'Lainnya', 'Penjualan Kasir')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_finance_date ON public.finance(date);
CREATE INDEX IF NOT EXISTS idx_finance_type ON public.finance(type);

-- 7. TABEL ACTIVITY LOGS (Riwayat Aktivitas & Audit Trail)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    username VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    before_data JSONB,
    after_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- 8. TABEL SETTINGS (Pengaturan Toko)
CREATE TABLE IF NOT EXISTS public.settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    store_name VARCHAR(100) NOT NULL DEFAULT 'KASIRKU',
    store_address TEXT DEFAULT 'Jl. Raya Bisnis No. 88',
    store_phone VARCHAR(30) DEFAULT '0812-3456-7890',
    receipt_footer TEXT DEFAULT 'Terima kasih telah berbelanja!',
    logo_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Inisialisasi Settings default jika belum ada
INSERT INTO public.settings (id, store_name, receipt_footer)
VALUES (1, 'KASIRKU', 'Terima kasih telah berbelanja!')
ON CONFLICT (id) DO NOTHING;

-- 9. SEED DATA PRODUK AWAL
INSERT INTO public.products (id, name, category, selling_price, cost_price, stock, status)
VALUES 
    ('P001', 'Pop Mie', 'Makanan', 8000, 6000, 25, 'active'),
    ('P002', 'Es Mojito', 'Minuman', 6000, 3500, 30, 'active'),
    ('P003', 'Keripik Gulmer', 'Makanan', 10000, 7500, 15, 'active'),
    ('P004', 'Teh Pucuk', 'Minuman', 5000, 3500, 40, 'active'),
    ('P005', 'Boneva', 'Minuman', 5000, 3000, 20, 'active')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    selling_price = EXCLUDED.selling_price;

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Aktifkan RLS di semua tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Helper Function: Cek apakah user saat ini adalah super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND role = 'super_admin' AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- POLICIES FOR PROFILES ---
-- User dapat melihat profil aktif (untuk nama kasir di struk)
CREATE POLICY "Public profiles can be viewed by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- User dapat mengupdate profil miliknya sendiri
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Super Admin memiliki kontrol penuh atas semua profil
CREATE POLICY "Super admins can manage all profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_super_admin());

-- --- POLICIES FOR PRODUCTS ---
-- Semua user terautentikasi dapat melihat produk aktif
CREATE POLICY "Anyone authenticated can view active products"
ON public.products FOR SELECT
TO authenticated
USING (status = 'active' OR public.is_super_admin());

-- Hanya Super Admin yang dapat menambah, mengubah harga/stok, atau menghapus produk
CREATE POLICY "Super admins can insert products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can update products"
ON public.products FOR UPDATE
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can delete products"
ON public.products FOR DELETE
TO authenticated
USING (public.is_super_admin());

-- --- POLICIES FOR TRANSACTIONS & ITEMS ---
-- Kasir dapat membuat transaksi
CREATE POLICY "Users can insert transactions"
ON public.transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR public.is_super_admin());

CREATE POLICY "Users can insert transaction items"
ON public.transaction_items FOR INSERT
TO authenticated
WITH CHECK (true);

-- User biasa hanya bisa melihat transaksi miliknya; Super Admin bisa melihat semua
CREATE POLICY "Users view own transactions or super_admin views all"
ON public.transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_super_admin());

CREATE POLICY "Users view transaction items for their transactions"
ON public.transaction_items FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.transactions t 
        WHERE t.id = transaction_items.transaction_id 
        AND (t.user_id = auth.uid() OR public.is_super_admin())
    )
);

-- Hanya Super Admin yang boleh menghapus transaksi
CREATE POLICY "Only super admins can delete transactions"
ON public.transactions FOR DELETE
TO authenticated
USING (public.is_super_admin());

-- --- POLICIES FOR FINANCE ---
-- Hanya Super Admin yang dapat mengakses keuangan
CREATE POLICY "Only super admins can access finance"
ON public.finance FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- --- POLICIES FOR ACTIVITY LOGS ---
-- Semua user dapat menambah log saat transaksi atau aktivitas
CREATE POLICY "Authenticated users can insert activity logs"
ON public.activity_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Hanya Super Admin yang dapat melihat riwayat aktivitas
CREATE POLICY "Super admins can view activity logs"
ON public.activity_logs FOR SELECT
TO authenticated
USING (public.is_super_admin());

-- --- POLICIES FOR SETTINGS ---
-- Semua user dapat membaca nama toko & footer struk
CREATE POLICY "Authenticated users can view settings"
ON public.settings FOR SELECT
TO authenticated
USING (true);

-- Hanya Super Admin yang dapat mengubah pengaturan
CREATE POLICY "Only super admins can update settings"
ON public.settings FOR UPDATE
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- ==============================================================================
-- 11. TRIGGER PENGURANGAN STOK OTOMATIS SAAT TRANSAKSI DILAKUKAN
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.decrease_stock_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products
    SET stock = stock - NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_decrease_stock ON public.transaction_items;
CREATE TRIGGER trigger_decrease_stock
AFTER INSERT ON public.transaction_items
FOR EACH ROW
EXECUTE FUNCTION public.decrease_stock_on_transaction();

-- ==============================================================================
-- 12. PANDUAN PEMBUATAN AKUN SUPER ADMIN AWAL (FRANSISKO)
-- ==============================================================================
/*
LANGKAH MEMBUAT AKUN SUPER ADMIN:
1. Buka Supabase Dashboard > Authentication > Users > Add User
2. Masukkan Email: fransisko@kasirku.local (atau email resmi Fransisko)
3. Masukkan Password: [Password Rahasia Fransisko, cth: 09042005]
4. Setelah user terbuat di Supabase Auth, salin User UID-nya.
5. Jalankan query berikut di Supabase SQL Editor (Ganti USER_UID_DARI_AUTH):

INSERT INTO public.profiles (user_id, username, phone, full_name, role, status, must_change_password)
VALUES (
    'USER_UID_DARI_AUTH',
    'Fransisko',
    '081234567890',
    'Fransisko Super Admin',
    'super_admin',
    'active',
    true
) ON CONFLICT (username) DO UPDATE SET role = 'super_admin', status = 'active';

Atau gunakan tombol 'Inisialisasi Super Admin' otomatis pada aplikasi KASIRKU!
*/
