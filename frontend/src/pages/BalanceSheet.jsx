import { ButtonSpinner } from '../components/Spinner';
import { TableSkeleton } from '../components/Skeleton';
import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import { IndianRupee, Filter, FileDown, FileSpreadsheet, Building2, Printer, CalendarDays, ChevronDown, Lock, Unlock, RotateCcw } from 'lucide-react';
import { useSocietyConfig } from '../context/SocietyConfigContext';
import { getTypeColor } from '../utils/typeColors';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const fmt = (n) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function getDefaultDates() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] };
}

function formatDateIndian(d) {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function BalanceSheet() {
  const { config: societyConfig } = useSocietyConfig();
  const defaults = getDefaultDates();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(defaults.from);
  const [toDate, setToDate] = useState(defaults.to);
  const [tab, setTab] = useState('summary');
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  const fetchData = useCallback(async (fd, td) => {
    setLoading(true);
    try {
      const { data: res } = await adminAPI.getBalanceSheet(fd || undefined, td || undefined);
      setData(res);
    } catch (err) { console.error('Failed to load balance sheet', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(fromDate, toDate); }, []);

  const handleFilter = () => fetchData(fromDate, toDate);
  const clearFilter = () => { const d = getDefaultDates(); setFromDate(d.from); setToDate(d.to); fetchData(d.from, d.to); };

  const periodLabel = fromDate && toDate ? `${formatDateIndian(fromDate)} to ${formatDateIndian(toDate)}` : 'All Time';

  const exportPDF = () => {
    if (!data) return;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pw = doc.internal.pageSize.getWidth();
    let y = 15;

    doc.setFontSize(16); doc.setFont(undefined, 'bold');
    doc.text(societyConfig.societyName || 'Society Management', pw / 2, y, { align: 'center' }); y += 7;
    doc.setFontSize(10); doc.setFont(undefined, 'normal');
    doc.text(societyConfig.tagline || 'Society Management', pw / 2, y, { align: 'center' }); y += 6;
    doc.setFontSize(12); doc.setFont(undefined, 'bold');
    doc.text('Receipts & Payments Account', pw / 2, y, { align: 'center' }); y += 6;
    doc.setFontSize(9); doc.setFont(undefined, 'normal');
    doc.text(`Period: ${periodLabel}`, pw / 2, y, { align: 'center' }); y += 4;
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pw / 2, y, { align: 'center' }); y += 8;

    doc.setFontSize(11); doc.setFont(undefined, 'bold');
    doc.text('Schedule A: Income (Receipts)', 14, y); y += 2;
    autoTable(doc, {
      startY: y,
      head: [['Sl.', 'Particulars', 'Count', 'Amount (Rs.)']],
      body: [
        ...data.incomeBreakdown.map((item, i) => [i + 1, item.type.replace(/_/g, ' '), item.count, fmt(item.amount)]),
        [{ content: 'Total Income (A)', colSpan: 3, styles: { fontStyle: 'bold', halign: 'right' } }, { content: fmt(data.totalIncome), styles: { fontStyle: 'bold' } }],
      ],
      theme: 'grid', styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [13, 166, 132], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { halign: 'center', cellWidth: 12 }, 3: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;

    doc.setFontSize(11); doc.setFont(undefined, 'bold');
    doc.text('Schedule B: Expenditure (Payments)', 14, y); y += 2;
    autoTable(doc, {
      startY: y,
      head: [['Sl.', 'Particulars', 'Count', 'Amount (Rs.)']],
      body: [
        ...data.expenseBreakdown.map((item, i) => [i + 1, item.category.replace(/_/g, ' '), item.count, fmt(item.amount)]),
        [{ content: 'Total Expenditure (B)', colSpan: 3, styles: { fontStyle: 'bold', halign: 'right' } }, { content: fmt(data.totalExpense), styles: { fontStyle: 'bold' } }],
      ],
      theme: 'grid', styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [239, 52, 99], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { halign: 'center', cellWidth: 12 }, 3: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;

    // Refunds / Reversals
    if (data.refundBreakdown && data.refundBreakdown.length > 0) {
      doc.setFontSize(11); doc.setFont(undefined, 'bold');
      doc.text('Less: Refunds / Reversals', 14, y); y += 2;
      autoTable(doc, {
        startY: y,
        head: [['Sl.', 'Income Type Reversed', 'Count', 'Amount (Rs.)']],
        body: [
          ...data.refundBreakdown.map((item, i) => [i + 1, item.type.replace(/_/g, ' '), item.count, fmt(item.amount)]),
          [{ content: 'Total Refunds', colSpan: 3, styles: { fontStyle: 'bold', halign: 'right' } }, { content: fmt(data.totalRefunds), styles: { fontStyle: 'bold' } }],
        ],
        theme: 'grid', styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 0: { halign: 'center', cellWidth: 12 }, 3: { halign: 'right' } },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    // Schedule C: Reserve Fund Summary
    if (data.reserveBreakdown && data.reserveBreakdown.length > 0) {
      doc.setFontSize(11); doc.setFont(undefined, 'bold');
      doc.text('Schedule C: Reserve Fund Summary', 14, y); y += 2;
      autoTable(doc, {
        startY: y,
        head: [['Fund Type', 'Collected (Rs.)', 'Released (Rs.)', 'Locked (Rs.)']],
        body: [
          ...data.reserveBreakdown.map(item => [item.fundType.replace(/_/g, ' '), fmt(item.collected), fmt(item.released), fmt(item.locked)]),
          [{ content: 'Totals', styles: { fontStyle: 'bold' } }, { content: fmt(data.totalReserveFunds ?? 0), styles: { fontStyle: 'bold' } }, { content: fmt(data.releasedReserveFunds ?? 0), styles: { fontStyle: 'bold' } }, { content: fmt(data.lockedReserveFunds ?? 0), styles: { fontStyle: 'bold' } }],
        ],
        theme: 'grid', styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [217, 119, 6], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    // Net Balance Summary
    doc.setFontSize(11); doc.setFont(undefined, 'bold');
    doc.text('Net Balance Summary', 14, y); y += 6;
    doc.setFontSize(9); doc.setFont(undefined, 'normal');
    doc.text(`Operational Income: Rs. ${fmt(data.operationalIncome ?? data.totalIncome)}`, 14, y); y += 5;
    doc.text(`Released Reserve Funds: Rs. ${fmt(data.releasedReserveFunds ?? 0)}`, 14, y); y += 5;
    doc.text(`Total Expenditure: Rs. ${fmt(data.totalExpense)}`, 14, y); y += 5;
    if (Number(data.totalRefunds ?? 0) > 0) {
      doc.text(`Less: Refunds / Reversals: Rs. ${fmt(data.totalRefunds)}`, 14, y); y += 5;
    }
    doc.setFont(undefined, 'bold');
    doc.text(`Available Balance: Rs. ${fmt(data.availableBalance ?? data.balance)}`, 14, y); y += 5;
    if (data.lockedReserveFunds > 0) {
      doc.setFont(undefined, 'normal');
      doc.text(`Locked Reserve Funds (not included): Rs. ${fmt(data.lockedReserveFunds)}`, 14, y); y += 5;
    }
    y += 5;

    if (data.incomeItems.length > 0) {
      if (y > 240) { doc.addPage(); y = 15; }
      doc.setFontSize(11); doc.setFont(undefined, 'bold');
      doc.text('Annexure I: Detailed Income Register', 14, y); y += 2;
      autoTable(doc, {
        startY: y,
        head: [['Date', 'Type', 'Received From', 'Description', 'Amount (Rs.)']],
        body: data.incomeItems.map(item => [item.date, item.type.replace(/_/g, ' '), item.from, item.description || '-', fmt(item.amount)]),
        theme: 'grid', styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: { fillColor: [13, 166, 132], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 4: { halign: 'right' } },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    if (data.expenseItems.length > 0) {
      if (y > 240) { doc.addPage(); y = 15; }
      doc.setFontSize(11); doc.setFont(undefined, 'bold');
      doc.text('Annexure II: Detailed Expenditure Register', 14, y); y += 2;
      autoTable(doc, {
        startY: y,
        head: [['Date', 'Category', 'Paid To', 'Description', 'Amount (Rs.)']],
        body: data.expenseItems.map(item => [item.expenseDate, item.category.replace(/_/g, ' '), item.paidTo || '-', item.description || '-', fmt(item.amount)]),
        theme: 'grid', styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: { fillColor: [239, 52, 99], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 4: { halign: 'right' } },
        margin: { left: 14, right: 14 },
      });
    }

    doc.save(`${(societyConfig.societyName || 'Society').replace(/\s+/g, '_')}_BalanceSheet_${fromDate}_${toDate}.pdf`);
  };

  const exportExcel = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();

    const summaryData = [
      [`${societyConfig.societyName || 'Society'} - Receipts & Payments Account`],
      [`Period: ${periodLabel}`],
      [`Generated: ${new Date().toLocaleDateString('en-IN')}`],
      [],
      ['INCOME BREAKDOWN'],
      ['Particulars', 'Count', 'Amount (Rs.)'],
      ...data.incomeBreakdown.map(i => [i.type.replace(/_/g, ' '), i.count, Number(i.amount)]),
      ['Total Income', '', Number(data.totalIncome)],
      [],
      ['EXPENDITURE BREAKDOWN'],
      ['Particulars', 'Count', 'Amount (Rs.)'],
      ...data.expenseBreakdown.map(i => [i.category.replace(/_/g, ' '), i.count, Number(i.amount)]),
      ['Total Expenditure', '', Number(data.totalExpense)],
      [],
      ...(data.refundBreakdown && data.refundBreakdown.length > 0 ? [
        ['REFUNDS / REVERSALS'],
        ['Income Type Reversed', 'Count', 'Amount (Rs.)'],
        ...data.refundBreakdown.map(i => [i.type.replace(/_/g, ' '), i.count, Number(i.amount)]),
        ['Total Refunds', '', Number(data.totalRefunds)],
        [],
      ] : []),
      ...(data.reserveBreakdown && data.reserveBreakdown.length > 0 ? [
        ['RESERVE FUND SUMMARY'],
        ['Fund Type', 'Collected (Rs.)', 'Released (Rs.)', 'Locked (Rs.)'],
        ...data.reserveBreakdown.map(i => [i.fundType.replace(/_/g, ' '), Number(i.collected), Number(i.released), Number(i.locked)]),
        ['Totals', Number(data.totalReserveFunds ?? 0), Number(data.releasedReserveFunds ?? 0), Number(data.lockedReserveFunds ?? 0)],
        [],
      ] : []),
      ['NET BALANCE SUMMARY'],
      ['Operational Income', '', Number(data.operationalIncome ?? data.totalIncome)],
      ['Released Reserve Funds', '', Number(data.releasedReserveFunds ?? 0)],
      ['Total Expenditure', '', Number(data.totalExpense)],
      ...(Number(data.totalRefunds ?? 0) > 0 ? [['Less: Refunds / Reversals', '', Number(data.totalRefunds)]] : []),
      ['Available Balance', '', Number(data.availableBalance ?? data.balance)],
      ...(data.lockedReserveFunds > 0 ? [['Locked Reserve Funds (not included)', '', Number(data.lockedReserveFunds)]] : []),
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    ws1['!cols'] = [{ wch: 35 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

    if (data.incomeItems.length > 0) {
      const incData = [['Date', 'Type', 'Received From', 'Description', 'Amount (Rs.)'], ...data.incomeItems.map(i => [i.date, i.type.replace(/_/g, ' '), i.from, i.description || '-', Number(i.amount)])];
      const ws2 = XLSX.utils.aoa_to_sheet(incData);
      ws2['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 25 }, { wch: 30 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'Income Details');
    }

    if (data.expenseItems.length > 0) {
      const expData = [['Date', 'Category', 'Paid To', 'Description', 'Amount (Rs.)'], ...data.expenseItems.map(i => [i.expenseDate, i.category.replace(/_/g, ' '), i.paidTo || '-', i.description || '-', Number(i.amount)])];
      const ws3 = XLSX.utils.aoa_to_sheet(expData);
      ws3['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 25 }, { wch: 30 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws3, 'Expense Details');
    }

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `${(societyConfig.societyName || 'Society').replace(/\s+/g, '_')}_BalanceSheet_${fromDate}_${toDate}.xlsx`);
  };

  return (
    <div>
      {/* Page header with filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">Balance Sheet</h1>
          <p className="text-[13px] text-muted mt-0.5">Receipts & Payments Account</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div><label className="block text-[10px] font-medium text-muted mb-1">From</label><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-3 py-1.5 bg-input-bg border border-input-border rounded text-[13px] text-heading focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" /></div>
          <div><label className="block text-[10px] font-medium text-muted mb-1">To</label><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-3 py-1.5 bg-input-bg border border-input-border rounded text-[13px] text-heading focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" /></div>
          <button onClick={handleFilter} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded text-[13px] font-medium hover:bg-indigo-700 transition-colors"><Filter className="w-3.5 h-3.5" /> Apply</button>
          <button onClick={clearFilter} className="px-3 py-1.5 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Reset</button>
        </div>
      </div>

      {loading ? <TableSkeleton /> : data && (
        <>
          {/* ===== INVOICE-STYLE DOCUMENT ===== */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">

            {/* Document Header */}
            <div className="p-8 border-b border-dashed border-border">
              <div className="flex flex-col sm:flex-row justify-between gap-6">
                {/* Company info */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[18px] font-semibold text-heading">{societyConfig.societyName || 'Society Management'}</h2>
                    <p className="text-[13px] text-muted mt-0.5">{societyConfig.tagline || 'Society Management'}</p>
                    <p className="text-[12px] text-muted mt-1">Residential Welfare Association</p>
                  </div>
                </div>
                {/* Document info */}
                <div className="text-right">
                  <h3 className="text-[16px] font-semibold text-indigo-600 dark:text-indigo-400">Receipts & Payments Account</h3>
                  <div className="flex items-center justify-end gap-1.5 mt-2 text-[13px] text-muted">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {periodLabel}
                  </div>
                  <p className="text-[11px] text-muted mt-1">Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            </div>

            {/* Summary Figures */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-dashed divide-border border-b border-dashed border-border">
              <div className="p-5 text-center">
                <p className="text-[10px] font-medium text-muted uppercase tracking-wider">Operational Income</p>
                <p className="text-[18px] font-bold text-green-600 dark:text-green-400 mt-1.5"><IndianRupee className="w-4 h-4 inline" />{fmt(data.operationalIncome ?? data.totalIncome)}</p>
              </div>
              <div className="p-5 text-center">
                <p className="text-[10px] font-medium text-muted uppercase tracking-wider flex items-center justify-center gap-1"><Lock className="w-3 h-3" /> Reserve Funds (Locked)</p>
                <p className="text-[18px] font-bold text-amber-600 dark:text-amber-400 mt-1.5"><IndianRupee className="w-4 h-4 inline" />{fmt(data.lockedReserveFunds ?? 0)}</p>
              </div>
              <div className="p-5 text-center">
                <p className="text-[10px] font-medium text-muted uppercase tracking-wider flex items-center justify-center gap-1"><Unlock className="w-3 h-3" /> Released Reserves</p>
                <p className="text-[18px] font-bold text-emerald-600 dark:text-emerald-400 mt-1.5"><IndianRupee className="w-4 h-4 inline" />{fmt(data.releasedReserveFunds ?? 0)}</p>
              </div>
              <div className="p-5 text-center">
                <p className="text-[10px] font-medium text-muted uppercase tracking-wider">Total Expenditure</p>
                <p className="text-[18px] font-bold text-red-500 dark:text-red-400 mt-1.5"><IndianRupee className="w-4 h-4 inline" />{fmt(data.totalExpense)}</p>
              </div>
              {Number(data.totalRefunds ?? 0) > 0 && (
                <div className="p-5 text-center">
                  <p className="text-[10px] font-medium text-muted uppercase tracking-wider flex items-center justify-center gap-1"><RotateCcw className="w-3 h-3" /> Refunds</p>
                  <p className="text-[18px] font-bold text-orange-500 dark:text-orange-400 mt-1.5"><IndianRupee className="w-4 h-4 inline" />{fmt(data.totalRefunds)}</p>
                </div>
              )}
              <div className={`p-5 text-center ${Number(data.totalRefunds ?? 0) > 0 ? '' : 'col-span-2 sm:col-span-3 lg:col-span-2'} border-t lg:border-t-0 border-dashed border-border`}>
                <p className="text-[10px] font-medium text-muted uppercase tracking-wider">Available Balance</p>
                <p className={`text-[18px] font-bold mt-1.5 ${Number(data.availableBalance ?? data.balance) >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500 dark:text-red-400'}`}><IndianRupee className="w-4 h-4 inline" />{fmt(data.availableBalance ?? data.balance)}</p>
              </div>
            </div>

            {/* Schedule A: Income */}
            <div className="p-8 border-b border-dashed border-border">
              <h4 className="text-[13px] font-semibold text-heading mb-4">Schedule A &mdash; Income Breakdown</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted bg-card-alt rounded-l-lg">Sl.</th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted bg-card-alt">Particulars</th>
                      <th className="text-center px-4 py-2.5 text-[11px] font-semibold text-muted bg-card-alt">Count</th>
                      <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-muted bg-card-alt rounded-r-lg">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.incomeBreakdown.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-6 text-center text-[13px] text-muted">No income recorded</td></tr>
                    ) : (
                      <>
                        {data.incomeBreakdown.map((item, i) => {
                          const isReserve = item.type === 'CORPUS' || item.type === 'MEMBERSHIP';
                          return (
                            <tr key={item.type} className="border-b border-dashed border-border">
                              <td className="px-4 py-2.5 text-[13px] text-muted">{i + 1}</td>
                              <td className="px-4 py-2.5 text-[13px] font-medium text-heading">
                                <span className="inline-flex items-center gap-1.5">
                                  {item.type.replace(/_/g, ' ')}
                                  {isReserve && <Lock className="w-3 h-3 text-amber-500" title="Reserve Fund - Locked" />}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-[13px] text-muted text-center">{item.count}</td>
                              <td className="px-4 py-2.5 text-[13px] text-heading text-right">{fmt(item.amount)}</td>
                            </tr>
                          );
                        })}
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-[13px] font-bold text-heading text-right">Total Income (A)</td>
                          <td className="px-4 py-3 text-[14px] font-bold text-green-600 dark:text-green-400 text-right">{fmt(data.totalIncome)}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Schedule B: Expenditure */}
            <div className="p-8 border-b border-dashed border-border">
              <h4 className="text-[13px] font-semibold text-heading mb-4">Schedule B &mdash; Expenditure Breakdown</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted bg-card-alt rounded-l-lg">Sl.</th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted bg-card-alt">Particulars</th>
                      <th className="text-center px-4 py-2.5 text-[11px] font-semibold text-muted bg-card-alt">Count</th>
                      <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-muted bg-card-alt rounded-r-lg">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.expenseBreakdown.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-6 text-center text-[13px] text-muted">No expenses recorded</td></tr>
                    ) : (
                      <>
                        {data.expenseBreakdown.map((item, i) => (
                          <tr key={item.category} className="border-b border-dashed border-border">
                            <td className="px-4 py-2.5 text-[13px] text-muted">{i + 1}</td>
                            <td className="px-4 py-2.5 text-[13px] font-medium text-heading">{item.category.replace(/_/g, ' ')}</td>
                            <td className="px-4 py-2.5 text-[13px] text-muted text-center">{item.count}</td>
                            <td className="px-4 py-2.5 text-[13px] text-heading text-right">{fmt(item.amount)}</td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-[13px] font-bold text-heading text-right">Total Expenditure (B)</td>
                          <td className="px-4 py-3 text-[14px] font-bold text-red-500 dark:text-red-400 text-right">{fmt(data.totalExpense)}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Schedule B₁: Refunds / Reversals */}
            {data.refundBreakdown && data.refundBreakdown.length > 0 && (
              <div className="p-8 border-b border-dashed border-border">
                <h4 className="text-[13px] font-semibold text-heading mb-4 flex items-center gap-2">
                  Less: Refunds / Reversals
                  <RotateCcw className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-[11px] font-normal text-muted">({data.refundCount} credit note{data.refundCount !== 1 ? 's' : ''})</span>
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted bg-card-alt rounded-l-lg">Sl.</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted bg-card-alt">Income Type Reversed</th>
                        <th className="text-center px-4 py-2.5 text-[11px] font-semibold text-muted bg-card-alt">Count</th>
                        <th className="text-center px-4 py-2.5 text-[11px] font-semibold text-muted bg-card-alt">GST Applicable</th>
                        <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-muted bg-card-alt rounded-r-lg">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.refundBreakdown.map((item, i) => (
                        <tr key={item.type} className="border-b border-dashed border-border">
                          <td className="px-4 py-2.5 text-[13px] text-muted">{i + 1}</td>
                          <td className="px-4 py-2.5 text-[13px] font-medium text-heading">
                            <span className="inline-flex items-center gap-1.5">
                              <RotateCcw className="w-3 h-3 text-orange-500" />
                              {item.type.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-[13px] text-muted text-center">{item.count}</td>
                          <td className="px-4 py-2.5 text-[13px] text-muted text-center">{item.gstApplicable ? 'Yes' : 'No'}</td>
                          <td className="px-4 py-2.5 text-[13px] text-orange-600 dark:text-orange-400 text-right font-medium">- {fmt(item.amount)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-[13px] font-bold text-heading text-right">Total Refunds</td>
                        <td className="px-4 py-3 text-[14px] font-bold text-orange-600 dark:text-orange-400 text-right">- {fmt(data.totalRefunds)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Schedule C: Reserve Fund Summary */}
            {data.reserveBreakdown && data.reserveBreakdown.length > 0 && (
              <div className="p-8 border-b border-dashed border-border">
                <h4 className="text-[13px] font-semibold text-heading mb-4 flex items-center gap-2">
                  Schedule C &mdash; Reserve Fund Summary
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted bg-card-alt rounded-l-lg">Fund Type</th>
                        <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-muted bg-card-alt">Collected</th>
                        <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-muted bg-card-alt">Released</th>
                        <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-muted bg-card-alt rounded-r-lg">Locked</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.reserveBreakdown.map((item) => (
                        <tr key={item.fundType} className="border-b border-dashed border-border">
                          <td className="px-4 py-2.5 text-[13px] font-medium text-heading flex items-center gap-1.5">
                            <Lock className="w-3 h-3 text-amber-500" />
                            {item.fundType.replace(/_/g, ' ')}
                          </td>
                          <td className="px-4 py-2.5 text-[13px] text-heading text-right">{fmt(item.collected)}</td>
                          <td className="px-4 py-2.5 text-[13px] text-emerald-600 dark:text-emerald-400 text-right">{fmt(item.released)}</td>
                          <td className="px-4 py-2.5 text-[13px] font-semibold text-amber-600 dark:text-amber-400 text-right">{fmt(item.locked)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td className="px-4 py-3 text-[13px] font-bold text-heading text-right">Totals</td>
                        <td className="px-4 py-3 text-[13px] font-bold text-heading text-right">{fmt(data.totalReserveFunds ?? 0)}</td>
                        <td className="px-4 py-3 text-[13px] font-bold text-emerald-600 dark:text-emerald-400 text-right">{fmt(data.releasedReserveFunds ?? 0)}</td>
                        <td className="px-4 py-3 text-[13px] font-bold text-amber-600 dark:text-amber-400 text-right">{fmt(data.lockedReserveFunds ?? 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-muted mt-3 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked reserve funds are not included in the available balance. They can only be released through the approval workflow.
                </p>
              </div>
            )}

            {/* Grand Total / Net Balance */}
            <div className="p-8 border-b border-dashed border-border">
              <div className="flex justify-end">
                <div className="w-full max-w-md space-y-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted">Operational Income</span>
                    <span className="font-medium text-heading">{fmt(data.operationalIncome ?? data.totalIncome)}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted flex items-center gap-1"><Unlock className="w-3 h-3" /> Released Reserve Funds</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">+ {fmt(data.releasedReserveFunds ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted">Total Expenditure</span>
                    <span className="font-medium text-red-500 dark:text-red-400">- {fmt(data.totalExpense)}</span>
                  </div>
                  {Number(data.totalRefunds ?? 0) > 0 && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-muted flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Less: Refunds / Reversals</span>
                      <span className="font-medium text-orange-500 dark:text-orange-400">- {fmt(data.totalRefunds)}</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-[14px] font-bold text-heading">Available Balance</span>
                      <span className={`text-[18px] font-bold ${Number(data.availableBalance ?? data.balance) >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500 dark:text-red-400'}`}>
                        <IndianRupee className="w-4 h-4 inline" />{fmt(data.availableBalance ?? data.balance)}
                      </span>
                    </div>
                  </div>
                  {data.lockedReserveFunds > 0 && (
                    <div className="flex justify-between text-[12px] pt-1">
                      <span className="text-muted flex items-center gap-1"><Lock className="w-3 h-3 text-amber-500" /> Locked Reserve Funds (not included above)</span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">{fmt(data.lockedReserveFunds)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Terms / Notes */}
            <div className="p-8 border-b border-dashed border-border">
              <h5 className="text-[12px] font-semibold text-heading mb-2">Notes:</h5>
              <ul className="space-y-1 text-[11px] text-muted list-disc pl-4">
                <li>This is a computer-generated statement and does not require a signature.</li>
                <li>All amounts are in Indian Rupees (INR).</li>
                <li>Period: {periodLabel}.</li>
                <li>Corpus and Membership funds are treated as reserve funds and are locked by default.</li>
                <li>Reserve funds can only be released through the approval workflow (Reserve Funds page).</li>
                <li>Available Balance = Operational Income + Released Reserves - Total Expenditure - Refunds.</li>
                <li>For any discrepancies, please contact the society management office.</li>
              </ul>
            </div>

            {/* Action Buttons (Approx invoice-style bottom bar) */}
            <div className="p-6 flex flex-wrap justify-end gap-2 bg-card-alt">
              <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={exportPDF} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded text-[13px] font-medium hover:bg-red-700 transition-colors">
                <FileDown className="w-4 h-4" /> Export PDF
              </button>
              <button onClick={exportExcel} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded text-[13px] font-medium hover:bg-green-700 transition-colors">
                <FileSpreadsheet className="w-4 h-4" /> Export Excel
              </button>
            </div>
          </div>

          {/* ===== DETAIL REGISTERS (Collapsible) ===== */}
          <div className="mt-6 space-y-4">

            {/* Income Details - Collapsible */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <button onClick={() => setIncomeOpen(!incomeOpen)} className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-card-hover transition-colors">
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <h2 className="text-[14px] font-semibold text-heading">Annexure I: Income Register</h2>
                  <span className="text-[11px] text-muted px-2 py-0.5 bg-card-alt rounded">{data.incomeItems.length} entries</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 ${incomeOpen ? 'rotate-180' : ''}`} />
              </button>
              {incomeOpen && (
                <div className="table-container border-t border-border">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Date</th>
                        <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Type</th>
                        <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Received From</th>
                        <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Description</th>
                        <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.incomeItems.map((item, idx) => {
                        const reserveTypes = (data.reserveBreakdown || []).map(r => r.fundType);
                        const isReserve = reserveTypes.includes(item.type);
                        return (
                          <tr key={idx} className="border-b border-dashed border-border hover:bg-card-hover transition-colors">
                            <td className="px-5 py-3 text-[13px] text-muted">{item.date}</td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${getTypeColor(item.type)}`}>
                                {item.type.replace(/_/g, ' ')}
                                {isReserve && <Lock className="w-2.5 h-2.5" />}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-[13px] font-medium text-heading">{item.from}</td>
                            <td className="px-5 py-3 text-[13px] text-muted">{item.description || '-'}</td>
                            <td className="px-5 py-3 text-right text-[13px] font-semibold text-green-600 dark:text-green-400">{fmt(item.amount)}</td>
                          </tr>
                        );
                      })}
                      {data.incomeItems.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-muted text-[13px]">No income entries</td></tr>}
                    </tbody>
                    {data.incomeItems.length > 0 && (
                      <tfoot>
                        <tr className="border-t-2 border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/5">
                          <td colSpan={4} className="px-5 py-3 text-[13px] font-bold text-green-700 dark:text-green-400 text-right">Total Income (A)</td>
                          <td className="px-5 py-3 text-right text-[14px] font-bold text-green-700 dark:text-green-400">{fmt(data.totalIncome)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </div>

            {/* Expense Details - Collapsible */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <button onClick={() => setExpenseOpen(!expenseOpen)} className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-card-hover transition-colors">
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-red-500 dark:text-red-400" />
                  <h2 className="text-[14px] font-semibold text-heading">Annexure II: Expenditure Register</h2>
                  <span className="text-[11px] text-muted px-2 py-0.5 bg-card-alt rounded">{data.expenseItems.length} entries</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 ${expenseOpen ? 'rotate-180' : ''}`} />
              </button>
              {expenseOpen && (
                <div className="table-container border-t border-border">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Date</th>
                        <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Category</th>
                        <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Paid To</th>
                        <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Description</th>
                        <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.expenseItems.map((item) => {
                        return (
                          <tr key={item.id} className="border-b border-dashed border-border hover:bg-card-hover transition-colors">
                            <td className="px-5 py-3 text-[13px] text-muted">{item.expenseDate}</td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${getTypeColor(item.category)}`}>
                                {item.category.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-[13px] font-medium text-heading">{item.paidTo || '-'}</td>
                            <td className="px-5 py-3 text-[13px] text-muted">{item.description || '-'}</td>
                            <td className="px-5 py-3 text-right text-[13px] font-semibold text-red-500 dark:text-red-400">{fmt(item.amount)}</td>
                          </tr>
                        );
                      })}
                      {data.expenseItems.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-muted text-[13px]">No expenses recorded</td></tr>}
                    </tbody>
                    {data.expenseItems.length > 0 && (
                      <tfoot>
                        <tr className="border-t-2 border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5">
                          <td colSpan={4} className="px-5 py-3 text-[13px] font-bold text-red-600 dark:text-red-400 text-right">Total Expenditure (B)</td>
                          <td className="px-5 py-3 text-right text-[14px] font-bold text-red-600 dark:text-red-400">{fmt(data.totalExpense)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
