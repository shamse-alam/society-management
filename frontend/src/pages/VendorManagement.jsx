import { ButtonSpinner } from '../components/Spinner';
import { TableSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, Search, Upload, Store, Landmark, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VENDOR_CATEGORIES = [
  'GARDENER', 'SECURITY', 'CLEANING', 'ELECTRICIAN', 'PLUMBER', 'PAINTER', 'CARPENTER', 'UTILITY', 'OTHER',
];

const categoryColor = (cat) => {
  const colors = {
    GARDENER: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    SECURITY: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    CLEANING: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
    ELECTRICIAN: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
    PLUMBER: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
    PAINTER: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400',
    CARPENTER: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
    UTILITY: 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400',
    OTHER: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400',
  };
  return colors[cat] || colors.OTHER;
};

function VendorAvatar({ name, src }) {
  if (src) {
    return <img src={src} alt={name} className="w-9 h-9 rounded-lg object-cover shrink-0" />;
  }
  return (
    <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-500/15 rounded-lg flex items-center justify-center shrink-0">
      <Store className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
    </div>
  );
}

export default function VendorManagement() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const emptyAccount = { accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '', branchName: '' };
  const [form, setForm] = useState({ name: '', category: 'GARDENER', phone: '', email: '', address: '', active: true, bankAccounts: [] });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterActive, setFilterActive] = useState('true');
  const navigate = useNavigate();

  const fetchVendors = async () => {
    setLoading(true);
    try { const { data } = await adminAPI.getVendors(); setVendors(data); }
    catch (err) { console.error('Failed to load vendors', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVendors(); }, []);

  const openAddModal = () => {
    setEditId(null);
    setForm({ name: '', category: 'GARDENER', phone: '', email: '', address: '', active: true, bankAccounts: [] });
    setLogoFile(null); setLogoPreview(null);
    setError(''); setModalOpen(true);
  };

  const openEditModal = (vendor) => {
    setEditId(vendor.id);
    setForm({ name: vendor.name, category: vendor.category, phone: vendor.phone || '', email: vendor.email || '', address: vendor.address || '', active: vendor.active, bankAccounts: vendor.bankAccounts?.map(ba => ({ id: ba.id, accountHolderName: ba.accountHolderName || '', accountNumber: ba.accountNumber || '', ifscCode: ba.ifscCode || '', bankName: ba.bankName || '', branchName: ba.branchName || '' })) || [] });
    setLogoFile(null); setLogoPreview(vendor.logoImage || null);
    setError(''); setModalOpen(true);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { setError('Logo must be less than 5MB'); return; }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      let vendorId;
      if (editId) {
        const { data } = await adminAPI.updateVendor(editId, form);
        vendorId = data.id;
      } else {
        const { data } = await adminAPI.createVendor(form);
        vendorId = data.id;
      }
      if (logoFile && vendorId) {
        await adminAPI.uploadVendorLogo(vendorId, logoFile);
      }
      setModalOpen(false); fetchVendors();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save vendor'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vendor?')) return;
    try { await adminAPI.deleteVendor(id); fetchVendors(); }
    catch { alert('Failed to delete vendor'); }
  };

  const filtered = vendors.filter(v => {
    const matchSearch = !search || v.name?.toLowerCase().includes(search.toLowerCase()) || v.phone?.toLowerCase().includes(search.toLowerCase()) || v.email?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !filterCategory || v.category === filterCategory;
    const matchActive = filterActive === '' || String(v.active) === filterActive;
    return matchSearch && matchCategory && matchActive;
  });

  const PAGE_SIZE = 30;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleVendors = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">Vendor Directory</h1>
          <p className="text-[13px] text-muted mt-0.5">{vendors.length} registered vendors & service providers</p>
        </div>
        <button onClick={openAddModal} className="btn-primary inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-indigo-700 transition-colors"><Plus className="w-4 h-4" /> Add Vendor</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg border border-border p-5 stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Total Vendors</p>
              <p className="text-[22px] font-bold text-heading mt-1">{vendors.length}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/15 rounded-lg flex items-center justify-center"><Store className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /></div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-5 stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Active</p>
              <p className="text-[22px] font-bold text-green-600 dark:text-green-400 mt-1">{vendors.filter(v => v.active).length}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-500/15 rounded-lg flex items-center justify-center"><Store className="w-5 h-5 text-green-600 dark:text-green-400" /></div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-5 stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Inactive</p>
              <p className="text-[22px] font-bold text-muted mt-1">{vendors.filter(v => !v.active).length}</p>
            </div>
            <div className="w-10 h-10 bg-card-alt rounded-lg flex items-center justify-center"><Store className="w-5 h-5 text-muted" /></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="flex-1 min-w-[200px]"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" /><input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }} placeholder="Search vendors..." className="w-full pl-10 pr-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading placeholder:text-muted" /></div></div>
        <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setVisibleCount(PAGE_SIZE); }} className="px-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading"><option value="">All Categories</option>{VENDOR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <select value={filterActive} onChange={(e) => { setFilterActive(e.target.value); setVisibleCount(PAGE_SIZE); }} className="px-3 py-2 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading"><option value="">All Status</option><option value="true">Active</option><option value="false">Inactive</option></select>
      </div>

      {/* Table */}
      {loading ? <TableSkeleton /> : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="table-container-lg">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Vendor</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Category</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Contact</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Status</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleVendors.map((vendor) => (
                  <tr key={vendor.id} onClick={() => navigate(`/vendors/${vendor.id}`)} className={`border-b border-dashed border-border hover:bg-card-hover transition-colors cursor-pointer ${!vendor.active ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <VendorAvatar name={vendor.name} src={vendor.logoImage} />
                        <div>
                          <p className="text-[13px] font-medium text-heading">{vendor.name}</p>
                          {vendor.address && <p className="text-[11px] text-muted truncate max-w-[200px]">{vendor.address}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${categoryColor(vendor.category)}`}>{vendor.category}</span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-[13px] text-heading">{vendor.phone || '-'}</p>
                      <p className="text-[11px] text-muted">{vendor.email || ''}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${vendor.active ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'}`}>{vendor.active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={(e) => { e.stopPropagation(); openEditModal(vendor); }} className="p-1.5 text-muted hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(vendor.id); }} className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={5}><EmptyState icon={Store} title="No vendors found" description="There are no vendors matching your search criteria." /></td></tr>}
              </tbody>
            </table>
            {hasMore && (
              <div className="px-5 py-3 border-t border-border text-center">
                <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)} className="text-[13px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">
                  Show more ({filtered.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Vendor' : 'Add Vendor'} full>
        {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-lg text-[13px]">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            {/* Left Column — Vendor Details */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h2 className="text-[14px] font-semibold text-heading mb-2">Vendor Details</h2>

                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Vendor Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required placeholder="e.g. Green Gardens Pvt Ltd" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Category</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">{VENDOR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Phone</label>
                    <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="98765 43210" />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="vendor@email.com" />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Address</label>
                  <textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading resize-none" placeholder="Full vendor address" />
                </div>

                {editId && (
                  <div className="flex items-center gap-2 pt-1">
                    <input type="checkbox" id="active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 text-indigo-600 rounded border-input-border focus:ring-indigo-500" />
                    <label htmlFor="active" className="text-[13px] text-heading">Active</label>
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setModalOpen(false)}
                    className="flex-1 py-2.5 border border-border rounded-lg text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving ? <><ButtonSpinner /> Saving...</> : <><Save className="w-4 h-4" /> {editId ? 'Update Vendor' : 'Save Vendor'}</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column — Logo & Bank Accounts */}
            <div className="space-y-6 md:sticky md:top-4 md:self-start">
              {/* Logo */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-[14px] font-semibold text-heading mb-4">Vendor Logo</h2>
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-card-alt overflow-hidden mb-3">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-10 h-10 text-muted opacity-40" />
                    )}
                  </div>
                  <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" /> Upload Logo
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  </label>
                  <p className="text-[11px] text-muted mt-2">Square PNG or JPG, max 5MB</p>
                </div>
              </div>

              {/* Bank Accounts */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-[14px] font-semibold text-heading">Bank Accounts</h2>
                  <button type="button" onClick={() => setForm({ ...form, bankAccounts: [...form.bankAccounts, { ...emptyAccount }] })} className="inline-flex items-center gap-1 text-[12px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
                <p className="text-[11px] text-muted mb-3">Add one or more bank accounts for this vendor.</p>
                {form.bankAccounts.length === 0 && (
                  <p className="text-[12px] text-muted text-center py-3 bg-card-alt rounded-lg italic">No bank accounts added</p>
                )}
                <div className="space-y-3">
                  {form.bankAccounts.map((ba, idx) => (
                    <div key={idx} className="bg-card-alt rounded-lg p-3 border border-border relative">
                      <button type="button" onClick={() => setForm({ ...form, bankAccounts: form.bankAccounts.filter((_, i) => i !== idx) })} className="absolute top-2 right-2 p-1 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">Account {idx + 1}</p>
                      <div className="space-y-2">
                        <input type="text" value={ba.accountHolderName} onChange={(e) => { const accs = [...form.bankAccounts]; accs[idx] = { ...accs[idx], accountHolderName: e.target.value }; setForm({ ...form, bankAccounts: accs }); }} className="w-full px-3 py-1.5 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="Account Holder Name" required />
                        <input type="text" value={ba.accountNumber} onChange={(e) => { const accs = [...form.bankAccounts]; accs[idx] = { ...accs[idx], accountNumber: e.target.value }; setForm({ ...form, bankAccounts: accs }); }} className="w-full px-3 py-1.5 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="Account Number" required />
                        <input type="text" value={ba.ifscCode} onChange={(e) => { const accs = [...form.bankAccounts]; accs[idx] = { ...accs[idx], ifscCode: e.target.value.toUpperCase() }; setForm({ ...form, bankAccounts: accs }); }} className="w-full px-3 py-1.5 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading uppercase" placeholder="IFSC Code" required />
                        <input type="text" value={ba.bankName} onChange={(e) => { const accs = [...form.bankAccounts]; accs[idx] = { ...accs[idx], bankName: e.target.value }; setForm({ ...form, bankAccounts: accs }); }} className="w-full px-3 py-1.5 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="Bank Name" />
                        <input type="text" value={ba.branchName} onChange={(e) => { const accs = [...form.bankAccounts]; accs[idx] = { ...accs[idx], branchName: e.target.value }; setForm({ ...form, bankAccounts: accs }); }} className="w-full px-3 py-1.5 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="Branch Name" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
