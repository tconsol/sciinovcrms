import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import Dropdown from '../components/Dropdown';
import ConfirmDialog from '../components/ConfirmDialog';
import { HiOutlineSearch, HiOutlineX } from 'react-icons/hi';

const paginationBtnCls = 'px-3 py-1.5 text-xs border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-500 dark:text-slate-400 rounded-lg disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white transition';

const OUTCOME_OPTIONS = [
  { value: '', label: 'All Outcomes' },
  { value: 'Interested', label: 'Interested' },
  { value: 'Not Interested', label: 'Not Interested' },
  { value: 'Callback Requested', label: 'Callback Requested' },
  { value: 'No Response', label: 'No Response' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Declined', label: 'Declined' },
  { value: 'Other', label: 'Other' },
];

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function ConversationModal({ conversation: c, onClose }) {
  if (!c) return null;
  const isOverdue = c.status === 'PENDING' && new Date(c.followUpDate) < new Date();

  return createPortal(
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Conversation Details</h3>
          <button type="button" onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 dark:text-slate-500 transition">
            <HiOutlineX className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Client</p>
              {c.clientId ? (
                <Link to={`/clients/${c.clientId._id}`} onClick={onClose}
                  className="text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline">
                  {c.clientId.fullName}
                </Link>
              ) : <p className="text-sm text-gray-700 dark:text-slate-200">—</p>}
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Date</p>
              <p className={`text-sm font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-slate-200'}`}>
                {new Date(c.followUpDate).toLocaleString()}
                {isOverdue && <span className="ml-1.5 text-xs bg-red-100 dark:bg-red-500/10 px-1.5 py-0.5 rounded font-semibold">OVERDUE</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Conference</p>
              {c.conference
                ? <span className="text-xs px-2 py-1 rounded-lg bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 font-medium">{c.conference}</span>
                : <p className="text-sm text-gray-400 dark:text-slate-500">—</p>}
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Topic</p>
              {c.topic
                ? <span className="text-xs px-2 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-medium">{c.topic}</span>
                : <p className="text-sm text-gray-400 dark:text-slate-500">—</p>}
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Outcome</p>
              {c.outcome
                ? <span className="text-xs px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-medium">{c.outcome}</span>
                : <p className="text-sm text-gray-400 dark:text-slate-500">—</p>}
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Status</p>
              <span className={`text-xs px-2 py-1 rounded-lg font-medium border ${
                c.status === 'COMPLETED'
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
              }`}>{c.status}</span>
            </div>
          </div>

          {c.notes && (
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-gray-700 dark:text-slate-200 bg-gray-50 dark:bg-white/[0.04] rounded-xl px-3 py-2.5 italic">"{c.notes}"</p>
            </div>
          )}

          <p className="text-xs text-gray-400 dark:text-slate-500">
            Created {new Date(c.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Conversations() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [conferenceFilter, setConferenceFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [showOverdue, setShowOverdue] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedConv, setSelectedConv] = useState(null);

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
  const topics = Array.isArray(sciData) ? sciData : [];

  const { data, isLoading } = useQuery({
    queryKey: ['followups', { page, search, statusFilter, conferenceFilter, topicFilter, outcomeFilter, showOverdue }],
    queryFn: () => {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (conferenceFilter) params.conference = conferenceFilter;
      if (topicFilter) params.topic = topicFilter;
      if (outcomeFilter) params.outcome = outcomeFilter;
      if (showOverdue) params.overdue = 'true';
      return api.get('/follow-ups', { params }).then((r) => r.data);
    },
    placeholderData: keepPreviousData,
  });

  const markCompleteMutation = useMutation({
    mutationFn: (id) => api.put(`/follow-ups/${id}`, { status: 'COMPLETED' }),
    onSuccess: () => {
      toast.success('Conversation completed');
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => toast.error('Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/follow-ups/${id}`),
    onSuccess: () => {
      toast.success('Conversation deleted');
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete'),
  });

  const conversations = data?.followUps || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };
  const hasActiveFilter = search || statusFilter || conferenceFilter || topicFilter || outcomeFilter || showOverdue;

  const resetFilters = () => {
    setSearch(''); setStatusFilter(''); setConferenceFilter('');
    setTopicFilter(''); setOutcomeFilter(''); setShowOverdue(false); setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Conversations</h2>
          <p className="text-gray-400 dark:text-slate-500 text-sm mt-0.5">{pagination.total} total records</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-sm dark:shadow-none">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative">
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
            <input type="text" placeholder="Search by client name..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-white/[0.06] border border-gray-300 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 dark:focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all" />
          </div>
          <Dropdown value={conferenceFilter} onChange={(v) => { setConferenceFilter(v); setPage(1); }}
            options={[{ value: '', label: 'All Conferences' }, ...activeConferences.map((c) => ({ value: c.name, label: c.name }))]}
            placeholder="Filter by Conference" />
          <Dropdown value={topicFilter} onChange={(v) => { setTopicFilter(v); setPage(1); }}
            options={[{ value: '', label: 'All Topics' }, ...topics.map((t) => ({ value: t.name || t.title, label: t.name || t.title }))]}
            placeholder="Filter by Topic" />
          <Dropdown value={outcomeFilter} onChange={(v) => { setOutcomeFilter(v); setPage(1); }}
            options={OUTCOME_OPTIONS} placeholder="Filter by Outcome" />
          <Dropdown value={statusFilter} onChange={(v) => { setStatusFilter(v); if (v) setShowOverdue(false); setPage(1); }}
            options={[{ value: '', label: 'All Statuses' }, { value: 'PENDING', label: 'Pending' }, { value: 'COMPLETED', label: 'Completed' }]}
            placeholder="Filter by Status" />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <div className="relative">
                <input type="checkbox" checked={showOverdue}
                  onChange={(e) => { setShowOverdue(e.target.checked); if (e.target.checked) setStatusFilter(''); setPage(1); }}
                  className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 dark:bg-white/[0.1] border border-gray-300 dark:border-white/10 rounded-full peer-checked:bg-red-600 peer-checked:border-red-600 transition-all" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-4" />
              </div>
              <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">Overdue only</span>
            </label>
            {hasActiveFilter && (
              <button type="button" onClick={resetFilters}
                className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium transition">
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 dark:border-slate-700 border-t-violet-500" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-slate-600">No conversations found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-transparent">
                  {['Client', 'Date', 'Conference', 'Topic', 'Outcome', 'Notes', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                {conversations.map((f) => {
                  const isOverdue = f.status === 'PENDING' && new Date(f.followUpDate) < new Date();
                  return (
                    <tr
                      key={f._id}
                      onClick={() => setSelectedConv(f)}
                      className={`cursor-pointer transition-colors ${isOverdue ? 'bg-red-50 dark:bg-red-500/[0.04]' : 'hover:bg-violet-50/50 dark:hover:bg-violet-500/[0.04]'}`}
                    >
                      <td className="px-3 py-2.5 text-xs">
                        {f.clientId ? (
                          <span
                            className="font-semibold text-violet-600 dark:text-violet-400"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link to={`/clients/${f.clientId._id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                              {f.clientId.fullName}
                            </Link>
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                        <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-slate-300'}>
                          {new Date(f.followUpDate).toLocaleString()}
                        </span>
                        {isOverdue && (
                          <span className="ml-1.5 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10 px-1 py-0.5 rounded">OD</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 max-w-[110px]">
                        {f.conference
                          ? <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 font-medium block truncate">{f.conference}</span>
                          : <span className="text-xs text-gray-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="px-3 py-2.5 max-w-[110px]">
                        {f.topic
                          ? <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-medium block truncate">{f.topic}</span>
                          : <span className="text-xs text-gray-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {f.outcome
                          ? <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-medium">{f.outcome}</span>
                          : <span className="text-xs text-gray-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-400 dark:text-slate-500 max-w-[140px] truncate">{f.notes || '—'}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                          f.status === 'COMPLETED'
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                            : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                        }`}>{f.status}</span>
                      </td>
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedConv(f); }}
                            className="text-[10px] px-2 py-0.5 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20 rounded-md hover:bg-violet-100 dark:hover:bg-violet-500/20 transition font-semibold whitespace-nowrap">
                            View
                          </button>
                          {f.status === 'PENDING' && (
                            <button type="button" onClick={() => markCompleteMutation.mutate(f._id)}
                              className="text-[10px] px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition font-semibold whitespace-nowrap">
                              Complete
                            </button>
                          )}
                          <button type="button" onClick={() => setDeleteId(f._id)}
                            className="text-[10px] px-2 py-0.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-md hover:bg-red-100 dark:hover:bg-red-500/20 transition font-semibold">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConversationModal conversation={selectedConv} onClose={() => setSelectedConv(null)} />

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Delete Conversation?"
        message="This conversation will be permanently removed."
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-slate-500">Page {pagination.page} of {pagination.pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1} className={paginationBtnCls}>Previous</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.pages} className={paginationBtnCls}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
