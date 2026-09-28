import React, { useState } from 'react';
import { StoreSettings, UserProfile, SupabaseConfig } from '../types';
import { db } from '../services/db';

interface Props {
  settings: StoreSettings;
  currentUser: UserProfile;
  onRefreshSettings: () => void;
  onSupabaseConfigChanged: () => void;
}

export const SettingsView: React.FC<Props> = ({
  settings,
  currentUser,
  onRefreshSettings,
  onSupabaseConfigChanged
}) => {
  const isSuperAdmin = currentUser.role === 'super_admin';

  // Store form
  const [storeName, setStoreName] = useState(settings.store_name);
  const [storeAddress, setStoreAddress] = useState(settings.store_address);
  const [storePhone, setStorePhone] = useState(settings.store_phone);
  const [receiptFooter, setReceiptFooter] = useState(settings.receipt_footer);
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeSuccess, setStoreSuccess] = useState('');

  // Supabase form
  const currentSupa = db.getSupabaseConfig();
  const [supaUrl, setSupaUrl] = useState(currentSupa.url);
  const [supaKey, setSupaKey] = useState(currentSupa.anonKey);
  const [supaLoading, setSupaLoading] = useState(false);
  const [supaStatus, setSupaStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleSaveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setStoreLoading(true);
    try {
      const res = await db.updateSettings({
        store_name: storeName.trim() || 'KASIRKU',
        store_address: storeAddress.trim(),
        store_phone: storePhone.trim(),
        receipt_footer: receiptFooter.trim() || 'Terima kasih telah berbelanja!'
      }, currentUser.username);

      if (res.success) {
        setStoreSuccess(res.message);
        onRefreshSettings();
        setTimeout(() => setStoreSuccess(''), 3000);
      }
    } catch (e: any) {
      alert('Gagal menyimpan pengaturan toko: ' + e.message);
    } finally {
      setStoreLoading(false);
    }
  };

  const handleSaveSupabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupaLoading(true);
    setSupaStatus(null);
    try {
      const res = await db.setSupabaseConfig(supaUrl.trim(), supaKey.trim());
      setSupaStatus(res);
      onSupabaseConfigChanged();
    } catch (e: any) {
      setSupaStatus({ success: false, message: e.message || 'Gagal menyimpan konfigurasi Supabase' });
    } finally {
      setSupaLoading(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="glass-panel p-12 text-center rounded-2xl border border-rose-500/30">
        <i className="fa-solid fa-ban text-4xl text-rose-500 mb-3"></i>
        <h2 className="text-xl font-bold text-white">AKSES DITOLAK</h2>
        <p className="text-xs text-slate-400 mt-1">Fitur ini hanya dapat digunakan oleh Super Admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-cyan-500/20">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>PENGATURAN SISTEM & TOKO</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              Konfigurasi Utama
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ubah identitas toko untuk cetak struk kasir dan sambungkan ke database online Supabase Free.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Settings Form */}
        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <i className="fa-solid fa-store"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Identitas Toko & Struk</h3>
              <p className="text-[11px] text-slate-400">Kustomisasi nama dan header/footer struk belanja</p>
            </div>
          </div>

          {storeSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <i className="fa-solid fa-circle-check"></i>
              <span>{storeSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveStoreSettings} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Nama Toko
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                placeholder="KASIRKU"
                className="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-bold text-cyan-300"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Alamat Toko
              </label>
              <textarea
                rows={2}
                value={storeAddress}
                onChange={e => setStoreAddress(e.target.value)}
                placeholder="Jl. Raya Bisnis No. 88, Jakarta"
                className="w-full glass-input px-3.5 py-2 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={storePhone}
                onChange={e => setStorePhone(e.target.value)}
                placeholder="0812-3456-7890"
                className="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Footer Catatan Struk
              </label>
              <input
                type="text"
                value={receiptFooter}
                onChange={e => setReceiptFooter(e.target.value)}
                placeholder="Terima kasih telah berbelanja!"
                className="w-full glass-input px-3.5 py-2 rounded-xl text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={storeLoading}
              className="w-full py-2.5 rounded-xl neon-btn-primary text-xs font-bold flex items-center justify-center gap-2 mt-4"
            >
              <i className="fa-solid fa-floppy-disk"></i>
              <span>{storeLoading ? 'Menyimpan...' : 'SIMPAN PENGATURAN TOKO'}</span>
            </button>
          </form>
        </div>

        {/* Supabase Connection Form */}
        <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <i className="fa-solid fa-database"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Koneksi Supabase Free</h3>
              <p className="text-[11px] text-slate-400">Hubungkan database PostgreSQL online Supabase Anda</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <p className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <i className="fa-solid fa-shield-halved"></i>
              <span>Panduan Keamanan (PENTING):</span>
            </p>
            <p className="text-slate-400">
              Gunakan hanya <strong>Supabase URL</strong> dan <strong>Anon / Publishable Key</strong>.
              JANGAN PERNAH memasukkan <code>service_role secret key</code> ke dalam formulir ini atau kode frontend!
            </p>
          </div>

          {supaStatus && (
            <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              supaStatus.success
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
            }`}>
              <i className={`fa-solid ${supaStatus.success ? 'fa-circle-check text-emerald-400' : 'fa-circle-exclamation text-rose-400'}`}></i>
              <span>{supaStatus.message}</span>
            </div>
          )}

          <form onSubmit={handleSaveSupabaseConfig} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Project URL Supabase
              </label>
              <input
                type="url"
                value={supaUrl}
                onChange={e => setSupaUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Project Anon / Publishable Key
              </label>
              <textarea
                rows={3}
                value={supaKey}
                onChange={e => setSupaKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full glass-input px-3.5 py-2 rounded-xl text-xs font-mono break-all"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSupaUrl('');
                  setSupaKey('');
                  db.setSupabaseConfig('', '');
                  onSupabaseConfigChanged();
                }}
                className="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Reset Lokal
              </button>
              <button
                type="submit"
                disabled={supaLoading}
                className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-black flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
              >
                <i className="fa-solid fa-link"></i>
                <span>{supaLoading ? 'Memeriksa...' : 'UJI & SIMPAN KONEKSI'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
