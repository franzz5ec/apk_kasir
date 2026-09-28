import React from 'react';
import { UserProfile, StoreSettings } from '../types';

interface Props {
  user: UserProfile | null;
  settings: StoreSettings;
  isSupabaseConnected: boolean;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenChangePassword: () => void;
  onLogout: () => void;
  onToggleMobileSidebar: () => void;
  activeTab: string;
}

export const Navbar: React.FC<Props> = ({
  user,
  settings,
  isSupabaseConnected,
  onOpenLogin,
  onOpenRegister,
  onOpenChangePassword,
  onLogout,
  onToggleMobileSidebar,
  activeTab
}) => {
  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-cyan-500/20 backdrop-blur-xl px-4 sm:px-6 py-3 flex items-center justify-between no-print">
      {/* Left: Mobile hamburger & Store Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-cyan-950/40 border border-slate-700/50"
          aria-label="Toggle Menu"
        >
          <i className="fa-solid fa-bars text-lg"></i>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center text-black font-extrabold text-lg shadow-[0_0_15px_rgba(0,240,255,0.4)]">
            <i className="fa-solid fa-cash-register text-sm"></i>
          </div>
          <div>
            <span className="text-lg font-black tracking-wider text-white">
              {settings.store_name || 'KASIRKU'}
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-mono">
              POS & Keuangan
            </span>
          </div>
        </div>
      </div>

      {/* Center: Database Mode Indicator badge */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            isSupabaseConnected
              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
              : 'bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.8)]'
          }`}
        ></span>
        <span className="text-slate-300 font-medium">
          {isSupabaseConnected ? 'Supabase Online (PostgreSQL)' : 'Mode Lokal / Demo Terpadu'}
        </span>
      </div>

      {/* Right: User Status & Actions */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Info Badge */}
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800/80 px-3 py-1.5 rounded-xl">
              <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-400/50 flex items-center justify-center text-cyan-300 text-xs font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5 leading-tight">
                  <span>{user.username}</span>
                  {user.role === 'super_admin' ? (
                    <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded">
                      SUPER ADMIN
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-slate-700/60 text-slate-300 border border-slate-600 rounded">
                      KASIR
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400">{user.phone}</div>
              </div>
            </div>

            {/* Quick Change Password Action */}
            <button
              onClick={onOpenChangePassword}
              title="Ubah Password"
              className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-800 border border-slate-800 transition"
            >
              <i className="fa-solid fa-key text-sm"></i>
            </button>

            {/* Logout Action */}
            <button
              onClick={onLogout}
              title="Keluar"
              className="p-2 rounded-xl text-rose-400 hover:text-rose-200 hover:bg-rose-950/30 border border-rose-900/40 transition"
            >
              <i className="fa-solid fa-arrow-right-from-bracket text-sm"></i>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenLogin}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              Login
            </button>
            <button
              onClick={onOpenRegister}
              className="px-3.5 py-1.5 rounded-xl neon-btn-primary text-xs font-bold transition"
            >
              Daftar
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
