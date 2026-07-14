import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  HiOutlineSearch, HiOutlineX, HiOutlineDocumentText, HiOutlinePlus,
  HiOutlineDownload, HiOutlinePencil, HiOutlineTrash,
} from 'react-icons/hi';

const inputCls = 'w-full px-4 py-2.5 bg-gray-100 dark:bg-white/[0.06] border border-gray-300 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 dark:focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all';
const labelCls = 'block text-xs font-medium text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wider';

const TODAY = new Date().toISOString().slice(0, 10);

const DEFAULT_TAGLINE = 'The two-day hybrid event unites young researchers, scholars, activists and academicians to discuss and share knowledge in the field of the conference.';

const baseEmptyForm = {
  conferenceId: '',
  conferenceName: '',
  conferenceDates: '',
  conferenceLocation: '',
  shortCode: '',
  eventTagline: DEFAULT_TAGLINE,
  websiteUrl: '',
  paperTitle: '',
  presentationType: 'Oral Presentation',
  signatoryName: '',
  signatoryTitle: 'Scientific Committee',
  contactAddress: '',
  contactEmail: '',
  contactWhatsapp: '',
  letterDate: TODAY,
};

function buildEmptyForm(settings) {
  return {
    ...baseEmptyForm,
    contactAddress: settings?.contactAddress || '',
    contactEmail: settings?.contactEmail || '',
    contactWhatsapp: settings?.contactWhatsapp || '',
  };
}

// ─── Client search picker ──────────────────────────────────────────────────

function ClientPicker({ value, onSelect }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = async (val) => {
    if (!val.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const { data } = await api.get('/clients', { params: { search: val, limit: 8 } });
      setResults(data.clients || []);
      setOpen(true);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQ(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), 300);
  };

  const pick = (client) => {
    onSelect(client);
    setQ('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <label className={labelCls}>Recipient (Client) *</label>
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-100 dark:bg-white/[0.06] border border-gray-300 dark:border-white/10 rounded-xl focus-within:border-violet-500 dark:focus-within:border-violet-500/60 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all">
        <HiOutlineSearch className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
        <input
          type="text"
          value={value ? value.fullName : q}
          onChange={(e) => { if (value) onSelect(null); handleChange(e); }}
          onFocus={() => q && results.length && setOpen(true)}
          placeholder="Search client by name or email..."
          className="bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 outline-none flex-1"
        />
        {loading && <div className="w-3.5 h-3.5 border border-gray-300 dark:border-slate-600 border-t-violet-500 rounded-full animate-spin shrink-0" />}
        {value && (
          <button type="button" onClick={() => { onSelect(null); setQ(''); }}>
            <HiOutlineX className="w-4 h-4 text-gray-400 dark:text-slate-500" />
          </button>
        )}
      </div>
      {value && (
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">{value.organization || 'No organization on file'}{value.country ? ` · ${value.country}` : ''}</p>
      )}
      {open && results.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl z-[200] overflow-hidden max-h-64 overflow-y-auto">
          {results.map((c) => (
            <button key={c._id} type="button" onClick={() => pick(c)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition text-left">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {c.fullName?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">{c.fullName}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{c.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {open && q && results.length === 0 && !loading && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl z-[200] px-4 py-4 text-center text-xs text-gray-400 dark:text-slate-600">
          No clients found for "{q}"
        </div>
      )}
    </div>
  );
}

// ─── Create/edit form ──────────────────────────────────────────────────────

function DocumentForm({ docType, docTypes, editing, client, onClientSelect, form, onChange, conferences, onSubmit, onCancel, saving }) {
  const handleConferenceChange = (id) => {
    const conf = conferences.find((c) => c._id === id);
    onChange({
      conferenceId: id,
      conferenceName: conf?.name || form.conferenceName,
      conferenceDates: conf?.date ? new Date(conf.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : form.conferenceDates,
      conferenceLocation: conf?.location || form.conferenceLocation,
    });
  };

  return (
    <form onSubmit={onSubmit} className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-5 shadow-sm dark:shadow-none">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{editing ? 'Edit Document' : 'New Document'}</h3>
        <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 dark:text-slate-500 transition">
          <HiOutlineX className="w-4 h-4" />
        </button>
      </div>

      <div>
        <label className={labelCls}>Document Type *</label>
        <select value={docType} disabled={editing} onChange={(e) => onChange({ __docType: e.target.value })}
          className={`${inputCls} ${editing ? 'opacity-60 cursor-not-allowed' : ''}`}>
          {docTypes.map((t) => <option key={t.docType} value={t.docType}>{t.label}</option>)}
        </select>
      </div>

      <ClientPicker value={client} onSelect={onClientSelect} />

      {docType === 'ACCEPTANCE_LETTER' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Conference (autofill)</label>
              <select value={form.conferenceId} onChange={(e) => handleConferenceChange(e.target.value)} className={inputCls}>
                <option value="">— pick to autofill —</option>
                {conferences.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Conference Name *</label>
              <input value={form.conferenceName} onChange={(e) => onChange({ conferenceName: e.target.value })} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Conference Dates *</label>
              <input value={form.conferenceDates} onChange={(e) => onChange({ conferenceDates: e.target.value })} required placeholder="e.g. 15 - 16 June, 2026" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Location *</label>
              <input value={form.conferenceLocation} onChange={(e) => onChange({ conferenceLocation: e.target.value })} required placeholder="e.g. Boston, Massachusetts, USA" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Short Code *</label>
              <input value={form.shortCode} onChange={(e) => onChange({ shortCode: e.target.value })} required placeholder="e.g. GMC 2026" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Conference Website</label>
              <input value={form.websiteUrl} onChange={(e) => onChange({ websiteUrl: e.target.value })} placeholder="https://..." className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Event Tagline *</label>
            <textarea value={form.eventTagline} onChange={(e) => onChange({ eventTagline: e.target.value })} required rows={2} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Paper / Research Title *</label>
            <input value={form.paperTitle} onChange={(e) => onChange({ paperTitle: e.target.value })} required className={inputCls} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Presentation Type *</label>
              <select value={form.presentationType} onChange={(e) => onChange({ presentationType: e.target.value })} className={inputCls}>
                <option value="Oral Presentation">Oral Presentation</option>
                <option value="Poster Presentation">Poster Presentation</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Letter Date</label>
              <input type="date" value={form.letterDate} onChange={(e) => onChange({ letterDate: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Signatory Name *</label>
              <input value={form.signatoryName} onChange={(e) => onChange({ signatoryName: e.target.value })} required placeholder="e.g. Dr. Susan Albert" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Signatory Title</label>
              <input value={form.signatoryTitle} onChange={(e) => onChange({ signatoryTitle: e.target.value })} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Contact Address</label>
              <input value={form.contactAddress} onChange={(e) => onChange({ contactAddress: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Contact Email</label>
              <input type="email" value={form.contactEmail} onChange={(e) => onChange({ contactEmail: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Contact WhatsApp</label>
              <input value={form.contactWhatsapp} onChange={(e) => onChange({ contactWhatsapp: e.target.value })} className={inputCls} />
            </div>
          </div>
        </>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-900/30 transition-all"
        >
          <HiOutlineDocumentText className="w-4 h-4" />
          {saving ? 'Saving...' : editing ? 'Save Changes' : 'Save Document'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-5 py-2.5 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-xl text-sm font-medium transition-all">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function DocumentGenerator() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [docType, setDocType] = useState('ACCEPTANCE_LETTER');
  const [client, setClient] = useState(null);
  const [form, setForm] = useState(baseEmptyForm);
  const [deleteId, setDeleteId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const { data: docTypes = [] } = useQuery({
    queryKey: ['documents', 'types'],
    queryFn: () => api.get('/documents/types').then((r) => r.data),
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => api.get('/documents').then((r) => r.data),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((r) => r.data),
  });

  const { data: conferences = [] } = useQuery({
    queryKey: ['admin', 'conferences'],
    queryFn: () => api.get('/admin/conferences').then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => editDoc ? api.put(`/documents/${editDoc._id}`, payload) : api.post('/documents', payload),
    onSuccess: () => {
      toast.success(editDoc ? 'Document updated' : 'Document saved');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      closeForm();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save document'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/documents/${id}`),
    onSuccess: () => {
      toast.success('Document deleted');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete document'),
  });

  const closeForm = () => {
    setShowForm(false);
    setEditDoc(null);
    setClient(null);
    setForm(buildEmptyForm(settings));
  };

  const openCreate = () => {
    setEditDoc(null);
    setDocType('ACCEPTANCE_LETTER');
    setClient(null);
    setForm(buildEmptyForm(settings));
    setShowForm(true);
  };

  const openEdit = (doc) => {
    setEditDoc(doc);
    setDocType(doc.docType);
    setClient(doc.clientId ? { _id: doc.clientId._id, fullName: doc.fields.recipientName || doc.clientId.fullName, organization: doc.fields.affiliation, country: doc.fields.country } : null);
    setForm({ ...buildEmptyForm(settings), ...doc.fields });
    setShowForm(true);
  };

  const handleFormChange = (patch) => {
    if (patch.__docType) { setDocType(patch.__docType); return; }
    setForm((f) => ({ ...f, ...patch }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!client) { toast.error('Select a recipient client'); return; }
    saveMutation.mutate({
      docType,
      clientId: client._id,
      recipientName: client.fullName,
      affiliation: client.organization || '',
      country: client.country || '',
      ...form,
    });
  };

  const handleDownload = async (doc) => {
    setDownloadingId(doc._id);
    try {
      const { data } = await api.get(`/documents/${doc._id}/download`, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${(doc.fields.recipientName || doc.docType).replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error('Failed to download document');
    } finally {
      setDownloadingId(null);
    }
  };

  const typeLabel = (type) => docTypes.find((t) => t.docType === type)?.label || type;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h2>
          <p className="text-gray-400 dark:text-slate-500 text-sm mt-0.5">Generate and manage branded PDF documents</p>
        </div>
        {!showForm && (
          <button type="button" onClick={openCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-violet-900/30 transition-all">
            <HiOutlinePlus className="w-4 h-4" /> New Document
          </button>
        )}
      </div>

      {showForm && (
        <DocumentForm
          docType={docType}
          docTypes={docTypes}
          editing={Boolean(editDoc)}
          client={client}
          onClientSelect={setClient}
          form={form}
          onChange={handleFormChange}
          conferences={conferences}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          saving={saveMutation.isPending}
        />
      )}

      <div className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 dark:border-slate-700 border-t-violet-500" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-slate-600 text-sm">No documents saved yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-transparent">
                  {['Type', 'Recipient', 'Details', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                {documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-violet-50/40 dark:hover:bg-violet-500/[0.04] transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs px-2.5 py-1 rounded-lg font-medium bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300">{typeLabel(doc.docType)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-slate-200">{doc.fields?.recipientName || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400 max-w-xs truncate">{doc.fields?.conferenceName || doc.fields?.paperTitle || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap">{new Date(doc.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => handleDownload(doc)} disabled={downloadingId === doc._id}
                          title="Download PDF"
                          className="p-1.5 text-gray-400 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-lg transition disabled:opacity-40">
                          <HiOutlineDownload className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => openEdit(doc)} title="Edit"
                          className="p-1.5 text-gray-400 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition">
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => setDeleteId(doc._id)} title="Delete"
                          className="p-1.5 text-gray-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition">
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Delete Document?"
        message="This saved document will be permanently removed. You can still generate a new one later."
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
