import React, { useState } from 'react';
import { db } from '../services/db';
import { UserProfile } from '../types';

interface Props {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: UserProfile) => void;
  isMandatory?: boolean;
}

export const ChangePasswordModal: React.FC<Props> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
  isMandatory = false
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!oldPassword) {
      setError('Password lama wajib diisi!');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok dengan password baru!');
      return;
    }

    setLoading(true);
    try {
      const res = await db.changePassword(user.user_id, oldPassword, newPassword);
      if (res.success) {
        const updated = await db.getActiveUser();
        if (updated) {
          onSuccess(updated);
        }
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengganti password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-cyan-500/30 shadow-2xl relative">
        {!isMandatory && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        )}

        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xl border border-cyan-500/40">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">UBAH PASSWORD</h2>
          {isMandatory ? (
            <div className="mt-2 text-sm text-amber-300 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/30">
              <i className="fa-solid fa-triangle-exclamation mr-1.5"></i>
              Untuk keamanan, silakan ubah password default Anda.
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-1">Perbarui kata sandi Anda secara berkala untuk menjaga keamanan akun.</p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation text-rose-400 text-sm"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Password Lama
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                placeholder="********"
                className="w-full glass-input px-3.5 py-2.5 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Password Baru
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full glass-input px-3.5 py-2.5 rounded-lg text-sm"
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
              placeholder="Ketik ulang password baru"
              className="w-full glass-input px-3.5 py-2.5 rounded-lg text-sm"
            />
          </div>

          <div className="pt-2 flex gap-3">
            {!isMandatory && (
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`${isMandatory ? 'w-full' : 'w-2/3'} py-2.5 rounded-lg neon-btn-primary text-sm font-bold flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-lock"></i>
                  <span>SIMPAN PASSWORD BARU</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
