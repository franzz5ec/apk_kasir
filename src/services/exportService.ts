import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, StoreSettings } from '../types';

export interface ReportSummary {
  periodLabel: string;
  totalTransactions: number;
  totalOmzet: number;
  totalPengeluaran: number;
  totalKeuntungan: number;
}

export function formatRupiah(amount: number): string {
  return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
}

export function exportReportToPDF(
  settings: StoreSettings,
  summary: ReportSummary,
  transactions: Transaction[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const filename = `Laporan_Kasir_${todayStr}.pdf`;

  // Header Banner
  doc.setFillColor(8, 14, 28);
  doc.rect(0, 0, 210, 38, 'F');

  // Accent Line Neon Blue
  doc.setFillColor(0, 240, 255);
  doc.rect(0, 37, 210, 2, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(0, 240, 255);
  doc.text(settings.store_name || 'KASIRKU', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(200, 220, 240);
  doc.text('Sistem Kasir & Pencatatan Keuangan', 14, 23);
  doc.text(`${settings.store_address || ''} | Telp: ${settings.store_phone || ''}`, 14, 30);

  // Subheader & Period
  let currentY = 48;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN KEUANGAN & PENJUALAN', 14, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Periode: ${summary.periodLabel} (Dicetak pada: ${new Date().toLocaleString('id-ID')})`, 14, currentY);

  // Summary Metrics Box
  currentY += 8;
  const boxWidth = 43;
  const boxHeight = 22;
  const startX = 14;
  const gap = 6;

  const metrics = [
    { title: 'Total Transaksi', val: `${summary.totalTransactions} TRX`, color: [14, 116, 144] },
    { title: 'Total Omzet', val: formatRupiah(summary.totalOmzet), color: [16, 185, 129] },
    { title: 'Total Pengeluaran', val: formatRupiah(summary.totalPengeluaran), color: [239, 68, 68] },
    { title: 'Total Keuntungan', val: formatRupiah(summary.totalKeuntungan), color: [16, 149, 193] }
  ];

  metrics.forEach((m, idx) => {
    const x = startX + idx * (boxWidth + gap);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, currentY, boxWidth, boxHeight, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, boxWidth, boxHeight, 2, 2, 'S');

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(m.title, x + 3, currentY + 7);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.val, x + 3, currentY + 16);
    doc.setFont('helvetica', 'normal');
  });

  // Table of Transactions
  currentY += boxHeight + 10;
  const tableRows = transactions.map((t, index) => [
    index + 1,
    t.date,
    t.id,
    t.username,
    t.payment_method,
    formatRupiah(t.total)
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['No', 'Tanggal', 'No Transaksi', 'Kasir', 'Metode', 'Total']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [8, 14, 28],
      textColor: [0, 240, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 42 },
      3: { cellWidth: 32 },
      4: { cellWidth: 28 },
      5: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
    },
    foot: [
      ['', '', '', '', 'TOTAL OMZET', formatRupiah(summary.totalOmzet)]
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      halign: 'right'
    }
  });

  // Save the PDF
  doc.save(filename);
}

export function exportReceiptToPDF(settings: StoreSettings, trx: Transaction) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 160] // standard 80mm thermal receipt format
  });

  const width = 80;
  let y = 10;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(settings.store_name || 'KASIRKU', width / 2, y, { align: 'center' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Sistem Kasir & Pencatatan Keuangan', width / 2, y, { align: 'center' });

  if (settings.store_address) {
    y += 4;
    doc.setFontSize(7);
    doc.text(settings.store_address, width / 2, y, { align: 'center' });
  }

  y += 5;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(6, y, width - 6, y);

  // Meta
  y += 5;
  doc.setFontSize(7.5);
  doc.text(`No Transaksi: ${trx.id}`, 6, y);
  y += 4;
  doc.text(`Tanggal: ${trx.date} ${trx.time || ''}`, 6, y);
  y += 4;
  doc.text(`Kasir: ${trx.username}`, 6, y);

  y += 4;
  doc.line(6, y, width - 6, y);

  // Items
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Item', 6, y);
  doc.text('Total', width - 6, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');

  if (trx.items && trx.items.length > 0) {
    trx.items.forEach(item => {
      y += 5;
      doc.text(`${item.product_name} x${item.quantity}`, 6, y);
      doc.text(formatRupiah(item.subtotal), width - 6, y, { align: 'right' });
    });
  } else {
    y += 5;
    doc.text(`Penjualan Umum x1`, 6, y);
    doc.text(formatRupiah(trx.total), width - 6, y, { align: 'right' });
  }

  y += 5;
  doc.line(6, y, width - 6, y);

  // Calculations
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL', 6, y);
  doc.text(formatRupiah(trx.total), width - 6, y, { align: 'right' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Pembayaran: ${trx.payment_method}`, 6, y);

  if (trx.payment_method === 'Cash') {
    y += 4;
    doc.text(`Dibayar:`, 6, y);
    doc.text(formatRupiah(trx.paid), width - 6, y, { align: 'right' });

    y += 4;
    doc.text(`Kembalian:`, 6, y);
    doc.text(formatRupiah(trx.change), width - 6, y, { align: 'right' });
  }

  y += 6;
  doc.line(6, y, width - 6, y);

  y += 6;
  doc.setFontSize(8);
  doc.text(settings.receipt_footer || 'Terima kasih telah berbelanja!', width / 2, y, { align: 'center' });

  doc.save(`Struk_${trx.id}.pdf`);
}

export function exportReportToWord(
  settings: StoreSettings,
  summary: ReportSummary,
  transactions: Transaction[]
) {
  const todayStr = new Date().toISOString().split('T')[0];
  const filename = `Laporan_Kasir_${todayStr}.doc`;

  const rowsHtml = transactions.map((t, idx) => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${idx + 1}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${t.date}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${t.id}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${t.username}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${t.payment_method}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">${formatRupiah(t.total)}</td>
    </tr>
  `).join('');

  const wordContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Laporan Keuangan ${settings.store_name}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1e293b; }
        .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 24px; }
        .title { font-size: 24px; font-weight: bold; color: #0369a1; margin: 0; }
        .subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }
        .summary-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
        .summary-grid { width: 100%; border-collapse: collapse; }
        .summary-grid td { padding: 10px; border: 1px solid #e2e8f0; }
        .table-data { width: 100%; border-collapse: collapse; margin-top: 16px; }
        .table-data th { background: #0f172a; color: #ffffff; padding: 10px; border: 1px solid #334155; text-align: left; }
        .footer { margin-top: 30px; text-align: right; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">${settings.store_name}</h1>
        <div class="subtitle">Sistem Kasir & Pencatatan Keuangan | ${settings.store_address || ''} | Telp: ${settings.store_phone || ''}</div>
      </div>

      <h2>LAPORAN KEUANGAN & TRANSAKSI</h2>
      <p><strong>Periode:</strong> ${summary.periodLabel} | <strong>Dicetak:</strong> ${new Date().toLocaleString('id-ID')}</p>

      <div class="summary-box">
        <h3>RINGKASAN EKSEKUTIF</h3>
        <table class="summary-grid">
          <tr>
            <td><strong>Total Transaksi:</strong></td>
            <td>${summary.totalTransactions} Transaksi</td>
            <td><strong>Total Omzet:</strong></td>
            <td style="color: #059669; font-weight: bold;">${formatRupiah(summary.totalOmzet)}</td>
          </tr>
          <tr>
            <td><strong>Total Pengeluaran:</strong></td>
            <td style="color: #dc2626; font-weight: bold;">${formatRupiah(summary.totalPengeluaran)}</td>
            <td><strong>Total Keuntungan Bersih:</strong></td>
            <td style="color: #0284c7; font-weight: bold;">${formatRupiah(summary.totalKeuntungan)}</td>
          </tr>
        </table>
        <p style="font-size: 11px; color: #64748b; margin-top: 8px;"><em>*Rumus: Keuntungan = Total Omzet - Total Pengeluaran</em></p>
      </div>

      <h3>DETAIL TRANSAKSI PENJUALAN</h3>
      <table class="table-data">
        <thead>
          <tr>
            <th>No</th>
            <th>Tanggal</th>
            <th>No Transaksi</th>
            <th>Kasir</th>
            <th>Metode</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr style="background: #f1f5f9; font-weight: bold;">
            <td colspan="5" style="border: 1px solid #ddd; padding: 8px; text-align: right;">TOTAL OMZET:</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right; color: #0284c7;">${formatRupiah(summary.totalOmzet)}</td>
          </tr>
        </tfoot>
      </table>

      <div class="footer">
        Dicetak secara otomatis oleh sistem ${settings.store_name} &bull; Siap Hosting di GitHub Pages
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', wordContent], {
    type: 'application/msword'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
