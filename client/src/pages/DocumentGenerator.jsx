import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlineX, HiOutlineDocumentText } from 'react-icons/hi';

const inputCls = 'w-full px-4 py-2.5 bg-gray-100 dark:bg-white/[0.06] border border-gray-300 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 dark:focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all';
const labelCls = 'block text-xs font-medium text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wider';

const TODAY = new Date().toISOString().slice(0, 10);

const DEFAULT_TAGLINE = 'The two-day hybrid event unites young researchers, scholars, activists and academicians to discuss and share knowledge in the field of the conference.';

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

const emptyForm = {
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

export default function DocumentGenerator() {
  const [client, setClient] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [generating, setGenerating] = useState(false);

  const { data: conferences = [] } = useQuery({
    queryKey: ['admin', 'conferences'],
    queryFn: () => api.get('/admin/conferences').then((r) => r.data),
  });

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleConferenceChange = (id) => {
    const conf = conferences.find((c) => c._id === id);
    set({
      conferenceId: id,
      conferenceName: conf?.name || form.conferenceName,
      conferenceDates: conf?.date ? new Date(conf.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : form.conferenceDates,
      conferenceLocation: conf?.location || form.conferenceLocation,
    });
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!client) { toast.error('Select a recipient client'); return; }

    setGenerating(true);
    try {
      const payload = {
        clientId: client._id,
        recipientName: client.fullName,
        affiliation: client.organization || '',
        country: client.country || '',
        conferenceName: form.conferenceName,
        conferenceDates: form.conferenceDates,
        conferenceLocation: form.conferenceLocation,
        shortCode: form.shortCode,
        eventTagline: form.eventTagline,
        websiteUrl: form.websiteUrl,
        paperTitle: form.paperTitle,
        presentationType: form.presentationType,
        signatoryName: form.signatoryName,
        signatoryTitle: form.signatoryTitle,
        contactAddress: form.contactAddress,
        contactEmail: form.contactEmail,
        contactWhatsapp: form.contactWhatsapp,
        letterDate: form.letterDate,
      };
      const { data } = await api.post('/documents/acceptance-letter', payload, { responseType: 'blob' });

      const blobUrl = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `acceptance-letter-${client.fullName.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Letter generated');
    } catch (err) {
      let message = 'Failed to generate document';
      if (err.response?.data instanceof Blob) {
        try {
          message = JSON.parse(await err.response.data.text()).message || message;
        } catch { /* keep default message */ }
      } else {
        message = err.response?.data?.message || message;
      }
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h2>
        <p className="text-gray-400 dark:text-slate-500 text-sm mt-0.5">Generate a branded Letter of Acceptance PDF</p>
      </div>

      <form onSubmit={handleGenerate} className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-5 shadow-sm dark:shadow-none">
        <ClientPicker value={client} onSelect={setClient} />

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
            <input value={form.conferenceName} onChange={(e) => set({ conferenceName: e.target.value })} required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Conference Dates *</label>
            <input value={form.conferenceDates} onChange={(e) => set({ conferenceDates: e.target.value })} required placeholder="e.g. 15 - 16 June, 2026" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Location *</label>
            <input value={form.conferenceLocation} onChange={(e) => set({ conferenceLocation: e.target.value })} required placeholder="e.g. Boston, Massachusetts, USA" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Short Code *</label>
            <input value={form.shortCode} onChange={(e) => set({ shortCode: e.target.value })} required placeholder="e.g. GMC 2026" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Conference Website</label>
            <input value={form.websiteUrl} onChange={(e) => set({ websiteUrl: e.target.value })} placeholder="https://..." className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Event Tagline *</label>
          <textarea value={form.eventTagline} onChange={(e) => set({ eventTagline: e.target.value })} required rows={2} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Paper / Research Title *</label>
          <input value={form.paperTitle} onChange={(e) => set({ paperTitle: e.target.value })} required className={inputCls} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Presentation Type *</label>
            <select value={form.presentationType} onChange={(e) => set({ presentationType: e.target.value })} className={inputCls}>
              <option value="Oral Presentation">Oral Presentation</option>
              <option value="Poster Presentation">Poster Presentation</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Letter Date</label>
            <input type="date" value={form.letterDate} onChange={(e) => set({ letterDate: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Signatory Name *</label>
            <input value={form.signatoryName} onChange={(e) => set({ signatoryName: e.target.value })} required placeholder="e.g. Dr. Susan Albert" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Signatory Title</label>
            <input value={form.signatoryTitle} onChange={(e) => set({ signatoryTitle: e.target.value })} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Contact Address</label>
            <input value={form.contactAddress} onChange={(e) => set({ contactAddress: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Contact Email</label>
            <input type="email" value={form.contactEmail} onChange={(e) => set({ contactEmail: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Contact WhatsApp</label>
            <input value={form.contactWhatsapp} onChange={(e) => set({ contactWhatsapp: e.target.value })} className={inputCls} />
          </div>
        </div>

        <button
          type="submit"
          disabled={generating}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-900/30 transition-all"
        >
          <HiOutlineDocumentText className="w-4 h-4" />
          {generating ? 'Generating...' : 'Generate PDF'}
        </button>
      </form>
    </div>
  );
}
