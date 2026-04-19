import { ButtonSpinner } from '../components/Spinner';
import { StatSkeleton, TableSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useState, useEffect, useMemo } from 'react';
import { adminAPI } from '../services/api';
import Modal from '../components/Modal';
import UserAvatar from '../components/UserAvatar';
import { Plus, Receipt, IndianRupee, TrendingUp, Clock, CheckCircle2, Eye, Download, Pencil, ChevronDown, FileText, AlertTriangle, CreditCard, Save } from 'lucide-react';
import InfoTooltip from '../components/InfoTooltip';
import { useToast } from '../components/Toast';
import { useSocietyConfig } from '../context/SocietyConfigContext';
import { getTypeColor } from '../utils/typeColors';
import Chart from 'react-apexcharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatDate } from '../utils/format';
import { saveAs } from 'file-saver';

const STATUS_COLORS = {
  PAID: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};

const fmt = (n) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 });

function IncomeCharts({ payments }) {
  const isDark = document.documentElement.classList.contains('dark');
  const chartColors = ['#1a6dd1', '#0da684', '#4a94e0', '#f4a14d', '#41cbd8', '#ef3463', '#e96d8e', '#5db7de'];

  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) });
    }
    const data = months.map(m => payments.filter(p => {
      if (p.status !== 'PAID') return false;
      const dt = new Date(p.paidAt || p.createdAt);
      return dt.getFullYear() === m.year && dt.getMonth() === m.month;
    }).reduce((s, p) => s + Number(p.amount), 0));
    return { labels: months.map(m => m.label), data };
  }, [payments]);

  const typeData = useMemo(() => {
    const types = {};
    payments.filter(p => p.status === 'PAID').forEach(p => {
      const t = p.paymentType?.replace(/_/g, ' ') || 'Other';
      types[t] = (types[t] || 0) + Number(p.amount);
    });
    return { labels: Object.keys(types), series: Object.values(types) };
  }, [payments]);

  const barOptions = {
    chart: { type: 'bar', fontFamily: 'inherit', toolbar: { show: false }, background: 'transparent' },
    theme: { mode: isDark ? 'dark' : 'light' },
    colors: ['#0da684'],
    plotOptions: { bar: { borderRadius: 4, borderRadiusApplication: 'end', columnWidth: '45%' } },
    dataLabels: { enabled: false },
    grid: { borderColor: isDark ? '#2a3248' : '#e3ebf6', strokeDashArray: 4 },
    xaxis: { categories: monthlyData.labels, labels: { style: { colors: isDark ? '#7a82b1' : '#95a0c5', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: isDark ? '#7a82b1' : '#95a0c5', fontSize: '11px' }, formatter: (v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v } },
    tooltip: { theme: isDark ? 'dark' : 'light' },
  };

  const donutOptions = {
    chart: { type: 'donut', fontFamily: 'inherit', toolbar: { show: false }, background: 'transparent' },
    theme: { mode: isDark ? 'dark' : 'light' },
    colors: chartColors,
    labels: typeData.labels,
    plotOptions: { pie: { donut: { size: '70%', labels: { show: true, name: { fontSize: '12px', color: isDark ? '#d9e1ec' : '#25282d' }, value: { fontSize: '16px', fontWeight: 600, color: isDark ? '#d9e1ec' : '#25282d', formatter: (v) => `₹${Number(v).toLocaleString('en-IN')}` }, total: { show: true, label: 'Total', color: isDark ? '#7a82b1' : '#95a0c5', formatter: (w) => `₹${w.globals.seriesTotals.reduce((a, b) => a + b, 0).toLocaleString('en-IN')}` } } } } },
    dataLabels: { enabled: false },
    legend: { position: 'bottom', labels: { colors: isDark ? '#a8b5d1' : '#555b7e' }, fontSize: '11px', markers: { size: 4 } },
    stroke: { width: 0 },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <div className="lg:col-span-2 bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-[14px] font-semibold text-heading">Monthly Collection Trend</h2>
          <p className="text-[11px] text-muted mt-0.5">Last 6 months</p>
        </div>
        <div className="p-4">
          <Chart options={barOptions} series={[{ name: 'Collections', data: monthlyData.data }]} type="bar" height={260} />
        </div>
      </div>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-[14px] font-semibold text-heading">Collection by Category</h2>
          <p className="text-[11px] text-muted mt-0.5">Type-wise distribution</p>
        </div>
        <div className="p-4 flex items-center justify-center">
          {typeData.series.length > 0 ? (
            <Chart options={donutOptions} series={typeData.series} type="donut" height={260} />
          ) : (
            <EmptyState icon={CreditCard} title="No collection data" description="Collection data will appear here once payments are recorded." />
          )}
        </div>
      </div>
    </div>
  );
}

export default function Payments() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [receiptModal, setReceiptModal] = useState(false);
  const [receiptUserId, setReceiptUserId] = useState('');
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [receiptAmount, setReceiptAmount] = useState('');
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editType, setEditType] = useState('MAINTENANCE');
  const [registerOpen, setRegisterOpen] = useState(true);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [penaltyModal, setPenaltyModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ periodMode: 'MONTHLY', month: new Date().getMonth() + 1, year: new Date().getFullYear(), periodFrom: '', periodTo: '', paymentType: 'MAINTENANCE', calculationMode: 'PER_SQFT', amountPerUnit: '', ratePerSqFt: '', dueDays: 15, dueDate: '' });
  const handleInvoiceTypeChange = (paymentType) => {
    const incType = incomeTypes.find(t => t.code === paymentType);
    if (incType?.oneTime) {
      setInvoiceForm(f => ({ ...f, paymentType, periodMode: 'ONE_TIME', calculationMode: 'LUMPSUM' }));
    } else {
      setInvoiceForm(f => ({ ...f, paymentType, periodMode: f.periodMode === 'ONE_TIME' ? 'MONTHLY' : f.periodMode, calculationMode: paymentType === 'MAINTENANCE' ? 'PER_SQFT' : 'LUMPSUM' }));
    }
  };
  const [penaltyForm, setPenaltyForm] = useState({ annualRate: '18' });
  const toast = useToast();
  const { config: societyConfig, incomeTypes } = useSocietyConfig();
  const propertyLabel = societyConfig?.propertyLabel || 'Property';

  // Build dynamic PAYMENT_TYPES tabs from context
  const PAYMENT_TYPES = [{ value: 'ALL', label: 'All Receipts' }, ...incomeTypes.map(t => ({ value: t.code, label: t.displayName }))];

  const fetchData = async () => {
    try {
      const [paymentsRes, usersRes] = await Promise.all([adminAPI.getAllPayments(), adminAPI.getUsers()]);
      setPayments(paymentsRes.data); setUsers(usersRes.data);
    } catch (err) { console.error('Failed to load data', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openReceiptModal = () => {
    setReceiptUserId(''); setPendingInvoices([]); setSelectedInvoiceId(''); setReceiptAmount('');
    setError(''); setReceiptModal(true);
  };

  const handleUserChange = async (userId) => {
    setReceiptUserId(userId);
    setSelectedInvoiceId(''); setReceiptAmount(''); setPendingInvoices([]);
    if (!userId) return;
    setLoadingInvoices(true);
    try {
      const { data } = await adminAPI.getPaymentsByUser(userId);
      setPendingInvoices(data.filter(p => p.status === 'PENDING'));
    } catch { setPendingInvoices([]); }
    finally { setLoadingInvoices(false); }
  };

  const handleInvoiceSelect = (invoiceId) => {
    setSelectedInvoiceId(invoiceId);
    if (invoiceId) {
      const inv = pendingInvoices.find(p => String(p.id) === String(invoiceId));
      if (inv) setReceiptAmount(String(Number(inv.amount) + Number(inv.penaltyAmount || 0)));
    } else {
      setReceiptAmount('');
    }
  };

  const handleRecordReceipt = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await adminAPI.recordReceipt(selectedInvoiceId, Number(receiptAmount));
      toast.success('Receipt recorded successfully');
      setReceiptModal(false); fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Failed to record receipt'); }
    finally { setSaving(false); }
  };

  const openEditModal = (payment) => {
    setEditId(payment.id);
    setEditType(payment.paymentType);
    setEditForm({
      userId: String(payment.userId),
      amount: String(payment.amount),
      periodFrom: payment.periodFrom || '',
      periodTo: payment.periodTo || '',
      description: payment.description || '',
    });
    setError(''); setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { userId: Number(editForm.userId), paymentType: editType, amount: Number(editForm.amount), periodFrom: editForm.periodFrom || undefined, periodTo: editForm.periodTo || undefined, description: editForm.description };
      await adminAPI.updatePayment(editId, payload);
      toast.success('Payment updated');
      setEditModalOpen(false); fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Failed to update'); }
    finally { setSaving(false); }
  };

  const handleGenerateInvoices = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isOneTime = invoiceForm.periodMode === 'ONE_TIME';
      const calcMode = invoiceForm.calculationMode === 'PER_SQFT' ? 'PER_SQFT' : 'LUMPSUM';
      const payload = {
        paymentType: invoiceForm.paymentType,
        periodMode: invoiceForm.periodMode,
        calculationMode: calcMode,
        dueDays: isOneTime ? null : invoiceForm.dueDays,
        dueDate: isOneTime ? invoiceForm.dueDate : null,
        amountPerUnit: calcMode === 'LUMPSUM' ? Number(invoiceForm.amountPerUnit) : null,
        ratePerSqFt: calcMode === 'PER_SQFT' ? Number(invoiceForm.ratePerSqFt) : null,
        month: invoiceForm.periodMode === 'MONTHLY' ? invoiceForm.month : null,
        year: invoiceForm.periodMode === 'MONTHLY' ? invoiceForm.year : null,
        periodFrom: invoiceForm.periodMode === 'CUSTOM' ? invoiceForm.periodFrom : null,
        periodTo: invoiceForm.periodMode === 'CUSTOM' ? invoiceForm.periodTo : null,
      };
      const res = await adminAPI.generateInvoices(payload);
      if (res.data.generated > 0) {
        toast.success(`Generated ${res.data.generated} invoice(s) for ${res.data.total} ${propertyLabel.toLowerCase()}s (${res.data.skipped} skipped)`);
      } else {
        toast.error(`No invoices generated — ${res.data.skipped} ${propertyLabel.toLowerCase()}(s) skipped. Possible reasons: invoices already exist for this period, no residents assigned, or missing ${propertyLabel.toLowerCase()} area.`);
      }
      setInvoiceModal(false);
      setRegisterOpen(true);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to generate invoices'); }
    finally { setSaving(false); }
  };

  const handleApplyPenalties = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminAPI.applyPenalties({ annualRate: Number(penaltyForm.annualRate) });
      toast.success(`Applied penalties to ${res.data.applied} payments`);
      setPenaltyModal(false);
      fetchData();
    } catch (err) { toast.error('Failed to apply penalties'); }
    finally { setSaving(false); }
  };

  const generateReceiptPDF = (p) => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text(societyConfig.societyName || 'Society Management', 105, 20, { align: 'center' });
    doc.setFontSize(10); doc.text(societyConfig.tagline || 'Society Management', 105, 27, { align: 'center' });
    doc.setDrawColor(49, 103, 243); doc.setLineWidth(0.5); doc.line(14, 32, 196, 32);
    doc.setFontSize(14); doc.text('Payment Receipt', 105, 42, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Receipt No: ${p.receiptNumber || 'N/A'}`, 14, 55);
    doc.text(`Date: ${formatDate(p.paidAt || p.createdAt)}`, 140, 55);
    doc.text(`Resident: ${p.fullName}`, 14, 65);
    doc.text(`${propertyLabel}: ${p.unitNumber || 'N/A'}`, 140, 65);
    doc.autoTable({
      startY: 75, head: [['Description', 'Period', 'Amount', 'Penalty', 'Total']],
      body: [[
        p.paymentType?.replace(/_/g, ' '),
        p.periodFrom && p.periodTo ? `${p.periodFrom} to ${p.periodTo}` : 'One Time',
        `Rs. ${fmt(p.amount)}`,
        p.penaltyAmount > 0 ? `Rs. ${fmt(p.penaltyAmount)}` : '-',
        `Rs. ${fmt(Number(p.amount) + Number(p.penaltyAmount || 0))}`
      ]],
      styles: { fontSize: 10 }, headStyles: { fillColor: [49, 103, 243] },
    });
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Status: ${p.status}`, 14, finalY);
    if (p.dueDate) doc.text(`Due Date: ${p.dueDate}`, 14, finalY + 7);
    doc.setFontSize(8); doc.setTextColor(128); doc.text('This is a computer-generated receipt.', 105, 280, { align: 'center' });
    doc.save(`receipt-${p.receiptNumber || p.id}.pdf`);
  };

  const allFiltered = activeTab === 'ALL' ? payments : payments.filter(p => p.paymentType === activeTab);
  const PAGE_SIZE = 30;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const filteredPayments = allFiltered.slice(0, visibleCount);
  const hasMore = visibleCount < allFiltered.length;

  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + Number(p.amount), 0);
  const totalCount = payments.length;

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text('Payment Report', 14, 20);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);
    doc.autoTable({
      startY: 35, head: [['Receipt', 'Member', propertyLabel, 'Type', 'Status', 'Amount', 'Date']],
      body: allFiltered.map(p => [p.receiptNumber, p.fullName, p.unitNumber || '-', p.paymentType?.replace(/_/g, ' '), p.status, `₹${fmt(p.amount)}`, formatDate(p.paidAt)]),
      styles: { fontSize: 9, font: 'helvetica' },
      headStyles: { fillColor: [49, 103, 243] },
      foot: [['', '', '', '', 'Total', `₹${fmt(allFiltered.reduce((s, p) => s + Number(p.amount), 0))}`, '']],
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    });
    doc.save('payments-report.pdf');
  };

  const exportExcel = () => {
    const data = allFiltered.map(p => ({ Receipt: p.receiptNumber, Member: p.fullName, [propertyLabel]: p.unitNumber || '-', Type: p.paymentType?.replace(/_/g, ' '), Status: p.status, Amount: Number(p.amount), Date: formatDate(p.paidAt) }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payments');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf]), 'payments-report.xlsx');
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">Income & Receipts</h1>
          <p className="text-[13px] text-muted mt-0.5">Record and manage society collections from members</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportPDF} className="btn-outline inline-flex items-center gap-1.5 px-3 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors" title="Export PDF"><Download className="w-3.5 h-3.5" /> PDF</button>
          <button onClick={exportExcel} className="btn-outline inline-flex items-center gap-1.5 px-3 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors" title="Export Excel"><Download className="w-3.5 h-3.5" /> Excel</button>
          <button onClick={() => setInvoiceModal(true)} className="btn-outline inline-flex items-center gap-1.5 px-3 py-2 bg-amber-600 text-white rounded text-[13px] font-medium hover:bg-amber-700 transition-colors"><FileText className="w-3.5 h-3.5" /> Generate Invoices</button>
          <button onClick={() => setPenaltyModal(true)} className="btn-outline inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded text-[13px] font-medium hover:bg-red-700 transition-colors"><AlertTriangle className="w-3.5 h-3.5" /> Late Fees</button>
          <button onClick={openReceiptModal} className="btn-primary inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-green-700 transition-colors">
            <Plus className="w-4 h-4" /> Record Receipt
          </button>
        </div>
      </div>

      {success && <div className="mb-4 p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 rounded text-[13px]">{success}</div>}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg border border-border p-5 stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Total Collections</p>
              <p className="text-[22px] font-bold text-green-600 dark:text-green-400 mt-1"><IndianRupee className="w-5 h-5 inline" />{fmt(totalPaid)}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-500/15 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-5 stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Outstanding Dues</p>
              <p className="text-[22px] font-bold text-amber-600 dark:text-amber-400 mt-1"><IndianRupee className="w-5 h-5 inline" />{fmt(totalPending)}</p>
            </div>
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/15 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-5 stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Total Receipts</p>
              <p className="text-[22px] font-bold text-heading mt-1">{totalCount}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/15 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {payments.length > 0 && <IncomeCharts payments={payments} />}

      {/* Income Register - Collapsible */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <button onClick={() => setRegisterOpen(!registerOpen)} className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-card-hover transition-colors">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-[14px] font-semibold text-heading">Income Register</h2>
            <span className="text-[11px] text-muted px-2 py-0.5 bg-card-alt rounded">{payments.length} entries</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 ${registerOpen ? 'rotate-180' : ''}`} />
        </button>

        {registerOpen && (
        <>
        <div className="px-5 pt-0 pb-0 border-t border-b border-border flex flex-wrap gap-0">
          {PAYMENT_TYPES.map(t => (
            <button key={t.value} onClick={() => { setActiveTab(t.value); setVisibleCount(PAGE_SIZE); }}
              className={`px-4 py-2.5 text-[13px] font-medium transition-colors relative ${activeTab === t.value ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted hover:text-heading'}`}>
              {t.label}
              {activeTab === t.value && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600 dark:bg-indigo-400 rounded-t" />}
            </button>
          ))}
        </div>

        {loading ? <div className="space-y-6"><StatSkeleton count={4} /><TableSkeleton /></div> : (
          <div className="table-container">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Receipt No.</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Received From</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Particulars</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Status</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Due Date</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Amount (₹)</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Penalty</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Date</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => (
                  <tr key={p.id} className={`border-b border-dashed border-border hover:bg-card-hover transition-colors ${p.overdue ? 'bg-red-50/50 dark:bg-red-500/5' : ''}`}>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-heading">
                        <Receipt className="w-3.5 h-3.5 text-muted" />{p.receiptNumber || '-'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={p.fullName} src={p.profileImage} />
                        <div>
                          <p className="text-[13px] font-medium text-heading">{p.fullName}</p>
                          <p className="text-[11px] text-muted">{p.unitNumber || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${getTypeColor(p.paymentType)}`}>
                        {p.paymentType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-700'}`}>
                        {p.status}
                      </span>
                      {p.overdue && <span className="ml-1 inline-flex px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400 text-[10px] font-bold">OVERDUE</span>}
                    </td>
                    <td className="px-5 py-3 text-[13px] text-muted">{p.dueDate || '-'}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-[13px] font-semibold text-heading"><IndianRupee className="w-3 h-3 inline" /> {fmt(p.amount)}</span>
                    </td>
                    <td className="px-5 py-3 text-right text-[13px]">
                      {p.penaltyAmount > 0 ? <span className="text-red-600 font-medium">+{fmt(p.penaltyAmount)}</span> : <span className="text-muted">-</span>}
                    </td>
                    <td className="px-5 py-3 text-[13px] text-muted">{formatDate(p.paidAt || p.createdAt)}</td>
                    <td className="px-5 py-3 text-right flex items-center justify-end gap-1">
                      {p.status === 'PAID' && <button onClick={() => generateReceiptPDF(p)} className="p-1.5 text-muted hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 rounded transition-colors" title="Download Receipt"><Download className="w-4 h-4" /></button>}
                      <button onClick={() => openEditModal(p)} className="p-1.5 text-muted hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                {filteredPayments.length === 0 && <tr><td colSpan={10}><EmptyState icon={Receipt} title="No payments found" description="No payment records match the current filters." /></td></tr>}
              </tbody>
            </table>
            {hasMore && (
              <div className="px-5 py-3 border-t border-border text-center">
                <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)} className="text-[13px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">
                  Show more ({allFiltered.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}
        </>
        )}
      </div>

      {/* Invoice Generation Modal */}
      {invoiceModal && (
        <Modal open title="Generate Invoices" onClose={() => setInvoiceModal(false)} full>
          <form onSubmit={handleGenerateInvoices}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[14px] font-semibold text-heading">Invoice Details</h2>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setInvoiceModal(false)} className="px-4 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-amber-600 text-white rounded text-[13px] font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">{saving ? <><ButtonSpinner /> Generating...</> : <><Save className="w-4 h-4" /> Generate Invoices</>}</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  {invoiceForm.periodMode !== 'ONE_TIME' && (
                    <>
                      <div>
                        <label className="block text-[13px] font-medium text-heading mb-1">Billing Period</label>
                        <select value={invoiceForm.periodMode} onChange={e => setInvoiceForm({...invoiceForm, periodMode: e.target.value})} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                          <option value="MONTHLY">Monthly (select month & year)</option>
                          <option value="CUSTOM">Custom Period (select date range)</option>
                        </select>
                      </div>
                      {invoiceForm.periodMode === 'MONTHLY' ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[13px] font-medium text-heading mb-1">Month</label>
                            <select value={invoiceForm.month} onChange={e => setInvoiceForm({...invoiceForm, month: Number(e.target.value)})} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                              {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('en', {month:'long'})}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[13px] font-medium text-heading mb-1">Year</label>
                            <input type="number" min="2000" max="2099" value={invoiceForm.year} onChange={e => setInvoiceForm({...invoiceForm, year: Number(e.target.value)})} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[13px] font-medium text-heading mb-1">Period From</label>
                            <input type="date" required value={invoiceForm.periodFrom} onChange={e => setInvoiceForm({...invoiceForm, periodFrom: e.target.value})} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" />
                          </div>
                          <div>
                            <label className="block text-[13px] font-medium text-heading mb-1">Period To</label>
                            <input type="date" required value={invoiceForm.periodTo} onChange={e => setInvoiceForm({...invoiceForm, periodTo: e.target.value})} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {invoiceForm.calculationMode === 'PER_SQFT' ? (
                    <div>
                      <label className="block text-[13px] font-medium text-heading mb-1">Rate Per Sq.Ft (₹)<InfoTooltip text={`Amount = Rate × ${propertyLabel} Area (sq.ft). ${propertyLabel}s without area will be skipped.`} /></label>
                      <input type="number" min="0.01" step="0.01" required value={invoiceForm.ratePerSqFt} onChange={e => setInvoiceForm({...invoiceForm, ratePerSqFt: e.target.value})} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="e.g. 2.50" />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[13px] font-medium text-heading mb-1">{`Amount Per ${propertyLabel} (₹)`}</label>
                      <input type="number" min="1" required value={invoiceForm.amountPerUnit} onChange={e => setInvoiceForm({...invoiceForm, amountPerUnit: e.target.value})} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="e.g. 5000" />
                    </div>
                  )}
                  {invoiceForm.periodMode === 'ONE_TIME' ? (
                    <div>
                      <label className="block text-[13px] font-medium text-heading mb-1">Due Date<InfoTooltip text="Late fees will be calculated from this date for unpaid invoices." /></label>
                      <input type="date" required value={invoiceForm.dueDate} onChange={e => setInvoiceForm({...invoiceForm, dueDate: e.target.value})} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[13px] font-medium text-heading mb-1">Due Days (from period start)</label>
                      <input type="number" min="1" value={invoiceForm.dueDays} onChange={e => setInvoiceForm({...invoiceForm, dueDays: Number(e.target.value)})} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" />
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-6 md:sticky md:top-4 md:self-start">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="text-[14px] font-semibold text-heading mb-1">Payment Type</h2>
                  <p className="text-[11px] text-muted mb-3"><InfoTooltip text={invoiceForm.paymentType === 'MAINTENANCE' ? `Maintenance is calculated as Rate Per Sq.Ft × ${propertyLabel} Area. Invoices will be generated for all occupied ${propertyLabel.toLowerCase()}s.` : `This will create PENDING invoices for all ${propertyLabel.toLowerCase()}s that have an assigned resident.`} /> Select the type of invoice to generate.</p>
                  <select value={invoiceForm.paymentType} onChange={e => handleInvoiceTypeChange(e.target.value)} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                    {incomeTypes.filter(t => !t.systemManaged).map(t => (
                      <option key={t.code} value={t.code}>{t.displayName}</option>
                    ))}
                  </select>
                  {invoiceForm.periodMode === 'ONE_TIME' && <p className="text-[11px] text-muted mt-2"><InfoTooltip text={`One-time charge — will only generate if no prior ${invoiceForm.paymentType.toLowerCase()} invoice exists for a ${propertyLabel.toLowerCase()}.`} /> One-time charge</p>}
                </div>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Penalty Modal */}
      {penaltyModal && (
        <Modal open title="Apply Late Fees" onClose={() => setPenaltyModal(false)} full>
          <form onSubmit={handleApplyPenalties}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[14px] font-semibold text-heading">Late Fee Configuration</h2>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPenaltyModal(false)} className="px-4 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
                <button type="submit" disabled={saving || !penaltyForm.annualRate} className="px-4 py-2 bg-red-600 text-white rounded text-[13px] font-medium hover:bg-red-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">{saving ? <><ButtonSpinner /> Applying...</> : <><Save className="w-4 h-4" /> Apply Late Fees</>}</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <p className="text-[13px] text-muted">Applies an annual interest-based late fee to all overdue PENDING payments.<InfoTooltip text="Penalty is calculated proportionally based on the number of days overdue. Formula: Amount × Annual Rate × Days Overdue ÷ 365" /></p>
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Annual Interest Rate (%)<InfoTooltip text={`e.g. 18% p.a. on ₹5,000 overdue by 30 days = ₹${(5000 * (Number(penaltyForm.annualRate) || 0) * 30 / 36500).toFixed(0)} penalty`} /></label>
                    <input type="number" min="0.01" step="0.01" required value={penaltyForm.annualRate} onChange={e => setPenaltyForm({...penaltyForm, annualRate: e.target.value})} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="e.g. 18" />
                  </div>
                </div>
              </div>
              <div className="space-y-6 md:sticky md:top-4 md:self-start"></div>
            </div>
          </form>
        </Modal>
      )}

      {/* Record Receipt Modal */}
      <Modal open={receiptModal} onClose={() => setReceiptModal(false)} title="Record Receipt" full>
        {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded text-[13px]">{error}</div>}
        <form onSubmit={handleRecordReceipt}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[14px] font-semibold text-heading">Receipt Details</h2>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setReceiptModal(false)} className="px-4 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
              <button type="submit" disabled={saving || !receiptUserId || !selectedInvoiceId || !receiptAmount} className="px-4 py-2 bg-green-600 text-white rounded text-[13px] font-medium hover:bg-green-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">
                {saving ? <><ButtonSpinner /> Processing...</> : <><Save className="w-4 h-4" /> Record Receipt</>}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <p className="text-[13px] text-muted">Select a member and their pending invoice to record a payment.</p>
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Member *</label>
                  <select value={receiptUserId} onChange={e => handleUserChange(e.target.value)} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required>
                    <option value="">-- Select Member --</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.unitNumber || u.username})</option>)}
                  </select>
                </div>

                {receiptUserId && (
                  <>
                    {loadingInvoices ? (
                      <p className="text-[13px] text-muted py-2">Loading pending invoices...</p>
                    ) : pendingInvoices.length === 0 ? (
                      <div className="p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg text-[13px] text-green-700 dark:text-green-400">
                        No pending invoices for this member.
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-[13px] font-medium text-heading mb-1">Pending Invoice *</label>
                          <select value={selectedInvoiceId} onChange={e => handleInvoiceSelect(e.target.value)} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required>
                            <option value="">-- Select Invoice --</option>
                            {pendingInvoices.map(inv => (
                              <option key={inv.id} value={inv.id}>
                                {inv.receiptNumber || `INV-${inv.id}`} — {inv.paymentType.replace(/_/g, ' ')} — ₹{fmt(Number(inv.amount) + Number(inv.penaltyAmount || 0))}{inv.periodFrom ? ` (${inv.periodFrom} to ${inv.periodTo})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {selectedInvoiceId && (() => {
                          const inv = pendingInvoices.find(p => String(p.id) === String(selectedInvoiceId));
                          if (!inv) return null;
                          const totalDue = Number(inv.amount) + Number(inv.penaltyAmount || 0);
                          return (
                            <>
                              <div>
                                <label className="block text-[13px] font-medium text-heading mb-1">Amount Received (₹) *</label>
                                <input type="number" min="1" max={totalDue} step="0.01" required value={receiptAmount} onChange={e => setReceiptAmount(e.target.value)}
                                  className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder={`Full amount: ${fmt(totalDue)}`} />
                                {receiptAmount && Number(receiptAmount) < totalDue && (
                                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">Partial payment — ₹{fmt(totalDue - Number(receiptAmount))} will remain pending.</p>
                                )}
                                {receiptAmount && Number(receiptAmount) >= totalDue && (
                                  <p className="text-[11px] text-green-600 dark:text-green-400 mt-1">Full payment — invoice will be marked as PAID.</p>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="space-y-6 md:sticky md:top-4 md:self-start">
              {selectedInvoiceId && (() => {
                const inv = pendingInvoices.find(p => String(p.id) === String(selectedInvoiceId));
                if (!inv) return null;
                const totalDue = Number(inv.amount) + Number(inv.penaltyAmount || 0);
                return (
                  <div className="bg-card-alt border border-border rounded-xl p-5 space-y-2">
                    <h2 className="text-[14px] font-semibold text-heading mb-2">Invoice Summary</h2>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-muted">Invoice</span>
                      <span className="font-medium text-heading">{inv.receiptNumber || `INV-${inv.id}`}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-muted">Type</span>
                      <span className="font-medium text-heading">{inv.paymentType.replace(/_/g, ' ')}</span>
                    </div>
                    {inv.periodFrom && (
                      <div className="flex justify-between text-[13px]">
                        <span className="text-muted">Period</span>
                        <span className="font-medium text-heading">{inv.periodFrom} to {inv.periodTo}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[13px]">
                      <span className="text-muted">Principal</span>
                      <span className="font-medium text-heading">₹{fmt(inv.amount)}</span>
                    </div>
                    {Number(inv.penaltyAmount) > 0 && (
                      <div className="flex justify-between text-[13px]">
                        <span className="text-muted">Penalty</span>
                        <span className="font-medium text-red-600 dark:text-red-400">₹{fmt(inv.penaltyAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[13px] pt-2 border-t border-border">
                      <span className="font-semibold text-heading">Total Due</span>
                      <span className="text-[16px] font-bold text-indigo-700 dark:text-indigo-400">₹{fmt(totalDue)}</span>
                    </div>
                    {inv.dueDate && (
                      <div className="flex justify-between text-[13px]">
                        <span className="text-muted">Due Date</span>
                        <span className={`font-medium ${inv.overdue ? 'text-red-600 dark:text-red-400' : 'text-heading'}`}>{inv.dueDate}{inv.overdue ? ' (OVERDUE)' : ''}</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Payment Modal */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Receipt" full>
        {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-lg text-[13px]">{error}</div>}
        <form onSubmit={handleEditSubmit}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[14px] font-semibold text-heading">Receipt Details</h2>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setEditModalOpen(false)} className="px-4 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
              <button type="submit" disabled={saving || !editForm.amount} className="px-4 py-2 bg-indigo-600 text-white rounded text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">
                {saving ? <><ButtonSpinner /> Saving...</> : <><Save className="w-4 h-4" /> Update Receipt</>}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Amount (₹) *</label>
                  <input type="number" min="1" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Description</label>
                  <input type="text" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" />
                </div>
              </div>
            </div>
            <div className="space-y-6 md:sticky md:top-4 md:self-start"></div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
