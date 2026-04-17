import { ButtonSpinner } from '../components/Spinner';
import { StatSkeleton, TableSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useState, useEffect, useMemo } from 'react';
import { adminAPI } from '../services/api';
import Modal from '../components/Modal';
import { Plus, Trash2, IndianRupee, Search, TrendingDown, Receipt, Tag, Download, Zap, Droplets, Shield, Wrench, Wallet, Sparkles, TreePine, Hammer, CircleDot, ChevronDown, Save } from 'lucide-react';
import Chart from 'react-apexcharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const EXPENSE_CATEGORIES = ['ELECTRICITY', 'WATER', 'SECURITY', 'MAINTENANCE', 'SALARY', 'CLEANING', 'GARDENING', 'REPAIRS', 'OTHER'];
const fmt = (n) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 });

const CATEGORY_ICONS = {
  ELECTRICITY: Zap,
  WATER: Droplets,
  SECURITY: Shield,
  MAINTENANCE: Wrench,
  SALARY: Wallet,
  CLEANING: Sparkles,
  GARDENING: TreePine,
  REPAIRS: Hammer,
  OTHER: CircleDot,
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

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ category: 'MAINTENANCE', amount: '', description: '', paidTo: '', expenseDate: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [registerOpen, setRegisterOpen] = useState(false);

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
    setForm({ category: 'MAINTENANCE', amount: '', description: '', paidTo: '', expenseDate: new Date().toISOString().split('T')[0] });
    setError(''); setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try { await adminAPI.createExpense(form); setModalOpen(false); fetchData(); }
    catch (err) { setError(err.response?.data?.message || 'Failed to add expense'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try { await adminAPI.deleteExpense(id); fetchData(); }
    catch { alert('Failed to delete expense'); }
  };

  const allFiltered = expenses.filter(exp => {
    const matchSearch = !search || exp.description?.toLowerCase().includes(search.toLowerCase()) || exp.paidTo?.toLowerCase().includes(search.toLowerCase()) || exp.category?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !filterCategory || exp.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const totalAmount = allFiltered.reduce((sum, e) => sum + Number(e.amount), 0);

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
        <div className="flex items-center gap-2">
          <button onClick={() => {
            const doc = new jsPDF();
            doc.setFontSize(16); doc.text('Expense Report', 14, 20);
            doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);
            doc.autoTable({ startY: 35, head: [['Date', 'Category', 'Paid To', 'Description', 'Amount']],
              body: allFiltered.map(e => [e.expenseDate, e.category?.replace(/_/g, ' '), e.paidTo || '-', e.description || '-', `₹${fmt(e.amount)}`]),
              styles: { fontSize: 9 }, headStyles: { fillColor: [239, 52, 99] },
              foot: [['', '', '', 'Total', `₹${fmt(totalAmount)}`]], footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
            });
            doc.save('expenses-report.pdf');
          }} className="btn-outline inline-flex items-center gap-1.5 px-3 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors"><Download className="w-3.5 h-3.5" /> PDF</button>
          <button onClick={() => {
            const data = allFiltered.map(e => ({ Date: e.expenseDate, Category: e.category?.replace(/_/g, ' '), 'Paid To': e.paidTo || '-', Description: e.description || '-', Amount: Number(e.amount) }));
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
            saveAs(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })]), 'expenses-report.xlsx');
          }} className="btn-outline inline-flex items-center gap-1.5 px-3 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors"><Download className="w-3.5 h-3.5" /> Excel</button>
          <button onClick={openModal} className="btn-primary inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-indigo-700 transition-colors"><Plus className="w-4 h-4" /> Record Expense</button>
        </div>
      </div>

      {/* Summary Cards */}
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
        </div>

        {/* Table */}
        {loading ? <div className="space-y-6"><StatSkeleton count={3} /><TableSkeleton /></div> : (
          <div className="table-container">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Date</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Category</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Paid To</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Description</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Amount</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt w-16"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((exp) => (
                  <tr key={exp.id} className="border-b border-dashed border-border hover:bg-card-hover transition-colors">
                    <td className="px-5 py-3 text-[13px] text-muted">{exp.expenseDate}</td>
                    <td className="px-5 py-3">{(() => { const Icon = CATEGORY_ICONS[exp.category]; return (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.OTHER}`}>
                        {Icon && <Icon className="w-3 h-3" />}{exp.category.replace(/_/g, ' ')}
                      </span>
                    ); })()}</td>
                    <td className="px-5 py-3 text-[13px] text-heading">{exp.paidTo || '-'}</td>
                    <td className="px-5 py-3 text-[13px] text-muted">{exp.description || '-'}</td>
                    <td className="px-5 py-3 text-right text-[13px] font-semibold text-red-700 dark:text-red-400">₹{fmt(exp.amount)}</td>
                    <td className="px-5 py-3 text-right"><button onClick={() => handleDelete(exp.id)} className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={6}><EmptyState icon={Receipt} title="No expenses found" description="No expense records match the current filters." /></td></tr>}
              </tbody>
              {allFiltered.length > 0 && <tfoot><tr className="bg-red-50 dark:bg-red-500/10 border-t-2 border-red-200 dark:border-red-500/20"><td colSpan={4} className="px-5 py-3 text-[13px] font-semibold text-red-800 dark:text-red-400">Total</td><td className="px-5 py-3 text-right text-[13px] font-bold text-red-800 dark:text-red-400">₹{fmt(totalAmount)}</td><td></td></tr></tfoot>}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record Expense Voucher" full>
        {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-lg text-[13px]">{error}</div>}
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
                  <label className="block text-[13px] font-medium text-heading mb-1">Paid To (Vendor)</label>
                  <select value={vendors.find(v => v.name === form.paidTo) ? form.paidTo : '__custom'} onChange={(e) => { if (e.target.value !== '__custom') setForm({ ...form, paidTo: e.target.value }); }} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                    <option value="__custom">-- Type manually --</option>
                    {vendors.map(v => <option key={v.id} value={v.name}>{v.name} ({v.category})</option>)}
                  </select>
                  {(!vendors.find(v => v.name === form.paidTo)) && (
                    <input type="text" value={form.paidTo} onChange={(e) => setForm({ ...form, paidTo: e.target.value })} className="w-full mt-2 px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="Enter vendor name" />
                  )}
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Description</label>
                  <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="e.g. Monthly electricity bill" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-border rounded-lg text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">{saving ? <><ButtonSpinner /> Saving...</> : <><Save className="w-4 h-4" /> Record Voucher</>}</button>
                </div>
              </div>
            </div>
            <div className="space-y-6 md:sticky md:top-4 md:self-start">
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-[14px] font-semibold text-heading mb-1">Category</h2>
                <p className="text-[11px] text-muted mb-3">Expense head for classification.</p>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">{EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}</select>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
