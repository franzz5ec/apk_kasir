# KASIRKU - SISTEM KASIR & PENCATATAN KEUANGAN

Aplikasi kasir online & pencatatan keuangan gratis tanpa kartu kredit berbasis **PostgreSQL Supabase** dan siap hosting gratis selamanya di **GitHub Pages**.

## Fitur Utama
1. **Kasir (POS)**: Katalog produk interaktif, filter kategori, indikator stok otomatis (AMAN >5, MENIPIS 1-5, HABIS 0), hitung kembalian, dan cetak struk/PDF.
2. **Manajemen Barang (Super Admin)**: Tambah, edit harga jual & modal, update stok, dan hapus barang dengan audit trail.
3. **Pencatatan Keuangan**: Arus kas pemasukan dan pengeluaran dengan kategori dan kalkulasi saldo otomatis.
4. **Laporan & Ekspor**: Filter rentang tanggal fleksibel, ekspor PDF (jsPDF + AutoTable), Word (.docx), dan cetak printer kasir (@media print).
5. **Keamanan & Role**:
   - Super Admin: Fransisko (akses penuh).
   - User / Kasir: Akses POS & transaksi pribadi.
   - Row Level Security (RLS) pada seluruh tabel PostgreSQL Supabase.
   - Sandi terenkripsi penuh via Supabase Auth (tidak ada plaintext).
6. **Tema Visual**: Black + Neon Blue Glassmorphism modern & responsif di HP, Tablet, Laptop, dan PC.

---

## Panduan Hosting GitHub Pages (Gratis)
1. Buat repository baru di [GitHub](https://github.com/new).
2. Beri nama repository, misalnya `kasirku`.
3. Unggah seluruh isi folder ini ke repository Anda. Pastikan file `index.html` berada di root direktori.
4. Buka **Settings** repository > **Pages**.
5. Di bagian *Branch*, pilih **main** dan folder **/ (root)**.
6. Klik **Save**.
7. Dalam 1-2 menit, aplikasi kasir Anda akan aktif di:
   `https://[username_github].github.io/kasirku/`

---

## Panduan Database Supabase (Gratis)
1. Daftar akun di [supabase.com](https://supabase.com).
2. Buat project baru (contoh nama: `kasirku-db`).
3. Buka menu **SQL Editor**, buat **New Query**, tempelkan seluruh isi file `src/sql/supabase_setup.sql`.
4. Klik **Run** untuk membuat tabel, fungsi RLS, dan seed awal.
5. Buka **Project Settings > API**, salin:
   - Project URL
   - Project Anon Public Key
6. Masukkan kedua nilai tersebut ke file `js/config.js` atau menu **Pengaturan Toko** di dalam aplikasi.

---

## Kredensial Super Admin Awal
- **Username**: `Fransisko`
- **Password Awal**: `09042005`
*(Sistem akan meminta perubahan kata sandi untuk memenuhi protokol keamanan saat pertama kali login).*
