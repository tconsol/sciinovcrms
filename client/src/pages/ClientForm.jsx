import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import Dropdown from '../components/Dropdown';
import MultiSelect from '../components/MultiSelect';
import ConfirmDialog from '../components/ConfirmDialog';
import CountrySelect from '../components/CountrySelect';
import { HiOutlineArrowLeft } from 'react-icons/hi';

const inputCls = 'w-full px-4 py-2.5 bg-gray-100 dark:bg-white/[0.06] border border-gray-300 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 dark:focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all';
const labelCls = 'block text-xs font-medium text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wider';

export default function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', organization: '', country: '',
    role: '', topics: [], status: '', conferenceNames: [], conversationVia: '', notes: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    amountPaid: '0', actualFee: '0', discount: '0', paymentMode: '', transactionId: '',
  });

  const { data: rolesData = [] } = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: () => api.get('/admin/roles').then((r) => r.data),
    staleTime: 5 * 60_000,
  });
  const { data: statusesData = [] } = useQuery({
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
  const { data: paymentModesData = [] } = useQuery({
    queryKey: ['admin', 'payment-modes'],
    queryFn: () => api.get('/admin/payment-modes').then((r) => r.data),
    staleTime: 5 * 60_000,
  });
  const { data: conversationViaData = [] } = useQuery({
    queryKey: ['admin', 'conversation-via'],
    queryFn: () => api.get('/admin/conversation-via').then((r) => r.data),
    staleTime: 5 * 60_000,
  });

  const roles = rolesData.filter((r) => r.isActive);
  const statuses = statusesData.filter((s) => s.isActive);
  const conferences = confsData.filter((c) => c.isActive);
  const sciinovConferences = Array.isArray(sciData) ? sciData : [];

  const { data: clientData, isLoading: loading } = useQuery({
    queryKey: ['clients', id],
    queryFn: () => api.get(`/clients/${id}`).then((r) => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (clientData) {
      setForm({
        fullName: clientData.fullName || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        organization: clientData.organization || '',
        country: clientData.country || '',
        role: clientData.role || '',
        topics: Array.isArray(clientData.topics) ? clientData.topics : (clientData.topic ? [clientData.topic] : []),
        status: clientData.status || '',
        conferenceNames: Array.isArray(clientData.conferenceNames) ? clientData.conferenceNames : (clientData.conferenceName ? [clientData.conferenceName] : []),
        conversationVia: clientData.conversationVia || '',
        notes: clientData.notes || '',
      });
    }
  }, [clientData]);

  useEffect(() => {
    if (isEdit) return;
    setForm((prev) => ({
      ...prev,
      role: prev.role || roles[0]?.name || '',
      status: prev.status || statuses[0]?.name || '',
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles[0]?.name, statuses[0]?.name, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirm(false);
    setSaving(true);
    try {
      const formData = new FormData();
      const { topics, conferenceNames, ...rest } = form;
      Object.entries(rest).forEach(([key, val]) => { if (val) formData.append(key, val); });
      topics.forEach((t) => formData.append('topics[]', t));
      conferenceNames.forEach((c) => formData.append('conferenceNames[]', c));
      if (imageFile) formData.append('profileImage', imageFile);

      let savedClient;
      if (isEdit) {
        const res = await api.put(`/clients/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        savedClient = res.data;
        toast.success('Client updated');
      } else {
        const res = await api.post('/clients', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        savedClient = res.data;
        toast.success('Client created');
      }

      // If status is PAID and payment data provided, create payment record
      if (form.status === 'PAID' && paymentForm.amountPaid && paymentForm.actualFee && paymentForm.paymentMode) {
        try {
          await api.post('/payments', {
            clientId: savedClient._id,
            amountPaid: Number(paymentForm.amountPaid),
            actualFee: Number(paymentForm.actualFee),
            discount: Number(paymentForm.discount || 0),
            paymentMode: paymentForm.paymentMode,
            transactionId: paymentForm.transactionId,
          });
        } catch {
          toast.error('Client saved but payment failed — add it manually from client page');
        }
      }

      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/clients');
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || 'Failed to save client';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 dark:border-slate-700 border-t-violet-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => navigate('/clients')}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition">
          <HiOutlineArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{isEdit ? 'Edit Client' : 'Add New Client'}</h2>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{isEdit ? 'Update client information' : 'Fill in the details below'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl p-6 space-y-5 shadow-sm dark:shadow-none">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Full Name *</label>
            <input name="fullName" value={form.fullName} onChange={handleChange} required placeholder="John Doe" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email *</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="john@example.com" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Organization</label>
            <input name="organization" value={form.organization} onChange={handleChange} placeholder="Company name" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Country</label>
            <CountrySelect
              value={form.country}
              onChange={(val) => setForm((prev) => ({ ...prev, country: val }))}
            />
          </div>
          <div>
            <label className={labelCls}>Role *</label>
            <Dropdown value={form.role}
              onChange={(value) => setForm((prev) => ({ ...prev, role: value }))}
              options={roles.map((r) => ({ value: r.name, label: r.label || r.name }))}
              placeholder="Select Role" />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <Dropdown value={form.status}
              onChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
              options={statuses.map((s) => ({ value: s.name, label: s.label || s.name }))}
              placeholder="Select Status" />
          </div>
          <div>
            <label className={labelCls}>Conversation Via</label>
            <Dropdown value={form.conversationVia}
              onChange={(value) => setForm((prev) => ({ ...prev, conversationVia: value }))}
              options={[{ value: '', label: 'Select...' }, ...conversationViaData.filter((v) => v.isActive).map((v) => ({ value: v.name, label: v.label || v.name }))]}
              placeholder="Select Channel" />
          </div>
        </div>

        {form.status === 'PAID' && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-xl space-y-4">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Payment Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Actual Fee ($) *</label>
                <input type="number" min="0" placeholder="0" value={paymentForm.actualFee}
                  onWheel={(e) => e.target.blur()}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, actualFee: e.target.value }))}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Discount ($)</label>
                <input type="number" min="0" placeholder="0" value={paymentForm.discount}
                  onWheel={(e) => e.target.blur()}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, discount: e.target.value }))}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Amount Paid ($) *</label>
                <input type="number" min="0" placeholder="0" value={paymentForm.amountPaid}
                  onWheel={(e) => e.target.blur()}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, amountPaid: e.target.value }))}
                  className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Payment Mode *</label>
                <Dropdown
                  value={paymentForm.paymentMode}
                  onChange={(v) => setPaymentForm((f) => ({ ...f, paymentMode: v }))}
                  options={paymentModesData.filter((m) => m.isActive).map((m) => ({ value: m.name, label: m.label || m.name }))}
                  placeholder="Select mode"
                />
              </div>
              <div>
                <label className={labelCls}>Transaction ID</label>
                <input type="text" placeholder="e.g. TXN123456" value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, transactionId: e.target.value }))}
                  className={inputCls} />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Conferences</label>
            <MultiSelect
              values={form.conferenceNames}
              onChange={(vals) => setForm((prev) => ({ ...prev, conferenceNames: vals }))}
              options={conferences.map((c) => ({ value: c.name, label: c.name }))}
              placeholder="Select Conferences"
            />
          </div>
          <div>
            <label className={labelCls}>Topics</label>
            <MultiSelect
              values={form.topics}
              onChange={(vals) => setForm((prev) => ({ ...prev, topics: vals }))}
              options={sciinovConferences.map((c) => ({ value: c.name || c.title, label: c.name || c.title }))}
              placeholder="Select Topics"
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Any notes about this client..."
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-white/[0.06]">
          <button type="submit" disabled={saving}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all shadow-lg shadow-violet-900/30">
            {saving ? 'Saving...' : isEdit ? 'Update Client' : 'Create Client'}
          </button>
          <button type="button" onClick={() => navigate('/clients')}
            className="px-6 py-2.5 border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.08] rounded-xl text-sm font-medium transition-all">
            Cancel
          </button>
        </div>
      </form>

      <ConfirmDialog
        isOpen={showConfirm}
        title={isEdit ? 'Update Client?' : 'Create Client?'}
        message={isEdit ? 'Are you sure you want to update this client?' : 'Are you sure you want to create this new client?'}
        confirmText={isEdit ? 'Update' : 'Create'}
        cancelText="Cancel"
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
