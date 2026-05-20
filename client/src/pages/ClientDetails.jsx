import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePencil, HiOutlinePlus, HiOutlineArrowLeft, HiOutlineCheck } from 'react-icons/hi';
import Dropdown from '../components/Dropdown';

const STATUS_BADGE = {
  REGISTERED: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20',
  PAID: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20',
  DECLINED: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20',
  NEXT_EDITION_INTEREST: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20',
};

const inputCls = 'w-full px-4 py-2.5 bg-gray-100 dark:bg-white/[0.06] border border-gray-300 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 dark:focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all';
const labelCls = 'block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider';

const OUTCOME_OPTIONS = [
  { value: 'Interested', label: 'Interested' },
  { value: 'Not Interested', label: 'Not Interested' },
  { value: 'Callback Requested', label: 'Callback Requested' },
  { value: 'No Response', label: 'No Response' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Declined', label: 'Declined' },
  { value: 'Other', label: 'Other' },
];

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-gray-700 dark:text-slate-200">{value || '—'}</p>
    </div>
  );
}

function ConferenceTimeline({ conferenceName, conversations, onMarkComplete }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-px bg-gray-200 dark:bg-white/[0.06]" />
        <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest px-2 shrink-0">{conferenceName}</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-white/[0.06]" />
      </div>

      <div className="relative pl-6">
        <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-200 dark:bg-white/[0.08]" />

        <div className="space-y-3">
          {conversations.map((c, i) => {
            const isOverdue = c.status === 'PENDING' && new Date(c.followUpDate) < new Date();
            return (
              <div key={c._id} className="relative flex items-start gap-3">
                <div className={`absolute -left-4 top-2.5 w-2.5 h-2.5 rounded-full border-2 shrink-0 ${
                  c.status === 'COMPLETED'
                    ? 'bg-emerald-500 border-emerald-500'
                    : isOverdue
                    ? 'bg-red-500 border-red-500'
                    : 'bg-amber-400 border-amber-400'
                }`} />

                <div className={`flex-1 p-3 rounded-xl border text-sm ${
                  isOverdue
                    ? 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20'
                    : 'bg-gray-50 dark:bg-white/[0.03] border-gray-100 dark:border-white/[0.06]'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800 dark:text-slate-200 text-xs">
                          Conversation #{i + 1}
                        </span>
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
                        {isOverdue && (
                          <span className="text-xs font-semibold text-red-600 dark:text-red-400">OVERDUE</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-slate-500">
                        {new Date(c.followUpDate).toLocaleString()}
                      </p>
                      {c.notes && (
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 italic">"{c.notes}"</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-lg font-medium border ${
                        c.status === 'COMPLETED'
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                          : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                      }`}>
                        {c.status}
                      </span>
                      {c.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => onMarkComplete(c._id)}
                          title="Mark complete"
                          className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg transition"
                        >
                          <HiOutlineCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showConvForm, setShowConvForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amountPaid: '', actualFee: '', discount: '0', paymentMode: '', transactionId: '',
  });
  const [convForm, setConvForm] = useState({
    followUpDate: '', conference: '', topic: '', outcome: '', notes: '',
  });

  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['clients', id],
    queryFn: () => api.get(`/clients/${id}`).then((r) => r.data),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments', 'client', id],
    queryFn: () => api.get(`/payments/client/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['followups', 'client', id],
    queryFn: () => api.get(`/follow-ups/client/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });

  const { data: paymentModesData = [] } = useQuery({
    queryKey: ['admin', 'payment-modes'],
    queryFn: () => api.get('/admin/payment-modes').then((r) => r.data),
    staleTime: 5 * 60_000,
  });

  const addPaymentMutation = useMutation({
    mutationFn: (data) => api.post('/payments', data),
    onSuccess: () => {
      toast.success('Payment added');
      setShowPaymentForm(false);
      setPaymentForm({ amountPaid: '', actualFee: '', discount: '0', paymentMode: '', transactionId: '' });
      queryClient.invalidateQueries({ queryKey: ['payments', 'client', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to add payment'),
  });

  const addConvMutation = useMutation({
    mutationFn: (data) => api.post('/follow-ups', data),
    onSuccess: () => {
      toast.success('Conversation saved');
      setShowConvForm(false);
      setConvForm({ followUpDate: '', conference: '', topic: '', outcome: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['followups', 'client', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to save conversation'),
  });

  const markCompleteMutation = useMutation({
    mutationFn: (fId) => api.put(`/follow-ups/${fId}`, { status: 'COMPLETED' }),
    onSuccess: () => {
      toast.success('Conversation completed');
      queryClient.invalidateQueries({ queryKey: ['followups', 'client', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => toast.error('Failed to update'),
  });

  const handleAddPayment = (e) => {
    e.preventDefault();
    addPaymentMutation.mutate({
      clientId: id, ...paymentForm,
      amountPaid: Number(paymentForm.amountPaid),
      actualFee: Number(paymentForm.actualFee),
      discount: Number(paymentForm.discount),
    });
  };

  const handleAddConv = (e) => {
    e.preventDefault();
    addConvMutation.mutate({ clientId: id, ...convForm });
  };

  if (clientLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 dark:border-slate-700 border-t-violet-500" />
      </div>
    );
  }

  if (!client) return <p className="text-gray-400 dark:text-slate-500">Client not found</p>;

  const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);

  // Group conversations by conference, sorted by date within each group
  const conferenceGroups = {};
  [...conversations]
    .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate))
    .forEach((c) => {
      const key = c.conference || 'General';
      if (!conferenceGroups[key]) conferenceGroups[key] = [];
      conferenceGroups[key].push(c);
    });

  // Client's conference names for dropdown
  const clientConferences = (client.conferenceNames || []).map((c) => ({ value: c, label: c }));
  const clientTopics = (client.topics || []).map((t) => ({ value: t, label: t }));

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/clients')}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition shrink-0"
        >
          <HiOutlineArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-wrap items-center justify-between gap-4 flex-1">
          <div className="flex items-center gap-4">
            {client.profileImage ? (
              <img src={client.profileImage} alt={client.fullName}
                className="w-14 h-14 rounded-2xl object-cover border border-gray-200 dark:border-white/10" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                {client.fullName?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{client.fullName}</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">{client.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-3 py-1.5 rounded-xl font-medium ${STATUS_BADGE[client.status] || 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-slate-400'}`}>
              {client.status}
            </span>
            <Link
              to={`/clients/${id}/edit`}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.08] rounded-xl text-sm font-medium transition"
            >
              <HiOutlinePencil className="w-4 h-4" /> Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Client Info */}
      <div className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm dark:shadow-none">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Client Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Info label="Phone" value={client.phone} />
          <Info label="Organization" value={client.organization} />
          <Info label="Country" value={client.country} />
          <Info label="Role" value={client.role} />
          <Info label="Created" value={new Date(client.createdAt).toLocaleDateString()} />
          {client.conferenceNames?.length > 0 && (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Conferences</p>
              <div className="flex flex-wrap gap-2">
                {client.conferenceNames.map((c) => (
                  <span key={c} className="text-xs px-2.5 py-1 rounded-lg bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 font-medium">{c}</span>
                ))}
              </div>
            </div>
          )}
          {client.topics?.length > 0 && (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Topics</p>
              <div className="flex flex-wrap gap-2">
                {client.topics.map((t) => (
                  <span key={t} className="text-xs px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-medium">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Conversations + Payments */}
      <div className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm dark:shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Conversation History</h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              {payments.length > 0 && ` · $${totalPaid.toLocaleString()} paid`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setShowConvForm(!showConvForm); setShowPaymentForm(false); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold transition"
            >
              <HiOutlinePlus className="w-3.5 h-3.5" /> Conversation
            </button>
            <button
              type="button"
              onClick={() => { setShowPaymentForm(!showPaymentForm); setShowConvForm(false); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition"
            >
              <HiOutlinePlus className="w-3.5 h-3.5" /> Payment
            </button>
          </div>
        </div>

        {showConvForm && (
          <form onSubmit={handleAddConv} className="mb-6 p-4 bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] rounded-xl space-y-3">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">New Conversation</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Date & Time *</label>
                <input type="datetime-local" value={convForm.followUpDate}
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
                <label className={labelCls}>Outcome</label>
                <Dropdown value={convForm.outcome} onChange={(v) => setConvForm((f) => ({ ...f, outcome: v }))}
                  options={OUTCOME_OPTIONS} placeholder="Select outcome" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <textarea rows={2} placeholder="What was discussed..." value={convForm.notes}
                onChange={(e) => setConvForm((f) => ({ ...f, notes: e.target.value }))}
                className={`${inputCls} resize-none`} />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={addConvMutation.isPending}
                className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-50">
                {addConvMutation.isPending ? 'Saving...' : 'Save Conversation'}
              </button>
              <button type="button" onClick={() => setShowConvForm(false)}
                className="px-4 py-2 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-xl text-xs font-medium transition">
                Cancel
              </button>
            </div>
          </form>
        )}

        {showPaymentForm && (
          <form onSubmit={handleAddPayment} className="mb-6 p-4 bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] rounded-xl space-y-3">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">Add Payment</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Amount Paid *</label>
                <input type="number" placeholder="0" value={paymentForm.amountPaid}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, amountPaid: e.target.value }))}
                  required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Actual Fee *</label>
                <input type="number" placeholder="0" value={paymentForm.actualFee}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, actualFee: e.target.value }))}
                  required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Discount</label>
                <input type="number" placeholder="0" value={paymentForm.discount}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, discount: e.target.value }))}
                  className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Payment Mode *</label>
                <Dropdown value={paymentForm.paymentMode}
                  onChange={(v) => setPaymentForm((f) => ({ ...f, paymentMode: v }))}
                  options={paymentModesData.filter((m) => m.isActive).map((m) => ({ value: m.name, label: m.label || m.name }))}
                  placeholder="Select mode" />
              </div>
              <div>
                <label className={labelCls}>Transaction ID</label>
                <input type="text" placeholder="e.g. TXN123456" value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, transactionId: e.target.value }))}
                  className={inputCls} />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={addPaymentMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-50">
                {addPaymentMutation.isPending ? 'Saving...' : 'Save Payment'}
              </button>
              <button type="button" onClick={() => setShowPaymentForm(false)}
                className="px-4 py-2 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-xl text-xs font-medium transition">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Payments summary */}
        {payments.length > 0 && (
          <div className="mb-5 space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Payments</p>
            {payments.map((p) => (
              <div key={p._id} className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-xl text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">$${p.amountPaid.toLocaleString()}</span>
                  <span className="text-xs text-gray-500 dark:text-slate-500 bg-gray-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-lg">{p.paymentMode}</span>
                  {p.transactionId && <span className="text-xs text-gray-400 dark:text-slate-600">#{p.transactionId}</span>}
                </div>
                <span className="text-xs text-gray-400 dark:text-slate-500">{new Date(p.paymentDate).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}

        {/* Conversation timeline */}
        {conversations.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-slate-600 py-4 text-center">No conversations yet.</p>
        ) : (
          Object.entries(conferenceGroups).map(([conf, items]) => (
            <ConferenceTimeline
              key={conf}
              conferenceName={conf}
              conversations={items}
              onMarkComplete={(fId) => markCompleteMutation.mutate(fId)}
            />
          ))
        )}
      </div>
    </div>
  );
}
