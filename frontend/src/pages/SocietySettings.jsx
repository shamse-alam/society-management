import { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../services/api';
import { useToast } from '../components/Toast';
import { ButtonSpinner } from '../components/Spinner';
import { FormSkeleton } from '../components/Skeleton';
import { useSocietyConfig } from '../context/SocietyConfigContext';
import { useNavigate } from 'react-router-dom';
import { Building2, Upload, Save, Plus, X, GripVertical, Pencil, Trash2, Lock, DollarSign, Shield, CalendarClock, Receipt, AlertTriangle } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import { useAuth } from '../context/AuthContext';

export default function SocietySettings() {
  const toast = useToast();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { isAdmin } = useAuth();
  const { refreshConfig } = useSocietyConfig();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const fileRef = useRef();
  const [form, setForm] = useState({
    societyName: '', tagline: '', address: '', phone: '', email: '', gstin: '', registrationNumber: '', propertyLabel: '',
  });
  const [logoUrl, setLogoUrl] = useState('');
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [newType, setNewType] = useState('');

  // Income & Expense Types
  const [incomeTypes, setIncomeTypes] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [editingIncome, setEditingIncome] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [incomeForm, setIncomeForm] = useState({ code: '', displayName: '', gstApplicable: true, reserveFund: false, oneTime: false, displayOrder: 0, active: true });
  const [expenseForm, setExpenseForm] = useState({ code: '', displayName: '', gstIncluded: true, displayOrder: 0, active: true });
  const [savingType, setSavingType] = useState(false);

  const fetchTypes = async () => {
    try {
      const [incRes, expRes] = await Promise.all([adminAPI.getIncomeTypes(), adminAPI.getExpenseTypes()]);
      setIncomeTypes(incRes.data);
      setExpenseTypes(expRes.data);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    (async () => {
      try {
        const [configRes] = await Promise.all([adminAPI.getSocietyConfig(), fetchTypes()]);
        const c = configRes.data;
        setForm({
          societyName: c.societyName || '',
          tagline: c.tagline || '',
          address: c.address || '',
          phone: c.phone || '',
          email: c.email || '',
          gstin: c.gstin || '',
          registrationNumber: c.registrationNumber || '',
          propertyLabel: c.propertyLabel || '',
        });
        setLogoUrl(c.logoUrl || '');
        setPropertyTypes(c.propertyTypes || []);
      } catch {
        toast.error('Failed to load society settings');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminAPI.updateSocietyConfig({ ...form, propertyTypes });
      setLogoUrl(res.data.logoUrl || '');
      await refreshConfig();
      toast.success('Society settings updated');
    } catch {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await adminAPI.uploadSocietyLogo(file);
      setLogoUrl(res.data.logoUrl || '');
      await refreshConfig();
      toast.success('Logo uploaded');
    } catch {
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  // Income type handlers
  const resetIncomeForm = () => { setEditingIncome(null); setIncomeForm({ code: '', displayName: '', gstApplicable: true, reserveFund: false, oneTime: false, displayOrder: 0, active: true }); };
  const startEditIncome = (t) => { setEditingIncome(t.id); setIncomeForm({ code: t.code, displayName: t.displayName, gstApplicable: t.gstApplicable, reserveFund: t.reserveFund, oneTime: t.oneTime, displayOrder: t.displayOrder, active: t.active }); };
  const saveIncomeType = async () => {
    if (!incomeForm.code.trim() || !incomeForm.displayName.trim()) { toast.error('Code and name are required'); return; }
    setSavingType(true);
    try {
      if (editingIncome) {
        await adminAPI.updateIncomeType(editingIncome, incomeForm);
        toast.success('Income type updated');
      } else {
        await adminAPI.createIncomeType(incomeForm);
        toast.success('Income type created');
      }
      resetIncomeForm();
      await fetchTypes();
      await refreshConfig();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save income type');
    } finally { setSavingType(false); }
  };
  const deleteIncomeType = async (id) => {
    try {
      await adminAPI.deleteIncomeType(id);
      toast.success('Income type deleted');
      await fetchTypes();
      await refreshConfig();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete income type');
    }
  };

  // Expense type handlers
  const resetExpenseForm = () => { setEditingExpense(null); setExpenseForm({ code: '', displayName: '', gstIncluded: true, displayOrder: 0, active: true }); };
  const startEditExpense = (t) => { setEditingExpense(t.id); setExpenseForm({ code: t.code, displayName: t.displayName, gstIncluded: t.gstIncluded, displayOrder: t.displayOrder, active: t.active }); };
  const saveExpenseType = async () => {
    if (!expenseForm.code.trim() || !expenseForm.displayName.trim()) { toast.error('Code and name are required'); return; }
    setSavingType(true);
    try {
      if (editingExpense) {
        await adminAPI.updateExpenseType(editingExpense, expenseForm);
        toast.success('Expense type updated');
      } else {
        await adminAPI.createExpenseType(expenseForm);
        toast.success('Expense type created');
      }
      resetExpenseForm();
      await fetchTypes();
      await refreshConfig();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save expense type');
    } finally { setSavingType(false); }
  };
  const deleteExpenseType = async (id) => {
    try {
      await adminAPI.deleteExpenseType(id);
      toast.success('Expense type deleted');
      await fetchTypes();
      await refreshConfig();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete expense type');
    }
  };

  const handleCleanupData = async () => {
    const ok = await confirm({
      title: 'Clean Up All Data',
      message: 'This will permanently delete ALL existing data including properties, residents, payments, complaints, visitors, and all other records. Only admin and guard user accounts will be preserved. Settings and type configurations will remain intact.\n\nThis action is intended for test environments and CANNOT be undone. Are you sure?',
      confirmLabel: 'Yes, Delete All Data',
      danger: true,
    });
    if (!ok) return;
    setCleaning(true);
    try {
      const { data } = await adminAPI.cleanupAllData();
      toast.success(`Cleanup complete — ${data.totalRecords} records deleted`);
      refreshConfig();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cleanup failed');
    } finally {
      setCleaning(false);
    }
  };

  if (loading) return <FormSkeleton fields={6} />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">Society Settings</h1>
          <p className="text-[13px] text-muted mt-0.5">Configure your society's name, logo, and contact information</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
          <button type="submit" form="society-settings-form" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">
            {saving ? <><ButtonSpinner /> Saving...</> : <><Save className="w-4 h-4" /> Save Settings</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
        {/* Left Column — Details Form */}
        <div className="space-y-6">
          <form id="society-settings-form" onSubmit={handleSave} className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-[14px] font-semibold text-heading mb-2">Society Details</h2>

            <div>
              <label className="block text-[13px] font-medium text-heading mb-1">Society Name *</label>
              <input type="text" required value={form.societyName} onChange={e => setForm({ ...form, societyName: e.target.value })}
                className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="e.g. The Courtyard" />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-heading mb-1">Tagline</label>
              <input type="text" value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })}
                className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="e.g. Society Management" />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-heading mb-1">Address</label>
              <textarea rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading resize-none" placeholder="Full society address" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-heading mb-1">Mobile</label>
                <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="98765 43210" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-heading mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="society@example.com" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-heading mb-1">GSTIN</label>
                <input type="text" value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value })}
                  className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="22AAAAA0000A1Z5" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-heading mb-1">Registration No.</label>
                <input type="text" value={form.registrationNumber} onChange={e => setForm({ ...form, registrationNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="SOC/REG/XXXX" />
              </div>
            </div>

          </form>
        </div>

        {/* Right Column — Logo, Property Label, Property Types */}
        <div className="space-y-6 md:sticky md:top-4 md:self-start">
          {/* Logo Section */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-[14px] font-semibold text-heading mb-4">Society Logo</h2>
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-card-alt overflow-hidden mb-3">
                {logoUrl ? (
                  <img src={logoUrl} alt="Society logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-10 h-10 text-muted opacity-40" />
                )}
              </div>
              <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
                {uploading ? <><ButtonSpinner /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload Logo</>}
              </button>
              <p className="text-[11px] text-muted mt-2">Square PNG or SVG, 200x200px+</p>
            </div>
          </div>

          {/* Property Label */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-[14px] font-semibold text-heading mb-1">Property Label</h2>
            <p className="text-[11px] text-muted mb-3">Term used for your units (e.g. Villa, Flat).</p>
            <input type="text" value={form.propertyLabel} onChange={e => setForm({ ...form, propertyLabel: e.target.value })}
              className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="e.g. Villa, Flat, Apartment" />
          </div>

          {/* Property Types */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-[14px] font-semibold text-heading mb-1">{form.propertyLabel || 'Property'} Types</h2>
            <p className="text-[11px] text-muted mb-3">Available {(form.propertyLabel || 'property').toLowerCase()} types in the dropdown.</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {propertyTypes.map((t, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 rounded-lg text-[12px] font-medium">
                  {t}
                  <button type="button" onClick={() => setPropertyTypes(propertyTypes.filter((_, idx) => idx !== i))}
                    className="p-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {propertyTypes.length === 0 && <span className="text-[12px] text-muted italic">No types defined yet</span>}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newType} onChange={e => setNewType(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newType.trim()) {
                    e.preventDefault();
                    if (!propertyTypes.includes(newType.trim())) setPropertyTypes([...propertyTypes, newType.trim()]);
                    setNewType('');
                  }
                }}
                className="flex-1 px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="e.g. Penthouse" />
              <button type="button" onClick={() => {
                if (newType.trim() && !propertyTypes.includes(newType.trim())) { setPropertyTypes([...propertyTypes, newType.trim()]); setNewType(''); }
              }} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors shrink-0">
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Income Types Section */}
      <div className="bg-card border border-border rounded-xl p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[14px] font-semibold text-heading flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-500" /> Income Types</h2>
            <p className="text-[11px] text-muted mt-0.5">Configure payment/income categories with GST and reserve fund flags</p>
          </div>
        </div>

        {/* Income type form */}
        <div className="bg-card-alt border border-border rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="block text-[11px] font-medium text-muted mb-1">Code *</label>
              <input type="text" value={incomeForm.code} onChange={e => setIncomeForm({ ...incomeForm, code: e.target.value })}
                disabled={!!editingIncome}
                className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading disabled:opacity-50" placeholder="e.g. PARKING_FEE" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-muted mb-1">Display Name *</label>
              <input type="text" value={incomeForm.displayName} onChange={e => setIncomeForm({ ...incomeForm, displayName: e.target.value })}
                className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="e.g. Parking Fee" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-muted mb-1">Order</label>
              <input type="number" value={incomeForm.displayOrder} onChange={e => setIncomeForm({ ...incomeForm, displayOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={saveIncomeType} disabled={savingType || !incomeForm.code.trim() || !incomeForm.displayName.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                {savingType ? <ButtonSpinner /> : <Plus className="w-3.5 h-3.5" />}
                {editingIncome ? 'Update' : 'Add'}
              </button>
              {editingIncome && (
                <button onClick={resetIncomeForm} className="px-3 py-2 border border-border rounded-lg text-[13px] text-sub hover:bg-card-hover transition-colors">
                  Cancel
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <label className="flex items-center gap-2 text-[12px] text-heading cursor-pointer">
              <input type="checkbox" checked={incomeForm.gstApplicable} onChange={e => setIncomeForm({ ...incomeForm, gstApplicable: e.target.checked })}
                className="rounded border-input-border" />
              <Receipt className="w-3.5 h-3.5 text-blue-500" /> GST Applicable
            </label>
            <label className="flex items-center gap-2 text-[12px] text-heading cursor-pointer">
              <input type="checkbox" checked={incomeForm.reserveFund} onChange={e => setIncomeForm({ ...incomeForm, reserveFund: e.target.checked })}
                className="rounded border-input-border" />
              <Shield className="w-3.5 h-3.5 text-amber-500" /> Reserve Fund
            </label>
            <label className="flex items-center gap-2 text-[12px] text-heading cursor-pointer">
              <input type="checkbox" checked={incomeForm.oneTime} onChange={e => setIncomeForm({ ...incomeForm, oneTime: e.target.checked })}
                className="rounded border-input-border" />
              <CalendarClock className="w-3.5 h-3.5 text-purple-500" /> One-Time
            </label>
            <label className="flex items-center gap-2 text-[12px] text-heading cursor-pointer">
              <input type="checkbox" checked={incomeForm.active} onChange={e => setIncomeForm({ ...incomeForm, active: e.target.checked })}
                className="rounded border-input-border" />
              Active
            </label>
          </div>
        </div>

        {/* Income types table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[11px] text-muted uppercase tracking-wider">
                <th className="pb-2 pr-3">Code</th>
                <th className="pb-2 pr-3">Name</th>
                <th className="pb-2 pr-3 text-center">GST</th>
                <th className="pb-2 pr-3 text-center">Reserve</th>
                <th className="pb-2 pr-3 text-center">One-Time</th>
                <th className="pb-2 pr-3 text-center">Active</th>
                <th className="pb-2 pr-3 text-center">Order</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {incomeTypes.map(t => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-card-hover transition-colors">
                  <td className="py-2.5 pr-3 font-mono text-[12px]">
                    {t.code}
                    {t.systemManaged && <Lock className="inline w-3 h-3 text-muted ml-1" title="System managed" />}
                  </td>
                  <td className="py-2.5 pr-3 text-heading">{t.displayName}</td>
                  <td className="py-2.5 pr-3 text-center">{t.gstApplicable ? <span className="text-green-500">Yes</span> : <span className="text-muted">No</span>}</td>
                  <td className="py-2.5 pr-3 text-center">{t.reserveFund ? <span className="text-amber-500">Yes</span> : <span className="text-muted">No</span>}</td>
                  <td className="py-2.5 pr-3 text-center">{t.oneTime ? <span className="text-purple-500">Yes</span> : <span className="text-muted">No</span>}</td>
                  <td className="py-2.5 pr-3 text-center">{t.active ? <span className="text-green-500">Yes</span> : <span className="text-red-400">No</span>}</td>
                  <td className="py-2.5 pr-3 text-center text-muted">{t.displayOrder}</td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => startEditIncome(t)} className="p-1 hover:bg-card-alt rounded transition-colors" title="Edit">
                        <Pencil className="w-3.5 h-3.5 text-muted hover:text-heading" />
                      </button>
                      {!t.systemManaged && (
                        <button onClick={() => deleteIncomeType(t.id)} className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5 text-muted hover:text-red-500" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {incomeTypes.length === 0 && (
                <tr><td colSpan={8} className="py-6 text-center text-muted text-[12px]">No income types configured</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Types Section */}
      <div className="bg-card border border-border rounded-xl p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[14px] font-semibold text-heading flex items-center gap-2"><Receipt className="w-4 h-4 text-red-500" /> Expense Types</h2>
            <p className="text-[11px] text-muted mt-0.5">Configure expense categories with GST inclusion flag</p>
          </div>
        </div>

        {/* Expense type form */}
        <div className="bg-card-alt border border-border rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="block text-[11px] font-medium text-muted mb-1">Code *</label>
              <input type="text" value={expenseForm.code} onChange={e => setExpenseForm({ ...expenseForm, code: e.target.value })}
                disabled={!!editingExpense}
                className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading disabled:opacity-50" placeholder="e.g. INSURANCE" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-muted mb-1">Display Name *</label>
              <input type="text" value={expenseForm.displayName} onChange={e => setExpenseForm({ ...expenseForm, displayName: e.target.value })}
                className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="e.g. Insurance" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-muted mb-1">Order</label>
              <input type="number" value={expenseForm.displayOrder} onChange={e => setExpenseForm({ ...expenseForm, displayOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={saveExpenseType} disabled={savingType || !expenseForm.code.trim() || !expenseForm.displayName.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                {savingType ? <ButtonSpinner /> : <Plus className="w-3.5 h-3.5" />}
                {editingExpense ? 'Update' : 'Add'}
              </button>
              {editingExpense && (
                <button onClick={resetExpenseForm} className="px-3 py-2 border border-border rounded-lg text-[13px] text-sub hover:bg-card-hover transition-colors">
                  Cancel
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <label className="flex items-center gap-2 text-[12px] text-heading cursor-pointer">
              <input type="checkbox" checked={expenseForm.gstIncluded} onChange={e => setExpenseForm({ ...expenseForm, gstIncluded: e.target.checked })}
                className="rounded border-input-border" />
              <Receipt className="w-3.5 h-3.5 text-blue-500" /> GST Included
            </label>
            <label className="flex items-center gap-2 text-[12px] text-heading cursor-pointer">
              <input type="checkbox" checked={expenseForm.active} onChange={e => setExpenseForm({ ...expenseForm, active: e.target.checked })}
                className="rounded border-input-border" />
              Active
            </label>
          </div>
        </div>

        {/* Expense types table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[11px] text-muted uppercase tracking-wider">
                <th className="pb-2 pr-3">Code</th>
                <th className="pb-2 pr-3">Name</th>
                <th className="pb-2 pr-3 text-center">GST Included</th>
                <th className="pb-2 pr-3 text-center">Active</th>
                <th className="pb-2 pr-3 text-center">Order</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {expenseTypes.map(t => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-card-hover transition-colors">
                  <td className="py-2.5 pr-3 font-mono text-[12px]">{t.code}</td>
                  <td className="py-2.5 pr-3 text-heading">{t.displayName}</td>
                  <td className="py-2.5 pr-3 text-center">{t.gstIncluded ? <span className="text-green-500">Yes</span> : <span className="text-muted">No</span>}</td>
                  <td className="py-2.5 pr-3 text-center">{t.active ? <span className="text-green-500">Yes</span> : <span className="text-red-400">No</span>}</td>
                  <td className="py-2.5 pr-3 text-center text-muted">{t.displayOrder}</td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => startEditExpense(t)} className="p-1 hover:bg-card-alt rounded transition-colors" title="Edit">
                        <Pencil className="w-3.5 h-3.5 text-muted hover:text-heading" />
                      </button>
                      <button onClick={() => deleteExpenseType(t.id)} className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5 text-muted hover:text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenseTypes.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-muted text-[12px]">No expense types configured</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Danger Zone ─── */}
      {isAdmin && (
        <div className="mt-10 border border-red-300 dark:border-red-500/30 rounded-lg p-6 bg-red-50/50 dark:bg-red-500/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
          </div>
          <p className="text-sm text-muted mb-4">
            Reset all data in this society. This will delete all properties, residents, payments, complaints, visitors, and every other record. Only admin and guard accounts will be preserved. This is intended for cleaning up test environments.
          </p>
          <button
            onClick={handleCleanupData}
            disabled={cleaning}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {cleaning ? <ButtonSpinner /> : <Trash2 className="w-4 h-4" />}
            {cleaning ? 'Cleaning up...' : 'Reset All Data'}
          </button>
        </div>
      )}
    </div>
  );
}
