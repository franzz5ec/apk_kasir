import React, { useState } from 'react';
import { db } from '../services/db';
import { UserProfile } from '../types';

interface LoginProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile, mustChangePassword?: boolean) => void;
  onSwitchToRegister: () => void;
}

export const LoginModal: React.FC<LoginProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToRegister
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await db.login(identifier, password);
      if (res.success && res.user) {
        onSuccess(res.user, res.mustChangePassword);
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFransisko = () => {
    setIdentifier('Fransisko');
    setPassword('09042005');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-md glass-panel rounded-2xl p-6 sm:p-8 border border-cyan-500/30 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 text-2xl mb-3 shadow-[0_0_20px_rgba(0,240,255,0.3)]">
            <i className="fa-solid fa-cash-register"></i>
          </div>
          <h2 className="text-2xl font-black tracking-wider text-white">
            KASIR<span className="text-cyan-400">KU</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Sistem Kasir & Pencatatan Keuangan</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation text-rose-400 text-sm"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Username / Nomor Telepon
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-cyan-400/70 text-sm">
                <i className="fa-regular fa-user"></i>
              </span>
              <input
                type="text"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="Contoh: Fransisko / 081234567890"
                className="w-full glass-input pl-10 pr-3.5 py-2.5 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-cyan-400/70 text-sm">
                <i className="fa-solid fa-lock"></i>
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="********"
                className="w-full glass-input pl-10 pr-3.5 py-2.5 rounded-xl text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl neon-btn-primary text-sm font-bold flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-arrow-right-to-bracket"></i>
                <span>LOGIN</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Helper for Super Admin Demo */}
        <div className="mt-5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 mb-1.5">Akun Super Admin Awal:</p>
          <button
            type="button"
            onClick={handleQuickFransisko}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono py-1 px-3 rounded bg-cyan-950/40 border border-cyan-500/30 transition inline-flex items-center gap-1.5"
          >
            <i className="fa-solid fa-bolt text-[10px]"></i>
            Isi Otomatis Fransisko (Super Admin)
          </button>
        </div>

        <div className="mt-5 text-center text-xs text-slate-400">
          Belum punya akun?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline"
          >
            Daftar Kasir Baru
          </button>
        </div>
      </div>
    </div>
  );
};

interface RegisterProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  onSuccess: () => void;
}

export const RegisterModal: React.FC<RegisterProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
  onSuccess
}) => {
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak sesuai!');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter!');
      return;
    }

    setLoading(true);
    try {
      const res = await db.register(username, phone, password, confirmPassword);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onSuccess();
          onSwitchToLogin();
        }, 1200);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftarkan akun.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-md glass-panel rounded-2xl p-6 sm:p-8 border border-cyan-500/30 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 text-xl mb-2">
            <i className="fa-solid fa-user-plus"></i>
          </div>
          <h2 className="text-xl font-bold tracking-wide text-white">Buat Akun Kasir</h2>
          <p className="text-xs text-slate-400 mt-1">Daftar untuk mengakses sistem transaksi kasir</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation text-rose-400 text-sm"></i>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <i className="fa-solid fa-check-circle text-emerald-400 text-sm"></i>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Username (Unik)
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Contoh: kasir_budi"
              className="w-full glass-input px-3.5 py-2.5 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Nomor Telepon (Unik)
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Contoh: 081298765432"
              className="w-full glass-input px-3.5 py-2.5 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Password (Min 6 Karakter)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="********"
              className="w-full glass-input px-3.5 py-2.5 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Konfirmasi Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Ketik ulang password"
              className="w-full glass-input px-3.5 py-2.5 rounded-xl text-sm"
            />
          </div>

          <p className="text-[11px] text-slate-400 italic">
            *Pengguna baru akan otomatis mendapatkan hak akses sebagai role <strong>user (kasir)</strong> dan status <strong>active</strong>.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl neon-btn-primary text-sm font-bold flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span>Mendaftarkan...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-user-check"></i>
                <span>DAFTAR</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-slate-400">
          Sudah memiliki akun?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline"
          >
            Login di Sini
          </button>
        </div>
      </div>
    </div>
  );
};
