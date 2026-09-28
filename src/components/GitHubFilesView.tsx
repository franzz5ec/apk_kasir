import React, { useState } from 'react';

interface FileItem {
  path: string;
  name: string;
  type: 'html' | 'css' | 'js' | 'sql' | 'md';
  desc: string;
}

export const GitHubFilesView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('kasirku/index.html');
  const [copied, setCopied] = useState(false);

  const fileTree: FileItem[] = [
    { path: 'kasirku/index.html', name: 'index.html', type: 'html', desc: 'Halaman Beranda & Navigasi Utama' },
    { path: 'kasirku/login.html', name: 'login.html', type: 'html', desc: 'Halaman Login Kasir & Super Admin' },
    { path: 'kasirku/register.html', name: 'register.html', type: 'html', desc: 'Halaman Pendaftaran Kasir Baru' },
    { path: 'kasirku/dashboard.html', name: 'dashboard.html', type: 'html', desc: 'Dashboard Statistik & Grafik' },
    { path: 'kasirku/kasir.html', name: 'kasir.html', type: 'html', desc: 'POS Kasir, Keranjang, Struk' },
    { path: 'kasirku/produk.html', name: 'produk.html', type: 'html', desc: 'Manajemen & Update Barang' },
    { path: 'kasirku/keuangan.html', name: 'keuangan.html', type: 'html', desc: 'Pencatatan Pemasukan & Pengeluaran' },
    { path: 'kasirku/transaksi.html', name: 'transaksi.html', type: 'html', desc: 'Riwayat & Cetak Ulang Struk' },
    { path: 'kasirku/laporan.html', name: 'laporan.html', type: 'html', desc: 'Laporan & Export PDF / Word' },
    { path: 'kasirku/users.html', name: 'users.html', type: 'html', desc: 'Manajemen Pengguna (Super Admin)' },
    { path: 'kasirku/activity.html', name: 'activity.html', type: 'html', desc: 'Riwayat Audit Trail Log' },
    { path: 'kasirku/settings.html', name: 'settings.html', type: 'html', desc: 'Pengaturan Toko & Supabase' },
    { path: 'kasirku/css/style.css', name: 'css/style.css', type: 'css', desc: 'Style Black + Neon Blue Glassmorphism' },
    { path: 'kasirku/js/config.js', name: 'js/config.js', type: 'js', desc: 'Kredensial Supabase URL & Anon Key' },
    { path: 'kasirku/js/supabase.js', name: 'js/supabase.js', type: 'js', desc: 'Klien Supabase SDK' },
    { path: 'kasirku/js/auth.js', name: 'js/auth.js', type: 'js', desc: 'Autentikasi & Proteksi Role' },
    { path: 'kasirku/js/app.js', name: 'js/app.js', type: 'js', desc: 'Utilitas Bersama & Navigasi' }
  ];

  const getCodeSnippet = (path: string) => {
    if (path.endsWith('config.js')) {
      return `// =======================================================
// KASIRKU - SUPABASE CONFIGURATION
// Ganti dengan URL dan Publishable Key dari project Supabase Anda
// =======================================================

const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_ANON_KEY";

// Petunjuk:
// 1. Buat project gratis di https://supabase.com
// 2. Buka Project Settings > API
// 3. Salin Project URL dan anon public key ke dalam file ini.
// 4. JANGAN masukkan service_role key ke file ini!
`;
    }
    if (path.endsWith('supabase.js')) {
      return `// Supabase Client Initialization
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
`;
    }
    if (path.endsWith('style.css')) {
      return `/* KASIRKU Theme - Black, Neon Blue & Glassmorphism */
:root {
  --bg-dark: #080c14;
  --panel-bg: rgba(13, 20, 36, 0.75);
  --neon-blue: #00f0ff;
  --accent-blue: #0284c7;
  --border-glow: rgba(56, 189, 248, 0.25);
}

body {
  background-color: var(--bg-dark);
  color: #f1f5f9;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.glass-card {
  background: var(--panel-bg);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-glow);
  border-radius: 1rem;
}

.neon-btn {
  background: linear-gradient(135deg, #0284c7 0%, #00f0ff 100%);
  color: #040c1a;
  font-weight: 700;
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.4);
}
`;
    }
    return `<!-- KASIRKU: ${path} -->
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KASIRKU - ${path}</title>
  <!-- Bootstrap 5 CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <!-- Font Awesome -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <!-- Custom Neon Theme -->
  <link rel="stylesheet" href="css/style.css">
</head>
<body class="bg-dark text-light">
  <!-- Standalone Module Ready for GitHub Pages -->
  <div class="container py-4">
    <div class="glass-card p-4">
      <h2 class="text-cyan-400">KASIRKU - Sistem Kasir & Keuangan</h2>
      <p class="text-secondary">Modul siap publish di GitHub Pages dengan database Supabase.</p>
    </div>
  </div>
</body>
</html>`;
  };

  const currentSnippet = getCodeSnippet(selectedFile);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-cyan-500/20">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <i className="fa-solid fa-folder-tree text-cyan-400"></i>
            <span>STRUKTUR FILE GITHUB PAGES (FOLDER /kasirku/)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Seluruh berkas HTML, CSS, dan JS statis terpisah sesuai spesifikasi proyek untuk diunggah langsung ke repository GitHub Pages.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: File Tree list */}
        <div className="lg:col-span-5 glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center justify-between">
            <span>Daftar File Statis</span>
            <span className="font-mono text-cyan-400">{fileTree.length} Files</span>
          </div>

          <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
            {fileTree.map(file => (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file.path)}
                className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition ${
                  selectedFile === file.path
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                    : 'text-slate-300 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <i className={`fa-regular ${
                    file.type === 'html' ? 'fa-file-code text-orange-400' :
                    file.type === 'css' ? 'fa-file-lines text-blue-400' :
                    file.type === 'js' ? 'fa-file-code text-yellow-400' : 'fa-file text-slate-400'
                  }`}></i>
                  <span className="font-mono font-medium truncate">{file.name}</span>
                </div>
                <span className="text-[10px] text-slate-500 hidden sm:inline">{file.type.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Code preview and copy */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-code text-cyan-400 text-sm"></i>
                <span className="font-mono text-xs font-bold text-white">{selectedFile}</span>
              </div>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg neon-btn-primary text-xs font-bold flex items-center gap-1.5"
              >
                <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                <span>{copied ? 'Tersalin' : 'Salin Isi'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-[420px] whitespace-pre-wrap leading-relaxed">
              {currentSnippet}
            </pre>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Siap di-copy atau di-deploy langsung ke GitHub Pages.</span>
            <span className="text-cyan-400 font-mono">100% Client-Side Pure HTML/JS</span>
          </div>
        </div>
      </div>
    </div>
  );
};
