import { ButtonSpinner } from '../components/Spinner';
import { TableSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, Search, Building2, ArrowLeft, Users, Phone, Save } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import { useSocietyConfig } from '../context/SocietyConfigContext';
import { formatDate, formatNumber } from '../utils/format';

const STATUS_COLORS = {
  OCCUPIED: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  VACANT: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  RENTED: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
};

export default function PropertyManagement() {
  const { config } = useSocietyConfig();
  const confirm = useConfirm();
  const propertyLabel = config?.propertyLabel || 'Property';
  const propertyTypes = config?.propertyTypes || [];
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ unitNumber: '', ownerName: '', ownerId: '', status: 'VACANT', tenantName: '', tenantPhone: '', areaInSqFt: '', propertyType: '', description: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchProperties = async () => {
    try { const { data } = await adminAPI.getProperties(); setProperties(data); }
    catch (err) { console.error('Failed to load properties', err); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try { const { data } = await adminAPI.getUsers(); setUsers(data); }
    catch (err) { console.error('Failed to load users', err); }
  };

  useEffect(() => { fetchProperties(); fetchUsers(); }, []);

  const fetchDetail = async (id) => {
    setDetailLoading(true);
    try { const { data } = await adminAPI.getProperty(id); setDetail(data); }
    catch (err) { console.error('Failed to load property detail', err); }
    finally { setDetailLoading(false); }
  };

  const handleRowClick = (property) => { setSelectedProperty(property); fetchDetail(property.id); };
  const closeDetail = () => { setSelectedProperty(null); setDetail(null); };

  const openCreate = () => {
    setEditing(null); setForm({ unitNumber: '', ownerName: '', ownerId: '', status: 'VACANT', tenantName: '', tenantPhone: '', areaInSqFt: '', propertyType: '', description: '' }); setError(''); setModalOpen(true);
  };

  const openEdit = (property, e) => {
    e?.stopPropagation(); setEditing(property);
    const ownerUser = users.find(u => u.unitNumber === property.unitNumber);
    setForm({ unitNumber: property.unitNumber, ownerName: property.ownerName || '', ownerId: ownerUser ? String(ownerUser.id) : '', status: property.status, tenantName: property.tenantName || '', tenantPhone: property.tenantPhone || '', areaInSqFt: property.areaInSqFt || '', propertyType: property.propertyType || '', description: property.description || '' });
    setError(''); setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { ...form, ownerId: form.ownerId ? Number(form.ownerId) : null };
      if (editing) { await adminAPI.updateProperty(editing.id, payload); } else { await adminAPI.createProperty(payload); }
      setModalOpen(false); fetchProperties();
      if (editing && selectedProperty && editing.id === selectedProperty.id) fetchDetail(editing.id);
    } catch (err) { setError(err.response?.data?.message || `Failed to save ${propertyLabel.toLowerCase()}`); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (!await confirm({ title: `Delete ${propertyLabel}`, message: `Are you sure you want to delete this ${propertyLabel.toLowerCase()}? This action cannot be undone.`, confirmLabel: 'Delete', danger: true })) return;
    try { await adminAPI.deleteProperty(id); if (selectedProperty && selectedProperty.id === id) closeDetail(); fetchProperties(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete'); }
  };

  const allFiltered = properties.filter(v => {
    const num = v.unitNumber || '';
    const matchSearch = num.toLowerCase().includes(search.toLowerCase()) || (v.ownerName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || v.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const PAGE_SIZE = 30;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const filtered = allFiltered.slice(0, visibleCount);
  const hasMore = visibleCount < allFiltered.length;

  if (selectedProperty) {
    return (
      <div>
        <button onClick={closeDetail} className="inline-flex items-center gap-2 text-muted hover:text-heading mb-4 text-[13px] font-medium"><ArrowLeft className="w-4 h-4" /> Back to {propertyLabel}s</button>

        {detailLoading || !detail ? <TableSkeleton /> : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/15 rounded-lg flex items-center justify-center"><Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /></div>
                <div><h1 className="text-xl font-semibold text-heading">{detail.unitNumber}</h1><span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${STATUS_COLORS[detail.status]}`}>{detail.status}</span></div>
              </div>
              <button onClick={(e) => openEdit(detail, e)} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-indigo-700 transition-colors"><Pencil className="w-4 h-4" /> {`Edit ${propertyLabel}`}</button>
            </div>

            <div className="bg-card rounded-lg border border-border overflow-hidden mb-6">
              <div className="px-5 py-3 bg-card-alt border-b border-border"><h2 className="text-[13px] font-semibold text-heading">{propertyLabel} Details</h2></div>
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: `${propertyLabel} No.`, value: detail.unitNumber },
                    { label: 'Current Owner', value: detail.ownerName || '-' },
                    { label: 'Status', value: detail.status },
                    { label: 'Area', value: detail.areaInSqFt ? `${detail.areaInSqFt.toLocaleString('en-IN')} sq ft` : '-' },
                    { label: `${propertyLabel} Type`, value: detail.propertyType || '-' },
                    { label: 'Created', value: formatDate(detail.createdAt) },
                  ].map((f) => (
                    <div key={f.label} className="p-3 bg-card-alt rounded"><p className="text-[11px] text-muted uppercase tracking-wider">{f.label}</p><p className="text-[13px] font-medium text-heading mt-0.5">{f.value}</p></div>
                  ))}
                </div>
                {detail.description && <p className="text-[13px] text-muted mt-4 p-3 bg-card-alt rounded">{detail.description}</p>}
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border overflow-hidden mb-6">
              <div className="px-5 py-3 bg-card-alt border-b border-border flex items-center gap-2"><Users className="w-4 h-4 text-muted" /><h2 className="text-[13px] font-semibold text-heading">Owner History</h2></div>
              <div className="divide-y divide-border">
                {(!detail.ownerTimeline || detail.ownerTimeline.length === 0) ? <div className="p-8 text-center text-muted text-[13px]">No owner recorded</div> : detail.ownerTimeline.map((entry, idx) => (
                  <div key={idx} className={`px-5 py-3 flex items-center gap-4 ${entry.active ? 'bg-green-50 dark:bg-green-500/5' : 'opacity-60'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${entry.active ? 'bg-green-100 dark:bg-green-500/15' : 'bg-card-alt'}`}><Users className={`w-4 h-4 ${entry.active ? 'text-green-600 dark:text-green-400' : 'text-muted'}`} /></div>
                    <div className="flex-1 min-w-0"><p className="text-[13px] font-medium text-heading">{entry.name}</p><p className="text-[11px] text-muted mt-0.5">{entry.startDate || 'Start'} — {entry.endDate || 'Present'}</p></div>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${entry.active ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400' : 'bg-card-alt text-muted'}`}>{entry.active ? 'Active' : 'Inactive'}</span>
                  </div>
                ))}
              </div>
            </div>

            {detail.tenantTimeline && detail.tenantTimeline.length > 0 && (
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="px-5 py-3 bg-card-alt border-b border-border flex items-center gap-2"><Phone className="w-4 h-4 text-muted" /><h2 className="text-[13px] font-semibold text-heading">Tenant History</h2></div>
                <div className="divide-y divide-border">
                  {detail.tenantTimeline.map((entry, idx) => (
                    <div key={idx} className={`px-5 py-3 flex items-center gap-4 ${entry.active ? 'bg-green-50 dark:bg-green-500/5' : 'opacity-60'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${entry.active ? 'bg-green-100 dark:bg-green-500/15' : 'bg-card-alt'}`}><Users className={`w-4 h-4 ${entry.active ? 'text-green-600 dark:text-green-400' : 'text-muted'}`} /></div>
                      <div className="flex-1 min-w-0"><p className="text-[13px] font-medium text-heading">{entry.name}</p>{entry.phone && <p className="text-[11px] text-muted">{entry.phone}</p>}<p className="text-[11px] text-muted mt-0.5">{entry.startDate || 'Start'} — {entry.endDate || 'Present'}</p></div>
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${entry.active ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400' : 'bg-card-alt text-muted'}`}>{entry.active ? 'Active' : 'Inactive'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit ${propertyLabel}` : `Add New ${propertyLabel}`} full>{renderForm()}</Modal>
      </div>
    );
  }

  function renderForm() {
    return (
      <>
        {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-lg text-[13px]">{error}</div>}
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h2 className="text-[14px] font-semibold text-heading mb-2">{propertyLabel} Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[13px] font-medium text-heading mb-1">{propertyLabel} No. *</label><input type="text" value={form.unitNumber} onChange={(e) => setForm({ ...form, unitNumber: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required /></div>
                  <div><label className="block text-[13px] font-medium text-heading mb-1">Owner</label><select value={form.ownerId} onChange={(e) => { const uid = e.target.value; const u = users.find(x => String(x.id) === uid); setForm({ ...form, ownerId: uid, ownerName: u ? u.fullName : '' }); }} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading"><option value="">-- Select Owner --</option>{users.filter(u => u.role === 'USER').map((u) => <option key={u.id} value={u.id}>{u.fullName} (@{u.username})</option>)}</select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[13px] font-medium text-heading mb-1">Area (sq ft)</label><input type="number" min="0" value={form.areaInSqFt} onChange={(e) => setForm({ ...form, areaInSqFt: e.target.value ? Number(e.target.value) : '' })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="e.g. 2400" /></div>
                  <div><label className="block text-[13px] font-medium text-heading mb-1">{propertyLabel} Type</label><select value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading"><option value="">-- Select Type --</option>{propertyTypes.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                </div>
                <div><label className="block text-[13px] font-medium text-heading mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg resize-none text-[13px] text-heading" /></div>
                {form.status === 'RENTED' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[13px] font-medium text-heading mb-1">Tenant Name</label><input type="text" value={form.tenantName} onChange={(e) => setForm({ ...form, tenantName: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" /></div>
                    <div><label className="block text-[13px] font-medium text-heading mb-1">Tenant Phone</label><input type="text" value={form.tenantPhone} onChange={(e) => setForm({ ...form, tenantPhone: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" /></div>
                  </div>
                )}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-border rounded-lg text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">{saving ? <><ButtonSpinner /> Saving...</> : <><Save className="w-4 h-4" /> {editing ? `Update ${propertyLabel}` : `Save ${propertyLabel}`}</>}</button>
                </div>
              </div>
            </div>
            <div className="space-y-6 md:sticky md:top-4 md:self-start">
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-[14px] font-semibold text-heading mb-1">Status</h2>
                <p className="text-[11px] text-muted mb-3">Current occupancy status of the {propertyLabel.toLowerCase()}.</p>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading"><option value="OCCUPIED">Occupied</option><option value="VACANT">Vacant</option><option value="RENTED">Rented</option></select>
              </div>
            </div>
          </div>
        </form>
      </>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">{propertyLabel} Management</h1>
          <p className="text-[13px] text-muted mt-0.5">{properties.length} {propertyLabel.toLowerCase()}s registered</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-indigo-700 transition-colors"><Plus className="w-4 h-4" /> {`Add ${propertyLabel}`}</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" /><input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }} placeholder={`Search ${propertyLabel.toLowerCase()}s...`} className="w-full pl-10 pr-4 py-2.5 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading placeholder:text-muted" /></div>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setVisibleCount(PAGE_SIZE); }} className="px-3 py-2.5 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading"><option value="ALL">All Status</option><option value="OCCUPIED">Occupied</option><option value="VACANT">Vacant</option><option value="RENTED">Rented</option></select>
      </div>

      {loading ? <TableSkeleton /> : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="table-container-lg">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">{propertyLabel}</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Owner</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Status</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Area</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Type</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Tenant</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((property) => (
                  <tr key={property.id} onClick={() => handleRowClick(property)} className="border-b border-dashed border-border hover:bg-card-hover transition-colors cursor-pointer">
                    <td className="px-5 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-500/15 rounded-lg flex items-center justify-center"><Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /></div><span className="text-[13px] font-semibold text-heading">{property.unitNumber}</span></div></td>
                    <td className="px-5 py-3 text-[13px] text-heading">{property.ownerName || '-'}</td>
                    <td className="px-5 py-3"><span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${STATUS_COLORS[property.status]}`}>{property.status}</span></td>
                    <td className="px-5 py-3 text-[13px] text-muted">{property.areaInSqFt ? `${property.areaInSqFt.toLocaleString('en-IN')} sq ft` : '-'}</td>
                    <td className="px-5 py-3 text-[13px] text-muted">{property.propertyType || '-'}</td>
                    <td className="px-5 py-3 text-[13px] text-muted">{property.status === 'RENTED' ? (property.tenantName || '-') : '-'}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={(e) => openEdit(property, e)} className="p-1.5 text-muted hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={(e) => handleDelete(property.id, e)} className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7}><EmptyState icon={Building2} title={`No ${propertyLabel.toLowerCase()}s found`} description={`There are no ${propertyLabel.toLowerCase()}s matching your search criteria.`} /></td></tr>}
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
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit ${propertyLabel}` : `Add New ${propertyLabel}`} full>{renderForm()}</Modal>
    </div>
  );
}
