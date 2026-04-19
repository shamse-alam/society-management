import { useState, useEffect } from 'react';
import { adminAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ListSkeleton } from '../components/Skeleton';
import { ButtonSpinner } from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { FileText, FolderOpen, Plus, Download, Trash2, Edit2, Upload, BookOpen, FileSpreadsheet, ScrollText, ClipboardList, File, Save } from 'lucide-react';

const categories = ['BYLAWS', 'MEETING_MINUTES', 'FINANCIAL_STATEMENT', 'CIRCULAR', 'FORM', 'OTHER'];
const categoryConfig = {
  BYLAWS: { icon: BookOpen, color: 'bg-indigo-500', label: 'Bylaws' },
  MEETING_MINUTES: { icon: ScrollText, color: 'bg-blue-500', label: 'Meeting Minutes' },
  FINANCIAL_STATEMENT: { icon: FileSpreadsheet, color: 'bg-green-500', label: 'Financial Statement' },
  CIRCULAR: { icon: ClipboardList, color: 'bg-orange-500', label: 'Circular' },
  FORM: { icon: FileText, color: 'bg-purple-500', label: 'Form' },
  OTHER: { icon: File, color: 'bg-gray-500', label: 'Other' },
};

function formatSize(bytes) {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function Documents() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterCat, setFilterCat] = useState('');
  const [form, setForm] = useState({ title: '', description: '', category: 'CIRCULAR' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchDocs(); }, []);

  const fetchDocs = async () => {
    try {
      const res = isAdmin ? await adminAPI.getDocuments() : await userAPI.getDocuments();
      setDocs(res.data);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('description', form.description);
        formData.append('category', form.category);
        await adminAPI.updateDocument(editing.id, formData);
        toast.success('Document updated');
      } else {
        if (!file) { toast.error('Please select a file'); return; }
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('description', form.description);
        formData.append('category', form.category);
        formData.append('file', file);
        await adminAPI.uploadDocument(formData);
        toast.success('Document uploaded');
      }
      setShowModal(false);
      setEditing(null);
      setFile(null);
      fetchDocs();
    } catch {
      toast.error('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return;
    try {
      await adminAPI.deleteDocument(id);
      toast.success('Document deleted');
      fetchDocs();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const openEdit = (d) => {
    setEditing(d);
    setForm({ title: d.title, description: d.description || '', category: d.category });
    setShowModal(true);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', description: '', category: 'CIRCULAR' });
    setFile(null);
    setShowModal(true);
  };

  const filtered = filterCat ? docs.filter(d => d.category === filterCat) : docs;

  // Group by category
  const grouped = {};
  filtered.forEach(d => {
    const cat = d.category || 'OTHER';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(d);
  });

  if (loading) return <ListSkeleton />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">Society Documents</h1>
          <p className="text-[13px] text-muted mt-0.5">{docs.length} documents available</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="px-3 py-2 bg-card border border-border rounded-lg text-[13px] text-heading">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{categoryConfig[c].label}</option>)}
          </select>
          {isAdmin && (
            <button onClick={openAdd} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-[13px] font-medium hover:bg-indigo-700 transition-colors">
              <Upload className="w-4 h-4" /> Upload Document
            </button>
          )}
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <EmptyState icon={FolderOpen} title="No documents yet" description={isAdmin ? 'Upload society documents for residents' : 'Documents shared by the admin will appear here'} />
      ) : (
        Object.entries(grouped).map(([cat, catDocs]) => {
          const cfg = categoryConfig[cat] || categoryConfig.OTHER;
          const Icon = cfg.icon;
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-7 h-7 ${cfg.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-[14px] font-bold text-heading">{cfg.label}</h2>
                <span className="text-[12px] text-muted">({catDocs.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {catDocs.map(d => (
                  <div key={d.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-heading truncate">{d.title}</p>
                        {d.description && <p className="text-[12px] text-muted mt-1 line-clamp-2">{d.description}</p>}
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1 shrink-0 ml-2">
                          <button onClick={() => openEdit(d)} className="p-1.5 text-muted hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(d.id)} className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-[11px] text-muted">
                        <p>{d.fileName || 'No file'} &middot; {formatSize(d.fileSize)}</p>
                        <p>Uploaded by {d.uploadedByName}</p>
                      </div>
                      {d.fileUrl && (
                        <a href={d.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-[12px] font-medium hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {showModal && (
        <Modal open title={editing ? 'Edit Document' : 'Upload Document'} onClose={() => { setShowModal(false); setEditing(null); }} full>
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[14px] font-semibold text-heading">Document Details</h2>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { setShowModal(false); setEditing(null); }} className="px-4 py-2 border border-border rounded text-[13px] font-medium text-sub hover:bg-card-hover transition-colors">Cancel</button>
                <button type="submit" disabled={saving || !form.title || (!editing && !file)} className="px-4 py-2 bg-indigo-600 text-white rounded text-[13px] font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">{saving ? <><ButtonSpinner /> Saving...</> : <><Save className="w-4 h-4" /> {editing ? 'Update Document' : 'Upload Document'}</>}</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Title *</label>
                    <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                      className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading" placeholder="Document title" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-heading mb-1">Description</label>
                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                      className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading resize-none" rows={2} placeholder="Brief description" />
                  </div>
                </div>
              </div>
              <div className="space-y-6 md:sticky md:top-4 md:self-start">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="text-[14px] font-semibold text-heading mb-1">Category</h2>
                  <p className="text-[11px] text-muted mb-3">Classify the document for easy filtering.</p>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading">
                    {categories.map(c => <option key={c} value={c}>{categoryConfig[c].label}</option>)}
                  </select>
                </div>
                {!editing && (
                  <div className="bg-card border border-border rounded-xl p-5">
                    <h2 className="text-[14px] font-semibold text-heading mb-1">File</h2>
                    <p className="text-[11px] text-muted mb-3">Select a file to upload.</p>
                    <input type="file" onChange={e => setFile(e.target.files[0])}
                      className="w-full text-[13px] text-heading file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-[13px] file:font-medium file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-500/10 dark:file:text-indigo-400 hover:file:bg-indigo-100" />
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
