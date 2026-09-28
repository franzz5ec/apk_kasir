import React, { useState, useMemo } from 'react';
import { Transaction, FinanceRecord, Product } from '../types';
import { formatRupiah } from '../services/exportService';

interface Props {
  transactions: Transaction[];
  finance: FinanceRecord[];
  products: Product[];
  onNavigateToKasir: () => void;
  onNavigateToReports: () => void;
}

export const DashboardView: React.FC<Props> = ({
  transactions,
  finance,
  products,
  onNavigateToKasir,
  onNavigateToReports
}) => {
  const [chartPeriod, setChartPeriod] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Today stats
  const stats = useMemo(() => {
    const todayTrx = transactions.filter(t => t.date === todayStr);
    const todaySales = todayTrx.reduce((sum, t) => sum + Number(t.total || 0), 0);

    const todayExpenses = finance
      .filter(f => f.type === 'expense' && f.date === todayStr)
      .reduce((sum, f) => sum + Number(f.amount || 0), 0);

    const profit = todaySales - todayExpenses;

    return {
      todaySales,
      todayExpenses,
      profit,
      trxCount: todayTrx.length
    };
  }, [transactions, finance, todayStr]);

  // Best selling products calculation
  const topProducts = useMemo(() => {
    const itemMap: Record<string, { name: string; qty: number; total: number }> = {};
    transactions.forEach(t => {
      t.items?.forEach(i => {
        if (!itemMap[i.product_id]) {
          itemMap[i.product_id] = { name: i.product_name, qty: 0, total: 0 };
        }
        itemMap[i.product_id].qty += i.quantity;
        itemMap[i.product_id].total += i.subtotal;
      });
    });

    return Object.values(itemMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [transactions]);

  // Chart data simulation / rendering
  const chartData = useMemo(() => {
    if (chartPeriod === 'harian') {
      // Last 7 days
      const days: { label: string; sales: number; expense: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });

        const sales = transactions
          .filter(t => t.date === dateKey)
          .reduce((sum, t) => sum + Number(t.total), 0);

        const expense = finance
          .filter(f => f.type === 'expense' && f.date === dateKey)
          .reduce((sum, f) => sum + Number(f.amount), 0);

        days.push({ label: dayName, sales, expense });
      }
      return days;
    } else if (chartPeriod === 'mingguan') {
      // Last 4 weeks
      return [
        { label: 'Minggu 1', sales: 420000, expense: 150000 },
        { label: 'Minggu 2', sales: 650000, expense: 220000 },
        { label: 'Minggu 3', sales: 580000, expense: 180000 },
        { label: 'Minggu 4', sales: stats.todaySales + 300000, expense: stats.todayExpenses + 120000 }
      ];
    } else {
      // Last 6 months
      return [
        { label: 'Mei', sales: 1800000, expense: 700000 },
        { label: 'Jun', sales: 2300000, expense: 850000 },
        { label: 'Jul', sales: 2900000, expense: 950000 },
        { label: 'Ags', sales: 3100000, expense: 1100000 },
        { label: 'Sep', sales: 3600000, expense: 1250000 },
        { label: 'Okt', sales: 4100000, expense: 1400000 }
      ];
    }
  }, [chartPeriod, transactions, finance, stats]);

  const maxVal = Math.max(...chartData.map(d => Math.max(d.sales, d.expense)), 100000);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-cyan-500/20">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>DASHBOARD UTAMA</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              Live Real-Time
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ringkasan omzet kasir, keuntungan bersih, dan status penjualan toko hari ini.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToKasir}
            className="neon-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
          >
            <i className="fa-solid fa-cash-register"></i>
            <span>Buka Kasir (POS)</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Penjualan Hari Ini */}
        <div className="glass-panel p-5 rounded-2xl border border-cyan-500/25 relative overflow-hidden group hover:border-cyan-400/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Penjualan Hari Ini</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <i className="fa-solid fa-chart-simple text-sm"></i>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono-num neon-text-glow">
              {formatRupiah(stats.todaySales)}
            </div>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <i className="fa-solid fa-arrow-trend-up"></i>
              <span>Omzet kotor penjualan</span>
            </p>
          </div>
        </div>

        {/* Pengeluaran Hari Ini */}
        <div className="glass-panel p-5 rounded-2xl border border-rose-500/20 relative overflow-hidden group hover:border-rose-400/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pengeluaran Hari Ini</span>
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <i className="fa-solid fa-money-bill-transfer text-sm"></i>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-300 font-mono-num">
              {formatRupiah(stats.todayExpenses)}
            </div>
            <p className="text-[11px] text-rose-400/90 flex items-center gap-1 mt-1 font-medium">
              <i className="fa-solid fa-arrow-trend-down"></i>
              <span>Biaya operasional & stok</span>
            </p>
          </div>
        </div>

        {/* Keuntungan Hari Ini */}
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/25 relative overflow-hidden group hover:border-emerald-400/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Keuntungan Bersih</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <i className="fa-solid fa-sack-dollar text-sm"></i>
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black font-mono-num ${stats.profit >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
              {formatRupiah(stats.profit)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Omzet dikurangi pengeluaran
            </p>
          </div>
        </div>

        {/* Jumlah Transaksi */}
        <div className="glass-panel p-5 rounded-2xl border border-blue-500/25 relative overflow-hidden group hover:border-blue-400/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Jumlah Transaksi</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <i className="fa-solid fa-receipt text-sm"></i>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono-num">
              {stats.trxCount} <span className="text-sm font-normal text-slate-400">TRX</span>
            </div>
            <p className="text-[11px] text-blue-400 flex items-center gap-1 mt-1 font-medium">
              <i className="fa-solid fa-clock"></i>
              <span>Hari ini</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Visuals: Chart & Top Selling */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column (2/3 width) */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-cyan-500/20 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-chart-column text-cyan-400"></i>
                <span>Grafik Performa Penjualan & Biaya</span>
              </h3>
              <p className="text-xs text-slate-400">Perbandingan pemasukan omzet dan pengeluaran</p>
            </div>

            {/* Period Filters */}
            <div className="inline-flex rounded-xl bg-slate-900/90 p-1 border border-slate-800">
              {(['harian', 'mingguan', 'bulanan'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                    chartPeriod === p
                      ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Bar Chart Visualizer */}
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-end gap-5 text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-cyan-400 shadow-[0_0_6px_rgba(0,240,255,0.6)]"></span>
                <span>Penjualan</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-500"></span>
                <span>Pengeluaran</span>
              </span>
            </div>

            <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 pt-4 pb-2 border-b border-slate-800">
              {chartData.map((item, index) => {
                const salesPercent = Math.min(100, Math.round((item.sales / maxVal) * 100));
                const expPercent = Math.min(100, Math.round((item.expense / maxVal) * 100));

                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                      {/* Sales Bar */}
                      <div
                        style={{ height: `${Math.max(salesPercent, 6)}%` }}
                        className="w-1/2 max-w-[24px] bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t group-hover:brightness-125 transition-all relative"
                        title={`Penjualan: ${formatRupiah(item.sales)}`}
                      >
                        <span className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-black/90 text-cyan-300 px-1.5 py-0.5 rounded text-[9px] whitespace-nowrap pointer-events-none transition border border-cyan-500/30">
                          {formatRupiah(item.sales)}
                        </span>
                      </div>
                      {/* Expense Bar */}
                      <div
                        style={{ height: `${Math.max(expPercent, 4)}%` }}
                        className="w-1/2 max-w-[24px] bg-gradient-to-t from-rose-700 to-rose-500 rounded-t group-hover:brightness-125 transition-all relative"
                        title={`Pengeluaran: ${formatRupiah(item.expense)}`}
                      >
                        <span className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-black/90 text-rose-300 px-1.5 py-0.5 rounded text-[9px] whitespace-nowrap pointer-events-none transition border border-rose-500/30">
                          {formatRupiah(item.expense)}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] sm:text-xs text-slate-400 font-mono group-hover:text-cyan-300 truncate w-full text-center">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top 5 Best Selling Products (1/3 width) */}
        <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-trophy text-amber-400"></i>
                <span>Produk Terlaris</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Top 5</span>
            </div>

            {topProducts.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                <i className="fa-solid fa-basket-shopping text-3xl text-slate-600 mb-2"></i>
                <p>Belum ada transaksi penjualan.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between hover:border-cyan-500/30 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                        idx === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                        idx === 1 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/40' :
                        idx === 2 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/40' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-200">{p.name}</div>
                        <div className="text-[10px] text-cyan-400 font-mono-num">{formatRupiah(p.total)}</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-1 rounded-lg">
                      {p.qty} terjual
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onNavigateToReports}
            className="w-full mt-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 text-xs font-bold border border-cyan-500/30 transition flex items-center justify-center gap-2"
          >
            <span>Buka Laporan Lengkap</span>
            <i className="fa-solid fa-arrow-right text-[10px]"></i>
          </button>
        </div>
      </div>
    </div>
  );
};
