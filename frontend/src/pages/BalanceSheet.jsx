import { ButtonSpinner } from '../components/Spinner';
import { TableSkeleton } from '../components/Skeleton';
import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import { IndianRupee, Filter, FileDown, FileSpreadsheet, Building2, Printer, CalendarDays, Wrench, Landmark, UserPlus, CalendarCheck, Zap, Droplets, Shield, Wallet, Sparkles, TreePine, Hammer, CircleDot, ChevronDown } from 'lucide-react';
import { useSocietyConfig } from '../context/SocietyConfigContext';
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

const TYPE_ICONS = { MAINTENANCE: Wrench, CORPUS: Landmark, MEMBERSHIP: UserPlus, AMENITY_BOOKING: CalendarCheck };
const TYPE_COLORS = { MAINTENANCE: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400', CORPUS: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400', MEMBERSHIP: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400', AMENITY_BOOKING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' };
const EXP_ICONS = { ELECTRICITY: Zap, WATER: Droplets, SECURITY: Shield, MAINTENANCE: Wrench, SALARY: Wallet, CLEANING: Sparkles, GARDENING: TreePine, REPAIRS: Hammer, OTHER: CircleDot };
const EXP_COLORS = { ELECTRICITY: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400', WATER: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400', SECURITY: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400', MAINTENANCE: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400', SALARY: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400', CLEANING: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400', GARDENING: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400', REPAIRS: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400', OTHER: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400' };

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

    const balance = Number(data.balance);
    doc.setFontSize(11); doc.setFont(undefined, 'bold');
    doc.text(`Surplus / (Deficit) [A - B]: Rs. ${fmt(balance)}`, 14, y); y += 10;

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
      ['Surplus / (Deficit)', '', Number(data.balance)],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    ws1['!cols'] = [{ wch: 30 }, { wch: 10 }, { wch: 18 }];
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
            <div className="grid grid-cols-3 divide-x divide-dashed divide-border border-b border-dashed border-border">
              <div className="p-6 text-center">
                <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Total Receipts (A)</p>
                <p className="text-[22px] font-bold text-green-600 dark:text-green-400 mt-2"><IndianRupee className="w-5 h-5 inline" />{fmt(data.totalIncome)}</p>
              </div>
              <div className="p-6 text-center">
                <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Total Payments (B)</p>
                <p className="text-[22px] font-bold text-red-500 dark:text-red-400 mt-2"><IndianRupee className="w-5 h-5 inline" />{fmt(data.totalExpense)}</p>
              </div>
              <div className="p-6 text-center">
                <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Surplus / (Deficit)</p>
                <p className={`text-[22px] font-bold mt-2 ${Number(data.balance) >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500 dark:text-red-400'}`}><IndianRupee className="w-5 h-5 inline" />{fmt(data.balance)}</p>
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
                        {data.incomeBreakdown.map((item, i) => (
                          <tr key={item.type} className="border-b border-dashed border-border">
                            <td className="px-4 py-2.5 text-[13px] text-muted">{i + 1}</td>
                            <td className="px-4 py-2.5 text-[13px] font-medium text-heading">{item.type.replace(/_/g, ' ')}</td>
                            <td className="px-4 py-2.5 text-[13px] text-muted text-center">{item.count}</td>
                            <td className="px-4 py-2.5 text-[13px] text-heading text-right">{fmt(item.amount)}</td>
                          </tr>
                        ))}
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

            {/* Grand Total / Net Balance */}
            <div className="p-8 border-b border-dashed border-border">
              <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted">Total Income (A)</span>
                    <span className="font-medium text-heading">{fmt(data.totalIncome)}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted">Total Expenditure (B)</span>
                    <span className="font-medium text-heading">{fmt(data.totalExpense)}</span>
                  </div>
                  <div className="border-t border-border pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-[14px] font-bold text-heading">Surplus / (Deficit)</span>
                      <span className={`text-[18px] font-bold ${Number(data.balance) >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500 dark:text-red-400'}`}>
                        <IndianRupee className="w-4 h-4 inline" />{fmt(data.balance)}
                      </span>
                    </div>
                  </div>
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
                <li>For any discrepancies, please contact the society management office.</li>
              </ul>
            </div>

            {/* Action Buttons (Approx invoice-style bottom bar) */}
            <div className="p-6 flex flex-wrap justify-end gap-2 bg-card-alt">
              <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={exportPDF} className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded text-[13px] font-medium hover:bg-red-600 transition-colors">
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
                        const Icon = TYPE_ICONS[item.type];
                        return (
                          <tr key={idx} className="border-b border-dashed border-border hover:bg-card-hover transition-colors">
                            <td className="px-5 py-3 text-[13px] text-muted">{item.date}</td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${TYPE_COLORS[item.type] || 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400'}`}>
                                {Icon && <Icon className="w-3 h-3" />}{item.type.replace(/_/g, ' ')}
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
                        const Icon = EXP_ICONS[item.category];
                        return (
                          <tr key={item.id} className="border-b border-dashed border-border hover:bg-card-hover transition-colors">
                            <td className="px-5 py-3 text-[13px] text-muted">{item.expenseDate}</td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${EXP_COLORS[item.category] || EXP_COLORS.OTHER}`}>
                                {Icon && <Icon className="w-3 h-3" />}{item.category.replace(/_/g, ' ')}
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
