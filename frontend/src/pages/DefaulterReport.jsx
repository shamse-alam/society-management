import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useToast } from '../components/Toast';
import { TableSkeleton } from '../components/Skeleton';
import { AlertTriangle, Download, Search, ChevronDown, ChevronRight, Phone, Mail, IndianRupee } from 'lucide-react';
import { useSocietyConfig } from '../context/SocietyConfigContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatNumber, formatDate } from '../utils/format';

export default function DefaulterReport() {
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});
  const toast = useToast();
  const { config } = useSocietyConfig();
  const propertyLabel = config?.propertyLabel || 'Property';

  useEffect(() => {
    fetchDefaulters();
  }, []);

  const fetchDefaulters = async () => {
    try {
      const res = await adminAPI.getDefaulters();
      setDefaulters(res.data);
    } catch (e) {
      toast.error('Failed to load defaulter report');
    } finally {
      setLoading(false);
    }
  };

  const filtered = defaulters.filter(d =>
    d.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    d.unitNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const totalOutstanding = filtered.reduce((sum, d) => sum + (d.totalDue || 0), 0);
  const avgDaysOverdue = filtered.length > 0
    ? Math.round(filtered.reduce((sum, d) => sum + (d.daysOverdue || 0), 0) / filtered.length)
    : 0;

  const toggleExpand = (userId) => {
    setExpanded(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Defaulter Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDate(new Date())}`, 14, 28);
    doc.text(`Total Defaulters: ${filtered.length} | Total Outstanding: Rs. ${formatNumber(totalOutstanding)}`, 14, 34);

    autoTable(doc, {
      startY: 40,
      head: [['Name', propertyLabel, 'Phone', 'Total Due', 'Oldest Due', 'Days Overdue', 'Pending']],
      body: filtered.map(d => [
        d.fullName, d.unitNumber, d.phone || '-',
        `Rs. ${formatNumber(d.totalDue)}`, formatDate(d.oldestDueDate),
        d.daysOverdue, d.pendingCount
      ]),
    });

    doc.save('defaulter-report.pdf');
    toast.success('PDF downloaded');
  };

  const exportExcel = () => {
    const data = filtered.map(d => ({
      'Name': d.fullName,
      [propertyLabel]: d.unitNumber,
      'Phone': d.phone,
      'Email': d.email,
      'Total Due': d.totalDue,
      'Oldest Due Date': d.oldestDueDate,
      'Days Overdue': d.daysOverdue,
      'Pending Count': d.pendingCount,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Defaulters');
    XLSX.writeFile(wb, 'defaulter-report.xlsx');
    toast.success('Excel downloaded');
  };

  if (loading) return <TableSkeleton />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">Defaulter Report</h1>
          <p className="text-[13px] text-muted mt-0.5">Residents with pending payments</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportPDF} className="btn-outline inline-flex items-center gap-1.5 px-3 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={exportExcel} className="btn-outline inline-flex items-center gap-1.5 px-3 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">
            <Download className="w-3.5 h-3.5" /> Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg border border-border p-5 stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Total Defaulters</p>
              <p className="text-[22px] font-bold text-red-600 dark:text-red-400 mt-1">{filtered.length}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 dark:bg-red-500/15 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-5 stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Total Outstanding</p>
              <p className="text-[22px] font-bold text-amber-600 dark:text-amber-400 mt-1"><IndianRupee className="w-5 h-5 inline" />{formatNumber(totalOutstanding)}</p>
            </div>
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/15 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-5 stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Avg Days Overdue</p>
              <p className="text-[22px] font-bold text-heading mt-1">{avgDaysOverdue}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/15 rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          placeholder={`Search by name or ${propertyLabel.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-4 py-2.5 w-full bg-card border border-border rounded-lg text-[13px] text-heading placeholder:text-muted focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-green-500 mx-auto mb-3 opacity-60" />
          <p className="text-heading font-medium">No defaulters found</p>
          <p className="text-muted text-[13px] mt-1">All payments are up to date</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-card-alt/50">
                <th className="text-left px-4 py-3 text-muted font-medium w-8"></th>
                <th className="text-left px-4 py-3 text-muted font-medium">Resident</th>
                <th className="text-left px-4 py-3 text-muted font-medium">{propertyLabel}</th>
                <th className="text-left px-4 py-3 text-muted font-medium">Contact</th>
                <th className="text-right px-4 py-3 text-muted font-medium">Total Due</th>
                <th className="text-left px-4 py-3 text-muted font-medium">Oldest Due</th>
                <th className="text-right px-4 py-3 text-muted font-medium">Days Overdue</th>
                <th className="text-right px-4 py-3 text-muted font-medium">Pending</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <>
                  <tr key={d.userId} onClick={() => toggleExpand(d.userId)}
                      className="border-b border-border/50 hover:bg-card-alt/30 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      {expanded[d.userId]
                        ? <ChevronDown className="w-4 h-4 text-muted" />
                        : <ChevronRight className="w-4 h-4 text-muted" />}
                    </td>
                    <td className="px-4 py-3 font-medium text-heading">{d.fullName}</td>
                    <td className="px-4 py-3 text-body">{d.unitNumber}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {d.phone && <span className="flex items-center gap-1 text-muted"><Phone className="w-3 h-3" />{d.phone}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">₹{formatNumber(d.totalDue)}</td>
                    <td className="px-4 py-3 text-body">{formatDate(d.oldestDueDate)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        d.daysOverdue > 30 ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' :
                        d.daysOverdue > 15 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400'
                      }`}>
                        {d.daysOverdue} days
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-body">{d.pendingCount}</td>
                  </tr>
                  {expanded[d.userId] && d.pendingPayments?.map(p => (
                    <tr key={p.id} className="bg-card-alt/20 border-b border-border/30">
                      <td></td>
                      <td className="px-4 py-2 text-[12px] text-muted" colSpan={2}>
                        {p.paymentType} — {p.periodFrom || 'N/A'} to {p.periodTo || 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-[12px] text-muted">{p.description}</td>
                      <td className="px-4 py-2 text-right text-[12px] font-medium text-heading">
                        ₹{formatNumber(p.amount)}
                        {p.penaltyAmount > 0 && <span className="text-red-500 ml-1">(+{p.penaltyAmount})</span>}
                      </td>
                      <td className="px-4 py-2 text-[12px] text-muted">{p.dueDate || '-'}</td>
                      <td className="px-4 py-2 text-right">
                        {p.overdue && <span className="text-[10px] bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400 px-1.5 py-0.5 rounded-full">Overdue</span>}
                      </td>
                      <td></td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
