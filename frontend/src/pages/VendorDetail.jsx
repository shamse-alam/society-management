import { FormSkeleton } from '../components/Skeleton';
import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { ArrowLeft, Phone, Mail, MapPin, Store, IndianRupee, Receipt, CalendarDays, Tag, CheckCircle2, XCircle, ChevronDown, Landmark } from 'lucide-react';
import { formatDate } from '../utils/format';
import { getTypeColor } from '../utils/typeColors';

const fmt = (n) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 });

export default function VendorDetail() {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [expensesLoaded, setExpensesLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vendorRes = await adminAPI.getVendor(id);
        setVendor(vendorRes.data);
        try {
          const expensesRes = await adminAPI.getExpensesByVendor(id);
          setExpenses(expensesRes.data);
          setExpensesLoaded(true);
        } catch (err) { console.error('Failed to load expenses', err); }
      } catch (err) {
        console.error('Failed to load vendor', err);
        setError(err.response?.data?.message || err.message || 'Failed to load vendor');
      }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  const handleLedgerToggle = () => {
    setLedgerOpen(o => !o);
  };

  const totalPaid = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount), 0), [expenses]);
  const categoryBreakdown = useMemo(() => {
    const cats = {};
    expenses.forEach(e => {
      const c = e.category?.replace(/_/g, ' ') || 'Other';
      cats[c] = (cats[c] || 0) + Number(e.amount);
    });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const PAGE_SIZE = 30;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleExpenses = expenses.slice(0, visibleCount);
  const hasMore = visibleCount < expenses.length;

  if (loading) return <FormSkeleton fields={5} />;
  if (error) return <div className="text-center py-16 text-red-600 dark:text-red-400 text-[13px]">{error}</div>;
  if (!vendor) return <div className="text-center py-16 text-muted text-[13px]">Vendor not found</div>;

  return (
    <div>
      <Link to="/vendors" className="inline-flex items-center gap-2 text-muted hover:text-heading mb-4 text-[13px] font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Vendors
      </Link>

      {/* Vendor Profile Header */}
      <div className="bg-card rounded-lg border border-border overflow-hidden mb-6">
        <div className="px-5 py-4">
          <div className="flex items-center gap-4">
            {vendor.logoImage ? (
              <img src={vendor.logoImage} alt={vendor.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-500/15 rounded-lg flex items-center justify-center shrink-0">
                <Store className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-heading">{vendor.name}</h1>
                <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${getTypeColor(vendor.category)}`}>{vendor.category}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${vendor.active ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'}`}>
                  {vendor.active ? <><CheckCircle2 className="w-3 h-3" /> Active</> : <><XCircle className="w-3 h-3" /> Inactive</>}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
            {vendor.phone && <div className="flex items-center gap-2 text-[13px] text-sub"><Phone className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />{vendor.phone}</div>}
            {vendor.email && <div className="flex items-center gap-2 text-[13px] text-sub"><Mail className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />{vendor.email}</div>}
            {vendor.address && <div className="flex items-center gap-2 text-[13px] text-sub"><MapPin className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />{vendor.address}</div>}
            {vendor.createdAt && <div className="flex items-center gap-2 text-[13px] text-sub"><CalendarDays className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />Since {formatDate(vendor.createdAt)}</div>}
          </div>
        </div>
      </div>

      <div className={`${vendor.bankAccounts?.length > 0 ? 'grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_300px] gap-6' : ''}`}>
        {/* Left Column — Main Content */}
        <div className="min-w-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-card rounded-lg border border-border p-5 stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Total Paid</p>
                  <p className="text-[20px] font-bold text-red-600 dark:text-red-400 mt-1">₹{fmt(totalPaid)}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 dark:bg-red-500/15 rounded-lg flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border p-5 stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted uppercase tracking-wider">No. of Vouchers</p>
                  <p className="text-[20px] font-bold text-heading mt-1">{expenses.length}</p>
                </div>
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/15 rounded-lg flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border p-5 stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Service Categories</p>
                  <p className="text-[20px] font-bold text-heading mt-1">{categoryBreakdown.length}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/15 rounded-lg flex items-center justify-center">
                  <Tag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          {categoryBreakdown.length > 0 && (
            <div className="bg-card rounded-lg border border-border overflow-hidden mb-6">
              <div className="px-5 py-3 bg-card-alt border-b border-border">
                <h2 className="text-[13px] font-semibold text-heading">Expenditure by Service Head</h2>
              </div>
              <div className="p-5">
                <div className="space-y-3">
                  {categoryBreakdown.map(([cat, amount]) => {
                    const pct = totalPaid > 0 ? (amount / totalPaid * 100) : 0;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-[13px] mb-1">
                          <span className="font-medium text-heading">{cat}</span>
                          <span className="text-muted">₹{fmt(amount)} <span className="text-[11px]">({pct.toFixed(1)}%)</span></span>
                        </div>
                        <div className="w-full h-2 bg-card-alt rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Transaction Ledger (collapsible, lazy-loaded) */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <button onClick={handleLedgerToggle} className="w-full px-5 py-3 bg-card-alt border-b border-border flex items-center justify-between hover:bg-card-hover transition-colors">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-muted" />
                <h2 className="text-[13px] font-semibold text-heading">Transaction Ledger</h2>
                {expensesLoaded && <span className="text-[11px] text-muted px-2 py-0.5 bg-card rounded">{expenses.length} entries</span>}
              </div>
              <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 ${ledgerOpen ? 'rotate-180' : ''}`} />
            </button>
            {ledgerOpen && (
              <div className="table-container">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Date</th>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Expense Head</th>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Description</th>
                      <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleExpenses.map((exp) => (
                      <tr key={exp.id} className="border-b border-dashed border-border hover:bg-card-hover transition-colors">
                        <td className="px-5 py-3 text-[13px] text-muted">{exp.expenseDate}</td>
                        <td className="px-5 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${getTypeColor(exp.category)}`}>
                            {exp.category?.replace(/_/g, ' ')}
                          </span></td>
                        <td className="px-5 py-3 text-[13px] text-muted">{exp.description || '-'}</td>
                        <td className="px-5 py-3 text-right text-[13px] font-semibold text-red-700 dark:text-red-400">₹{fmt(exp.amount)}</td>
                      </tr>
                    ))}
                    {expenses.length === 0 && <tr><td colSpan={4} className="px-5 py-12 text-center text-muted text-[13px]">No transactions recorded for this vendor</td></tr>}
                  </tbody>
                  {expenses.length > 0 && (
                    <tfoot>
                      <tr className="bg-red-50 dark:bg-red-500/10 border-t-2 border-red-200 dark:border-red-500/20">
                        <td colSpan={3} className="px-5 py-3 text-[13px] font-bold text-red-800 dark:text-red-400 text-right">Total Paid to Vendor</td>
                        <td className="px-5 py-3 text-right text-[13px] font-bold text-red-800 dark:text-red-400">₹{fmt(totalPaid)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
                {hasMore && (
                  <div className="px-5 py-3 border-t border-border text-center">
                    <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)} className="text-[13px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">
                      Show more ({expenses.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column — Bank Accounts */}
        {vendor.bankAccounts?.length > 0 && (
          <div>
            <div className="md:sticky md:top-4">
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="px-4 py-3 bg-card-alt border-b border-border">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-muted" />
                    <h2 className="text-[13px] font-semibold text-heading">Bank Accounts</h2>
                    <span className="text-[11px] text-muted px-1.5 py-0.5 bg-card rounded">{vendor.bankAccounts.length}</span>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {vendor.bankAccounts.map((ba) => (
                    <div key={ba.id} className="bg-card-alt rounded-lg p-3 border border-border">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-7 h-7 bg-indigo-100 dark:bg-indigo-500/15 rounded-lg flex items-center justify-center shrink-0">
                          <Landmark className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-heading truncate">{ba.bankName || 'Bank Account'}</p>
                          {ba.branchName && <p className="text-[11px] text-muted truncate">{ba.branchName}</p>}
                        </div>
                      </div>
                      <div className="space-y-1.5 text-[12px]">
                        <div>
                          <p className="text-muted">Account Holder</p>
                          <p className="font-medium text-heading">{ba.accountHolderName}</p>
                        </div>
                        <div>
                          <p className="text-muted">Account No.</p>
                          <p className="font-medium text-heading font-mono">{ba.accountNumber}</p>
                        </div>
                        <div>
                          <p className="text-muted">IFSC</p>
                          <p className="font-medium text-heading font-mono">{ba.ifscCode}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
