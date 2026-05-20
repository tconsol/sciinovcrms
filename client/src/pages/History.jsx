import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../services/api';
import Dropdown from '../components/Dropdown';
import { HiOutlineSearch, HiOutlinePlus, HiOutlineX } from 'react-icons/hi';

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

const OUTCOME_FORM_OPTIONS = OUTCOME_OPTIONS.slice(1);

const paginationBtnCls =
  'px-3 py-1.5 text-xs border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-500 dark:text-slate-400 rounded-lg disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white transition';

const inputCls =
  'w-full px-3 py-2 bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 dark:focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all';

const labelCls = 'block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1';

const emptyConvForm = () => ({
  followUpDate: new Date().toISOString().slice(0, 16),
  conference: '',
  topic: '',
  outcome: '',
  notes: '',
  status: 'PENDING',
});

const emptyPayForm = () => ({
  amountPaid: '0',
  actualFee: '0',
  discount: '0',
  paymentMode: '',
  transactionId: '',
});

export default function History() {
  const [searchParams] = useSearchParams();
  const clientParam = searchParams.get('client') || '';
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(() => clientParam);
  const [statusFilter, setStatusFilter] = useState('');
  const [conferenceFilter, setConferenceFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');

  const [panel, setPanel] = useState(null); // 'conv' | 'pay' | null
  const [convForm, setConvForm] = useState(emptyConvForm);
  const [payForm, setPayForm] = useState(emptyPayForm);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const p = searchParams.get('client');
    if (p) setSearch(p);
  }, [searchParams]);

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
  const { data: paymentModesData = [] } = useQuery({
    queryKey: ['admin', 'payment-modes'],
    queryFn: () => api.get('/admin/payment-modes').then((r) => r.data),
    staleTime: 5 * 60_000,
  });

  // Fetch target client when URL has ?client= param
  const { data: clientSearchData } = useQuery({
    queryKey: ['clients', 'search', clientParam],
    queryFn: () => api.get('/clients', { params: { search: clientParam, limit: 1 } }).then((r) => r.data),
    enabled: !!clientParam,
    staleTime: 2 * 60_000,
  });
  const targetClient = clientSearchData?.clients?.[0] || null;

  const activeConferences = confsData.filter((c) => c.isActive);
  const topics = Array.isArray(sciData) ? sciData : [];
  const activePaymentModes = paymentModesData.filter((m) => m.isActive);

  // Client-specific conference/topic options (from targetClient or global)
  const clientConferences = targetClient?.conferenceNames?.length
    ? targetClient.conferenceNames
    : activeConferences.map((c) => c.name);
  const clientTopics = targetClient?.topics?.length
    ? targetClient.topics
    : topics.map((t) => t.name || t.title);

  const { data, isLoading } = useQuery({
    queryKey: ['followups', 'history', { page, search, statusFilter, conferenceFilter, topicFilter, outcomeFilter }],
    queryFn: () => {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (conferenceFilter) params.conference = conferenceFilter;
      if (topicFilter) params.topic = topicFilter;
      if (outcomeFilter) params.outcome = outcomeFilter;
      return api.get('/follow-ups', { params }).then((r) => r.data);
    },
    placeholderData: keepPreviousData,
  });

  const conversations = data?.followUps || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  const invalidateConvs = () => qc.invalidateQueries({ queryKey: ['followups'] });
  const invalidatePays = () => qc.invalidateQueries({ queryKey: ['payments'] });

  const addConvMutation = useMutation({
    mutationFn: (body) => api.post('/follow-ups', body).then((r) => r.data),
    onSuccess: () => {
      invalidateConvs();
      setConvForm(emptyConvForm);
      setPanel(null);
      setFormError('');
    },
    onError: (e) => setFormError(e?.response?.data?.message || 'Failed to add conversation'),
  });

  const addPayMutation = useMutation({
    mutationFn: (body) => api.post('/payments', body).then((r) => r.data),
    onSuccess: () => {
      invalidatePays();
      setPayForm(emptyPayForm);
      setPanel(null);
      setFormError('');
    },
    onError: (e) => setFormError(e?.response?.data?.message || 'Failed to add payment'),
  });

  const handleConvSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!convForm.followUpDate || !convForm.conference || !convForm.topic || !convForm.outcome) {
      return setFormError('Date, conference, topic, and outcome are required');
    }
    addConvMutation.mutate({ ...convForm, clientId: targetClient._id });
  };

  const handlePaySubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!payForm.amountPaid || !payForm.actualFee || !payForm.paymentMode) {
      return setFormError('Amount paid, actual fee, and payment mode are required');
    }
    addPayMutation.mutate({ ...payForm, clientId: targetClient._id });
  };

  const togglePanel = (p) => {
    setPanel((prev) => (prev === p ? null : p));
    setFormError('');
    setConvForm(emptyConvForm);
    setPayForm(emptyPayForm);
  };

  const hasActiveFilter = search || statusFilter || conferenceFilter || topicFilter || outcomeFilter;
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setConferenceFilter('');
    setTopicFilter('');
    setOutcomeFilter('');
    setPage(1);
  };

  // Group by conference
  const groups = {};
  conversations.forEach((c) => {
    const key = c.conference || 'General';
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  });
  Object.values(groups).forEach((arr) =>
    arr.sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate))
  );

  const withNumbers = (items) => {
    const clientIdx = {};
    return items.map((c) => {
      const key = `${c.clientId?._id}-${c.conference || 'General'}`;
      clientIdx[key] = (clientIdx[key] || 0) + 1;
      return { ...c, num: clientIdx[key] };
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {targetClient ? `${targetClient.fullName}'s History` : 'History'}
          </h2>
          <p className="text-gray-400 dark:text-slate-500 text-sm mt-0.5">
            {pagination.total} total conversation{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>

        {targetClient && (
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => togglePanel('conv')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition shadow-sm ${
                panel === 'conv'
                  ? 'bg-violet-700 border-violet-700 text-white shadow-violet-900/30'
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 border-transparent text-white hover:opacity-90 shadow-violet-900/20'
              }`}
            >
              {panel === 'conv' ? <HiOutlineX className="w-3.5 h-3.5" /> : <HiOutlinePlus className="w-3.5 h-3.5" />}
              Conversation
            </button>
            <button
              type="button"
              onClick={() => togglePanel('pay')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition shadow-sm ${
                panel === 'pay'
                  ? 'bg-emerald-700 border-emerald-700 text-white shadow-emerald-900/30'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 border-transparent text-white hover:opacity-90 shadow-emerald-900/20'
              }`}
            >
              {panel === 'pay' ? <HiOutlineX className="w-3.5 h-3.5" /> : <HiOutlinePlus className="w-3.5 h-3.5" />}
              Payment
            </button>
          </div>
        )}
      </div>

      {/* Add Conversation Form */}
      {panel === 'conv' && targetClient && (
        <div className="bg-white dark:bg-white/[0.04] border border-violet-200 dark:border-violet-500/30 rounded-2xl p-5 shadow-sm dark:shadow-none">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
            New Conversation — {targetClient.fullName}
          </h3>
          <form onSubmit={handleConvSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Date & Time *</label>
              <input
                type="datetime-local"
                value={convForm.followUpDate}
                onChange={(e) => setConvForm((f) => ({ ...f, followUpDate: e.target.value }))}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Conference *</label>
              <Dropdown
                value={convForm.conference}
                onChange={(v) => setConvForm((f) => ({ ...f, conference: v }))}
                options={[
                  { value: '', label: 'Select conference' },
                  ...clientConferences.map((c) => ({ value: c, label: c })),
                ]}
                placeholder="Select conference"
              />
            </div>
            <div>
              <label className={labelCls}>Topic *</label>
              <Dropdown
                value={convForm.topic}
                onChange={(v) => setConvForm((f) => ({ ...f, topic: v }))}
                options={[
                  { value: '', label: 'Select topic' },
                  ...clientTopics.map((t) => ({ value: t, label: t })),
                ]}
                placeholder="Select topic"
              />
            </div>
            <div>
              <label className={labelCls}>Outcome *</label>
              <Dropdown
                value={convForm.outcome}
                onChange={(v) => setConvForm((f) => ({ ...f, outcome: v }))}
                options={[
                  { value: '', label: 'Select outcome' },
                  ...OUTCOME_FORM_OPTIONS,
                ]}
                placeholder="Select outcome"
              />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <Dropdown
                value={convForm.status}
                onChange={(v) => setConvForm((f) => ({ ...f, status: v }))}
                options={[
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'COMPLETED', label: 'Completed' },
                ]}
                placeholder="Select status"
              />
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <input
                type="text"
                value={convForm.notes}
                onChange={(e) => setConvForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes..."
                className={inputCls}
              />
            </div>
            {formError && (
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-xs text-red-600 dark:text-red-400">{formError}</p>
              </div>
            )}
            <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
              <button
                type="submit"
                disabled={addConvMutation.isPending}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition"
              >
                {addConvMutation.isPending ? 'Saving...' : 'Save Conversation'}
              </button>
              <button
                type="button"
                onClick={() => togglePanel(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-slate-300 text-xs font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Payment Form */}
      {panel === 'pay' && targetClient && (
        <div className="bg-white dark:bg-white/[0.04] border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-5 shadow-sm dark:shadow-none">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
            New Payment — {targetClient.fullName}
          </h3>
          <form onSubmit={handlePaySubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Actual Fee ($) *</label>
              <input
                type="number"
                min="0"
                value={payForm.actualFee}
                onWheel={(e) => e.target.blur()}
                onChange={(e) => {
                  const actualFee = e.target.value;
                  setPayForm((f) => {
                    const fee = parseFloat(actualFee) || 0;
                    const paid = parseFloat(f.amountPaid);
                    const disc = parseFloat(f.discount) || 0;
                    if (!isNaN(paid)) return { ...f, actualFee, discount: String(Math.max(0, fee - paid)) };
                    return { ...f, actualFee, amountPaid: String(Math.max(0, fee - disc)) };
                  });
                }}
                placeholder="0"
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Discount ($)</label>
              <input
                type="number"
                min="0"
                value={payForm.discount}
                onWheel={(e) => e.target.blur()}
                onChange={(e) => {
                  const discount = e.target.value;
                  setPayForm((f) => {
                    const fee = parseFloat(f.actualFee) || 0;
                    const disc = parseFloat(discount) || 0;
                    return { ...f, discount, amountPaid: String(Math.max(0, fee - disc)) };
                  });
                }}
                placeholder="0"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Amount Paid ($) *</label>
              <input
                type="number"
                min="0"
                value={payForm.amountPaid}
                onWheel={(e) => e.target.blur()}
                onChange={(e) => {
                  const amountPaid = e.target.value;
                  setPayForm((f) => {
                    const fee = parseFloat(f.actualFee) || 0;
                    const paid = parseFloat(amountPaid) || 0;
                    return { ...f, amountPaid, discount: String(Math.max(0, fee - paid)) };
                  });
                }}
                placeholder="0"
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Payment Mode *</label>
              <Dropdown
                value={payForm.paymentMode}
                onChange={(v) => setPayForm((f) => ({ ...f, paymentMode: v }))}
                options={[
                  { value: '', label: 'Select mode' },
                  ...activePaymentModes.map((m) => ({ value: m.name, label: m.label || m.name })),
                ]}
                placeholder="Select mode"
              />
            </div>
            <div>
              <label className={labelCls}>Transaction ID</label>
              <input
                type="text"
                value={payForm.transactionId}
                onChange={(e) => setPayForm((f) => ({ ...f, transactionId: e.target.value }))}
                placeholder="Optional"
                className={inputCls}
              />
            </div>
            {formError && (
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-xs text-red-600 dark:text-red-400">{formError}</p>
              </div>
            )}
            <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
              <button
                type="submit"
                disabled={addPayMutation.isPending}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition"
              >
                {addPayMutation.isPending ? 'Saving...' : 'Save Payment'}
              </button>
              <button
                type="button"
                onClick={() => togglePanel(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-slate-300 text-xs font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-sm dark:shadow-none">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative">
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by client name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-white/[0.06] border border-gray-300 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 dark:focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
          </div>
          <Dropdown
            value={conferenceFilter}
            onChange={(v) => { setConferenceFilter(v); setPage(1); }}
            options={[
              { value: '', label: 'All Conferences' },
              ...activeConferences.map((c) => ({ value: c.name, label: c.name })),
            ]}
            placeholder="Filter by Conference"
          />
          <Dropdown
            value={topicFilter}
            onChange={(v) => { setTopicFilter(v); setPage(1); }}
            options={[
              { value: '', label: 'All Topics' },
              ...topics.map((t) => ({ value: t.name || t.title, label: t.name || t.title })),
            ]}
            placeholder="Filter by Topic"
          />
          <Dropdown
            value={outcomeFilter}
            onChange={(v) => { setOutcomeFilter(v); setPage(1); }}
            options={OUTCOME_OPTIONS}
            placeholder="Filter by Outcome"
          />
          <Dropdown
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'COMPLETED', label: 'Completed' },
            ]}
            placeholder="Filter by Status"
          />
          {hasActiveFilter && (
            <div className="flex items-center">
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium transition"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 dark:border-slate-700 border-t-violet-500" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl p-16 text-center shadow-sm dark:shadow-none">
          <p className="text-gray-400 dark:text-slate-600">No conversations found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([conferenceName, items]) => {
            const numbered = withNumbers(items);
            return (
              <div
                key={conferenceName}
                className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm dark:shadow-none overflow-hidden"
              >
                <div className="px-5 py-3 border-b border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-white/[0.08]" />
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest shrink-0">
                    {conferenceName}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-white/[0.08]" />
                  <span className="text-xs text-gray-400 dark:text-slate-500 shrink-0">
                    {items.length} conversation{items.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="p-4 space-y-0">
                  <div className="relative pl-6">
                    <div className="absolute left-2.5 top-3 bottom-3 w-px bg-gray-200 dark:bg-white/[0.08]" />
                    <div className="space-y-3">
                      {numbered.map((c) => {
                        const isOverdue =
                          c.status === 'PENDING' && new Date(c.followUpDate) < new Date();
                        return (
                          <div key={c._id} className="relative flex items-start gap-4">
                            <div
                              className={`absolute -left-4 top-3 w-2.5 h-2.5 rounded-full border-2 shrink-0 ${
                                c.status === 'COMPLETED'
                                  ? 'bg-emerald-500 border-emerald-500'
                                  : isOverdue
                                  ? 'bg-red-500 border-red-500'
                                  : 'bg-amber-400 border-amber-400'
                              }`}
                            />
                            <div
                              className={`flex-1 p-3.5 rounded-xl border ${
                                isOverdue
                                  ? 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20'
                                  : 'bg-gray-50 dark:bg-white/[0.03] border-gray-100 dark:border-white/[0.06]'
                              }`}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    {c.clientId ? (
                                      <Link
                                        to={`/clients/${c.clientId._id}`}
                                        className="text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition"
                                      >
                                        {c.clientId.fullName}
                                      </Link>
                                    ) : (
                                      <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                                        Unknown
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-400 dark:text-slate-500">·</span>
                                    <span className="text-xs text-gray-500 dark:text-slate-400">
                                      Conversation{' '}
                                      <span className="font-bold text-violet-600 dark:text-violet-400">#{c.num}</span>
                                    </span>
                                    {isOverdue && (
                                      <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10 px-1.5 py-0.5 rounded">
                                        OVERDUE
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                                    {c.outcome && (
                                      <span className="text-xs px-2 py-0.5 rounded-lg bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 font-medium">
                                        {c.outcome}
                                      </span>
                                    )}
                                    {c.topic && (
                                      <span className="text-xs px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-medium">
                                        {c.topic}
                                      </span>
                                    )}
                                    {c.clientId?.role && (
                                      <span className="text-xs px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-slate-400 font-medium">
                                        {c.clientId.role}
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-xs text-gray-400 dark:text-slate-500">
                                    {new Date(c.followUpDate).toLocaleString()}
                                  </p>

                                  {c.notes && (
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 italic">
                                      "{c.notes}"
                                    </p>
                                  )}
                                </div>

                                <span
                                  className={`text-xs px-2.5 py-1 rounded-lg font-medium border shrink-0 ${
                                    c.status === 'COMPLETED'
                                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                                      : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                                  }`}
                                >
                                  {c.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-slate-500">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              className={paginationBtnCls}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pagination.pages}
              className={paginationBtnCls}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
