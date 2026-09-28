import React, { useState, useMemo } from 'react';
import { FinanceRecord, FinanceType, FinanceCategory, UserProfile } from '../types';
import { db } from '../services/db';
import { formatRupiah } from '../services/exportService';

interface Props {
  finance: FinanceRecord[];
  currentUser: UserProfile;
  onRefreshFinance: () => void;
  onAccessDenied: (featureName: string) => void;
}

export const KeuanganView: React.FC<Props> = ({
  finance,
  currentUser,
  onRefreshFinance,
  onAccessDenied
}) => {
  const isSuperAdmin = currentUser.role === 'super_admin';

  const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [type, setType] = useState<FinanceType>('expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<FinanceCategory>('Operasional');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Totals & Saldo
  const { totalPemasukan, totalPengeluaran, saldo } = useMemo(() => {
    let pemasukan = 0;
    let pengeluaran = 0;
    finance.forEach(f => {
      const val = Number(f.amount || 0);
      if (f.type === 'income') pemasukan += val;
      if (f.type === 'expense') pengeluaran += val;
    });
    return {
      totalPemasukan: pemasukan,
      totalPengeluaran: pengeluaran,
      saldo: pemasukan - pengeluaran
    };
  }, [finance]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    if (activeFilter === 'all') return finance;
    return finance.filter(f => f.type === activeFilter);
  }, [finance, activeFilter]);

  const handleOpenAddModal = (initialType: FinanceType) => {
    if (!isSuperAdmin) {
      onAccessDenied('Catatan Keuangan');
      return;
    }
    setType(initialType);
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setAmount('');
    setCategory(initialType === 'expense' ? 'Operasional' : 'Lainnya');
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!isSuperAdmin) {
      onAccessDenied('Hapus Catatan');
      return;
    }
    if (confirm('Hapus catatan transaksi keuangan ini?')) {
      await db.deleteFinanceRecord(id);
      onRefreshFinance();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      onAccessDenied('Tambah Keuangan');
      return;
    }

    const numAmount = Number(amount);
    if (numAmount <= 0) {
      setErrorMsg('Nominal harus lebih besar dari 0!');
      return;
    }

    setSubmitting(true);
    try {
      const res = await db.addFinanceRecord({
        type,
        date,
        description: description.trim(),
        amount: numAmount,
        category
      });

      if (res.success) {
        setModalOpen(false);
        onRefreshFinance();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan catatan keuangan.');
    } finally {
      setSubmitting(false);
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
            <span>PENCATATAN KEUANGAN</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              Khusus Super Admin
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pantau arus kas masuk (pemasukan & kasir) dan arus kas keluar (pengeluaran biaya toko).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAddModal('income')}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-black flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(16,185,129,0.3)]"
          >
            <i className="fa-solid fa-plus text-[10px]"></i>
            <span>+ Pemasukan</span>
          </button>
          <button
            onClick={() => handleOpenAddModal('expense')}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(239,68,68,0.3)]"
          >
            <i className="fa-solid fa-minus text-[10px]"></i>
            <span>+ Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards: Pemasukan, Pengeluaran, Saldo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pemasukan */}
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30">
          <div className="flex justify-between items-center text-xs text-slate-400 uppercase font-semibold">
            <span>Total Pemasukan</span>
            <i className="fa-solid fa-arrow-down-left text-emerald-400 text-base"></i>
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono-num mt-2">
            {formatRupiah(totalPemasukan)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Penjualan kasir & modal masuk</p>
        </div>

        {/* Pengeluaran */}
        <div className="glass-panel p-5 rounded-2xl border border-rose-500/30">
          <div className="flex justify-between items-center text-xs text-slate-400 uppercase font-semibold">
            <span>Total Pengeluaran</span>
            <i className="fa-solid fa-arrow-up-right text-rose-400 text-base"></i>
          </div>
          <div className="text-2xl font-black text-rose-300 font-mono-num mt-2">
            {formatRupiah(totalPengeluaran)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Operasional, stok & peralatan</p>
        </div>

        {/* Saldo Kas */}
        <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30">
          <div className="flex justify-between items-center text-xs text-slate-400 uppercase font-semibold">
            <span>Saldo Kas Bersih</span>
            <i className="fa-solid fa-wallet text-cyan-400 text-base"></i>
          </div>
          <div className={`text-2xl font-black font-mono-num mt-2 ${saldo >= 0 ? 'text-cyan-300 neon-text-glow' : 'text-rose-400'}`}>
            {formatRupiah(saldo)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Saldo = Pemasukan - Pengeluaran</p>
        </div>
      </div>

      {/* Tabs Filter & Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            {(['all', 'income', 'expense'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeFilter === tab
                    ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'all' ? 'Semua Catatan' : tab === 'income' ? 'Pemasukan' : 'Pengeluaran'}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400 font-mono">
            {filteredRecords.length} transaksi tercatat
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-cyan-400 uppercase font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Tipe</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Belum ada data keuangan pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(r => (
                  <tr key={r.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3 px-4 font-mono">{r.date}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.type === 'income'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {r.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{r.category}</td>
                    <td className="py-3 px-4 text-white font-medium">{r.description}</td>
                    <td className={`py-3 px-4 text-right font-mono-num font-bold ${
                      r.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {r.type === 'income' ? '+' : '-'} {formatRupiah(r.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(r.id)}
                        title="Hapus Catatan"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL TAMBAH KEUANGAN --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-cyan-500/40 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>

            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <i className={`fa-solid ${type === 'income' ? 'fa-arrow-down-left text-emerald-400' : 'fa-arrow-up-right text-rose-400'}`}></i>
              <span>{type === 'income' ? 'CATAT PEMASUKAN' : 'CATAT PENGELUARAN'}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Catatan ini akan otomatis mempengaruhi kalkulasi saldo toko.</p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Jenis
                  </label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as FinanceType)}
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs bg-slate-900 text-slate-200"
                  >
                    <option value="income">Pemasukan (+)</option>
                    <option value="expense">Pengeluaran (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as FinanceCategory)}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs bg-slate-900 text-slate-200"
                >
                  <option value="Operasional">Operasional</option>
                  <option value="Pembelian barang">Pembelian barang / Restock</option>
                  <option value="Transportasi">Transportasi</option>
                  <option value="Peralatan">Peralatan</option>
                  <option value="Lainnya">Lainnya</option>
                  <option value="Penjualan Kasir">Penjualan Kasir</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Keterangan
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Contoh: Beli kemasan plastik & cup"
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Contoh: 150000"
                  className="w-full glass-input px-3 py-2 rounded-xl text-sm font-mono-num font-bold text-cyan-300"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-2/3 py-2.5 rounded-xl neon-btn-primary text-xs font-black flex items-center justify-center gap-2"
                >
                  {submitting ? 'Menyimpan...' : 'SIMPAN CATATAN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
