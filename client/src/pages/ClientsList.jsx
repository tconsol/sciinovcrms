import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus, HiOutlineSearch, HiOutlineTrash, HiOutlinePencil,
  HiOutlineEye, HiOutlineCheck, HiOutlineClipboardList,
} from 'react-icons/hi';
import Dropdown from '../components/Dropdown';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';

const COLOR_MAP = { blue: '#3b82f6', green: '#10b981', red: '#ef4444', amber: '#f59e0b', purple: '#8b5cf6', indigo: '#6366f1' };
const resolveColor = (c) => COLOR_MAP[c] || c || '#6366f1';

const paginationBtnCls = 'px-3 py-1.5 text-xs border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-500 dark:text-slate-400 rounded-lg disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white transition';
const inputCls = 'w-full px-3 py-2 bg-gray-100 dark:bg-white/[0.06] border border-gray-300 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 dark:focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all';
const labelCls = 'block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1 uppercase tracking-wider';


// ─── Inline Conversations Panel ───────────────────────────────────────────────

function ClientConversationsPanel({ client }) {
  const queryClient = useQueryClient();
  const clientId = client._id;

  const [convFilter, setConvFilter] = useState('ALL');
  const [showConvForm, setShowConvForm] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [convForm, setConvForm] = useState({ followUpDate: '', conference: '', topic: '', outcome: '', notes: '' });
  const [payForm, setPayForm] = useState({ amountPaid: '', actualFee: '', discount: '0', paymentMode: '', transactionId: '' });

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['followups', 'client', clientId],
    queryFn: () => api.get(`/follow-ups/client/${clientId}`).then((r) => r.data),
    staleTime: 30_000,
  });

  const { data: paymentModesData = [] } = useQuery({
    queryKey: ['admin', 'payment-modes'],
    queryFn: () => api.get('/admin/payment-modes').then((r) => r.data),
    staleTime: 5 * 60_000,
  });
  const { data: statusesData = [] } = useQuery({
    queryKey: ['admin', 'statuses'],
    queryFn: () => api.get('/admin/statuses').then((r) => r.data),
    staleTime: 5 * 60_000,
  });

  const addConvMutation = useMutation({
    mutationFn: (data) => api.post('/follow-ups', data),
    onSuccess: () => {
      toast.success('Conversation saved');
      setShowConvForm(false);
      setConvForm({ followUpDate: '', conference: '', topic: '', outcome: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['followups', 'client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  const addPayMutation = useMutation({
    mutationFn: (data) => api.post('/payments', data),
    onSuccess: () => {
      toast.success('Payment added');
      setShowPayForm(false);
      setPayForm({ amountPaid: '', actualFee: '', discount: '0', paymentMode: '', transactionId: '' });
      queryClient.invalidateQueries({ queryKey: ['payments', 'client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add payment'),
  });

  const markCompleteMutation = useMutation({
    mutationFn: (id) => api.put(`/follow-ups/${id}`, { status: 'COMPLETED' }),
    onSuccess: () => {
      toast.success('Conversation completed');
      queryClient.invalidateQueries({ queryKey: ['followups', 'client', clientId] });
    },
    onError: () => toast.error('Failed to update'),
  });

  const filtered = conversations
    .filter((c) => convFilter === 'ALL' || c.status === convFilter)
    .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));

  // Number conversations per conference
  const confCounters = {};
  const sortedAll = [...conversations].sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));
  sortedAll.forEach((c) => {
    const key = c.conference || 'General';
    confCounters[key] = (confCounters[key] || 0) + 1;
  });

  // Assign sequential numbers within each conference for filtered list
  const confIdx = {};
  const numberedFiltered = sortedAll
    .map((c) => {
      const key = c.conference || 'General';
      confIdx[key] = (confIdx[key] || 0) + 1;
      return { ...c, num: confIdx[key] };
    })
    .filter((c) => convFilter === 'ALL' || c.status === convFilter);

  const clientConferences = (client.conferenceNames || []).map((c) => ({ value: c, label: c }));
  const clientTopics = (client.topics || []).map((t) => ({ value: t, label: t }));

  return (
    <div className="p-4 space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-gray-100 dark:bg-white/[0.06] p-1 rounded-xl">
          {['ALL', 'PENDING', 'COMPLETED'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setConvFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                convFilter === f
                  ? 'bg-white dark:bg-white/[0.1] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
              }`}
            >
              {f === 'ALL' ? `All (${conversations.length})` : f === 'PENDING' ? `Pending (${conversations.filter(c => c.status === 'PENDING').length})` : `Completed (${conversations.filter(c => c.status === 'COMPLETED').length})`}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => { setShowConvForm(!showConvForm); setShowPayForm(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold transition">
            <HiOutlinePlus className="w-3.5 h-3.5" /> Conversation
          </button>
          <button type="button" onClick={() => { setShowPayForm(!showPayForm); setShowConvForm(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition">
            <HiOutlinePlus className="w-3.5 h-3.5" /> Payment
          </button>
        </div>
      </div>

      {/* Add Conversation Form */}
      {showConvForm && (
        <form onSubmit={(e) => { e.preventDefault(); addConvMutation.mutate({ clientId, ...convForm }); }}
          className="p-4 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl space-y-3">
          <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">New Conversation</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Date *</label>
              <input type="date" value={convForm.followUpDate}
                onChange={(e) => setConvForm((f) => ({ ...f, followUpDate: e.target.value }))}
                required className={`${inputCls} dark:[color-scheme:dark]`} />
            </div>
            <div>
              <label className={labelCls}>Conference</label>
              <Dropdown value={convForm.conference} onChange={(v) => setConvForm((f) => ({ ...f, conference: v }))}
                options={clientConferences} placeholder="Select conference" />
            </div>
            <div>
              <label className={labelCls}>Topic</label>
              <Dropdown value={convForm.topic} onChange={(v) => setConvForm((f) => ({ ...f, topic: v }))}
                options={clientTopics} placeholder="Select topic" />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <Dropdown value={convForm.outcome} onChange={(v) => setConvForm((f) => ({ ...f, outcome: v }))}
                options={[{ value: '', label: 'Select status' }, ...statusesData.map((s) => ({ value: s.name, label: s.label || s.name }))]}
                placeholder="Select status" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea rows={2} placeholder="What was discussed..."
              value={convForm.notes} onChange={(e) => setConvForm((f) => ({ ...f, notes: e.target.value }))}
              className={`${inputCls} resize-none`} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={addConvMutation.isPending}
              className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-50 transition">
              {addConvMutation.isPending ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => setShowConvForm(false)}
              className="px-4 py-1.5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 rounded-xl text-xs font-medium transition hover:text-gray-900 dark:hover:text-white">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Add Payment Form */}
      {showPayForm && (
        <form onSubmit={(e) => {
          e.preventDefault();
          addPayMutation.mutate({
            clientId,
            ...payForm,
            amountPaid: Number(payForm.amountPaid),
            actualFee: Number(payForm.actualFee),
            discount: Number(payForm.discount),
          });
        }}
          className="p-4 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl space-y-3">
          <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">Add Payment</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Amount Paid *</label>
              <input type="number" placeholder="0" required value={payForm.amountPaid}
                onChange={(e) => setPayForm((f) => ({ ...f, amountPaid: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Actual Fee *</label>
              <input type="number" placeholder="0" required value={payForm.actualFee}
                onChange={(e) => setPayForm((f) => ({ ...f, actualFee: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Discount</label>
              <input type="number" placeholder="0" value={payForm.discount}
                onChange={(e) => setPayForm((f) => ({ ...f, discount: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Payment Mode *</label>
              <Dropdown value={payForm.paymentMode} onChange={(v) => setPayForm((f) => ({ ...f, paymentMode: v }))}
                options={paymentModesData.filter((m) => m.isActive).map((m) => ({ value: m.name, label: m.label || m.name }))}
                placeholder="Select mode" />
            </div>
            <div>
              <label className={labelCls}>Transaction ID</label>
              <input type="text" placeholder="e.g. TXN123456" value={payForm.transactionId}
                onChange={(e) => setPayForm((f) => ({ ...f, transactionId: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={addPayMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-50 transition">
              {addPayMutation.isPending ? 'Saving...' : 'Save Payment'}
            </button>
            <button type="button" onClick={() => setShowPayForm(false)}
              className="px-4 py-1.5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 rounded-xl text-xs font-medium transition hover:text-gray-900 dark:hover:text-white">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Conversations list */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 dark:border-slate-700 border-t-violet-500" />
        </div>
      ) : numberedFiltered.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-slate-600 text-center py-6">No conversations{convFilter !== 'ALL' ? ` with status ${convFilter}` : ''}</p>
      ) : (
        <div className="space-y-2">
          {numberedFiltered.map((c) => {
            const isOverdue = c.status === 'PENDING' && new Date(c.followUpDate) < new Date();
            return (
              <div key={c._id} className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${
                isOverdue
                  ? 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20'
                  : 'bg-gray-50 dark:bg-white/[0.03] border-gray-100 dark:border-white/[0.06]'
              }`}>
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                  c.status === 'COMPLETED' ? 'bg-emerald-500' : isOverdue ? 'bg-red-500' : 'bg-amber-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-gray-800 dark:text-slate-200">
                      {c.conference ? `${c.conference} — ` : ''}Conversation #{c.num}
                    </span>
                    {c.outcome && (
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 font-medium">{c.outcome}</span>
                    )}
                    {c.topic && (
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-medium">{c.topic}</span>
                    )}
                    {isOverdue && <span className="text-xs font-semibold text-red-600 dark:text-red-400">OVERDUE</span>}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{new Date(c.followUpDate).toLocaleString()}</p>
                  {c.notes && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 italic">"{c.notes}"</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-lg font-medium border ${
                    c.status === 'COMPLETED'
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                  }`}>{c.status}</span>
                  {c.status === 'PENDING' && (
                    <button type="button" onClick={() => markCompleteMutation.mutate(c._id)}
                      title="Mark complete"
                      className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg transition">
                      <HiOutlineCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClientsList() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSuperAdmin = user?.roles?.includes('ROLE_SUPER_ADMIN');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', role: '' });
  const [topicFilter, setTopicFilter] = useState('');
  const [conferenceFilter, setConferenceFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const { data: rolesData } = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: () => api.get('/admin/roles').then((r) => r.data),
    staleTime: 5 * 60_000,
  });

  const { data: statusesData } = useQuery({
    queryKey: ['admin', 'statuses'],
    queryFn: () => api.get('/admin/statuses').then((r) => r.data),
    staleTime: 5 * 60_000,
  });
  const { data: confsData = [] } = useQuery({
    queryKey: ['admin', 'conferences'],
    queryFn: () => api.get('/admin/conferences').then((r) => r.data),
    staleTime: 5 * 60_000,
  });
  const { data: sciData = [] } = useQuery({
    queryKey: ['sciinov', 'conferences'],
    queryFn: () => api.get('/sciinov/conferences').then((r) => r.data).catch(() => []),
    staleTime: 10 * 60_000,
  });

  const activeConferences = confsData.filter((c) => c.isActive);
  const allTopics = Array.isArray(sciData) ? sciData : [];

  const { data, isLoading } = useQuery({
    queryKey: ['clients', { page, limit, search, topicFilter, conferenceFilter, ...filters }],
    queryFn: () => {
      const params = { page, limit };
      if (search) params.search = search;
      if (filters.status) params.status = filters.status;
      if (filters.role) params.role = filters.role;
      if (topicFilter) params.topic = topicFilter;
      if (conferenceFilter) params.conference = conferenceFilter;
      return api.get('/clients', { params }).then((r) => r.data);
    },
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/clients/${id}`),
    onSuccess: () => {
      toast.success('Client deleted');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete client'),
  });

  const clients = data?.clients || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };
  const roles = rolesData || [];
  const statuses = statusesData || [];

  const getStatusStyle = (statusName) => {
    const found = statuses.find((s) => s.name === statusName);
    if (!found) return {};
    const hex = resolveColor(found.color);
    return { backgroundColor: hex + '22', color: hex, borderColor: hex + '44' };
  };
  const getStatusLabel = (statusName) => statuses.find((s) => s.name === statusName)?.label || statusName;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Clients</h2>
          <p className="text-gray-400 dark:text-slate-500 text-sm mt-0.5">{pagination.total} total records</p>
        </div>
        <Link to="/clients/new"
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-violet-900/30 transition-all">
          <HiOutlinePlus className="w-4 h-4" /> Add Client
        </Link>
      </div>

      <div className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-sm dark:shadow-none">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative">
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
            <input type="text" placeholder="Search by name or email..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-white/[0.06] border border-gray-300 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 dark:focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all" />
          </div>
          <Dropdown value={filters.status} onChange={(value) => { setFilters((f) => ({ ...f, status: value })); setPage(1); }}
            options={[{ value: '', label: 'All Statuses' }, ...statuses.map((s) => ({ value: s.name, label: s.label || s.name }))]}
            placeholder="Filter by Status" />
          <Dropdown value={filters.role} onChange={(value) => { setFilters((f) => ({ ...f, role: value })); setPage(1); }}
            options={[{ value: '', label: 'All Roles' }, ...roles.map((r) => ({ value: r.name, label: r.label || r.name }))]}
            placeholder="Filter by Role" />
          <Dropdown value={conferenceFilter} onChange={(v) => { setConferenceFilter(v); setPage(1); }}
            options={[{ value: '', label: 'All Conferences' }, ...activeConferences.map((c) => ({ value: c.name, label: c.name }))]}
            placeholder="Filter by Conference" />
          <Dropdown value={topicFilter} onChange={(v) => { setTopicFilter(v); setPage(1); }}
            options={[{ value: '', label: 'All Topics' }, ...allTopics.map((t) => ({ value: t.name || t.title, label: t.name || t.title }))]}
            placeholder="Filter by Topic" />
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 dark:border-slate-700 border-t-violet-500" />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-slate-600">No clients found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-transparent">
                  {['Name', 'Email', 'Role', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                {clients.map((client) => (
                  <tr key={client._id} className="hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {client.fullName?.[0]?.toUpperCase()}
                        </div>
                        <Link
                          to={`/clients/${client._id}`}
                          className="text-sm font-medium text-gray-800 dark:text-slate-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                        >
                          {client.fullName}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{client.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{client.role}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2.5 py-1 rounded-lg font-medium border" style={getStatusStyle(client.status)}>
                        {getStatusLabel(client.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/clients/${client._id}`}
                          title="View full history"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition"
                        >
                          <HiOutlineClipboardList className="w-3.5 h-3.5" />
                          History
                        </Link>
                        <Link to={`/clients/${client._id}/edit`} className="p-1.5 text-gray-400 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition" title="Edit">
                          <HiOutlinePencil className="w-4 h-4" />
                        </Link>
                        {isSuperAdmin && (
                          <button type="button" onClick={() => setDeleteId(client._id)} className="p-1.5 text-gray-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition">
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isSuperAdmin && (
        <ConfirmDialog
          isOpen={Boolean(deleteId)}
          title="Delete Client?"
          message="This will permanently delete the client and all associated data."
          confirmText="Delete"
          cancelText="Cancel"
          isDangerous
          onConfirm={() => deleteMutation.mutate(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {pagination.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-400 dark:text-slate-500">
              Page {pagination.page} of {pagination.pages} · {pagination.total} record{pagination.total !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 dark:text-slate-500">Show</span>
              {[10, 20, 50, 100].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => { setLimit(n); setPage(1); }}
                  className={`px-2 py-1 text-xs rounded-lg border transition font-medium ${
                    limit === n
                      ? 'bg-violet-600 border-violet-600 text-white'
                      : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/[0.08]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1} className={paginationBtnCls}>Previous</button>
            <span className="px-3 py-1.5 text-xs text-gray-400 dark:text-slate-400">{page} / {pagination.pages}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.pages} className={paginationBtnCls}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
