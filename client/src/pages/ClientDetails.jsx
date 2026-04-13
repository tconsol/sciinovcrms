import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePencil, HiOutlinePlus, HiOutlineArrowLeft } from 'react-icons/hi';

const STATUS_COLORS = {
  REGISTERED: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  DECLINED: 'bg-red-100 text-red-700',
  NEXT_EDITION_INTEREST: 'bg-amber-100 text-amber-700',
};

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [payments, setPayments] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Payment form state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amountPaid: '',
    actualFee: '',
    discount: '0',
    paymentMode: 'UPI',
    transactionId: '',
  });

  // Follow-up form state
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({
    followUpDate: '',
    notes: '',
  });

  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [clientRes, paymentsRes, followUpsRes] = await Promise.all([
        api.get(`/clients/${id}`),
        api.get(`/payments/client/${id}`),
        api.get(`/follow-ups/client/${id}`),
      ]);
      setClient(clientRes.data);
      setPayments(paymentsRes.data);
      setFollowUps(followUpsRes.data);
    } catch {
      toast.error('Failed to load client details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments', {
        clientId: id,
        ...paymentForm,
        amountPaid: Number(paymentForm.amountPaid),
        actualFee: Number(paymentForm.actualFee),
        discount: Number(paymentForm.discount),
      });
      toast.success('Payment added');
      setShowPaymentForm(false);
      setPaymentForm({ amountPaid: '', actualFee: '', discount: '0', paymentMode: 'UPI', transactionId: '' });
      fetchAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add payment');
    }
  };

  const handleAddFollowUp = async (e) => {
    e.preventDefault();
    try {
      await api.post('/follow-ups', {
        clientId: id,
        ...followUpForm,
      });
      toast.success('Follow-up scheduled');
      setShowFollowUpForm(false);
      setFollowUpForm({ followUpDate: '', notes: '' });
      fetchAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to schedule follow-up');
    }
  };

  const markFollowUpComplete = async (fId) => {
    try {
      await api.put(`/follow-ups/${fId}`, { status: 'COMPLETED' });
      toast.success('Follow-up completed');
      fetchAll();
    } catch {
      toast.error('Failed to update follow-up');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!client) {
    return <p className="text-gray-500">Client not found</p>;
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/clients')}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
          title="Back to Clients"
        >
          <HiOutlineArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <div className="flex flex-wrap items-start justify-between gap-4 flex-1">
          <div className="flex items-center gap-4">
            {client.profileImage && (
              <img
                src={client.profileImage}
                alt={client.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              />
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{client.fullName}</h2>
              <p className="text-gray-500">{client.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[client.status]}`}>
              {client.status}
            </span>
            <Link
              to={`/clients/${id}/edit`}
              className="flex items-center gap-1 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
            >
              <HiOutlinePencil className="w-4 h-4" /> Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Client Info */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Client Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Info label="Phone" value={client.phone} />
          <Info label="Organization" value={client.organization} />
          <Info label="Country" value={client.country} />
          <Info label="Role" value={client.role} />
          <Info label="Conference" value={client.conferenceName} />
          <Info label="Topic" value={client.topic} />
          <Info label="Created" value={new Date(client.createdAt).toLocaleDateString()} />
        </div>
        {client.abstract && (
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-500">Abstract</label>
            <p className="text-sm text-gray-700 mt-1">{client.abstract}</p>
          </div>
        )}
      </div>

      {/* Payments */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-700">Payments</h3>
            <p className="text-sm text-gray-400">Total paid: ₹{totalPaid.toLocaleString()}</p>
          </div>
          {client.status === 'PAID' && (
            <button
              onClick={() => setShowPaymentForm(!showPaymentForm)}
              className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
            >
              <HiOutlinePlus className="w-4 h-4" /> Add Payment
            </button>
          )}
        </div>

        {showPaymentForm && (
          <form onSubmit={handleAddPayment} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="number"
                placeholder="Amount Paid"
                value={paymentForm.amountPaid}
                onChange={(e) => setPaymentForm((f) => ({ ...f, amountPaid: e.target.value }))}
                required
                className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="number"
                placeholder="Actual Fee"
                value={paymentForm.actualFee}
                onChange={(e) => setPaymentForm((f) => ({ ...f, actualFee: e.target.value }))}
                required
                className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="number"
                placeholder="Discount"
                value={paymentForm.discount}
                onChange={(e) => setPaymentForm((f) => ({ ...f, discount: e.target.value }))}
                className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={paymentForm.paymentMode}
                onChange={(e) => setPaymentForm((f) => ({ ...f, paymentMode: e.target.value }))}
                className="px-3 py-2 border rounded-lg outline-none"
              >
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="BANK">Bank Transfer</option>
              </select>
              <input
                type="text"
                placeholder="Transaction ID"
                value={paymentForm.transactionId}
                onChange={(e) => setPaymentForm((f) => ({ ...f, transactionId: e.target.value }))}
                className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
              Save Payment
            </button>
          </form>
        )}

        <div className="space-y-2">
          {payments.map((p) => (
            <div key={p._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
              <div>
                <span className="font-semibold">₹{p.amountPaid.toLocaleString()}</span>
                <span className="text-gray-400 ml-2">via {p.paymentMode}</span>
                {p.transactionId && (
                  <span className="text-gray-400 ml-2">#{p.transactionId}</span>
                )}
              </div>
              <div className="text-gray-400">
                {new Date(p.paymentDate).toLocaleDateString()}
              </div>
            </div>
          ))}
          {payments.length === 0 && <p className="text-sm text-gray-400">No payments yet</p>}
        </div>
      </div>

      {/* Follow-ups */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">Follow-ups</h3>
          <button
            onClick={() => setShowFollowUpForm(!showFollowUpForm)}
            className="flex items-center gap-1 px-3 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700"
          >
            <HiOutlinePlus className="w-4 h-4" /> Schedule
          </button>
        </div>

        {showFollowUpForm && (
          <form onSubmit={handleAddFollowUp} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="datetime-local"
                value={followUpForm.followUpDate}
                onChange={(e) => setFollowUpForm((f) => ({ ...f, followUpDate: e.target.value }))}
                required
                className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="text"
                placeholder="Notes"
                value={followUpForm.notes}
                onChange={(e) => setFollowUpForm((f) => ({ ...f, notes: e.target.value }))}
                className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-700">
              Save Follow-up
            </button>
          </form>
        )}

        <div className="space-y-2">
          {followUps.map((f) => {
            const isOverdue = f.status === 'PENDING' && new Date(f.followUpDate) < new Date();
            return (
              <div key={f._id} className={`flex items-center justify-between p-3 rounded-lg text-sm ${isOverdue ? 'bg-red-50' : 'bg-gray-50'}`}>
                <div>
                  <span className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                    {new Date(f.followUpDate).toLocaleString()}
                  </span>
                  {f.notes && <span className="text-gray-500 ml-2">{f.notes}</span>}
                  {isOverdue && <span className="text-red-500 ml-2 text-xs font-medium">OVERDUE</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${f.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {f.status}
                  </span>
                  {f.status === 'PENDING' && (
                    <button
                      onClick={() => markFollowUpComplete(f._id)}
                      className="text-xs text-green-600 hover:underline"
                    >
                      Mark Done
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {followUps.length === 0 && <p className="text-sm text-gray-400">No follow-ups yet</p>}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 uppercase">{label}</label>
      <p className="text-gray-800">{value || '-'}</p>
    </div>
  );
}
