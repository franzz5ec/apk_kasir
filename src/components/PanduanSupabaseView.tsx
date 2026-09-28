import React, { useState } from 'react';

const SQL_SETUP_SCRIPT = `-- ==============================================================================
-- KASIRKU - SISTEM KASIR & PENCATATAN KEUANGAN
-- PostgreSQL & Supabase Database Setup Script dengan Row Level Security (RLS)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABEL PROFILES (Terhubung dengan Supabase Auth)
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

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- 2. TABEL PRODUCTS
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

-- 3. TABEL TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
    id VARCHAR(50) PRIMARY KEY,
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

-- 4. TABEL TRANSACTION ITEMS
CREATE TABLE IF NOT EXISTS public.transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(50) NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0)
);

-- 5. TABEL FINANCE
CREATE TABLE IF NOT EXISTS public.finance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. TABEL ACTIVITY LOGS
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

-- 7. TABEL SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    store_name VARCHAR(100) NOT NULL DEFAULT 'KASIRKU',
    store_address TEXT DEFAULT 'Jl. Raya Bisnis No. 88',
    store_phone VARCHAR(30) DEFAULT '0812-3456-7890',
    receipt_footer TEXT DEFAULT 'Terima kasih telah berbelanja!',
    logo_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

INSERT INTO public.settings (id, store_name, receipt_footer)
VALUES (1, 'KASIRKU', 'Terima kasih telah berbelanja!')
ON CONFLICT (id) DO NOTHING;

-- 8. SEED PRODUK AWAL
INSERT INTO public.products (id, name, category, selling_price, cost_price, stock, status)
VALUES 
    ('P001', 'Pop Mie', 'Makanan', 8000, 6000, 25, 'active'),
    ('P002', 'Es Mojito', 'Minuman', 6000, 3500, 30, 'active'),
    ('P003', 'Keripik Gulmer', 'Makanan', 10000, 7500, 15, 'active'),
    ('P004', 'Teh Pucuk', 'Minuman', 5000, 3500, 40, 'active'),
    ('P005', 'Boneva', 'Minuman', 5000, 3000, 20, 'active')
ON CONFLICT (id) DO NOTHING;

-- 9. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND role = 'super_admin' AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLICIES
CREATE POLICY "Public profiles can be viewed by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage all profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_super_admin());

CREATE POLICY "Anyone authenticated can view active products" ON public.products FOR SELECT TO authenticated USING (status = 'active' OR public.is_super_admin());
CREATE POLICY "Super admins can manage products" ON public.products FOR ALL TO authenticated USING (public.is_super_admin());

CREATE POLICY "Users can insert transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_super_admin());
CREATE POLICY "Users view own transactions or super admin views all" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_super_admin());
CREATE POLICY "Super admins can delete transactions" ON public.transactions FOR DELETE TO authenticated USING (public.is_super_admin());

CREATE POLICY "Users can insert transaction items" ON public.transaction_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users view items" ON public.transaction_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins manage finance" ON public.finance FOR ALL TO authenticated USING (public.is_super_admin());

CREATE POLICY "Anyone authenticated can insert activity logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Super admins view activity logs" ON public.activity_logs FOR SELECT TO authenticated USING (public.is_super_admin());

CREATE POLICY "Anyone authenticated can view settings" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can update settings" ON public.settings FOR UPDATE TO authenticated USING (public.is_super_admin());
`;

export const PanduanSupabaseView: React.FC = () => {
  const [copiedSQL, setCopiedSQL] = useState(false);

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SQL_SETUP_SCRIPT);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <i className="fa-solid fa-book-bookmark text-cyan-400"></i>
          <span>PANDUAN SETUP SUPABASE FREE & GITHUB PAGES</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Langkah lengkap 100% gratis tanpa kartu kredit untuk membuat database online Supabase dan hosting di GitHub Pages.
        </p>
      </div>

      {/* Accordion / Step Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: Supabase Setup */}
        <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm border border-emerald-500/40">
              1
            </span>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Setup Supabase Free (PostgreSQL & RLS)
              </h3>
              <p className="text-[11px] text-slate-400">Database online gratis untuk HP & Laptop</p>
            </div>
          </div>

          <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
            <li>
              Buka website resmi <strong>supabase.com</strong> dan buat akun gratis (Sign Up).
            </li>
            <li>
              Klik tombol <strong>"New Project"</strong>. Beri nama project misalnya <code>kasirku-app</code>.
            </li>
            <li>
              Tentukan Database Password dan pilih region terdekat (misal: <code>Singapore</code>).
            </li>
            <li>
              Setelah project siap, klik menu <strong>SQL Editor</strong> di bilah navigasi kiri Supabase.
            </li>
            <li>
              Klik <strong>"New Query"</strong>, tempel (paste) seluruh script SQL di bawah ini, lalu klik <strong>"Run"</strong>.
            </li>
            <li>
              Buka menu <strong>Project Settings &gt; API</strong> untuk menyalin:
              <ul className="list-disc list-inside pl-4 text-cyan-300 mt-1 space-y-0.5 font-mono text-[11px]">
                <li>Project URL</li>
                <li>Project API Anon / Publishable Key</li>
              </ul>
            </li>
            <li>
              Buka menu <strong>Pengaturan Toko</strong> di aplikasi KASIRKU dan tempelkan kedua kunci tersebut!
            </li>
          </ol>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300">Script SQL Lengkap Supabase:</span>
              <button
                onClick={handleCopySQL}
                className="px-3 py-1.5 rounded-lg neon-btn-primary text-xs font-bold flex items-center gap-1.5"
              >
                <i className={`fa-solid ${copiedSQL ? 'fa-check' : 'fa-copy'}`}></i>
                <span>{copiedSQL ? 'Tersalin!' : 'Salin Seluruh SQL'}</span>
              </button>
            </div>

            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-cyan-400 font-mono h-48 overflow-y-auto">
              {SQL_SETUP_SCRIPT}
            </pre>
          </div>
        </div>

        {/* Step 2: GitHub Pages Deployment */}
        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-sm border border-cyan-500/40">
              2
            </span>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Panduan Hosting GitHub Pages (Gratis)
              </h3>
              <p className="text-[11px] text-slate-400">Hosting statis selamanya tanpa biaya server</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
            <p className="font-bold text-cyan-300">9 Langkah Mudah Publish ke GitHub Pages:</p>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px]">
              <li>Buka <strong>github.com</strong> dan login ke akun GitHub Anda.</li>
              <li>Klik <strong>New Repository</strong>, beri nama repository (misalnya <code>kasirku</code>).</li>
              <li>Pilih opsi repository <strong>Public</strong>, lalu klik <strong>Create repository</strong>.</li>
              <li>Upload atau Push seluruh berkas aplikasi kasir (folder <code>kasirku/</code> atau file root).</li>
              <li>Pastikan file <strong>index.html</strong> berada di root (folder utama repository).</li>
              <li>Klik tab <strong>Settings</strong> di menu atas repository Anda.</li>
              <li>Pilih menu <strong>Pages</strong> di sidebar kiri.</li>
              <li>Pada opsi <em>Build and deployment</em> &gt; <em>Branch</em>, pilih:
                <div className="mt-1 font-mono text-cyan-400 pl-4">
                  Branch: main &bull; Folder: / (root) &bull; Klik Save
                </div>
              </li>
              <li>Tunggu 1-2 menit hingga GitHub memberikan URL live Anda:
                <div className="mt-1 font-mono text-emerald-400 pl-4">
                  https://[username].github.io/kasirku/
                </div>
              </li>
            </ol>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <i className="fa-solid fa-user-shield text-cyan-400"></i>
              <span>Kredensial Super Admin Awal Fransisko</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Username:</span>
                <span className="text-cyan-300 font-bold">Fransisko</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Password Awal:</span>
                <span className="text-amber-300 font-bold">09042005</span>
              </div>
            </div>
            <p className="text-[10px] text-amber-300/90 italic">
              *Setelah login pertama kali, sistem akan meminta perubahan kata sandi untuk memenuhi protokol keamanan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
