import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { db } from '../services/db';

interface Props {
  currentUser: UserProfile;
  onAccessDenied: (featureName: string) => void;
}

export const UsersView: React.FC<Props> = ({
  currentUser,
  onAccessDenied
}) => {
  const isSuperAdmin = currentUser.role === 'super_admin';

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const data = await db.getProfiles();
      setProfiles(data);
    } catch (e: any) {
      setErrorMsg('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadProfiles();
    }
  }, [isSuperAdmin]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleToggleStatus = async (user: UserProfile) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    const res = await db.updateUserStatus(user.user_id, nextStatus);
    if (res.success) {
      showToast(res.message);
      loadProfiles();
    } else {
      alert(res.message);
    }
  };

  const handleToggleRole = async (user: UserProfile) => {
    const nextRole = user.role === 'super_admin' ? 'user' : 'super_admin';
    if (confirm(`Ubah role pengguna ${user.username} menjadi "${nextRole}"?`)) {
      const res = await db.updateUserRole(user.user_id, nextRole);
      if (res.success) {
        showToast(res.message);
        loadProfiles();
      } else {
        alert(res.message);
      }
    }
  };

  const handleResetPassword = async (user: UserProfile) => {
    const newPass = prompt(`Masukkan password baru untuk user "${user.username}":`, '123456');
    if (!newPass) return;
    if (newPass.length < 6) {
      alert('Password minimal 6 karakter!');
      return;
    }

    const res = await db.resetUserPassword(user.user_id, newPass);
    if (res.success) {
      showToast(res.message);
      loadProfiles();
    } else {
      alert(res.message);
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (confirm(`Apakah Anda yakin ingin menghapus user "${user.username}"?`)) {
      const res = await db.deleteUser(user.user_id);
      if (res.success) {
        showToast(res.message);
        loadProfiles();
      } else {
        alert(res.message);
      }
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
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-16 right-4 z-50 p-4 rounded-xl bg-emerald-500/90 text-black font-bold text-xs shadow-2xl flex items-center gap-2">
          <i className="fa-solid fa-circle-check text-base"></i>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-cyan-500/20">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>MANAJEMEN USER & KASIR</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              {profiles.length} Pengguna
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kelola hak akses Super Admin dan Kasir. Password tersimpan secara terenkripsi di Supabase Auth.
          </p>
        </div>

        <button
          onClick={loadProfiles}
          disabled={loading}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold border border-slate-700 transition flex items-center gap-2"
        >
          <i className={`fa-solid fa-arrows-rotate ${loading ? 'fa-spin' : ''}`}></i>
          <span>Segarkan Data</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Users Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-cyan-400 uppercase font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Nomor Telepon</th>
                <th className="py-3 px-4 text-center">Role</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Tanggal Daftar</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {profiles.map(p => (
                <tr key={p.id} className="hover:bg-slate-900/50 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-[10px] text-cyan-300">
                        {p.username.charAt(0).toUpperCase()}
                      </div>
                      <span>{p.username}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">{p.phone}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleRole(p)}
                      title="Klik untuk ubah role"
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold transition ${
                        p.role === 'super_admin'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {p.role === 'super_admin' ? 'SUPER ADMIN' : 'KASIR (USER)'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleStatus(p)}
                      title="Klik untuk aktifkan / nonaktifkan"
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                        p.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                      }`}
                    >
                      ● {p.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString('id-ID') : '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleResetPassword(p)}
                        title="Reset Password Pengguna"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-600 hover:text-black text-amber-400 border border-amber-500/30 transition text-xs"
                      >
                        <i className="fa-solid fa-key"></i>
                      </button>

                      <button
                        onClick={() => handleDeleteUser(p)}
                        title="Hapus Pengguna"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 hover:text-white text-rose-400 border border-rose-500/30 transition text-xs"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
