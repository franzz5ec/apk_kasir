import React, { useState } from 'react';
import { UserProfile } from '../types';
import { db } from '../services/db';

interface Props {
  currentUser: UserProfile;
  onRefreshAll: () => void;
}

export const BackupView: React.FC<Props> = ({ currentUser, onRefreshAll }) => {
  const isSuperAdmin = currentUser.role === 'super_admin';

  const [loading, setLoading] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleExportBackup = async () => {
    setLoading(true);
    try {
      const json = await db.generateBackup();
      const todayStr = new Date().toISOString().split('T')[0];
      const filename = `KASIRKU_BACKUP_${todayStr}.json`;

      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('Gagal mengekspor file backup: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(`PERINGATAN: Memulihkan backup akan memperbarui data produk, transaksi, dan keuangan saat ini. Lanjutkan restore dari file "${file.name}"?`)) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const content = ev.target?.result as string;
        const res = await db.restoreBackup(content, currentUser.username);
        if (res.success) {
          setImportStatus({ type: 'success', message: res.message });
          onRefreshAll();
        } else {
          setImportStatus({ type: 'error', message: res.message });
        }
      } catch (err: any) {
        setImportStatus({ type: 'error', message: 'File JSON tidak valid atau rusak.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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
            <span>BACKUP & RESTORE DATABASE</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              Format JSON Aman
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Unduh salinan data produk, riwayat transaksi, dan catatan keuangan secara berkala untuk proteksi data.
          </p>
        </div>
      </div>

      {importStatus && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
          importStatus.type === 'success'
            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
            : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
        }`}>
          <i className={`fa-solid ${importStatus.type === 'success' ? 'fa-circle-check text-emerald-400' : 'fa-circle-exclamation text-rose-400'}`}></i>
          <span>{importStatus.message}</span>
        </div>
      )}

      {/* 2 Action Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 flex flex-col justify-between space-y-4">
          <div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-xl mb-3 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <i className="fa-solid fa-cloud-arrow-down"></i>
            </div>
            <h3 className="text-base font-bold text-white">Export Backup (JSON)</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Mengekspor seluruh tabel: Produk, Transaksi Kasir, Detail Item, Keuangan, Pengaturan, dan Activity Log ke dalam satu berkas format JSON terenkripsi.
            </p>
            <div className="mt-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 font-mono">
              Nama file: <span className="text-cyan-300">KASIRKU_BACKUP_YYYY-MM-DD.json</span>
            </div>
          </div>

          <button
            onClick={handleExportBackup}
            disabled={loading}
            className="w-full py-3 rounded-xl neon-btn-primary text-xs font-black flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-download"></i>
            <span>{loading ? 'Menyiapkan Data...' : 'UNDUH BACKUP SEKARANG'}</span>
          </button>
        </div>

        {/* Import Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-blue-500/30 flex flex-col justify-between space-y-4">
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 text-xl mb-3">
              <i className="fa-solid fa-cloud-arrow-up"></i>
            </div>
            <h3 className="text-base font-bold text-white">Restore Data (JSON)</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Pulihkan data sistem dari file cadangan JSON yang pernah Anda unduh sebelumnya.
            </p>
            <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-[11px] text-rose-300">
              <i className="fa-solid fa-triangle-exclamation mr-1"></i>
              Harap berhati-hati: Data saat ini akan digabungkan atau ditimpa dengan data backup.
            </div>
          </div>

          <label className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer border border-slate-700 transition">
            <i className="fa-solid fa-file-import text-cyan-400"></i>
            <span>PILIH FILE JSON BACKUP</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
