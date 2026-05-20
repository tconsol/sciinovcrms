import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '../services/api';
import Dropdown from '../components/Dropdown';

const REFUND_BADGE = {
  NONE: 'bg-gray-100 dark:bg-slate-500/20 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-500/20',
  PARTIAL: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20',
  FULL: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20',
};

const paginationBtnCls = 'px-3 py-1.5 text-xs border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-500 dark:text-slate-400 rounded-lg disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white transition';

export default function Payments() {
  const [page, setPage] = useState(1);
  const [modeFilter, setModeFilter] = useState('');

  const { data: paymentModesData = [] } = useQuery({
    queryKey: ['admin', 'payment-modes'],
    queryFn: () => api.get('/admin/payment-modes').then((r) => r.data),
    staleTime: 5 * 60_000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['payments', { page, modeFilter }],
    queryFn: () => {
      const params = { page, limit: 10 };
      if (modeFilter) params.paymentMode = modeFilter;
      return api.get('/payments', { params }).then((r) => r.data);
    },
    placeholderData: keepPreviousData,
  });

  const payments = data?.payments || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };
  const totalRevenue = payments.reduce((sum, p) => sum + p.amountPaid, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payments</h2>
          <p className="text-gray-400 dark:text-slate-500 text-sm mt-0.5">
            ${totalRevenue.toLocaleString()} on page · {pagination.total} total records
          </p>
        </div>
        <div className="w-48">
          <Dropdown
            value={modeFilter}
            onChange={(v) => { setModeFilter(v); setPage(1); }}
            options={[
              { value: '', label: 'All Modes' },
              ...paymentModesData.filter((m) => m.isActive).map((m) => ({ value: m.name, label: m.label || m.name })),
            ]}
            placeholder="All Modes"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 dark:border-slate-700 border-t-violet-500" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-slate-600">No payments found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-transparent">
                  {['Client', 'Amount', 'Actual Fee', 'Discount', 'Mode', 'Transaction ID', 'Refund', 'Date'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 text-sm">
                      {p.clientId ? (
                        <Link to={`/clients/${p.clientId._id}`} className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium transition">
                          {p.clientId.fullName}
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">${p.amountPaid.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">${p.actualFee.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">${(p.discount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-slate-300 font-medium">{p.paymentMode}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 dark:text-slate-500">{p.transactionId || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${REFUND_BADGE[p.refundStatus] || REFUND_BADGE.NONE}`}>
                        {p.refundStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 dark:text-slate-500">{new Date(p.paymentDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
