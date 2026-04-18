import { ButtonSpinner } from '../components/Spinner';
import { StatSkeleton, TableSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useState, useEffect, useMemo } from 'react';
import { adminAPI } from '../services/api';
import Modal from '../components/Modal';
import { Plus, Trash2, IndianRupee, Search, TrendingDown, Receipt, Tag, Download, Zap, Droplets, Shield, Wrench, Wallet, Sparkles, TreePine, Hammer, CircleDot, ChevronDown, Save, CheckCircle, XCircle, Clock, Banknote, Upload, FileText, Calendar } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import Chart from 'react-apexcharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const EXPENSE_CATEGORIES = ['ELECTRICITY', 'WATER', 'SECURITY', 'MAINTENANCE', 'SALARY', 'CLEANING', 'GARDENING', 'REPAIRS', 'OTHER'];
const EXPENSE_STATUSES = ['DRAFT', 'APPROVED', 'PAID', 'CANCELLED'];
const fmt = (n) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 });

const CATEGORY_ICONS = {
  ELECTRICITY: Zap, WATER: Droplets, SECURITY: Shield, MAINTENANCE: Wrench,
  SALARY: Wallet, CLEANING: Sparkles, GARDENING: TreePine, REPAIRS: Hammer, OTHER: CircleDot,
};

const CATEGORY_COLORS = {
  ELECTRICITY: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
  WATER: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
  SECURITY: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  MAINTENANCE: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  SALARY: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  CLEANING: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400',
  GARDENING: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  REPAIRS: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  OTHER: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400',
};

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400',
  APPROVED: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  PAID: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
};

const STATUS_ICONS = {
  DRAFT: Clock, APPROVED: CheckCircle, PAID: Banknote, CANCELLED: XCircle,
};

export default function Expenses() {
  const confirm = useConfirm();
  const [expenses, setExpenses] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [voucherMode, setVoucherMode] = useState('onetime'); // 'onetime' | 'monthly'
  const [form, setForm] = useState({ category: 'MAINTENANCE', amount: '', description: '', paidTo: '', vendorId: '', expenseDate: new Date().toISOString().split('T')[0], notes: '' });
  const [genYear, setGenYear] = useState(new Date().getFullYear());
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [registerOpen, setRegisterOpen] = useState(false);

  // Pay Vendor modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payVendorId, setPayVendorId] = useState('');
  const [paySelectedIds, setPaySelectedIds] = useState([]);
  const [payForm, setPayForm] = useState({ paymentMode: 'CASH', chequeNumber: '', chequeDate: '', chequeBankName: '', transactionReference: '', transactionDate: '' });
  const [paySaving, setPaySaving] = useState(false);

  // Bill upload
  const [billUploading, setBillUploading] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expRes, venRes] = await Promise.all([adminAPI.getExpenses(), adminAPI.getActiveVendors()]);
      setExpenses(expRes.data); setVendors(venRes.data);
    } catch (err) { console.error('Failed to load expenses', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = () => {
    setVoucherMode('onetime');
    setForm({ category: 'MAINTENANCE', amount: '', description: '', paidTo: '', vendorId: '', expenseDate: new Date().toISOString().split('T')[0], notes: '' });
    setGenYear(new Date().getFullYear());
    setGenMonth(new Date().getMonth() + 1);
    setError(''); setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { ...form, vendorId: form.vendorId || null };
      await adminAPI.createExpense(payload);
      setModalOpen(false); fetchData();
    }
    catch (err) { setError(err.response?.data?.message || 'Failed to add expense'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!await confirm({ title: 'Delete Expense', message: 'Are you sure you want to delete this expense voucher? This action cannot be undone.', confirmLabel: 'Delete', danger: true })) return;
    try { await adminAPI.deleteExpense(id); fetchData(); }
    catch { alert('Failed to delete expense'); }
  };

  const handleApprove = async (id) => {
    if (!await confirm({ title: 'Approve Voucher', message: 'Approve this voucher for payment?', confirmLabel: 'Approve', danger: false })) return;
    try { await adminAPI.approveExpense(id); fetchData(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to approve'); }
  };

  const handleCancel = async (id) => {
    if (!await confirm({ title: 'Cancel Voucher', message: 'Are you sure you want to cancel this voucher? This will mark it as cancelled.', confirmLabel: 'Cancel Voucher', danger: true })) return;
    try { await adminAPI.cancelExpense(id); fetchData(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to cancel'); }
  };

  const openPayVendorModal = (vendorId) => {
    setPayVendorId(vendorId || '');
    setPaySelectedIds([]);
    setPayForm({ paymentMode: 'CASH', chequeNumber: '', chequeDate: '', chequeBankName: '', transactionReference: '', transactionDate: new Date().toISOString().split('T')[0] });
    setPayModalOpen(true);
  };

  // Approved vouchers for selected vendor in pay modal
  const payVendorVouchers = payVendorId
    ? expenses.filter(e => String(e.vendorId) === String(payVendorId) && e.status === 'APPROVED')
    : expenses.filter(e => e.status === 'APPROVED');

  const paySelectedTotal = payVendorVouchers.filter(v => paySelectedIds.includes(v.id)).reduce((s, v) => s + Number(v.amount), 0);

  const togglePaySelect = (id) => {
    setPaySelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const togglePaySelectAll = () => {
    if (paySelectedIds.length === payVendorVouchers.length) setPaySelectedIds([]);
    else setPaySelectedIds(payVendorVouchers.map(v => v.id));
  };

  const handleMarkPaid = async (e) => {
    e.preventDefault();
    if (paySelectedIds.length === 0) return;
    if (!await confirm({ title: 'Confirm Payment', message: `Pay ${paySelectedIds.length} voucher${paySelectedIds.length !== 1 ? 's' : ''} totalling ₹${fmt(paySelectedTotal)} via ${payForm.paymentMode}?`, confirmLabel: 'Confirm Payment', danger: false })) return;
    setPaySaving(true);
    try {
      for (const id of paySelectedIds) {
        await adminAPI.markExpensePaid(id, payForm);
      }
      setPayModalOpen(false); fetchData();
    }
    catch (err) { alert(err.response?.data?.message || 'Failed to mark as paid'); }
    finally { setPaySaving(false); }
  };

  const handleBillUpload = async (id, file) => {
    setBillUploading(id);
    try { await adminAPI.uploadBill(id, file); fetchData(); }
    catch { alert('Failed to upload bill'); }
    finally { setBillUploading(null); }
  };

  const handleGenerate = async () => {
    setSaving(true); setError('');
    try {
      const { data } = await adminAPI.generateMonthlyVouchers(genYear, genMonth);
      if (data.length === 0) setError('No new vouchers generated. Make sure you have active CONTRACT type vendors with a monthly amount set. If they exist, they may already have vouchers for this month.');
      else { setModalOpen(false); fetchData(); }
    }
    catch (err) { setError(err.response?.data?.message || 'Failed to generate'); }
    finally { setSaving(false); }
  };

  const allFiltered = expenses.filter(exp => {
    const matchSearch = !search || exp.description?.toLowerCase().includes(search.toLowerCase()) || exp.paidTo?.toLowerCase().includes(search.toLowerCase()) || exp.category?.toLowerCase().includes(search.toLowerCase()) || exp.voucherNumber?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !filterCategory || exp.category === filterCategory;
    const matchStatus = !filterStatus || exp.status === filterStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  const totalAmount = allFiltered.reduce((sum, e) => sum + Number(e.amount), 0);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { DRAFT: 0, APPROVED: 0, PAID: 0, CANCELLED: 0 };
    expenses.forEach(e => { if (counts[e.status] !== undefined) counts[e.status]++; });
    return counts;
  }, [expenses]);

  // Progressive loading
  const PAGE_SIZE = 30;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const filtered = allFiltered.slice(0, visibleCount);
  const hasMore = visibleCount < allFiltered.length;

  // Chart data: spending by category
  const categoryData = useMemo(() => {
    const cats = {};
    expenses.forEach(e => {
      const c = e.category?.replace(/_/g, ' ') || 'Other';
      cats[c] = (cats[c] || 0) + Number(e.amount);
    });
    return { labels: Object.keys(cats), series: Object.values(cats) };
  }, [expenses]);

  // Monthly expense trend
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) });
    }
    const data = months.map(m => expenses.filter(e => {
      const dt = new Date(e.expenseDate || e.createdAt);
      return dt.getFullYear() === m.year && dt.getMonth() === m.month;
    }).reduce((s, e) => s + Number(e.amount), 0));
    return { labels: months.map(m => m.label), data };
  }, [expenses]);

  const isDark = document.documentElement.classList.contains('dark');
  const chartColors = ['#1a6dd1', '#0da684', '#ef3463', '#f4a14d', '#41cbd8', '#4a94e0', '#e96d8e', '#5db7de', '#82c341'];

  const donutOptions = {
    chart: { type: 'donut', fontFamily: 'inherit', toolbar: { show: false }, background: 'transparent' },
    theme: { mode: isDark ? 'dark' : 'light' },
    colors: chartColors,
    labels: categoryData.labels,
    plotOptions: { pie: { donut: { size: '70%', labels: { show: true, name: { fontSize: '12px', color: isDark ? '#d9e1ec' : '#25282d' }, value: { fontSize: '16px', fontWeight: 600, color: isDark ? '#d9e1ec' : '#25282d', formatter: (v) => `₹${fmt(v)}` }, total: { show: true, label: 'Total', color: isDark ? '#7a82b1' : '#95a0c5', formatter: (w) => `₹${fmt(w.globals.seriesTotals.reduce((a, b) => a + b, 0))}` } } } } },
    dataLabels: { enabled: false },
    legend: { position: 'bottom', labels: { colors: isDark ? '#a8b5d1' : '#555b7e' }, fontSize: '11px', markers: { size: 4 } },
    stroke: { width: 0 },
  };

  const barOptions = {
    chart: { type: 'bar', fontFamily: 'inherit', toolbar: { show: false }, background: 'transparent' },
    theme: { mode: isDark ? 'dark' : 'light' },
    colors: ['#ef3463'],
    plotOptions: { bar: { borderRadius: 4, borderRadiusApplication: 'end', columnWidth: '45%' } },
    dataLabels: { enabled: false },
    grid: { borderColor: isDark ? '#2a3248' : '#e3ebf6', strokeDashArray: 4 },
    xaxis: { categories: monthlyData.labels, labels: { style: { colors: isDark ? '#7a82b1' : '#95a0c5', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: isDark ? '#7a82b1' : '#95a0c5', fontSize: '11px' }, formatter: (v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v } },
    tooltip: { theme: isDark ? 'dark' : 'light' },
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">Expenditure Register</h1>
          <p className="text-[13px] text-muted mt-0.5">Track and manage society expenditure</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => {
            const doc = new jsPDF();
            doc.setFontSize(16); doc.text('Expense Report', 14, 20);
            doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);
            doc.autoTable({ startY: 35, head: [['Voucher', 'Date', 'Category', 'Paid To', 'Amount', 'Status']],
              body: allFiltered.map(e => [e.voucherNumber || '-', e.expenseDate, e.category?.replace(/_/g, ' '), e.paidTo || '-', `₹${fmt(e.amount)}`, e.status || 'DRAFT']),
              styles: { fontSize: 9 }, headStyles: { fillColor: [239, 52, 99] },
              foot: [['', '', '', 'Total', `₹${fmt(totalAmount)}`, '']], footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
            });
            doc.save('expenses-report.pdf');
          }} className="btn-outline inline-flex items-center gap-1.5 px-3 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors"><Download className="w-3.5 h-3.5" /> PDF</button>
          <button onClick={() => {
            const data = allFiltered.map(e => ({ Voucher: e.voucherNumber || '-', Date: e.expenseDate, Category: e.category?.replace(/_/g, ' '), 'Paid To': e.paidTo || '-', Description: e.description || '-', Amount: Number(e.amount), Status: e.status || 'DRAFT', 'Payment Mode': e.paymentMode || '-' }));
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
            saveAs(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })]), 'expenses-report.xlsx');
          }} className="btn-outline inline-flex items-center gap-1.5 px-3 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors"><Download className="w-3.5 h-3.5" /> Excel</button>
          <button onClick={() => openPayVendorModal('')} className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-green-700 transition-colors"><Banknote className="w-4 h-4" /> Pay Vendor</button>
          <button onClick={openModal} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-indigo-700 transition-colors"><Plus className="w-4 h-4" /> Create Voucher</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Draft', count: statusCounts.DRAFT, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-500/15', Icon: Clock },
          { label: 'Approved', count: statusCounts.APPROVED, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/15', Icon: CheckCircle },
          { label: 'Paid', count: statusCounts.PAID, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-500/15', Icon: Banknote },
          { label: 'Cancelled', count: statusCounts.CANCELLED, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-500/15', Icon: XCircle },
        ].map(s => (
          <button key={s.label} onClick={() => { setFilterStatus(filterStatus === s.label.toUpperCase() ? '' : s.label.toUpperCase()); setVisibleCount(PAGE_SIZE); }}
            className={`bg-card rounded-lg border p-4 stat-card text-left transition-all ${filterStatus === s.label.toUpperCase() ? 'border-indigo-500 ring-1 ring-indigo-500/30' : 'border-border'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted uppercase tracking-wider">{s.label}</p>
                <p className={`text-[22px] font-bold ${s.color} mt-1`}>{s.count}</p>
              </div>
              <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center`}>
                <s.Icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Total amount card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg border border-border p-5 stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Total Expenditure</p>
              <p className="text-[22px] font-bold text-red-600 dark:text-red-400 mt-1">₹{fmt(totalAmount)}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 dark:bg-red-500/15 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-5 stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">No. of Vouchers</p>
              <p className="text-[22px] font-bold text-heading mt-1">{expenses.length}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/15 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-5 stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Expense Heads</p>
              <p className="text-[22px] font-bold text-heading mt-1">{new Set(expenses.map(e => e.category)).size}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/15 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-[14px] font-semibold text-heading">Monthly Expenditure Trend</h2>
              <p className="text-[11px] text-muted mt-0.5">Last 6 months</p>
            </div>
            <div className="p-4">
              <Chart options={barOptions} series={[{ name: 'Expenses', data: monthlyData.data }]} type="bar" height={260} />
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-[14px] font-semibold text-heading">Expenditure by Head</h2>
              <p className="text-[11px] text-muted mt-0.5">Head-wise distribution</p>
            </div>
            <div className="p-4 flex items-center justify-center">
              <Chart options={donutOptions} series={categoryData.series} type="donut" height={260} />
            </div>
          </div>
        </div>
      )}

      {/* Expenditure Register - Collapsible */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <button onClick={() => setRegisterOpen(!registerOpen)} className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-card-hover transition-colors">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-red-600 dark:text-red-400" />
            <h2 className="text-[14px] font-semibold text-heading">Expenditure Register</h2>
            <span className="text-[11px] text-muted px-2 py-0.5 bg-card-alt rounded">{expenses.length} entries</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 ${registerOpen ? 'rotate-180' : ''}`} />
        </button>

        {registerOpen && (
        <>
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 px-5 py-3 border-t border-border">
          <div className="flex-1 min-w-[200px]"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" /><input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }} placeholder="Search expenses..." className="w-full pl-10 pr-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading placeholder:text-muted" /></div></div>
          <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setVisibleCount(PAGE_SIZE); }} className="px-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading"><option value="">All Categories</option>{EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}</select>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setVisibleCount(PAGE_SIZE); }} className="px-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading"><option value="">All Statuses</option>{EXPENSE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select>
        </div>

        {/* Table */}
        {loading ? <div className="space-y-6"><StatSkeleton count={3} /><TableSkeleton /></div> : (
          <div className="table-container">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Voucher</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Date</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Category</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Paid To</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Status</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Amount</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((exp) => {
                  const SIcon = STATUS_ICONS[exp.status] || Clock;
                  return (
                  <tr key={exp.id} className="border-b border-dashed border-border hover:bg-card-hover transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-[13px] font-medium text-heading">{exp.voucherNumber || '-'}</p>
                      {exp.paymentMode && <p className="text-[10px] text-muted mt-0.5">{exp.paymentMode}</p>}
                    </td>
                    <td className="px-5 py-3 text-[13px] text-muted">{exp.expenseDate}</td>
                    <td className="px-5 py-3">{(() => { const Icon = CATEGORY_ICONS[exp.category]; return (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.OTHER}`}>
                        {Icon && <Icon className="w-3 h-3" />}{exp.category?.replace(/_/g, ' ')}
                      </span>
                    ); })()}</td>
                    <td className="px-5 py-3">
                      <p className="text-[13px] text-heading">{exp.paidTo || '-'}</p>
                      {exp.description && <p className="text-[11px] text-muted truncate max-w-[200px]">{exp.description}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${STATUS_COLORS[exp.status] || STATUS_COLORS.DRAFT}`}>
                        <SIcon className="w-3 h-3" />{exp.status || 'DRAFT'}
                      </span>
                      {exp.approvedBy && <p className="text-[10px] text-muted mt-0.5">by {exp.approvedBy}</p>}
                    </td>
                    <td className="px-5 py-3 text-right text-[13px] font-semibold text-red-700 dark:text-red-400">₹{fmt(exp.amount)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {exp.status === 'DRAFT' && (
                          <button onClick={() => handleApprove(exp.id)} title="Approve" className="p-1.5 text-muted hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded transition-colors"><CheckCircle className="w-4 h-4" /></button>
                        )}
                        {exp.status === 'APPROVED' && (
                          <button onClick={() => { openPayVendorModal(exp.vendorId || ''); setPaySelectedIds([exp.id]); }} title="Mark as Paid" className="p-1.5 text-muted hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 rounded transition-colors"><Banknote className="w-4 h-4" /></button>
                        )}
                        {(exp.status === 'DRAFT' || exp.status === 'APPROVED') && (
                          <button onClick={() => handleCancel(exp.id)} title="Cancel" className="p-1.5 text-muted hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded transition-colors"><XCircle className="w-4 h-4" /></button>
                        )}
                        {exp.status !== 'PAID' && (
                          <label title="Upload Bill" className="p-1.5 text-muted hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded transition-colors cursor-pointer">
                            {billUploading === exp.id ? <ButtonSpinner /> : <Upload className="w-4 h-4" />}
                            <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files[0] && handleBillUpload(exp.id, e.target.files[0])} />
                          </label>
                        )}
                        {exp.billAttachment && (
                          <a href={exp.billAttachment} target="_blank" rel="noopener noreferrer" title="View Bill" className="p-1.5 text-muted hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded transition-colors"><FileText className="w-4 h-4" /></a>
                        )}
                        {exp.status !== 'PAID' && (
                          <button onClick={() => handleDelete(exp.id)} title="Delete" className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={7}><EmptyState icon={Receipt} title="No expenses found" description="No expense records match the current filters." /></td></tr>}
              </tbody>
              {allFiltered.length > 0 && <tfoot><tr className="bg-red-50 dark:bg-red-500/10 border-t-2 border-red-200 dark:border-red-500/20"><td colSpan={5} className="px-5 py-3 text-[13px] font-semibold text-red-800 dark:text-red-400">Total</td><td className="px-5 py-3 text-right text-[13px] font-bold text-red-800 dark:text-red-400">₹{fmt(totalAmount)}</td><td></td></tr></tfoot>}
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

      {/* Create Voucher Modal — One-time / Monthly toggle */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Voucher" full>
        {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-lg text-[13px]">{error}</div>}

        {/* Mode toggle */}
        <div className="flex items-center bg-card-alt rounded-xl p-1 mb-6 max-w-xs">
          {[{ key: 'onetime', label: 'One-time', icon: Receipt }, { key: 'monthly', label: 'Monthly Recurring', icon: Calendar }].map(m => (
            <button key={m.key} type="button" onClick={() => { setVoucherMode(m.key); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${voucherMode === m.key ? 'bg-card text-heading shadow-sm border border-border' : 'text-muted hover:text-sub'}`}>
              <m.icon className="w-3.5 h-3.5" />{m.label}
            </button>
          ))}
        </div>

        {voucherMode === 'onetime' ? (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <h2 className="text-[14px] font-semibold text-heading mb-2">Voucher Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-medium text-heading mb-1">Amount *</label>
                      <input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required placeholder="Enter amount" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-heading mb-1">Date *</label>
                      <input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Vendor</label>
                    <select value={form.vendorId || ''} onChange={(e) => {
                      const v = vendors.find(v => String(v.id) === e.target.value);
                      setForm({ ...form, vendorId: e.target.value || '', paidTo: v ? v.name : form.paidTo });
                    }} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                      <option value="">-- Select vendor or type below --</option>
                      {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.category})</option>)}
                    </select>
                    {!form.vendorId && (
                      <input type="text" value={form.paidTo} onChange={(e) => setForm({ ...form, paidTo: e.target.value })} className="w-full mt-2 px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="Enter payee name manually" />
                    )}
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Description</label>
                    <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="e.g. Monthly electricity bill" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Notes</label>
                    <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading resize-none" placeholder="Any additional notes" />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-border rounded-lg text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
                    <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">{saving ? <><ButtonSpinner /> Saving...</> : <><Save className="w-4 h-4" /> Create Voucher</>}</button>
                  </div>
                </div>
              </div>
              <div className="space-y-6 md:sticky md:top-4 md:self-start">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="text-[14px] font-semibold text-heading mb-1">Category</h2>
                  <p className="text-[11px] text-muted mb-3">Expense head for classification.</p>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">{EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}</select>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="text-[14px] font-semibold text-heading mb-1">Workflow</h2>
                  <p className="text-[11px] text-muted mb-3">Voucher status flow:</p>
                  <div className="flex items-center gap-1 text-[11px] text-muted">
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-500/15 rounded">Draft</span>
                    <span>→</span>
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-500/15 rounded text-blue-700 dark:text-blue-400">Approved</span>
                    <span>→</span>
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-500/15 rounded text-green-700 dark:text-green-400">Paid</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h2 className="text-[14px] font-semibold text-heading mb-2">Monthly Voucher Generation</h2>
                <p className="text-[13px] text-sub">Auto-generate DRAFT vouchers for all active contract vendors for the selected month. Vendors that already have a voucher for this month will be skipped.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Year</label>
                    <input type="number" value={genYear} onChange={(e) => setGenYear(Number(e.target.value))} min="2020" max="2030" className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Month</label>
                    <select value={genMonth} onChange={(e) => setGenMonth(Number(e.target.value))} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                      {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                        <option key={i+1} value={i+1}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Contract vendors preview */}
                {(() => {
                  const contractVendors = vendors.filter(v => v.vendorType === 'CONTRACT' && v.monthlyAmount);
                  return contractVendors.length > 0 ? (
                    <div>
                      <p className="text-[12px] font-medium text-muted mb-2">Contract vendors ({contractVendors.length})</p>
                      <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                        {contractVendors.map(v => (
                          <div key={v.id} className="flex items-center justify-between px-3 py-2 bg-card-alt rounded-lg text-[13px]">
                            <span className="text-heading font-medium">{v.name}</span>
                            <span className="text-muted">₹{fmt(v.monthlyAmount)}/mo</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-[13px] text-muted bg-card-alt rounded-lg">
                      No contract vendors found. Add vendors with type CONTRACT and a monthly amount to use this feature.
                    </div>
                  );
                })()}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-border rounded-lg text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
                  <button type="button" onClick={handleGenerate} disabled={saving} className="flex-1 py-2.5 bg-amber-600 text-white rounded-lg text-[13px] font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    {saving ? <><ButtonSpinner /> Generating...</> : <><Calendar className="w-4 h-4" /> Generate Vouchers</>}
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-6 md:sticky md:top-4 md:self-start">
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-[14px] font-semibold text-heading mb-1">How it works</h2>
                <p className="text-[11px] text-muted mb-3">Monthly generation creates one voucher per contract vendor:</p>
                <ul className="space-y-2 text-[12px] text-sub">
                  <li className="flex items-start gap-2"><span className="w-4 h-4 rounded bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>Picks all active CONTRACT vendors with monthly amount</li>
                  <li className="flex items-start gap-2"><span className="w-4 h-4 rounded bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>Skips vendors that already have a voucher for the month</li>
                  <li className="flex items-start gap-2"><span className="w-4 h-4 rounded bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>Creates DRAFT vouchers ready for approval</li>
                </ul>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-[14px] font-semibold text-heading mb-1">Workflow</h2>
                <p className="text-[11px] text-muted mb-3">Generated vouchers follow the same flow:</p>
                <div className="flex items-center gap-1 text-[11px] text-muted">
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-500/15 rounded">Draft</span>
                  <span>→</span>
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-500/15 rounded text-blue-700 dark:text-blue-400">Approved</span>
                  <span>→</span>
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-500/15 rounded text-green-700 dark:text-green-400">Paid</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Pay Vendor Modal */}
      <Modal open={payModalOpen} onClose={() => setPayModalOpen(false)} title="Pay Vendor" full>
        <form onSubmit={handleMarkPaid}>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            {/* Left — Vendor & Vouchers */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h2 className="text-[14px] font-semibold text-heading mb-2">Select Vendor & Vouchers</h2>

                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Vendor</label>
                  <select value={payVendorId} onChange={(e) => { setPayVendorId(e.target.value); setPaySelectedIds([]); }} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                    <option value="">-- All vendors (show all approved) --</option>
                    {vendors.map(v => {
                      const cnt = expenses.filter(e => String(e.vendorId) === String(v.id) && e.status === 'APPROVED').length;
                      return <option key={v.id} value={v.id}>{v.name} ({v.category}){cnt > 0 ? ` — ${cnt} pending` : ''}</option>;
                    })}
                  </select>
                </div>

                {/* Voucher list */}
                {payVendorVouchers.length === 0 ? (
                  <div className="text-center py-6 text-[13px] text-muted bg-card-alt rounded-lg">
                    No approved vouchers{payVendorId ? ' for this vendor' : ''}. Vouchers must be approved before payment.
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-2 text-[13px] font-medium text-heading cursor-pointer">
                        <input type="checkbox" checked={paySelectedIds.length === payVendorVouchers.length && payVendorVouchers.length > 0} onChange={togglePaySelectAll} className="w-4 h-4 rounded border-input-border text-green-600 focus:ring-green-500" />
                        Select All ({payVendorVouchers.length})
                      </label>
                      {paySelectedIds.length > 0 && (
                        <span className="text-[13px] font-semibold text-green-700 dark:text-green-400">Total: ₹{fmt(paySelectedTotal)}</span>
                      )}
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {payVendorVouchers.map(v => (
                        <label key={v.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${paySelectedIds.includes(v.id) ? 'border-green-500 bg-green-50 dark:bg-green-500/10 dark:border-green-500/40' : 'border-border hover:bg-card-hover'}`}>
                          <input type="checkbox" checked={paySelectedIds.includes(v.id)} onChange={() => togglePaySelect(v.id)} className="w-4 h-4 rounded border-input-border text-green-600 focus:ring-green-500" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[13px] font-medium text-heading">{v.voucherNumber}</span>
                              <span className="text-[13px] font-semibold text-red-700 dark:text-red-400">₹{fmt(v.amount)}</span>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <span className="text-[11px] text-muted">{v.paidTo} &middot; {v.category?.replace(/_/g, ' ')}</span>
                              <span className="text-[11px] text-muted">{v.expenseDate}</span>
                            </div>
                            {v.description && <p className="text-[11px] text-muted truncate mt-0.5">{v.description}</p>}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setPayModalOpen(false)} className="flex-1 py-2.5 border border-border rounded-lg text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
                  <button type="submit" disabled={paySaving || paySelectedIds.length === 0} className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-[13px] font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    {paySaving ? <><ButtonSpinner /> Processing...</> : <><Banknote className="w-4 h-4" /> Pay {paySelectedIds.length} Voucher{paySelectedIds.length !== 1 ? 's' : ''} &middot; ₹{fmt(paySelectedTotal)}</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Right — Payment Details */}
            <div className="space-y-6 md:sticky md:top-4 md:self-start">
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-[14px] font-semibold text-heading mb-3">Payment Details</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Payment Mode *</label>
                    <select value={payForm.paymentMode} onChange={(e) => setPayForm({ ...payForm, paymentMode: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                      <option value="CASH">Cash</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="ONLINE">Online / NEFT / RTGS</option>
                      <option value="UPI">UPI</option>
                    </select>
                  </div>

                  {payForm.paymentMode === 'CHEQUE' && (
                    <>
                      <div>
                        <label className="block text-[13px] font-medium text-heading mb-1">Cheque Number</label>
                        <input type="text" value={payForm.chequeNumber} onChange={(e) => setPayForm({ ...payForm, chequeNumber: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="Cheque number" />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-heading mb-1">Cheque Date</label>
                        <input type="date" value={payForm.chequeDate} onChange={(e) => setPayForm({ ...payForm, chequeDate: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-heading mb-1">Bank Name</label>
                        <input type="text" value={payForm.chequeBankName} onChange={(e) => setPayForm({ ...payForm, chequeBankName: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="Bank name" />
                      </div>
                    </>
                  )}

                  {(payForm.paymentMode === 'ONLINE' || payForm.paymentMode === 'UPI') && (
                    <>
                      <div>
                        <label className="block text-[13px] font-medium text-heading mb-1">Transaction Reference</label>
                        <input type="text" value={payForm.transactionReference} onChange={(e) => setPayForm({ ...payForm, transactionReference: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="UTR / Reference number" />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-heading mb-1">Transaction Date</label>
                        <input type="date" value={payForm.transactionDate} onChange={(e) => setPayForm({ ...payForm, transactionDate: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {paySelectedIds.length > 0 && (
                <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl p-5">
                  <h2 className="text-[14px] font-semibold text-green-800 dark:text-green-400 mb-2">Payment Summary</h2>
                  <div className="space-y-1 text-[13px]">
                    <div className="flex justify-between"><span className="text-green-700 dark:text-green-300">Vouchers</span><span className="font-medium text-green-800 dark:text-green-300">{paySelectedIds.length}</span></div>
                    <div className="flex justify-between"><span className="text-green-700 dark:text-green-300">Total Amount</span><span className="font-bold text-green-800 dark:text-green-300">₹{fmt(paySelectedTotal)}</span></div>
                    <div className="flex justify-between"><span className="text-green-700 dark:text-green-300">Mode</span><span className="font-medium text-green-800 dark:text-green-300">{payForm.paymentMode}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </Modal>

    </div>
  );
}
