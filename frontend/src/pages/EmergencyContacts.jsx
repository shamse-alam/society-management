import { useState, useEffect } from 'react';
import { adminAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ListSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { Phone, Plus, Edit2, Trash2, AlertTriangle, Shield, Flame, Heart, Building, Wrench, Info, Siren, Save } from 'lucide-react';

const categoryConfig = {
  POLICE: { icon: Shield, color: 'bg-blue-500', label: 'Police' },
  FIRE: { icon: Flame, color: 'bg-red-500', label: 'Fire' },
  AMBULANCE: { icon: Heart, color: 'bg-green-500', label: 'Ambulance' },
  HOSPITAL: { icon: Heart, color: 'bg-emerald-500', label: 'Hospital' },
  SOCIETY_OFFICE: { icon: Building, color: 'bg-indigo-500', label: 'Society Office' },
  OTHER: { icon: Wrench, color: 'bg-gray-500', label: 'Other' },
};

export default function EmergencyContacts() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', category: 'OTHER', address: '', active: true, displayOrder: 0 });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = isAdmin ? await adminAPI.getEmergencyContacts() : await userAPI.getEmergencyContacts();
      setContacts(res.data);
    } catch (e) {
      toast.error('Failed to load emergency contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await adminAPI.updateEmergencyContact(editing.id, form);
        toast.success('Contact updated');
      } else {
        await adminAPI.createEmergencyContact(form);
        toast.success('Contact added');
      }
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', phone: '', category: 'OTHER', address: '', active: true, displayOrder: 0 });
      fetchContacts();
    } catch (e) {
      toast.error('Failed to save contact');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this emergency contact?')) return;
    try {
      await adminAPI.deleteEmergencyContact(id);
      toast.success('Contact deleted');
      fetchContacts();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const handleSOS = async () => {
    try {
      await userAPI.triggerSOS();
      toast.success('SOS alert sent to all admins!');
      setShowSOS(false);
    } catch (e) {
      toast.error('Failed to send SOS');
    }
  };

  const openEdit = (contact) => {
    setEditing(contact);
    setForm({
      name: contact.name,
      phone: contact.phone,
      category: contact.category,
      address: contact.address || '',
      active: contact.active,
      displayOrder: contact.displayOrder,
    });
    setShowModal(true);
  };

  if (loading) return <ListSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-heading">Emergency Contacts</h1>
          <p className="text-[13px] text-muted mt-1">Important contacts for emergencies</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSOS(true)} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-[13px] font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/25">
            <Siren className="w-4 h-4" /> SOS Alert
          </button>
          {isAdmin && (
            <button onClick={() => { setEditing(null); setForm({ name: '', phone: '', category: 'OTHER', address: '', active: true, displayOrder: 0 }); setShowModal(true); }}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors">
              <Plus className="w-4 h-4" /> Add Contact
            </button>
          )}
        </div>
      </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map(contact => {
          const config = categoryConfig[contact.category] || categoryConfig.OTHER;
          const Icon = config.icon;
          return (
            <div key={contact.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${config.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted uppercase tracking-wide">{config.label}</p>
                    <p className="text-[14px] font-semibold text-heading">{contact.name}</p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(contact)} className="p-1.5 text-muted hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(contact.id)} className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <a href={`tel:${contact.phone}`}
                 className="mt-4 flex items-center gap-3 px-4 py-3 bg-green-50 dark:bg-green-500/10 rounded-lg hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors group">
                <Phone className="w-5 h-5 text-green-600 dark:text-green-400 group-hover:animate-pulse" />
                <span className="text-[16px] font-bold text-green-700 dark:text-green-400 tracking-wide">{contact.phone}</span>
              </a>

              {contact.address && (
                <p className="mt-2 text-[12px] text-muted">{contact.address}</p>
              )}
            </div>
          );
        })}

        {contacts.length === 0 && (
          <div className="col-span-full">
            <EmptyState icon={Shield} title="No emergency contacts yet" description={isAdmin ? 'Add emergency contacts for residents' : 'Emergency contacts will be listed here'} />
          </div>
        )}
      </div>

      {/* SOS Confirmation Modal */}
      {showSOS && (
        <Modal open title="SOS Alert" onClose={() => setShowSOS(false)}>
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-heading mb-2">Are you sure?</h3>
            <p className="text-[13px] text-muted mb-6">This will immediately alert all society admins about an emergency at your location.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowSOS(false)} className="flex-1 py-2.5 border border-border rounded-lg text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
              <button onClick={handleSOS} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-[13px] font-medium hover:bg-red-700 transition-colors">Send SOS Alert</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal open title={editing ? 'Edit Emergency Contact' : 'Add Emergency Contact'} onClose={() => { setShowModal(false); setEditing(null); }} full>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <h2 className="text-[14px] font-semibold text-heading mb-2">Contact Details</h2>
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Name *</label>
                    <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="e.g. Local Police Station" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-medium text-heading mb-1">Phone Number *</label>
                      <input type="text" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="e.g. 100" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-heading mb-1">Address</label>
                      <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                        className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="Sector 5, near Main Gate" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setShowModal(false); setEditing(null); }} className="flex-1 py-2.5 border border-border rounded-lg text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"><Save className="w-4 h-4" /> {editing ? 'Update Contact' : 'Add Contact'}</button>
                  </div>
                </div>
              </div>
              <div className="space-y-6 md:sticky md:top-4 md:self-start">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="text-[14px] font-semibold text-heading mb-1">Category</h2>
                  <p className="text-[11px] text-muted mb-3">Type of emergency service.</p>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                    <option value="POLICE">Police</option>
                    <option value="FIRE">Fire</option>
                    <option value="AMBULANCE">Ambulance</option>
                    <option value="HOSPITAL">Hospital</option>
                    <option value="SOCIETY_OFFICE">Society Office</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="text-[14px] font-semibold text-heading mb-1">Display Order</h2>
                  <p className="text-[11px] text-muted mb-3">Lower numbers appear first in the list.</p>
                  <input type="number" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" />
                </div>
                {editing && (
                  <div className="bg-card border border-border rounded-xl p-5">
                    <h2 className="text-[14px] font-semibold text-heading mb-1">Status</h2>
                    <p className="text-[11px] text-muted mb-3">Control visibility of this contact.</p>
                    <label className="flex items-center gap-2 text-[13px] text-heading cursor-pointer">
                      <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })}
                        className="rounded border-input-border text-indigo-600 focus:ring-indigo-500" />
                      Active
                    </label>
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
