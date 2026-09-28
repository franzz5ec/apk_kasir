import React, { useState, useMemo } from 'react';
import { Product, UserProfile } from '../types';
import { db } from '../services/db';
import { formatRupiah } from '../services/exportService';

interface Props {
  products: Product[];
  currentUser: UserProfile;
  onRefreshProducts: () => void;
  onAccessDenied: (featureName: string) => void;
}

export const ProdukView: React.FC<Props> = ({
  products,
  currentUser,
  onRefreshProducts,
  onAccessDenied
}) => {
  const isSuperAdmin = currentUser.role === 'super_admin';

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Makanan');
  const [formSellingPrice, setFormSellingPrice] = useState('');
  const [formCostPrice, setFormCostPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formImageUrl, setFormImageUrl] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => set.add(p.category));
    return ['Semua', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
      // Kasir only sees active products, Super admin sees all
      const matchStatus = isSuperAdmin ? true : p.status === 'active';
      return matchCat && matchSearch && matchStatus;
    });
  }, [products, selectedCategory, search, isSuperAdmin]);

  const handleOpenAddModal = () => {
    if (!isSuperAdmin) {
      onAccessDenied('Tambah Barang');
      return;
    }
    setEditingProduct(null);
    setFormId(`P${String(products.length + 1).padStart(3, '0')}`);
    setFormName('');
    setFormCategory('Makanan');
    setFormSellingPrice('');
    setFormCostPrice('');
    setFormStock('10');
    setFormStatus('active');
    setFormImageUrl('');
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    if (!isSuperAdmin) {
      onAccessDenied('Edit Barang');
      return;
    }
    setEditingProduct(product);
    setFormId(product.id);
    setFormName(product.name);
    setFormCategory(product.category);
    setFormSellingPrice(String(product.selling_price));
    setFormCostPrice(String(product.cost_price));
    setFormStock(String(product.stock));
    setFormStatus(product.status);
    setFormImageUrl(product.image_url || '');
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!isSuperAdmin) {
      onAccessDenied('Hapus Barang');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus produk "${product.name}" (${product.id})?`)) {
      try {
        const res = await db.deleteProduct(product.id, currentUser.username);
        if (res.success) {
          setSuccessToast(res.message);
          onRefreshProducts();
          setTimeout(() => setSuccessToast(''), 3000);
        } else {
          alert(res.message);
        }
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus produk');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      onAccessDenied('Simpan Produk');
      return;
    }

    setErrorMsg('');
    const sellPrice = Number(formSellingPrice);
    const costPrice = Number(formCostPrice || 0);
    const stock = Number(formStock);

    if (sellPrice < 0) {
      setErrorMsg('Harga Jual tidak boleh negatif!');
      return;
    }
    if (costPrice < 0) {
      setErrorMsg('Harga Modal tidak boleh negatif!');
      return;
    }
    if (stock < 0) {
      setErrorMsg('Stok tidak boleh bernilai negatif!');
      return;
    }

    setSubmitting(true);
    try {
      const res = await db.saveProduct({
        id: formId,
        name: formName.trim(),
        category: formCategory.trim(),
        selling_price: sellPrice,
        cost_price: costPrice,
        stock,
        status: formStatus,
        image_url: formImageUrl.trim()
      }, currentUser.username);

      if (res.success) {
        setSuccessToast(res.message);
        setModalOpen(false);
        onRefreshProducts();
        setTimeout(() => setSuccessToast(''), 3000);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan produk.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-16 right-4 z-50 p-4 rounded-xl bg-emerald-500/90 text-black font-bold text-xs shadow-2xl flex items-center gap-2">
          <i className="fa-solid fa-circle-check text-base"></i>
          <span>{successToast}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-cyan-500/20">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>{isSuperAdmin ? 'MANAJEMEN BARANG' : 'DAFTAR PRODUK'}</span>
            {!isSuperAdmin && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Mode Kasir (Lihat Saja)
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isSuperAdmin
              ? 'Kelola daftar stok, harga jual, harga modal, dan status katalog barang toko.'
              : 'Daftar produk yang tersedia untuk penjualan kasir.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isSuperAdmin ? (
            <button
              onClick={handleOpenAddModal}
              className="neon-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <i className="fa-solid fa-plus"></i>
              <span>Tambah Barang Baru</span>
            </button>
          ) : (
            <div className="text-xs text-slate-400 italic">
              <i className="fa-solid fa-lock mr-1.5 text-amber-400"></i>
              Edit barang khusus Super Admin
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'neon-btn-primary shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full sm:w-64 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-cyan-400 text-xs">
            <i className="fa-solid fa-magnifying-glass"></i>
          </span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari kode atau nama..."
            className="w-full glass-input pl-8 pr-3 py-1.5 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Product Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-cyan-400 uppercase font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Kode</th>
                <th className="py-3.5 px-4">Nama Barang</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4 text-right">Harga Jual</th>
                {isSuperAdmin && <th className="py-3.5 px-4 text-right">Harga Modal</th>}
                <th className="py-3.5 px-4 text-center">Stok</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                {isSuperAdmin && <th className="py-3.5 px-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 8 : 6} className="py-12 text-center text-slate-500">
                    Tidak ada produk ditemukan.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = p.stock > 0 && p.stock <= 5;

                  return (
                    <tr key={p.id} className="hover:bg-slate-900/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-300">{p.id}</td>
                      <td className="py-3 px-4 font-bold text-white">{p.name}</td>
                      <td className="py-3 px-4 text-slate-400">{p.category}</td>
                      <td className="py-3 px-4 text-right font-mono-num font-bold text-cyan-400">
                        {formatRupiah(p.selling_price)}
                      </td>
                      {isSuperAdmin && (
                        <td className="py-3 px-4 text-right font-mono-num text-slate-400">
                          {formatRupiah(p.cost_price)}
                        </td>
                      )}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                            isOutOfStock
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : isLowStock
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {p.stock} ({isOutOfStock ? 'HABIS' : isLowStock ? 'MENIPIS' : 'AMAN'})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'active'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                        >
                          {p.status === 'active' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      {isSuperAdmin && (
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              title="Edit Produk"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-black text-cyan-400 border border-cyan-500/30 transition text-xs"
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p)}
                              title="Hapus Produk"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 hover:text-white text-rose-400 border border-rose-500/30 transition text-xs"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- FORM UPDATE BARANG / TAMBAH BARANG MODAL --- */}
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
              <i className="fa-solid fa-box text-cyan-400"></i>
              <span>{editingProduct ? 'UPDATE BARANG' : 'TAMBAH BARANG BARU'}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {editingProduct
                ? 'Semua perubahan harga & stok akan dicatat ke Activity Log.'
                : 'Lengkapi formulir untuk menambahkan produk baru.'}
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Kode ID
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingProduct}
                    value={formId}
                    onChange={e => setFormId(e.target.value)}
                    placeholder="P001"
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono disabled:opacity-60"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Nama Barang
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Contoh: Es Mojito"
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Harga Jual (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formSellingPrice}
                    onChange={e => setFormSellingPrice(e.target.value)}
                    placeholder="Contoh: 6000"
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono-num font-bold text-cyan-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Harga Modal (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formCostPrice}
                    onChange={e => setFormCostPrice(e.target.value)}
                    placeholder="Contoh: 3500"
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Stok
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formStock}
                    onChange={e => setFormStock(e.target.value)}
                    placeholder="Contoh: 25"
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono-num font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Kategori
                  </label>
                  <input
                    type="text"
                    required
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    placeholder="Makanan / Minuman"
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs bg-slate-900 text-slate-200"
                >
                  <option value="active">Aktif (Tampil di Kasir)</option>
                  <option value="inactive">Nonaktif (Sembunyikan)</option>
                </select>
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
                  {submitting ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-floppy-disk"></i>
                      <span>SIMPAN</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
