import { useState, useEffect } from 'react';
import { adminAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ButtonSpinner } from '../components/Spinner';
import { ListSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { Users, Plus, Edit2, Trash2, Phone, Mail, Home, UserCheck, Save } from 'lucide-react';
import { useSocietyConfig } from '../context/SocietyConfigContext';
import UserAvatar from '../components/UserAvatar';
import PhotoPicker from '../components/PhotoPicker';

const relations = ['OWNER', 'SPOUSE', 'SON', 'DAUGHTER', 'PARENT', 'SIBLING', 'TENANT', 'OTHER'];

const relationColors = {
  OWNER: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
  SPOUSE: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400',
  SON: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  DAUGHTER: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  PARENT: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  SIBLING: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400',
  TENANT: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  OTHER: 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400',
};

export default function HouseholdMembers() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const { config } = useSocietyConfig();
  const propertyLabel = config?.propertyLabel || 'Property';
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterUnit, setFilterUnit] = useState('');
  const [form, setForm] = useState({ name: '', relation: 'SPOUSE', phone: '', email: '', unitNumber: '', canApproveVisitors: true });
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [properties, setProperties] = useState([]);

  useEffect(() => { fetchMembers(); if (isAdmin) fetchProperties(); }, []);

  const fetchProperties = async () => {
    try { const res = await adminAPI.getProperties(); setProperties(res.data); } catch {}
  };

  const fetchMembers = async () => {
    try {
      const res = isAdmin ? await adminAPI.getFamilyMembers() : await userAPI.getFamilyMembers();
      setMembers(res.data);
    } catch {
      toast.error('Failed to load household members');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let saved;
      if (editing) {
        saved = isAdmin ? await adminAPI.updateFamilyMember(editing.id, form) : await userAPI.updateFamilyMember(editing.id, form);
        toast.success('Member updated');
      } else {
        saved = isAdmin ? await adminAPI.addFamilyMember(form) : await userAPI.addFamilyMember(form);
        toast.success('Member added');
      }
      if (imageFile && saved?.data?.id) {
        try {
          isAdmin ? await adminAPI.uploadFamilyMemberPhoto(saved.data.id, imageFile) : await userAPI.uploadFamilyMemberPhoto(saved.data.id, imageFile);
        } catch { toast.error('Saved member but failed to upload photo'); }
      }
      setShowModal(false);
      setEditing(null);
      setImageFile(null);
      setImagePreview(null);
      fetchMembers();
    } catch {
      toast.error('Failed to save member');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this family member?')) return;
    try {
      isAdmin ? await adminAPI.deleteFamilyMember(id) : await userAPI.deleteFamilyMember(id);
      toast.success('Member removed');
      fetchMembers();
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({ name: m.name, relation: m.relation, phone: m.phone || '', email: m.email || '', unitNumber: m.unitNumber || '', canApproveVisitors: m.canApproveVisitors });
    setImageFile(null);
    setImagePreview(m.photoUrl || null);
    setShowModal(true);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', relation: 'SPOUSE', phone: '', email: '', unitNumber: '', canApproveVisitors: true });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be less than 5MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const filtered = filterUnit ? members.filter(m => m.unitNumber === filterUnit) : members;
  const unitNumbers = [...new Set(members.map(m => m.unitNumber))].sort();

  // Group by property
  const grouped = {};
  filtered.forEach(m => {
    if (!grouped[m.unitNumber]) grouped[m.unitNumber] = [];
    grouped[m.unitNumber].push(m);
  });

  if (loading) return <ListSkeleton />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">{isAdmin ? 'Household Members' : 'My Household'}</h1>
          <p className="text-[13px] text-muted mt-0.5">{isAdmin ? `Manage family members across all ${propertyLabel.toLowerCase()}s` : 'Manage your family members'}</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)}
              className="px-3 py-2 bg-card border border-border rounded-lg text-[13px] text-heading">
              <option value="">{`All ${propertyLabel}s`}</option>
              {properties.map(v => <option key={v.id} value={v.unitNumber}>{propertyLabel} {v.unitNumber}{v.ownerName ? ` (${v.ownerName})` : ''}</option>)}
            </select>
          )}
          <button onClick={openAdd} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" /> Add Member
          </button>
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <EmptyState icon={Users} title="No household members yet" description="Add family members to get started" />
      ) : (
        Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([unit, mems]) => (
          <div key={unit} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-card-alt border-b border-border flex items-center gap-2">
              <Home className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-[13px] font-semibold text-heading">{propertyLabel} {unit}</span>
              <span className="text-[12px] text-muted ml-1">({mems.length} members)</span>
            </div>
            <div className="divide-y divide-border">
              {mems.map(m => (
                <div key={m.id} className="px-5 py-3 flex items-center gap-4 hover:bg-card-alt/50 transition-colors">
                  <UserAvatar name={m.name} src={m.photoUrl} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-heading truncate">{m.name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${relationColors[m.relation] || relationColors.OTHER}`}>{m.relation}</span>
                      {m.canApproveVisitors && (
                        <span className="flex items-center gap-0.5 text-[10px] text-green-600 dark:text-green-400"><UserCheck className="w-3 h-3" /> Approver</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-0.5">
                      {m.phone && <span className="flex items-center gap-1 text-[12px] text-muted"><Phone className="w-3 h-3" />{m.phone}</span>}
                      {m.email && <span className="flex items-center gap-1 text-[12px] text-muted"><Mail className="w-3 h-3" />{m.email}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(m)} className="p-1.5 text-muted hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(m.id)} className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {showModal && (
        <Modal open title={editing ? 'Edit Family Member' : 'Add Family Member'} onClose={() => { setShowModal(false); setEditing(null); }} full>
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[14px] font-semibold text-heading">Member Details</h2>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { setShowModal(false); setEditing(null); }} className="px-4 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
                <button type="submit" disabled={saving || !form.name} className="px-4 py-2 bg-indigo-600 text-white rounded text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">{saving ? <><ButtonSpinner /> Saving...</> : <><Save className="w-4 h-4" /> {editing ? 'Update Member' : 'Save Member'}</>}</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Name *</label>
                    <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="Full name" />
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
                        className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="email@..." />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-[13px] text-heading cursor-pointer">
                    <input type="checkbox" checked={form.canApproveVisitors} onChange={e => setForm({ ...form, canApproveVisitors: e.target.checked })}
                      className="rounded border-input-border text-indigo-600 focus:ring-indigo-500" />
                    Can approve visitors
                  </label>
                </div>
              </div>
              <div className="space-y-6 md:sticky md:top-4 md:self-start">
                <PhotoPicker preview={imagePreview} onChange={(file) => { setImageFile(file); if (file) setImagePreview(URL.createObjectURL(file)); else setImagePreview(editing?.photoUrl || null); }} icon={Users} />
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="text-[14px] font-semibold text-heading mb-1">Relation</h2>
                  <p className="text-[11px] text-muted mb-3">Relationship to the primary owner.</p>
                  <select value={form.relation} onChange={e => setForm({ ...form, relation: e.target.value })}
                    className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                    {relations.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                {isAdmin && (
                  <div className="bg-card border border-border rounded-xl p-5">
                    <h2 className="text-[14px] font-semibold text-heading mb-1">{propertyLabel}</h2>
                    <p className="text-[11px] text-muted mb-3">Assign to a {propertyLabel.toLowerCase()}.</p>
                    <select required value={form.unitNumber} onChange={e => setForm({ ...form, unitNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                      <option value="">{`-- Select ${propertyLabel} --`}</option>
                      {properties.map(v => <option key={v.id} value={v.unitNumber}>{v.unitNumber}{v.ownerName ? ` (${v.ownerName})` : ''}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
