import { ButtonSpinner } from '../components/Spinner';
import { TableSkeleton } from '../components/Skeleton';
import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import { IndianRupee, FileDown, FileSpreadsheet, Filter, RotateCcw } from 'lucide-react';
import { useSocietyConfig, typeName } from '../context/SocietyConfigContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const GST_RATE = 18;
const fmt = (n) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function getDefaultDates() {
  const now = new Date();
  const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const qEnd = new Date(qStart.getFullYear(), qStart.getMonth() + 3, 0);
  return { from: qStart.toISOString().split('T')[0], to: qEnd.toISOString().split('T')[0] };
}

function formatDateIndian(d) {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function computeGST(amount) {
  const base = Number(amount) / (1 + GST_RATE / 100);
  const cgst = (base * GST_RATE / 2) / 100;
  const sgst = cgst;
  return { base, cgst, sgst, total: Number(amount) };
}

export default function GSTReport() {
  const { config: societyConfig, incomeTypes, expenseTypes } = useSocietyConfig();
  const tn = (code) => typeName(code, incomeTypes, expenseTypes);
  const defaults = getDefaultDates();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(defaults.from);
  const [toDate, setToDate] = useState(defaults.to);

  const fetchData = useCallback(async (fd, td) => {
    setLoading(true);
    try {
      const { data: res } = await adminAPI.getBalanceSheet(fd || undefined, td || undefined);
      setData(res);
    } catch (err) { console.error('Failed to load data', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(fromDate, toDate); }, []);

  const handleFilter = () => fetchData(fromDate, toDate);
  const periodLabel = fromDate && toDate ? `${formatDateIndian(fromDate)} to ${formatDateIndian(toDate)}` : 'All Time';

  // Compute GST on income (output GST) and expenses (input GST) — use gstApplicable/gstIncluded flags from backend
  const incomeGST = data?.incomeBreakdown?.filter(i => i.gstApplicable !== false).map(i => ({ ...i, ...computeGST(i.amount) })) || [];
  const expenseGST = data?.expenseBreakdown?.filter(i => i.gstIncluded !== false).map(i => ({ ...i, ...computeGST(i.amount) })) || [];

  // Credit notes from refunds — reduce output tax
  const refundGST = data?.refundBreakdown?.filter(i => i.gstApplicable !== false).map(i => ({ ...i, ...computeGST(i.amount) })) || [];
  const totalRefundCGST = refundGST.reduce((s, i) => s + i.cgst, 0);
  const totalRefundSGST = refundGST.reduce((s, i) => s + i.sgst, 0);

  const totalOutputCGST = incomeGST.reduce((s, i) => s + i.cgst, 0);
  const totalOutputSGST = incomeGST.reduce((s, i) => s + i.sgst, 0);
  const totalInputCGST = expenseGST.reduce((s, i) => s + i.cgst, 0);
  const totalInputSGST = expenseGST.reduce((s, i) => s + i.sgst, 0);
  // Net output = output - credit notes (refunds)
  const effectiveOutputCGST = totalOutputCGST - totalRefundCGST;
  const effectiveOutputSGST = totalOutputSGST - totalRefundSGST;
  const netCGST = effectiveOutputCGST - totalInputCGST;
  const netSGST = effectiveOutputSGST - totalInputSGST;
  const netGST = netCGST + netSGST;

  const exportPDF = () => {
    if (!data) return;
    const doc = new jsPDF('l', 'mm', 'a4');
    const pw = doc.internal.pageSize.getWidth();
    let y = 15;

    doc.setFontSize(16); doc.setFont(undefined, 'bold');
    doc.text(societyConfig.societyName || 'Society Management', pw / 2, y, { align: 'center' }); y += 7;
    doc.setFontSize(10); doc.setFont(undefined, 'normal');
    doc.text(societyConfig.tagline || 'Residential Welfare Association', pw / 2, y, { align: 'center' }); y += 6;
    doc.setFontSize(13); doc.setFont(undefined, 'bold');
    doc.text('GST Computation Statement', pw / 2, y, { align: 'center' }); y += 6;
    doc.setFontSize(9); doc.setFont(undefined, 'normal');
    doc.text(`Period: ${periodLabel} | GST Rate: ${GST_RATE}%`, pw / 2, y, { align: 'center' }); y += 4;
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pw / 2, y, { align: 'center' }); y += 8;

    doc.setFontSize(11); doc.setFont(undefined, 'bold');
    doc.text('Output Tax Liability (On Outward Supplies)', 14, y); y += 2;
    autoTable(doc, {
      startY: y,
      head: [['Particulars', 'Invoice Value (Incl. Tax)', 'Taxable Value', `CGST @${GST_RATE / 2}%`, `SGST @${GST_RATE / 2}%`, 'Total Tax']],
      body: [
        ...incomeGST.map(i => [tn(i.type), fmt(i.amount), fmt(i.base), fmt(i.cgst), fmt(i.sgst), fmt(i.cgst + i.sgst)]),
        [{ content: 'Total Output Tax', styles: { fontStyle: 'bold' } }, fmt(data.totalIncome), fmt(incomeGST.reduce((s, i) => s + i.base, 0)), fmt(totalOutputCGST), fmt(totalOutputSGST), fmt(totalOutputCGST + totalOutputSGST)],
      ],
      theme: 'grid', styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [34, 139, 34], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;

    if (refundGST.length > 0) {
      doc.setFontSize(11); doc.setFont(undefined, 'bold');
      doc.text('Credit Notes (Refunds / Reversals) — Section 34, CGST Act', 14, y); y += 2;
      autoTable(doc, {
        startY: y,
        head: [['Particulars', 'Credit Note Value', 'Taxable Value', `CGST @${GST_RATE / 2}%`, `SGST @${GST_RATE / 2}%`, 'Total Tax Reversal']],
        body: [
          ...refundGST.map(i => [tn(i.type), fmt(i.amount), fmt(i.base), fmt(i.cgst), fmt(i.sgst), fmt(i.cgst + i.sgst)]),
          [{ content: 'Total Credit Notes', styles: { fontStyle: 'bold' } }, fmt(data.totalRefunds), fmt(refundGST.reduce((s, i) => s + i.base, 0)), fmt(totalRefundCGST), fmt(totalRefundSGST), fmt(totalRefundCGST + totalRefundSGST)],
        ],
        theme: 'grid', styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    doc.setFontSize(11); doc.setFont(undefined, 'bold');
    doc.text('Input Tax Credit (On Inward Supplies)', 14, y); y += 2;
    autoTable(doc, {
      startY: y,
      head: [['Particulars', 'Invoice Value (Incl. Tax)', 'Taxable Value', `CGST @${GST_RATE / 2}%`, `SGST @${GST_RATE / 2}%`, 'Total Tax']],
      body: [
        ...expenseGST.map(i => [tn(i.category), fmt(i.amount), fmt(i.base), fmt(i.cgst), fmt(i.sgst), fmt(i.cgst + i.sgst)]),
        [{ content: 'Total Input Tax Credit', styles: { fontStyle: 'bold' } }, fmt(data.totalExpense), fmt(expenseGST.reduce((s, i) => s + i.base, 0)), fmt(totalInputCGST), fmt(totalInputSGST), fmt(totalInputCGST + totalInputSGST)],
      ],
      theme: 'grid', styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [220, 53, 69], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;

    doc.setFontSize(11); doc.setFont(undefined, 'bold');
    doc.text('Net Tax Liability', 14, y); y += 2;
    autoTable(doc, {
      startY: y,
      head: [['', `CGST @${GST_RATE / 2}%`, `SGST @${GST_RATE / 2}%`, 'Total']],
      body: [
        ['Output Tax', fmt(totalOutputCGST), fmt(totalOutputSGST), fmt(totalOutputCGST + totalOutputSGST)],
        ...(refundGST.length > 0 ? [['Less: Credit Notes (Refunds)', fmt(totalRefundCGST), fmt(totalRefundSGST), fmt(totalRefundCGST + totalRefundSGST)]] : []),
        ...(refundGST.length > 0 ? [['Net Output Tax', fmt(effectiveOutputCGST), fmt(effectiveOutputSGST), fmt(effectiveOutputCGST + effectiveOutputSGST)]] : []),
        ['Less: Input Tax Credit', fmt(totalInputCGST), fmt(totalInputSGST), fmt(totalInputCGST + totalInputSGST)],
        [{ content: 'Net Payable / (Refundable)', styles: { fontStyle: 'bold' } }, { content: fmt(netCGST), styles: { fontStyle: 'bold' } }, { content: fmt(netSGST), styles: { fontStyle: 'bold' } }, { content: fmt(netGST), styles: { fontStyle: 'bold' } }],
      ],
      theme: 'grid', styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [75, 85, 199], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });

    doc.save(`${(societyConfig.societyName || 'Society').replace(/\s+/g, '_')}_GST_${fromDate}_${toDate}.pdf`);
  };

  const exportExcel = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();

    const summaryData = [
      [`${societyConfig.societyName || 'Society'} - GST Computation Statement`],
      [`Period: ${periodLabel}`],
      [`GST Rate: ${GST_RATE}%`],
      [`Generated: ${new Date().toLocaleDateString('en-IN')}`],
      [],
      ['OUTPUT TAX LIABILITY (On Outward Supplies)'],
      ['Particulars', 'Invoice Value (Incl. Tax)', 'Taxable Value', `CGST @${GST_RATE / 2}%`, `SGST @${GST_RATE / 2}%`, 'Total Tax'],
      ...incomeGST.map(i => [tn(i.type), Number(i.amount), i.base, i.cgst, i.sgst, i.cgst + i.sgst]),
      ['Total Output Tax', Number(data.totalIncome), incomeGST.reduce((s, i) => s + i.base, 0), totalOutputCGST, totalOutputSGST, totalOutputCGST + totalOutputSGST],
      [],
      ...(refundGST.length > 0 ? [
        ['CREDIT NOTES (Refunds / Reversals)'],
        ['Particulars', 'Credit Note Value', 'Taxable Value', `CGST @${GST_RATE / 2}%`, `SGST @${GST_RATE / 2}%`, 'Total Tax Reversal'],
        ...refundGST.map(i => [tn(i.type), Number(i.amount), i.base, i.cgst, i.sgst, i.cgst + i.sgst]),
        ['Total Credit Notes', Number(data.totalRefunds), refundGST.reduce((s, i) => s + i.base, 0), totalRefundCGST, totalRefundSGST, totalRefundCGST + totalRefundSGST],
        [],
      ] : []),
      ['INPUT TAX CREDIT (On Inward Supplies)'],
      ['Particulars', 'Invoice Value (Incl. Tax)', 'Taxable Value', `CGST @${GST_RATE / 2}%`, `SGST @${GST_RATE / 2}%`, 'Total Tax'],
      ...expenseGST.map(i => [tn(i.category), Number(i.amount), i.base, i.cgst, i.sgst, i.cgst + i.sgst]),
      ['Total Input Tax Credit', Number(data.totalExpense), expenseGST.reduce((s, i) => s + i.base, 0), totalInputCGST, totalInputSGST, totalInputCGST + totalInputSGST],
      [],
      ['NET TAX LIABILITY'],
      ['', `CGST @${GST_RATE / 2}%`, `SGST @${GST_RATE / 2}%`, 'Total'],
      ['Output Tax', totalOutputCGST, totalOutputSGST, totalOutputCGST + totalOutputSGST],
      ...(refundGST.length > 0 ? [['Less: Credit Notes (Refunds)', totalRefundCGST, totalRefundSGST, totalRefundCGST + totalRefundSGST]] : []),
      ...(refundGST.length > 0 ? [['Net Output Tax', effectiveOutputCGST, effectiveOutputSGST, effectiveOutputCGST + effectiveOutputSGST]] : []),
      ['Less: Input Tax Credit', totalInputCGST, totalInputSGST, totalInputCGST + totalInputSGST],
      ['Net Payable / (Refundable)', netCGST, netSGST, netGST],
    ];
    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    ws['!cols'] = [{ wch: 30 }, { wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws, 'GST Report');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `${(societyConfig.societyName || 'Society').replace(/\s+/g, '_')}_GST_${fromDate}_${toDate}.xlsx`);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">GST Computation Statement</h1>
          <p className="text-[13px] text-muted mt-0.5">Tax computation for {societyConfig.societyName || 'Society'} &middot; {periodLabel}</p>
        </div>
        {data && (
          <div className="flex gap-2">
            <button onClick={exportPDF} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded text-[13px] font-medium hover:bg-red-700 transition-colors"><FileDown className="w-4 h-4" /> PDF</button>
            <button onClick={exportExcel} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded text-[13px] font-medium hover:bg-green-700 transition-colors"><FileSpreadsheet className="w-4 h-4" /> Excel</button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div><label className="block text-[10px] font-medium text-muted mb-1">From</label><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-3 py-1.5 bg-input-bg border border-input-border rounded text-[13px] text-heading focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" /></div>
        <div><label className="block text-[10px] font-medium text-muted mb-1">To</label><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-3 py-1.5 bg-input-bg border border-input-border rounded text-[13px] text-heading focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" /></div>
        <button onClick={handleFilter} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded text-[13px] font-medium hover:bg-amber-700 transition-colors"><Filter className="w-3.5 h-3.5" /> Generate</button>
      </div>

      {loading ? <TableSkeleton /> : data && (
        <>
          {/* Tax Summary Cards */}
          <div className={`grid grid-cols-1 sm:grid-cols-${refundGST.length > 0 ? '5' : '4'} gap-4 mb-6`}>
            <div className="bg-card rounded-lg border border-border p-5">
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">{refundGST.length > 0 ? 'Net Output Tax' : 'Output Tax Liability'}</p>
              <p className="text-[22px] font-bold text-green-600 dark:text-green-400 mt-1"><IndianRupee className="w-5 h-5 inline" /> {fmt(effectiveOutputCGST + effectiveOutputSGST)}</p>
              {refundGST.length > 0 && <p className="text-[11px] text-muted mt-0.5">After credit notes</p>}
            </div>
            {refundGST.length > 0 && (
              <div className="bg-card rounded-lg border border-border p-5">
                <p className="text-[11px] font-medium text-muted uppercase tracking-wider flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Credit Notes (Refunds)</p>
                <p className="text-[22px] font-bold text-orange-600 dark:text-orange-400 mt-1"><IndianRupee className="w-5 h-5 inline" /> {fmt(totalRefundCGST + totalRefundSGST)}</p>
              </div>
            )}
            <div className="bg-card rounded-lg border border-border p-5">
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Input Tax Credit (ITC)</p>
              <p className="text-[22px] font-bold text-red-600 dark:text-red-400 mt-1"><IndianRupee className="w-5 h-5 inline" /> {fmt(totalInputCGST + totalInputSGST)}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-5">
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">{netGST >= 0 ? 'Net Tax Payable' : 'Net Tax Refundable'}</p>
              <p className={`text-[22px] font-bold mt-1 ${netGST >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-green-600 dark:text-green-400'}`}><IndianRupee className="w-5 h-5 inline" /> {fmt(Math.abs(netGST))}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-5">
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Applicable Rate</p>
              <p className="text-[22px] font-bold text-heading mt-1">{GST_RATE}%</p>
              <p className="text-[11px] text-muted mt-0.5">CGST {GST_RATE / 2}% + SGST {GST_RATE / 2}%</p>
            </div>
          </div>

          {/* Output Tax Liability Table */}
          <div className="bg-card rounded-lg border border-border overflow-hidden mb-6">
            <div className="px-5 py-3 bg-green-50 dark:bg-green-500/10 border-b border-border"><h2 className="text-[13px] font-semibold text-green-800 dark:text-green-400">Output Tax Liability (On Outward Supplies)</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Particulars</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Invoice Value (Incl. Tax)</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Taxable Value</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">CGST @{GST_RATE / 2}%</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">SGST @{GST_RATE / 2}%</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Total Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeGST.map((i) => (
                    <tr key={i.type} className="border-b border-dashed border-border hover:bg-card-hover transition-colors">
                      <td className="px-5 py-3 text-[13px] font-medium text-heading">{tn(i.type)}</td>
                      <td className="px-5 py-3 text-right text-[13px] text-muted">{fmt(i.amount)}</td>
                      <td className="px-5 py-3 text-right text-[13px] text-muted">{fmt(i.base)}</td>
                      <td className="px-5 py-3 text-right text-[13px] text-muted">{fmt(i.cgst)}</td>
                      <td className="px-5 py-3 text-right text-[13px] text-muted">{fmt(i.sgst)}</td>
                      <td className="px-5 py-3 text-right text-[13px] font-semibold text-green-700 dark:text-green-400">{fmt(i.cgst + i.sgst)}</td>
                    </tr>
                  ))}
                  {incomeGST.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-muted text-[13px]">No income recorded for this period</td></tr>}
                </tbody>
                {incomeGST.length > 0 && <tfoot><tr className="bg-green-50 dark:bg-green-500/10 border-t-2 border-green-200 dark:border-green-500/20">
                  <td className="px-5 py-3 text-[13px] font-bold text-green-800 dark:text-green-400">Total</td>
                  <td className="px-5 py-3 text-right text-[13px] font-bold text-green-800 dark:text-green-400">{fmt(data.totalIncome)}</td>
                  <td className="px-5 py-3 text-right text-[13px] font-bold text-green-800 dark:text-green-400">{fmt(incomeGST.reduce((s, i) => s + i.base, 0))}</td>
                  <td className="px-5 py-3 text-right text-[13px] font-bold text-green-800 dark:text-green-400">{fmt(totalOutputCGST)}</td>
                  <td className="px-5 py-3 text-right text-[13px] font-bold text-green-800 dark:text-green-400">{fmt(totalOutputSGST)}</td>
                  <td className="px-5 py-3 text-right text-[13px] font-bold text-green-800 dark:text-green-400">{fmt(totalOutputCGST + totalOutputSGST)}</td>
                </tr></tfoot>}
              </table>
            </div>
          </div>

          {/* Credit Notes (Refunds) Table */}
          {refundGST.length > 0 && (
            <div className="bg-card rounded-lg border border-border overflow-hidden mb-6">
              <div className="px-5 py-3 bg-orange-50 dark:bg-orange-500/10 border-b border-border">
                <h2 className="text-[13px] font-semibold text-orange-800 dark:text-orange-400 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Credit Notes — Refunds / Reversals (Section 34, CGST Act)
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Particulars</th>
                      <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Credit Note Value</th>
                      <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Taxable Value</th>
                      <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">CGST @{GST_RATE / 2}%</th>
                      <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">SGST @{GST_RATE / 2}%</th>
                      <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Total Tax Reversal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refundGST.map((i) => (
                      <tr key={i.type} className="border-b border-dashed border-border hover:bg-card-hover transition-colors">
                        <td className="px-5 py-3 text-[13px] font-medium text-heading flex items-center gap-1.5">
                          <RotateCcw className="w-3 h-3 text-orange-500" />
                          {tn(i.type)}
                        </td>
                        <td className="px-5 py-3 text-right text-[13px] text-muted">{fmt(i.amount)}</td>
                        <td className="px-5 py-3 text-right text-[13px] text-muted">{fmt(i.base)}</td>
                        <td className="px-5 py-3 text-right text-[13px] text-muted">{fmt(i.cgst)}</td>
                        <td className="px-5 py-3 text-right text-[13px] text-muted">{fmt(i.sgst)}</td>
                        <td className="px-5 py-3 text-right text-[13px] font-semibold text-orange-700 dark:text-orange-400">{fmt(i.cgst + i.sgst)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="bg-orange-50 dark:bg-orange-500/10 border-t-2 border-orange-200 dark:border-orange-500/20">
                    <td className="px-5 py-3 text-[13px] font-bold text-orange-800 dark:text-orange-400">Total</td>
                    <td className="px-5 py-3 text-right text-[13px] font-bold text-orange-800 dark:text-orange-400">{fmt(data.totalRefunds)}</td>
                    <td className="px-5 py-3 text-right text-[13px] font-bold text-orange-800 dark:text-orange-400">{fmt(refundGST.reduce((s, i) => s + i.base, 0))}</td>
                    <td className="px-5 py-3 text-right text-[13px] font-bold text-orange-800 dark:text-orange-400">{fmt(totalRefundCGST)}</td>
                    <td className="px-5 py-3 text-right text-[13px] font-bold text-orange-800 dark:text-orange-400">{fmt(totalRefundSGST)}</td>
                    <td className="px-5 py-3 text-right text-[13px] font-bold text-orange-800 dark:text-orange-400">{fmt(totalRefundCGST + totalRefundSGST)}</td>
                  </tr></tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Input Tax Credit Table */}
          <div className="bg-card rounded-lg border border-border overflow-hidden mb-6">
            <div className="px-5 py-3 bg-red-50 dark:bg-red-500/10 border-b border-border"><h2 className="text-[13px] font-semibold text-red-800 dark:text-red-400">Input Tax Credit (On Inward Supplies)</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Particulars</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Invoice Value (Incl. Tax)</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Taxable Value</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">CGST @{GST_RATE / 2}%</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">SGST @{GST_RATE / 2}%</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Total Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseGST.map((i) => (
                    <tr key={i.category} className="border-b border-dashed border-border hover:bg-card-hover transition-colors">
                      <td className="px-5 py-3 text-[13px] font-medium text-heading">{tn(i.category)}</td>
                      <td className="px-5 py-3 text-right text-[13px] text-muted">{fmt(i.amount)}</td>
                      <td className="px-5 py-3 text-right text-[13px] text-muted">{fmt(i.base)}</td>
                      <td className="px-5 py-3 text-right text-[13px] text-muted">{fmt(i.cgst)}</td>
                      <td className="px-5 py-3 text-right text-[13px] text-muted">{fmt(i.sgst)}</td>
                      <td className="px-5 py-3 text-right text-[13px] font-semibold text-red-700 dark:text-red-400">{fmt(i.cgst + i.sgst)}</td>
                    </tr>
                  ))}
                  {expenseGST.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-muted text-[13px]">No expenses recorded for this period</td></tr>}
                </tbody>
                {expenseGST.length > 0 && <tfoot><tr className="bg-red-50 dark:bg-red-500/10 border-t-2 border-red-200 dark:border-red-500/20">
                  <td className="px-5 py-3 text-[13px] font-bold text-red-800 dark:text-red-400">Total</td>
                  <td className="px-5 py-3 text-right text-[13px] font-bold text-red-800 dark:text-red-400">{fmt(data.totalExpense)}</td>
                  <td className="px-5 py-3 text-right text-[13px] font-bold text-red-800 dark:text-red-400">{fmt(expenseGST.reduce((s, i) => s + i.base, 0))}</td>
                  <td className="px-5 py-3 text-right text-[13px] font-bold text-red-800 dark:text-red-400">{fmt(totalInputCGST)}</td>
                  <td className="px-5 py-3 text-right text-[13px] font-bold text-red-800 dark:text-red-400">{fmt(totalInputSGST)}</td>
                  <td className="px-5 py-3 text-right text-[13px] font-bold text-red-800 dark:text-red-400">{fmt(totalInputCGST + totalInputSGST)}</td>
                </tr></tfoot>}
              </table>
            </div>
          </div>

          {/* Net Tax Liability */}
          <div className="bg-card rounded-lg border border-border overflow-hidden mb-6">
            <div className="px-5 py-3 bg-indigo-50 dark:bg-indigo-500/10 border-b border-border"><h2 className="text-[13px] font-semibold text-indigo-800 dark:text-indigo-400">Net Tax Liability</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Description</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">CGST @{GST_RATE / 2}%</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">SGST @{GST_RATE / 2}%</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-dashed border-border hover:bg-card-hover transition-colors">
                    <td className="px-5 py-3 text-[13px] text-heading">Output Tax Liability</td>
                    <td className="px-5 py-3 text-right text-[13px] text-muted">{fmt(totalOutputCGST)}</td>
                    <td className="px-5 py-3 text-right text-[13px] text-muted">{fmt(totalOutputSGST)}</td>
                    <td className="px-5 py-3 text-right text-[13px] font-semibold text-heading">{fmt(totalOutputCGST + totalOutputSGST)}</td>
                  </tr>
                  {refundGST.length > 0 && (
                    <tr className="border-b border-dashed border-border hover:bg-card-hover transition-colors">
                      <td className="px-5 py-3 text-[13px] text-orange-700 dark:text-orange-400 flex items-center gap-1.5">
                        <RotateCcw className="w-3 h-3" /> Less: Credit Notes (Refunds)
                      </td>
                      <td className="px-5 py-3 text-right text-[13px] text-orange-600 dark:text-orange-400">- {fmt(totalRefundCGST)}</td>
                      <td className="px-5 py-3 text-right text-[13px] text-orange-600 dark:text-orange-400">- {fmt(totalRefundSGST)}</td>
                      <td className="px-5 py-3 text-right text-[13px] font-semibold text-orange-700 dark:text-orange-400">- {fmt(totalRefundCGST + totalRefundSGST)}</td>
                    </tr>
                  )}
                  {refundGST.length > 0 && (
                    <tr className="border-b border-dashed border-border bg-card-alt">
                      <td className="px-5 py-3 text-[13px] font-medium text-heading">Net Output Tax</td>
                      <td className="px-5 py-3 text-right text-[13px] font-medium text-heading">{fmt(effectiveOutputCGST)}</td>
                      <td className="px-5 py-3 text-right text-[13px] font-medium text-heading">{fmt(effectiveOutputSGST)}</td>
                      <td className="px-5 py-3 text-right text-[13px] font-semibold text-heading">{fmt(effectiveOutputCGST + effectiveOutputSGST)}</td>
                    </tr>
                  )}
                  <tr className="border-b border-dashed border-border hover:bg-card-hover transition-colors">
                    <td className="px-5 py-3 text-[13px] text-heading">Less: Input Tax Credit (ITC)</td>
                    <td className="px-5 py-3 text-right text-[13px] text-muted">{fmt(totalInputCGST)}</td>
                    <td className="px-5 py-3 text-right text-[13px] text-muted">{fmt(totalInputSGST)}</td>
                    <td className="px-5 py-3 text-right text-[13px] font-semibold text-heading">{fmt(totalInputCGST + totalInputSGST)}</td>
                  </tr>
                </tbody>
                <tfoot><tr className={`border-t-2 ${netGST >= 0 ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20' : 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20'}`}>
                  <td className="px-5 py-3 text-[13px] font-bold text-heading">{netGST >= 0 ? 'Net GST Payable' : 'Net GST Refundable'}</td>
                  <td className="px-5 py-3 text-right text-[13px] font-bold text-heading">{fmt(netCGST)}</td>
                  <td className="px-5 py-3 text-right text-[13px] font-bold text-heading">{fmt(netSGST)}</td>
                  <td className="px-5 py-3 text-right text-[13px] font-bold text-heading">{fmt(netGST)}</td>
                </tr></tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
