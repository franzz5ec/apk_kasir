import React, { useState, useMemo } from 'react';
import { Transaction, FinanceRecord, StoreSettings, UserProfile } from '../types';
import { formatRupiah, exportReportToPDF, exportReportToWord, ReportSummary } from '../services/exportService';

interface Props {
  transactions: Transaction[];
  finance: FinanceRecord[];
  settings: StoreSettings;
  currentUser: UserProfile;
}

export const LaporanView: React.FC<Props> = ({
  transactions,
  finance,
  settings,
  currentUser
}) => {
  const isSuperAdmin = currentUser.role === 'super_admin';

  const [periodFilter, setPeriodFilter] = useState<'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom'>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Date range calculation
  const { startDate, endDate, periodLabel } = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (periodFilter === 'today') {
      return { startDate: todayStr, endDate: todayStr, periodLabel: `Hari Ini (${todayStr})` };
    } else if (periodFilter === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      return { startDate: yStr, endDate: yStr, periodLabel: `Kemarin (${yStr})` };
    } else if (periodFilter === 'this_week') {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const mon = new Date(d.setDate(diff)).toISOString().split('T')[0];
      return { startDate: mon, endDate: todayStr, periodLabel: `Minggu Ini (${mon} s/d ${todayStr})` };
    } else if (periodFilter === 'this_month') {
      const d = new Date();
      const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
      return { startDate: firstDay, endDate: todayStr, periodLabel: `Bulan Ini (${firstDay} s/d ${todayStr})` };
    } else {
      const s = customStart || todayStr;
      const e = customEnd || todayStr;
      return { startDate: s, endDate: e, periodLabel: `Custom (${s} s/d ${e})` };
    }
  }, [periodFilter, customStart, customEnd]);

  // Filter transactions in range
  const filteredTrx = useMemo(() => {
    return transactions.filter(t => {
      if (!isSuperAdmin && t.username.toLowerCase() !== currentUser.username.toLowerCase()) {
        return false;
      }
      return t.date >= startDate && t.date <= endDate;
    });
  }, [transactions, startDate, endDate, isSuperAdmin, currentUser.username]);

  // Filter expenses in range
  const filteredExpenses = useMemo(() => {
    if (!isSuperAdmin) return 0;
    return finance
      .filter(f => f.type === 'expense' && f.date >= startDate && f.date <= endDate)
      .reduce((sum, f) => sum + Number(f.amount || 0), 0);
  }, [finance, startDate, endDate, isSuperAdmin]);

  // Summary Metrics
  const summary: ReportSummary = useMemo(() => {
    const totalTransactions = filteredTrx.length;
    const totalOmzet = filteredTrx.reduce((sum, t) => sum + Number(t.total || 0), 0);
    const totalPengeluaran = filteredExpenses;
    const totalKeuntungan = totalOmzet - totalPengeluaran;

    return {
      periodLabel,
      totalTransactions,
      totalOmzet,
      totalPengeluaran,
      totalKeuntungan
    };
  }, [filteredTrx, filteredExpenses, periodLabel]);

  // Handlers
  const handleExportPDF = () => {
    exportReportToPDF(settings, summary, filteredTrx);
  };

  const handleExportWord = () => {
    exportReportToWord(settings, summary, filteredTrx);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-cyan-500/20 no-print">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>LAPORAN PENJUALAN & KEUANGAN</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              {isSuperAdmin ? 'Akses Penuh Super Admin' : 'Laporan Kasir'}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ekspor rekap keuangan toko ke format PDF, dokumen Microsoft Word, atau cetak langsung.
          </p>
        </div>

        {/* Action Buttons: EXPORT PDF, EXPORT WORD, PRINT */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-black flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(0,240,255,0.3)]"
          >
            <i className="fa-solid fa-file-pdf"></i>
            <span>EXPORT PDF</span>
          </button>

          <button
            onClick={handleExportWord}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(37,99,235,0.3)]"
          >
            <i className="fa-solid fa-file-word"></i>
            <span>EXPORT WORD</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition border border-slate-700"
          >
            <i className="fa-solid fa-print"></i>
            <span>PRINT</span>
          </button>
        </div>
      </div>

      {/* Period Filter Buttons (no print) */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 no-print">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold mr-2">Pilih Periode:</span>
          {[
            { id: 'today', label: 'Hari ini' },
            { id: 'yesterday', label: 'Kemarin' },
            { id: 'this_week', label: 'Minggu ini' },
            { id: 'this_month', label: 'Bulan ini' },
            { id: 'custom', label: 'Custom tanggal' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriodFilter(p.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                periodFilter === p.id
                  ? 'neon-btn-primary shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {periodFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Dari:</span>
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="glass-input px-3 py-1 rounded-xl text-xs"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Sampai:</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="glass-input px-3 py-1 rounded-xl text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Print View Header (Visible during Print / PDF) */}
      <div className="hidden print-only text-center mb-6">
        <h1 className="text-2xl font-black">{settings.store_name}</h1>
        <p className="text-sm">LAPORAN KEUANGAN & PENJUALAN</p>
        <p className="text-xs text-gray-500">Periode: {periodLabel}</p>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Transaksi */}
        <div className="glass-panel p-5 rounded-2xl border border-blue-500/25">
          <div className="flex justify-between items-center text-xs text-slate-400 uppercase font-semibold">
            <span>Total Transaksi</span>
            <i className="fa-solid fa-receipt text-blue-400"></i>
          </div>
          <div className="text-2xl font-black text-white font-mono-num mt-2">
            {summary.totalTransactions} <span className="text-xs font-normal text-slate-400">TRX</span>
          </div>
        </div>

        {/* Total Omzet */}
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/25">
          <div className="flex justify-between items-center text-xs text-slate-400 uppercase font-semibold">
            <span>Total Omzet</span>
            <i className="fa-solid fa-coins text-emerald-400"></i>
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono-num mt-2">
            {formatRupiah(summary.totalOmzet)}
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="glass-panel p-5 rounded-2xl border border-rose-500/25">
          <div className="flex justify-between items-center text-xs text-slate-400 uppercase font-semibold">
            <span>Total Pengeluaran</span>
            <i className="fa-solid fa-arrow-trend-down text-rose-400"></i>
          </div>
          <div className="text-2xl font-black text-rose-300 font-mono-num mt-2">
            {formatRupiah(summary.totalPengeluaran)}
          </div>
        </div>

        {/* Total Keuntungan */}
        <div className="glass-panel p-5 rounded-2xl border border-cyan-500/25">
          <div className="flex justify-between items-center text-xs text-slate-400 uppercase font-semibold">
            <span>Total Keuntungan</span>
            <i className="fa-solid fa-sack-dollar text-cyan-400"></i>
          </div>
          <div className={`text-2xl font-black font-mono-num mt-2 ${summary.totalKeuntungan >= 0 ? 'text-cyan-300 neon-text-glow' : 'text-rose-400'}`}>
            {formatRupiah(summary.totalKeuntungan)}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Keuntungan = Omzet - Pengeluaran</p>
        </div>
      </div>

      {/* Transactions Detail Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <i className="fa-solid fa-table-list text-cyan-400"></i>
            <span>Daftar Transaksi Periode Ini</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {filteredTrx.length} baris data
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-cyan-400 uppercase font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 text-center">No</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">No Transaksi</th>
                <th className="py-3 px-4">Kasir</th>
                <th className="py-3 px-4">Metode</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredTrx.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Tidak ada transaksi dalam periode ini.
                  </td>
                </tr>
              ) : (
                filteredTrx.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono">{t.date}</td>
                    <td className="py-3 px-4 font-mono font-bold text-cyan-300">{t.id}</td>
                    <td className="py-3 px-4 text-white font-medium">{t.username}</td>
                    <td className="py-3 px-4">{t.payment_method}</td>
                    <td className="py-3 px-4 text-right font-mono-num font-bold text-white">
                      {formatRupiah(t.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredTrx.length > 0 && (
              <tfoot className="bg-slate-950 text-cyan-300 font-bold border-t border-slate-800">
                <tr>
                  <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider">
                    Total Omzet Penjualan:
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num text-sm text-cyan-400">
                    {formatRupiah(summary.totalOmzet)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
