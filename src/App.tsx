import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, Product, Transaction, FinanceRecord, StoreSettings } from './types';
import { db } from './services/db';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { KasirView } from './components/KasirView';
import { ProdukView } from './components/ProdukView';
import { KeuanganView } from './components/KeuanganView';
import { TransaksiView } from './components/TransaksiView';
import { LaporanView } from './components/LaporanView';
import { UsersView } from './components/UsersView';
import { ActivityView } from './components/ActivityView';
import { BackupView } from './components/BackupView';
import { SettingsView } from './components/SettingsView';
import { PanduanSupabaseView } from './components/PanduanSupabaseView';
import { GitHubFilesView } from './components/GitHubFilesView';
import { LoginModal, RegisterModal } from './components/AuthModals';
import { ChangePasswordModal } from './components/ChangePasswordModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Core Data
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [finance, setFinance] = useState<FinanceRecord[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({
    store_name: 'KASIRKU',
    store_address: 'Jl. Pemuda Bisnis No. 45, Jakarta Pusat',
    store_phone: '0812-3456-7890',
    receipt_footer: 'Terima kasih telah berbelanja!'
  });
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Modals
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [isMandatoryPasswordChange, setIsMandatoryPasswordChange] = useState(false);

  // Access Denied Alert
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  // Refresh functions
  const loadData = useCallback(async () => {
    try {
      const activeUser = await db.getActiveUser();
      if (activeUser) {
        setCurrentUser(activeUser);
        if (activeUser.must_change_password) {
          setIsMandatoryPasswordChange(true);
          setChangePasswordOpen(true);
        }
      } else {
        // Auto sign in as initial Super Admin Fransisko for seamless demonstration
        const res = await db.login('Fransisko', '09042005');
        if (res.success && res.user) {
          setCurrentUser(res.user);
          if (res.mustChangePassword) {
            setIsMandatoryPasswordChange(true);
            setChangePasswordOpen(true);
          }
        }
      }

      const [prods, trxs, fins, sets] = await Promise.all([
        db.getProducts(),
        db.getTransactions(activeUser?.role, activeUser?.username),
        db.getFinanceRecords(),
        db.getSettings()
      ]);

      setProducts(prods);
      setTransactions(trxs);
      setFinance(fins);
      setSettings(sets);
      setIsSupabaseConnected(db.isSupabaseConnected());
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefreshProducts = async () => {
    const data = await db.getProducts();
    setProducts(data);
  };

  const handleRefreshTransactions = async () => {
    const data = await db.getTransactions(currentUser?.role, currentUser?.username);
    setTransactions(data);
  };

  const handleRefreshFinance = async () => {
    const data = await db.getFinanceRecords();
    setFinance(data);
  };

  const handleRefreshSettings = async () => {
    const data = await db.getSettings();
    setSettings(data);
  };

  const handleTransactionSuccess = async (trx: Transaction) => {
    await handleRefreshTransactions();
    await handleRefreshProducts();
    await handleRefreshFinance();
  };

  const handleAccessDenied = (featureName: string) => {
    setAccessDeniedMessage(`AKSES DITOLAK: Fitur "${featureName}" hanya dapat digunakan oleh Super Admin.`);
    setTimeout(() => setAccessDeniedMessage(null), 4000);
  };

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari akun?')) {
      if (currentUser) {
        await db.logActivity(currentUser.username, 'LOGOUT', `User ${currentUser.username} telah logout`);
      }
      db.setActiveUser(null);
      setCurrentUser(null);
      setActiveTab('dashboard');
      setLoginOpen(true);
    }
  };

  const handleLoginSuccess = (user: UserProfile, mustChange?: boolean) => {
    setCurrentUser(user);
    if (mustChange || user.must_change_password) {
      setIsMandatoryPasswordChange(true);
      setChangePasswordOpen(true);
    }
    loadData();
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans antialiased">
      {/* Top Navbar */}
      <Navbar
        user={currentUser}
        settings={settings}
        isSupabaseConnected={isSupabaseConnected}
        onOpenLogin={() => setLoginOpen(true)}
        onOpenRegister={() => setRegisterOpen(true)}
        onOpenChangePassword={() => {
          setIsMandatoryPasswordChange(false);
          setChangePasswordOpen(true);
        }}
        onLogout={handleLogout}
        onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        activeTab={activeTab}
      />

      {/* Access Denied Toast Notification */}
      {accessDeniedMessage && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-2xl bg-rose-500/90 text-white font-bold text-xs shadow-[0_0_25px_rgba(244,63,94,0.6)] flex items-center gap-3 backdrop-blur-md border border-rose-400">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">
            <i className="fa-solid fa-ban"></i>
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-rose-200">Akses Dibatasi</div>
            <div>{accessDeniedMessage}</div>
          </div>
          <button
            onClick={() => setAccessDeniedMessage(null)}
            className="ml-2 text-rose-200 hover:text-white"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex w-full">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={currentUser}
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
          onAccessDenied={handleAccessDenied}
        />

        {/* Dynamic View Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {activeTab === 'dashboard' && (
            <DashboardView
              transactions={transactions}
              finance={finance}
              products={products}
              onNavigateToKasir={() => setActiveTab('kasir')}
              onNavigateToReports={() => setActiveTab('laporan')}
            />
          )}

          {activeTab === 'kasir' && currentUser && (
            <KasirView
              products={products}
              currentUser={currentUser}
              settings={settings}
              onTransactionSuccess={handleTransactionSuccess}
              onRefreshProducts={handleRefreshProducts}
            />
          )}

          {activeTab === 'kasir' && !currentUser && (
            <div className="glass-panel p-12 text-center rounded-2xl border border-cyan-500/30">
              <i className="fa-solid fa-lock text-4xl text-cyan-400 mb-3"></i>
              <h2 className="text-xl font-bold text-white">Silakan Login Terlebih Dahulu</h2>
              <p className="text-xs text-slate-400 mt-1 mb-4">Anda harus login untuk dapat melayani transaksi kasir.</p>
              <button
                onClick={() => setLoginOpen(true)}
                className="neon-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold"
              >
                Login Sekarang
              </button>
            </div>
          )}

          {activeTab === 'produk' && currentUser && (
            <ProdukView
              products={products}
              currentUser={currentUser}
              onRefreshProducts={handleRefreshProducts}
              onAccessDenied={handleAccessDenied}
            />
          )}

          {activeTab === 'keuangan' && currentUser && (
            <KeuanganView
              finance={finance}
              currentUser={currentUser}
              onRefreshFinance={handleRefreshFinance}
              onAccessDenied={handleAccessDenied}
            />
          )}

          {activeTab === 'transaksi' && currentUser && (
            <TransaksiView
              transactions={transactions}
              currentUser={currentUser}
              settings={settings}
              onRefreshTransactions={handleRefreshTransactions}
              onAccessDenied={handleAccessDenied}
            />
          )}

          {activeTab === 'laporan' && currentUser && (
            <LaporanView
              transactions={transactions}
              finance={finance}
              settings={settings}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'users' && currentUser && (
            <UsersView
              currentUser={currentUser}
              onAccessDenied={handleAccessDenied}
            />
          )}

          {activeTab === 'activity' && currentUser && (
            <ActivityView
              currentUser={currentUser}
            />
          )}

          {activeTab === 'backup' && currentUser && (
            <BackupView
              currentUser={currentUser}
              onRefreshAll={loadData}
            />
          )}

          {activeTab === 'settings' && currentUser && (
            <SettingsView
              settings={settings}
              currentUser={currentUser}
              onRefreshSettings={handleRefreshSettings}
              onSupabaseConfigChanged={loadData}
            />
          )}

          {activeTab === 'panduan' && (
            <PanduanSupabaseView />
          )}

          {activeTab === 'github_files' && (
            <GitHubFilesView />
          )}
        </main>
      </div>

      {/* Change Password Modal */}
      {currentUser && (
        <ChangePasswordModal
          user={currentUser}
          isOpen={changePasswordOpen}
          isMandatory={isMandatoryPasswordChange}
          onClose={() => {
            if (!isMandatoryPasswordChange) {
              setChangePasswordOpen(false);
            }
          }}
          onSuccess={(updated) => {
            setCurrentUser(updated);
            setIsMandatoryPasswordChange(false);
            setChangePasswordOpen(false);
          }}
        />
      )}

      {/* Login & Register Modals */}
      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={handleLoginSuccess}
        onSwitchToRegister={() => {
          setLoginOpen(false);
          setRegisterOpen(true);
        }}
      />

      <RegisterModal
        isOpen={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSwitchToLogin={() => {
          setRegisterOpen(false);
          setLoginOpen(true);
        }}
        onSuccess={() => {
          // Success
        }}
      />
    </div>
  );
}
