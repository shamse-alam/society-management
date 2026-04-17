import { useState, useEffect } from 'react';
import { adminAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ListSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { Calendar, Plus, Edit2, Trash2, MapPin, Clock, Users, Check, X, HelpCircle, Save } from 'lucide-react';

function formatDateTime(str) {
  if (!str) return '-';
  return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Events() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', venue: '', category: 'GENERAL', startTime: '', endTime: '', maxAttendees: '', status: 'UPCOMING' });

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      const res = isAdmin ? await adminAPI.getEvents() : await userAPI.getEvents();
      setEvents(res.data);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, maxAttendees: form.maxAttendees ? Number(form.maxAttendees) : null };
    try {
      if (editing) {
        await adminAPI.updateEvent(editing.id, payload);
        toast.success('Event updated');
      } else {
        await adminAPI.createEvent(payload);
        toast.success('Event created');
      }
      setShowModal(false);
      setEditing(null);
      fetchEvents();
    } catch {
      toast.error('Failed to save event');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return;
    try {
      await adminAPI.deleteEvent(id);
      toast.success('Event deleted');
      fetchEvents();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleRsvp = async (eventId, status) => {
    try {
      await userAPI.rsvpEvent(eventId, { status, guestCount: 0 });
      toast.success(`RSVP: ${status}`);
      fetchEvents();
    } catch {
      toast.error('Failed to RSVP');
    }
  };

  const openEdit = (ev) => {
    setEditing(ev);
    setForm({
      title: ev.title, description: ev.description || '', venue: ev.venue || '',
      category: ev.category || 'GENERAL', status: ev.status || 'UPCOMING',
      startTime: ev.startTime ? ev.startTime.slice(0, 16) : '',
      endTime: ev.endTime ? ev.endTime.slice(0, 16) : '',
      maxAttendees: ev.maxAttendees || '',
    });
    setShowModal(true);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', description: '', venue: '', category: 'GENERAL', startTime: '', endTime: '', maxAttendees: '', status: 'UPCOMING' });
    setShowModal(true);
  };

  const statusColors = {
    UPCOMING: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    ONGOING: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    COMPLETED: 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400',
    CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  };

  if (loading) return <ListSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-heading">Society Events</h1>
          <p className="text-[13px] text-muted mt-1">{events.length} events</p>
        </div>
        {isAdmin && (
          <button onClick={openAdd} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" /> Create Event
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {events.map(ev => (
          <div key={ev.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[ev.status] || statusColors.UPCOMING}`}>{ev.status}</span>
                    {ev.category && <span className="px-2 py-0.5 bg-card-alt rounded-full text-[10px] font-semibold text-muted">{ev.category}</span>}
                  </div>
                  <h3 className="text-[15px] font-bold text-heading">{ev.title}</h3>
                  {ev.description && <p className="text-[12px] text-muted mt-1 line-clamp-2">{ev.description}</p>}
                </div>
                {isAdmin && (
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button onClick={() => openEdit(ev)} className="p-1.5 text-muted hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(ev.id)} className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-3 space-y-1.5 text-[12px] text-muted">
                {ev.venue && <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{ev.venue}</p>}
                <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{formatDateTime(ev.startTime)}{ev.endTime ? ` — ${formatDateTime(ev.endTime)}` : ''}</p>
                <p className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{ev.goingCount} going &middot; {ev.maybeCount} maybe{ev.maxAttendees ? ` &middot; Max: ${ev.maxAttendees}` : ''}</p>
              </div>

              {/* RSVP Buttons */}
              <div className="mt-4 flex gap-2">
                <button onClick={() => handleRsvp(ev.id, 'GOING')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                    ev.myRsvp === 'GOING' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20'
                  }`}>
                  <Check className="w-3.5 h-3.5" /> Going
                </button>
                <button onClick={() => handleRsvp(ev.id, 'MAYBE')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                    ev.myRsvp === 'MAYBE' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20'
                  }`}>
                  <HelpCircle className="w-3.5 h-3.5" /> Maybe
                </button>
                <button onClick={() => handleRsvp(ev.id, 'NOT_GOING')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                    ev.myRsvp === 'NOT_GOING' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20'
                  }`}>
                  <X className="w-3.5 h-3.5" /> Not Going
                </button>
              </div>
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div className="col-span-full">
            <EmptyState icon={Calendar} title="No events yet" description={isAdmin ? 'Create an event for the community' : 'Upcoming society events will appear here'} />
          </div>
        )}
      </div>

      {showModal && (
        <Modal open title={editing ? 'Edit Event' : 'Create Event'} onClose={() => { setShowModal(false); setEditing(null); }} full>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <h2 className="text-[14px] font-semibold text-heading mb-2">Event Details</h2>
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Title *</label>
                    <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                      className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="Event title" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Description</label>
                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                      className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading resize-none" rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-medium text-heading mb-1">Venue</label>
                      <input type="text" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })}
                        className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="Function Hall" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-heading mb-1">Category</label>
                      <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                        className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="FESTIVAL" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-medium text-heading mb-1">Start Time</label>
                      <input type="datetime-local" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })}
                        className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-heading mb-1">End Time</label>
                      <input type="datetime-local" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })}
                        className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setShowModal(false); setEditing(null); }} className="flex-1 py-2.5 border border-border rounded-lg text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"><Save className="w-4 h-4" /> {editing ? 'Update Event' : 'Create Event'}</button>
                  </div>
                </div>
              </div>
              <div className="space-y-6 md:sticky md:top-4 md:self-start">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="text-[14px] font-semibold text-heading mb-1">Capacity</h2>
                  <p className="text-[11px] text-muted mb-3">Maximum number of attendees allowed.</p>
                  <input type="number" value={form.maxAttendees} onChange={e => setForm({ ...form, maxAttendees: e.target.value })}
                    className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="Unlimited" />
                </div>
                {editing && (
                  <div className="bg-card border border-border rounded-xl p-5">
                    <h2 className="text-[14px] font-semibold text-heading mb-1">Status</h2>
                    <p className="text-[11px] text-muted mb-3">Current status of the event.</p>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                      className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                      <option value="UPCOMING">Upcoming</option>
                      <option value="ONGOING">Ongoing</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
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
