import React, { useState, useMemo } from 'react';
import { Product, CartItem, PaymentMethod, Transaction, UserProfile, StoreSettings } from '../types';
import { db } from '../services/db';
import { formatRupiah, exportReceiptToPDF } from '../services/exportService';
import confetti from 'canvas-confetti';

interface Props {
  products: Product[];
  currentUser: UserProfile;
  settings: StoreSettings;
  onTransactionSuccess: (trx: Transaction) => void;
  onRefreshProducts: () => void;
}

export const KasirView: React.FC<Props> = ({
  products,
  currentUser,
  settings,
  onTransactionSuccess,
  onRefreshProducts
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [currentTrx, setCurrentTrx] = useState<Transaction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return ['Semua', ...Array.from(cats)];
  }, [products]);

  // Filtered products (only active)
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch && p.status === 'active';
    });
  }, [products, selectedCategory, search]);

  // Subtotal & Total
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discount);
  }, [subtotal, discount]);

  // Numeric amount paid
  const numericPaid = Number(amountPaid) || 0;
  const change = Math.max(0, numericPaid - total);
  const isPaymentInsufficient = paymentMethod === 'Cash' && numericPaid < total;

  // Add to cart
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) return;

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Stok produk "${product.name}" tersisa ${product.stock}`);
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * product.selling_price }
            : item
        );
      } else {
        return [...prev, { product, quantity: 1, subtotal: product.selling_price }];
      }
    });
  };

  // Modify quantity
  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) {
              alert(`Stok produk tidak mencukupi (Maks: ${item.product.stock})`);
              return item;
            }
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.product.selling_price
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Clear cart
  const handleClearCart = () => {
    if (cart.length > 0 && confirm('Kosongkan keranjang belanja?')) {
      setCart([]);
      setDiscount(0);
      setAmountPaid('');
    }
  };

  // Quick cash buttons
  const handleQuickCash = (amount: number) => {
    setAmountPaid(String(amount));
  };

  // Open checkout modal
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setErrorMsg('');
    if (paymentMethod === 'Cash') {
      setAmountPaid(String(total)); // Default exact amount
    } else {
      setAmountPaid(String(total));
    }
    setPaymentModalOpen(true);
  };

  // Process transaction
  const handleProcessTransaction = async () => {
    setErrorMsg('');

    if (paymentMethod === 'Cash' && numericPaid < total) {
      setErrorMsg('Pembayaran tidak cukup.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await db.createTransaction({
        user_id: currentUser.user_id,
        username: currentUser.username,
        total,
        payment_method: paymentMethod,
        paid: paymentMethod === 'Cash' ? numericPaid : total,
        change: paymentMethod === 'Cash' ? change : 0,
        items: cart
      });

      if (res.success && res.transaction) {
        setCurrentTrx(res.transaction);
        onTransactionSuccess(res.transaction);
        onRefreshProducts();
        setPaymentModalOpen(false);
        setReceiptModalOpen(true);
        setCart([]);
        setDiscount(0);
        setAmountPaid('');

        // Confetti celebration
        try {
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.7 }
          });
        } catch (e) {
          // ignore
        }
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses transaksi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Print Receipt
  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Kasir Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel p-4 rounded-2xl border border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <i className="fa-solid fa-cash-register text-lg"></i>
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-wide">KASIR (POINT OF SALE)</h2>
            <p className="text-xs text-slate-400">
              Kasir aktif: <strong className="text-cyan-300">{currentUser.username}</strong> &bull; Siap melayani transaksi
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-72 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-cyan-400/80 text-sm">
            <i className="fa-solid fa-magnifying-glass"></i>
          </span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama barang atau kode..."
            className="w-full glass-input pl-9 pr-3 py-2 rounded-xl text-xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
            >
              <i className="fa-solid fa-xmark text-xs"></i>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Products (Left) + Cart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Category Pills + Product Catalog (7 or 8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Category Tabs */}
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

          {/* Product Cards Grid */}
          {filteredProducts.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-2xl border border-dashed border-slate-800">
              <i className="fa-solid fa-box-open text-4xl text-slate-600 mb-2"></i>
              <p className="text-sm text-slate-400">Tidak ada produk yang cocok dengan filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredProducts.map(product => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock <= 5;
                const inCart = cart.find(c => c.product.id === product.id);

                return (
                  <div
                    key={product.id}
                    className={`glass-panel p-3.5 rounded-2xl border flex flex-col justify-between transition-all group ${
                      isOutOfStock
                        ? 'border-rose-900/30 opacity-60 bg-slate-950/40'
                        : inCart
                        ? 'border-cyan-400/60 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                        : 'border-slate-800 hover:border-cyan-500/40'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          {product.id}
                        </span>

                        {/* Stock Status Badge */}
                        {isOutOfStock ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            HABIS
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            MENIPIS ({product.stock})
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            AMAN ({product.stock})
                          </span>
                        )}
                      </div>

                      {/* Product Name */}
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition line-clamp-2">
                        {product.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{product.category}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      {/* Price */}
                      <div className="text-sm sm:text-base font-black text-cyan-400 font-mono-num mb-2.5">
                        {formatRupiah(product.selling_price)}
                      </div>

                      {/* Add Button */}
                      {isOutOfStock ? (
                        <button
                          disabled
                          className="w-full py-2 rounded-xl bg-slate-900 text-slate-500 text-xs font-bold cursor-not-allowed border border-slate-800"
                        >
                          STOK HABIS
                        </button>
                      ) : inCart ? (
                        <div className="flex items-center justify-between bg-cyan-950/60 rounded-xl p-1 border border-cyan-500/40">
                          <button
                            onClick={() => handleUpdateQuantity(product.id, -1)}
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs"
                          >
                            <i className="fa-solid fa-minus"></i>
                          </button>
                          <span className="text-xs font-bold font-mono text-cyan-300 px-2">
                            {inCart.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(product.id, 1)}
                            className="w-7 h-7 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center text-xs font-bold"
                          >
                            <i className="fa-solid fa-plus"></i>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-200 text-xs font-bold border border-slate-700 hover:border-cyan-400 transition flex items-center justify-center gap-1.5"
                        >
                          <i className="fa-solid fa-plus text-[10px]"></i>
                          <span>+ TAMBAH</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active Cart (5 or 4 cols) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="glass-panel rounded-2xl border border-cyan-500/30 p-4 sm:p-5 sticky top-20 flex flex-col justify-between shadow-2xl">
            {/* Cart Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-cart-shopping text-cyan-400"></i>
                  <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
                    Keranjang Belanja
                  </h3>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold"
                  >
                    Kosongkan
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="mt-3 divide-y divide-slate-800/80 max-h-72 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <i className="fa-solid fa-basket-shopping text-3xl text-slate-700 mb-2"></i>
                    <p className="text-xs">Keranjang masih kosong.</p>
                    <p className="text-[10px] text-slate-500 mt-1">Pilih produk di sebelah kiri untuk menambah pesanan.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{item.product.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono-num">
                          {formatRupiah(item.product.selling_price)}
                        </div>
                      </div>

                      {/* Quantity Controller [-] qty [+] */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateQuantity(item.product.id, -1)}
                          className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-xs font-mono font-bold text-cyan-300">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.product.id, 1)}
                          className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right min-w-[70px]">
                        <span className="text-xs font-bold font-mono-num text-white">
                          {formatRupiah(item.subtotal)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Calculations & Checkout Button */}
            <div className="mt-4 pt-3 border-t border-slate-800 space-y-2.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Subtotal:</span>
                <span className="font-mono-num font-semibold">{formatRupiah(subtotal)}</span>
              </div>

              {/* Discount Input */}
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Diskon:</span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={discount || ''}
                    onChange={e => setDiscount(Math.max(0, Number(e.target.value)))}
                    placeholder="0"
                    className="w-20 glass-input px-2 py-0.5 rounded text-right text-xs font-mono-num"
                  />
                </div>
              </div>

              {/* Total Banner */}
              <div className="flex justify-between items-center p-3 rounded-xl bg-cyan-950/50 border border-cyan-500/40">
                <span className="text-sm font-black text-cyan-300 uppercase tracking-wider">TOTAL:</span>
                <span className="text-lg font-black text-cyan-400 font-mono-num neon-text-glow">
                  {formatRupiah(total)}
                </span>
              </div>

              {/* Checkout Trigger */}
              <button
                disabled={cart.length === 0}
                onClick={handleOpenCheckout}
                className="w-full py-3.5 rounded-xl neon-btn-primary text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,240,255,0.4)]"
              >
                <i className="fa-solid fa-money-bill-wave"></i>
                <span>PROSES PEMBAYARAN</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL PEMBAYARAN --- */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-cyan-500/40 shadow-2xl relative">
            <button
              onClick={() => setPaymentModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>

            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <i className="fa-solid fa-credit-card text-cyan-400"></i>
              <span>PEMBAYARAN TRANSAKSI</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Pilih metode dan masukkan jumlah uang pembayaran.</p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation text-rose-400"></i>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(['Cash', 'QRIS', 'Transfer'] as PaymentMethod[]).map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(method);
                    if (method !== 'Cash') {
                      setAmountPaid(String(total));
                    }
                  }}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    paymentMethod === method
                      ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <i className={`fa-solid mr-1.5 ${
                    method === 'Cash' ? 'fa-money-bill-1' : method === 'QRIS' ? 'fa-qrcode' : 'fa-building-columns'
                  }`}></i>
                  {method}
                </button>
              ))}
            </div>

            {/* Total Display */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 mb-4 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-300">Total Tagihan:</span>
              <span className="text-lg font-black text-cyan-400 font-mono-num">{formatRupiah(total)}</span>
            </div>

            {/* Cash Input & Quick Buttons */}
            {paymentMethod === 'Cash' && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Uang Dibayar (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    autoFocus
                    value={amountPaid}
                    onChange={e => setAmountPaid(e.target.value)}
                    placeholder="Contoh: 50000"
                    className="w-full glass-input px-3.5 py-2.5 rounded-xl text-base font-mono-num font-bold text-cyan-300"
                  />
                </div>

                {/* Quick Cash Buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickCash(total)}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 border border-slate-700"
                  >
                    Uang Pas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickCash(20000)}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 border border-slate-700"
                  >
                    20.000
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickCash(50000)}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 border border-slate-700"
                  >
                    50.000
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickCash(100000)}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 border border-slate-700"
                  >
                    100.000
                  </button>
                </div>

                {/* Change or Warning */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  isPaymentInsufficient
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                    : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                }`}>
                  <span className="text-xs font-bold">
                    {isPaymentInsufficient ? 'Pembayaran tidak cukup:' : 'Kembalian:'}
                  </span>
                  <span className="text-base font-black font-mono-num">
                    {isPaymentInsufficient
                      ? formatRupiah(total - numericPaid)
                      : formatRupiah(change)}
                  </span>
                </div>
              </div>
            )}

            {/* QRIS / Transfer details */}
            {paymentMethod !== 'Cash' && (
              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-center mb-4 space-y-2">
                <i className={`fa-solid ${paymentMethod === 'QRIS' ? 'fa-qrcode text-4xl' : 'fa-building-columns text-3xl'} text-cyan-400`}></i>
                <p className="text-xs text-slate-300 font-semibold">
                  {paymentMethod === 'QRIS'
                    ? 'Tunjukkan QRIS kasir kepada pelanggan untuk discan.'
                    : 'Transfer Bank/E-Wallet: Pastikan bukti transfer terverifikasi.'}
                </p>
                <div className="text-xs text-cyan-400 font-mono">Jumlah: {formatRupiah(total)}</div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="w-1/3 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submitting || isPaymentInsufficient}
                onClick={handleProcessTransaction}
                className="w-2/3 py-2.5 rounded-xl neon-btn-primary text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check"></i>
                    <span>SELESAIKAN TRANSAKSI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL STRUK CETAK & PDF --- */}
      {receiptModalOpen && currentTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm glass-panel rounded-2xl p-6 border border-cyan-500/40 shadow-2xl relative text-black bg-white">
            <button
              onClick={() => setReceiptModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-black no-print"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>

            {/* Thermal Struk View */}
            <div id="receipt-print-area" className="font-mono text-xs text-slate-900 space-y-3">
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
                  <span className="font-bold">{currentTrx.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{currentTrx.date} {currentTrx.time}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>{currentTrx.username}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1 py-1 border-b border-dashed border-slate-400">
                {currentTrx.items?.map(it => (
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
                  <span>{formatRupiah(currentTrx.total)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Metode:</span>
                  <span>{currentTrx.payment_method}</span>
                </div>
                {currentTrx.payment_method === 'Cash' && (
                  <>
                    <div className="flex justify-between text-slate-700">
                      <span>Dibayar:</span>
                      <span>{formatRupiah(currentTrx.paid)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Kembalian:</span>
                      <span>{formatRupiah(currentTrx.change)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="text-center pt-2 text-[10px] text-slate-600">
                <p>{settings.receipt_footer || 'Terima kasih telah berbelanja!'}</p>
              </div>
            </div>

            {/* Receipt Actions: CETAK & PDF */}
            <div className="mt-5 pt-3 border-t border-slate-200 flex gap-2 no-print">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <i className="fa-solid fa-print"></i>
                <span>CETAK</span>
              </button>

              <button
                type="button"
                onClick={() => exportReceiptToPDF(settings, currentTrx)}
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
