import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import Dropdown from '../components/Dropdown';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [modeFilter, setModeFilter] = useState('');

  const paymentModeOptions = [
    { value: 'UPI', label: 'UPI' },
    { value: 'CARD', label: 'Card' },
    { value: 'BANK', label: 'Bank Transfer' },
  ];

  const fetchPayments = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (modeFilter) params.paymentMode = modeFilter;

      const { data } = await api.get('/payments', { params });
      setPayments(data.payments);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  }, [modeFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amountPaid, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Payments</h2>
          <p className="text-sm text-gray-500">
            Total on page: ₹{totalRevenue.toLocaleString()} | {pagination.total} records
          </p>
        </div>
        <Dropdown
          value={modeFilter}
          onChange={setModeFilter}
          options={paymentModeOptions}
          placeholder="All Modes"
          className="w-48"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-10 text-gray-400">No payments found</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Client', 'Amount', 'Actual Fee', 'Discount', 'Mode', 'Transaction ID', 'Refund', 'Date'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {p.clientId ? (
                      <Link to={`/clients/${p.clientId._id}`} className="text-indigo-600 hover:underline font-medium">
                        {p.clientId.fullName}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold">₹{p.amountPaid.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">₹{p.actualFee.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">₹{(p.discount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 font-medium">{p.paymentMode}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.transactionId || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      p.refundStatus === 'NONE' ? 'bg-gray-100 text-gray-600' :
                      p.refundStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {p.refundStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(p.paymentDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchPayments(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => fetchPayments(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
