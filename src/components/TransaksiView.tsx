import React, { useState, useMemo } from 'react';
import { Transaction, UserProfile, StoreSettings } from '../types';
import { db } from '../services/db';
import { formatRupiah, exportReceiptToPDF } from '../services/exportService';

interface Props {
  transactions: Transaction[];
  currentUser: UserProfile;
  settings: StoreSettings;
  onRefreshTransactions: () => void;
  onAccessDenied: (featureName: string) => void;
}

export const TransaksiView: React.FC<Props> = ({
  transactions,
  currentUser,
  settings,
  onRefreshTransactions,
  onAccessDenied
}) => {
  const isSuperAdmin = currentUser.role === 'super_admin';

  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterCashier, setFilterCashier] = useState('Semua');
  const [filterMethod, setFilterMethod] = useState('Semua');
  const [selectedTrx, setSelectedTrx] = useState<Transaction | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Cashiers list for filter
  const cashiers = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => set.add(t.username));
    return ['Semua', ...Array.from(set)];
  }, [transactions]);

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactions.filter(t => {
      // Kasir only sees own
      if (!isSuperAdmin && t.username.toLowerCase() !== currentUser.username.toLowerCase()) {
        return false;
      }

      const matchSearch = t.id.toLowerCase().includes(search.toLowerCase()) || t.username.toLowerCase().includes(search.toLowerCase());
      const matchDate = !filterDate || t.date === filterDate;
      const matchCashier = filterCashier === 'Semua' || t.username === filterCashier;
      const matchMethod = filterMethod === 'Semua' || t.payment_method === filterMethod;

      return matchSearch && matchDate && matchCashier && matchMethod;
    });
  }, [transactions, search, filterDate, filterCashier, filterMethod, isSuperAdmin, currentUser.username]);

  const handleOpenDetail = (trx: Transaction) => {
    setSelectedTrx(trx);
    setDetailModalOpen(true);
  };

  const handleDelete = async (trxId: string) => {
    if (!isSuperAdmin) {
      onAccessDenied('Hapus Transaksi');
      return;
    }

    if (confirm(`Hapus transaksi ${trxId} secara permanen? Data yang telah dihapus tidak dapat dipulihkan.`)) {
      try {
        const res = await db.deleteTransaction(trxId, currentUser.username);
        if (res.success) {
          onRefreshTransactions();
        } else {
          alert(res.message);
        }
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus transaksi');
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-cyan-500/20">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>{isSuperAdmin ? 'SEMUA RIWAYAT TRANSAKSI' : 'TRANSAKSI SAYA'}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              {filtered.length} Transaksi
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isSuperAdmin
              ? 'Seluruh catatan transaksi kasir toko. Anda dapat melihat detail atau mencetak ulang struk.'
              : 'Daftar transaksi yang Anda proses selama bertugas sebagai kasir.'}
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Search */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Cari ID Transaksi / Kasir</label>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="TRX-..."
            className="w-full glass-input px-3 py-1.5 rounded-xl"
          />
        </div>

        {/* Date Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Filter Tanggal</label>
          <div className="flex gap-1.5">
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="w-full glass-input px-3 py-1.5 rounded-xl"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="px-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                title="Reset Tanggal"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Cashier Filter (Super Admin only) */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Filter Kasir</label>
          <select
            disabled={!isSuperAdmin}
            value={filterCashier}
            onChange={e => setFilterCashier(e.target.value)}
            className="w-full glass-input px-3 py-1.5 rounded-xl bg-slate-900 disabled:opacity-50"
          >
            {cashiers.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Payment Method Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Metode Pembayaran</label>
          <select
            value={filterMethod}
            onChange={e => setFilterMethod(e.target.value)}
            className="w-full glass-input px-3 py-1.5 rounded-xl bg-slate-900"
          >
            <option value="Semua">Semua Metode</option>
            <option value="Cash">Cash (Tunai)</option>
            <option value="QRIS">QRIS</option>
            <option value="Transfer">Transfer Bank</option>
          </select>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-cyan-400 uppercase font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 text-center">No</th>
                <th className="py-3 px-4">Tanggal & Jam</th>
                <th className="py-3 px-4">No Transaksi</th>
                <th className="py-3 px-4">Kasir</th>
                <th className="py-3 px-4">Metode</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Tidak ada transaksi yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filtered.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono">
                      <span>{t.date}</span> <span className="text-slate-500 text-[10px]">{t.time}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-cyan-300">{t.id}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white">{t.username}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.payment_method === 'Cash'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : t.payment_method === 'QRIS'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      }`}>
                        {t.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num font-bold text-white">
                      {formatRupiah(t.total)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(t)}
                          title="Lihat Detail & Cetak Ulang Struk"
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-black text-cyan-400 border border-cyan-500/30 transition text-[11px] font-bold flex items-center gap-1"
                        >
                          <i className="fa-solid fa-receipt"></i>
                          <span>Struk</span>
                        </button>

                        {isSuperAdmin && (
                          <button
                            onClick={() => handleDelete(t.id)}
                            title="Hapus Transaksi"
                            className="p-1 rounded-lg bg-slate-800 hover:bg-rose-600 hover:text-white text-rose-400 border border-rose-500/30 transition text-xs"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL DETAIL / STRUK ULANG --- */}
      {detailModalOpen && selectedTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm glass-panel rounded-2xl p-6 border border-cyan-500/40 shadow-2xl relative text-black bg-white">
            <button
              onClick={() => setDetailModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-black no-print"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>

            <div className="font-mono text-xs text-slate-900 space-y-3">
              <div className="text-center pb-2 border-b border-dashed border-slate-400">
                <h3 className="font-extrabold text-base tracking-wider uppercase">{settings.store_name}</h3>
                <p className="text-[10px] text-slate-600">Sistem Kasir & Pencatatan Keuangan</p>
                {settings.store_address && (
                  <p className="text-[9px] text-slate-500 mt-0.5">{settings.store_address}</p>
                )}
              </div>

              <div className="text-[11px] space-y-0.5 text-slate-700 border-b border-dashed border-slate-400 pb-2">
                <div className="flex justify-between">
                  <span>No Transaksi:</span>
                  <span className="font-bold">{selectedTrx.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{selectedTrx.date} {selectedTrx.time}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>{selectedTrx.username}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1 py-1 border-b border-dashed border-slate-400">
                {selectedTrx.items?.map(it => (
                  <div key={it.id} className="flex justify-between text-[11px]">
                    <span>{it.product_name} x{it.quantity}</span>
                    <span className="font-semibold">{formatRupiah(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Calculations */}
              <div className="space-y-1 text-[11px] pt-1 border-b border-dashed border-slate-400 pb-2">
                <div className="flex justify-between font-bold text-xs">
                  <span>TOTAL:</span>
                  <span>{formatRupiah(selectedTrx.total)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Metode:</span>
                  <span>{selectedTrx.payment_method}</span>
                </div>
                {selectedTrx.payment_method === 'Cash' && (
                  <>
                    <div className="flex justify-between text-slate-700">
                      <span>Dibayar:</span>
                      <span>{formatRupiah(selectedTrx.paid)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Kembalian:</span>
                      <span>{formatRupiah(selectedTrx.change)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-600">
                <p>{settings.receipt_footer || 'Terima kasih telah berbelanja!'}</p>
              </div>
            </div>

            {/* Buttons: CETAK & PDF */}
            <div className="mt-5 pt-3 border-t border-slate-200 flex gap-2 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <i className="fa-solid fa-print"></i>
                <span>CETAK</span>
              </button>

              <button
                type="button"
                onClick={() => exportReceiptToPDF(settings, selectedTrx)}
                className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-black flex items-center justify-center gap-1.5 transition shadow-[0_0_10px_rgba(0,240,255,0.4)]"
              >
                <i className="fa-solid fa-file-pdf"></i>
                <span>PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
