import React from 'react';
import { UserProfile } from '../types';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  superAdminOnly?: boolean;
  badge?: string;
}

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserProfile | null;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onAccessDenied: (featureName: string) => void;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  user,
  mobileOpen,
  setMobileOpen,
  onAccessDenied
}) => {
  const isSuperAdmin = user?.role === 'super_admin';

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge-high' },
    { id: 'kasir', label: 'Kasir (POS)', icon: 'fa-cash-register', badge: 'Utama' },
    { id: 'produk', label: isSuperAdmin ? 'Manajemen Barang' : 'Lihat Produk', icon: 'fa-boxes-stacked' },
    { id: 'keuangan', label: 'Keuangan', icon: 'fa-wallet', superAdminOnly: true },
    { id: 'transaksi', label: isSuperAdmin ? 'Semua Transaksi' : 'Transaksi Saya', icon: 'fa-receipt' },
    { id: 'laporan', label: isSuperAdmin ? 'Laporan Lengkap' : 'Laporan Terbatas', icon: 'fa-chart-line' },
    { id: 'users', label: 'Manajemen User', icon: 'fa-users-gear', superAdminOnly: true },
    { id: 'activity', label: 'Riwayat Aktivitas', icon: 'fa-clock-rotate-left', superAdminOnly: true },
    { id: 'backup', label: 'Backup & Restore', icon: 'fa-database', superAdminOnly: true },
    { id: 'settings', label: 'Pengaturan Toko', icon: 'fa-gear', superAdminOnly: true },
    { id: 'panduan', label: 'Panduan Supabase', icon: 'fa-book-bookmark' },
    { id: 'github_files', label: 'File GitHub Pages', icon: 'fa-file-code' }
  ];

  const handleItemClick = (item: NavItem) => {
    if (item.superAdminOnly && !isSuperAdmin) {
      onAccessDenied(item.label);
      return;
    }
    setActiveTab(item.id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="sidebar-container"
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 glass-panel border-r border-cyan-500/20 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static no-print`}
      >
        {/* Sidebar Header */}
        <div className="p-4 sm:p-5 border-b border-cyan-500/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 text-sm shadow-[0_0_10px_rgba(0,240,255,0.3)]">
              <i className="fa-solid fa-layer-group"></i>
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-wider text-white">MENU NAVIGASI</h1>
              <p className="text-[10px] text-cyan-400/80 font-mono">KASIRKU v2026.1</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            const isLocked = item.superAdminOnly && !isSuperAdmin;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : isLocked
                    ? 'text-slate-500 hover:text-slate-400 hover:bg-slate-900/40 cursor-not-allowed opacity-60'
                    : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 text-center text-sm ${
                      isActive ? 'text-cyan-400 neon-text-glow' : isLocked ? 'text-slate-600' : 'text-slate-400 group-hover:text-cyan-400'
                    }`}
                  >
                    <i className={`fa-solid ${item.icon}`}></i>
                  </span>
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {isLocked && (
                    <span title="Khusus Super Admin" className="text-amber-500/80 text-[10px]">
                      <i className="fa-solid fa-lock"></i>
                    </span>
                  )}
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* User Card & Security Info */}
        <div className="p-3 border-t border-cyan-500/10 bg-slate-950/40 text-[11px]">
          {user ? (
            <div className="rounded-xl p-2.5 bg-slate-900/70 border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400">Hak Akses:</span>
                <span className={`font-mono font-bold ${isSuperAdmin ? 'text-cyan-400' : 'text-slate-300'}`}>
                  {user.role}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Status Akun:</span>
                <span className="text-emerald-400 font-medium">● {user.status}</span>
              </div>
            </div>
          ) : (
            <div className="text-center p-2 text-slate-400">
              <p>Belum login</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
