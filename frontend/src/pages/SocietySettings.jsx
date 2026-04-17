import { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../services/api';
import { useToast } from '../components/Toast';
import { ButtonSpinner } from '../components/Spinner';
import { FormSkeleton } from '../components/Skeleton';
import { useSocietyConfig } from '../context/SocietyConfigContext';
import { useNavigate } from 'react-router-dom';
import { Building2, Upload, Save, Plus, X, GripVertical } from 'lucide-react';

export default function SocietySettings() {
  const toast = useToast();
  const navigate = useNavigate();
  const { config, refreshConfig } = useSocietyConfig();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const [form, setForm] = useState({
    societyName: '', tagline: '', address: '', phone: '', email: '', gstin: '', registrationNumber: '', propertyLabel: '',
  });
  const [logoUrl, setLogoUrl] = useState('');
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [newType, setNewType] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await adminAPI.getSocietyConfig();
        const c = res.data;
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

  if (loading) return <FormSkeleton fields={6} />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-heading">Society Settings</h1>
        <p className="text-[13px] text-muted mt-1">Configure your society's name, logo, and contact information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
        {/* Left Column — Details Form */}
        <div className="space-y-6">
          <form onSubmit={handleSave} className="bg-card border border-border rounded-xl p-6 space-y-4">
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

            <div className="flex gap-3">
              <button type="button" onClick={() => navigate(-1)}
                className="flex-1 py-2.5 border border-border rounded-lg text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><ButtonSpinner /> Saving...</> : <><Save className="w-4 h-4" /> Save Settings</>}
              </button>
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
    </div>
  );
}
