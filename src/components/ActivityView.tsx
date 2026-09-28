import React, { useState, useEffect } from 'react';
import { ActivityLog, UserProfile } from '../types';
import { db } from '../services/db';

interface Props {
  currentUser: UserProfile;
}

export const ActivityView: React.FC<Props> = ({ currentUser }) => {
  const isSuperAdmin = currentUser.role === 'super_admin';

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filterAction, setFilterAction] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const loadLogs = async () => {
    const data = await db.getActivityLogs();
    setLogs(data);
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadLogs();
    }
  }, [isSuperAdmin]);

  const filteredLogs = logs.filter(log => {
    if (filterAction === 'ALL') return true;
    return log.action === filterAction;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'LOGIN':
      case 'REGISTER':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'CREATE_TRANSACTION':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'ADD_PRODUCT':
      case 'UPDATE_PRODUCT':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'DELETE_PRODUCT':
      case 'DELETE_TRANSACTION':
      case 'DELETE_USER':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'ADD_FINANCE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600';
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
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-cyan-500/20">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>RIWAYAT AKTIVITAS SISTEM (AUDIT LOG)</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              Audit Trail
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Rekam jejak setiap perubahan produk, transaksi kasir, keuangan, dan login pengguna. Password tidak pernah dicatat.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold border border-slate-700 transition flex items-center gap-2"
        >
          <i className="fa-solid fa-arrows-rotate"></i>
          <span>Segarkan Log</span>
        </button>
      </div>

      {/* Filter Action Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        {[
          { id: 'ALL', label: 'Semua Aktivitas' },
          { id: 'CREATE_TRANSACTION', label: 'Transaksi' },
          { id: 'UPDATE_PRODUCT', label: 'Update Produk' },
          { id: 'ADD_PRODUCT', label: 'Tambah Produk' },
          { id: 'DELETE_PRODUCT', label: 'Hapus Produk' },
          { id: 'LOGIN', label: 'Login' },
          { id: 'ADD_FINANCE', label: 'Keuangan' },
          { id: 'UPDATE_USER', label: 'Manajemen User' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setFilterAction(item.id)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              filterAction === item.id
                ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Logs List Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-cyan-400 uppercase font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Aksi</th>
                <th className="py-3 px-4">Deskripsi Aktivitas</th>
                <th className="py-3 px-4 text-center">Detail Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Belum ada catatan aktivitas pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-white">{log.username}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      {log.description}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {(log.before_data || log.after_data) ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[10px] font-mono transition"
                        >
                          Lihat Perubahan
                        </button>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL INSPECT DIFF --- */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg glass-panel rounded-2xl p-6 border border-cyan-500/40 shadow-2xl relative">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>

            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <i className="fa-solid fa-code-compare text-cyan-400"></i>
              <span>Detail Riwayat Perubahan</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">{selectedLog.description}</p>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] font-bold text-rose-400 block mb-1">Data Sebelum:</span>
                <pre className="text-[10px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                  {selectedLog.before_data ? JSON.stringify(selectedLog.before_data, null, 2) : '(Kosong)'}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] font-bold text-emerald-400 block mb-1">Data Sesudah:</span>
                <pre className="text-[10px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                  {selectedLog.after_data ? JSON.stringify(selectedLog.after_data, null, 2) : '(Kosong)'}
                </pre>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
