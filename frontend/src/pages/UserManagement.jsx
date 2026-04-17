import { ButtonSpinner } from '../components/Spinner';
import { TableSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import Modal from '../components/Modal';
import UserAvatar from '../components/UserAvatar';
import { Plus, Pencil, Trash2, Search, Copy, Check, Upload, Save, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSocietyConfig } from '../context/SocietyConfigContext';

export default function UserManagement() {
  const { config } = useSocietyConfig();
  const propertyLabel = config?.propertyLabel || 'Property';
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [resetLinkModal, setResetLinkModal] = useState({ open: false, link: '', username: '' });
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ username: '', firstName: '', lastName: '', email: '', phone: '', address: '', unitNumber: '', role: 'USER' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try { const { data } = await adminAPI.getUsers(); setUsers(data); }
    catch (err) { console.error('Failed to load users', err); }
    finally { setLoading(false); }
  };

  const fetchProperties = async () => {
    try { const { data } = await adminAPI.getProperties(); setProperties(data); }
    catch (err) { console.error('Failed to load properties', err); }
  };

  useEffect(() => { fetchUsers(); fetchProperties(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ username: '', firstName: '', lastName: '', email: '', phone: '', address: '', unitNumber: '', role: 'USER' });
    setImageFile(null); setImagePreview(null);
    setError(''); setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({ username: user.username, firstName: user.firstName || '', lastName: user.lastName || '', email: user.email, phone: user.phone || '', address: user.address || '', unitNumber: user.unitNumber || '', role: user.role });
    setImageFile(null); setImagePreview(user.profileImage || null);
    setError(''); setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { setError('Image must be less than 5MB'); return; }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      let userId;
      if (editing) {
        await adminAPI.updateUser(editing.id, { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, address: form.address, unitNumber: form.unitNumber, role: form.role });
        userId = editing.id;
      } else {
        const { data } = await adminAPI.createUser(form);
        userId = data.id;
        if (data.passwordResetLink) setResetLinkModal({ open: true, link: data.passwordResetLink, username: data.username });
      }
      if (imageFile && userId) {
        await adminAPI.uploadProfileImage(userId, imageFile);
      }
      setModalOpen(false); fetchUsers();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save user'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try { await adminAPI.deleteUser(id); fetchUsers(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete'); }
  };

  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  // Progressive loading
  const PAGE_SIZE = 30;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleUsers = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">Society Members</h1>
          <p className="text-[13px] text-muted mt-0.5">{users.length} registered members</p>
        </div>
        <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }} placeholder="Search members..." className="w-full pl-10 pr-4 py-2.5 bg-input-bg border border-input-border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[13px] text-heading placeholder:text-muted" />
      </div>

      {loading ? <TableSkeleton /> : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="table-container-lg">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Member</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Contact</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">{propertyLabel}</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Role</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider bg-card-alt">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.id} onClick={() => navigate(`/users/${user.id}`)} className="border-b border-dashed border-border hover:bg-card-hover transition-colors cursor-pointer">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={user.fullName} src={user.profileImage} />
                        <div>
                          <p className="text-[13px] font-medium text-heading">{user.fullName}</p>
                          <p className="text-[11px] text-muted">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-[13px] text-heading">{user.email}</p>
                      <p className="text-[11px] text-muted">{user.phone || '-'}</p>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-heading">{user.unitNumber || '-'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400'}`}>{user.role}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={(e) => { e.stopPropagation(); openEdit(user); }} className="p-1.5 text-muted hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(user.id); }} className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan="5"><EmptyState icon={Users} title="No members found" description="There are no members matching your search criteria." /></td></tr>}
              </tbody>
            </table>
          </div>
          {hasMore && (
            <div className="px-5 py-3 border-t border-border text-center">
              <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)} className="text-[13px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">
                Show more ({filtered.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Member' : 'Register New Member'} full>
        {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-lg text-[13px]">{error}</div>}
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            {/* Left Column — Member Details */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h2 className="text-[14px] font-semibold text-heading mb-2">Member Details</h2>

                {!editing && (
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Username *</label>
                    <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required placeholder="e.g. john.doe" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">First Name *</label>
                    <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required placeholder="First name" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Last Name *</label>
                    <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required placeholder="Last name" />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" required placeholder="member@example.com" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Phone</label>
                    <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="98765 43210" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">{propertyLabel} No.</label>
                    <select value={form.unitNumber} onChange={(e) => setForm({ ...form, unitNumber: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading"><option value="">{`-- Select ${propertyLabel} --`}</option>{properties.map((v) => <option key={v.id} value={v.unitNumber}>{v.unitNumber} {v.ownerName ? `(${v.ownerName})` : ''}</option>)}</select>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-heading mb-1">Address</label>
                  <textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading resize-none" placeholder="Full address" />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setModalOpen(false)}
                    className="flex-1 py-2.5 border border-border rounded-lg text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving ? <><ButtonSpinner /> Saving...</> : <><Save className="w-4 h-4" /> {editing ? 'Update Member' : 'Register Member'}</>}
                  </button>
                </div>

                {!editing && <p className="text-[11px] text-muted">A password setup link will be generated for the member.</p>}
              </div>
            </div>

            {/* Right Column — Photo & Role */}
            <div className="space-y-6 md:sticky md:top-4 md:self-start">
              {/* Profile Photo */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-[14px] font-semibold text-heading mb-4">Profile Photo</h2>
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-card-alt overflow-hidden mb-3">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-10 h-10 text-muted opacity-40" />
                    )}
                  </div>
                  <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" /> Upload Photo
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                  <p className="text-[11px] text-muted mt-2">Square PNG or JPG, max 5MB</p>
                </div>
              </div>

              {/* Role */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-[14px] font-semibold text-heading mb-1">Role</h2>
                <p className="text-[11px] text-muted mb-3">Assign permissions level for this member.</p>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      <Modal open={resetLinkModal.open} onClose={() => setResetLinkModal({ open: false, link: '', username: '' })} title="Member Registered Successfully">
        <div className="space-y-4">
          <p className="text-[13px] text-sub">User <span className="font-semibold">@{resetLinkModal.username}</span> has been created. Share this password reset link:</p>
          <div className="bg-card-alt border border-border rounded p-3 flex items-center gap-2">
            <input type="text" readOnly value={resetLinkModal.link} className="flex-1 bg-transparent text-[13px] text-heading outline-none truncate" />
            <button onClick={() => { navigator.clipboard.writeText(resetLinkModal.link); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-[11px] font-medium rounded hover:bg-indigo-700 transition-colors">
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </button>
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded p-3">Note: Email delivery failed (SMTP not configured). Please copy this link and share it manually. The link expires in 1 hour.</p>
          <div className="flex justify-end pt-2">
            <button onClick={() => setResetLinkModal({ open: false, link: '', username: '' })} className="px-4 py-2 bg-indigo-600 text-white rounded text-[13px] font-medium hover:bg-indigo-700">Done</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
