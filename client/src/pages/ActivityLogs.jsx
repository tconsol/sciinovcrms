import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Dropdown from '../components/Dropdown';

const ACTION_BADGE = {
  CLIENT_CREATED: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  CLIENT_UPDATED: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
  CLIENT_DELETED: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20',
  STATUS_CHANGED: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
  PAYMENT_ADDED: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  FOLLOWUP_CREATED: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
  FOLLOWUP_UPDATED: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
  FOLLOWUP_COMPLETED: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
};

const ACTION_DOT = {
  CLIENT_CREATED: 'bg-emerald-500',
  CLIENT_UPDATED: 'bg-blue-500',
  CLIENT_DELETED: 'bg-red-500',
  STATUS_CHANGED: 'bg-purple-500',
  PAYMENT_ADDED: 'bg-emerald-500',
  FOLLOWUP_CREATED: 'bg-amber-500',
  FOLLOWUP_UPDATED: 'bg-amber-500',
  FOLLOWUP_COMPLETED: 'bg-emerald-500',
};

const paginationBtnCls = 'px-3 py-1.5 text-xs border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-500 dark:text-slate-400 rounded-lg disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white transition';

export default function ActivityLogs() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const isSuperAdmin = user?.roles?.includes('ROLE_SUPER_ADMIN') || user?.roles?.includes('super_admin');
  const isAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('admin');

  const { data, isLoading } = useQuery({
    queryKey: ['activity-logs', { page, actionFilter }],
    queryFn: () => {
      const params = { page, limit: 20 };
      if (actionFilter) params.actionType = actionFilter;
      if (isAdmin && !isSuperAdmin) params.userId = user?.email || user?.id;
      return api.get('/activity-logs', { params }).then((r) => r.data);
    },
    placeholderData: keepPreviousData,
  });

  const logs = data?.logs || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Logs</h2>
          <p className="text-gray-400 dark:text-slate-500 text-sm mt-0.5">{pagination.total} total entries</p>
        </div>
        <div className="w-52">
          <Dropdown
            value={actionFilter}
            onChange={(v) => { setActionFilter(v); setPage(1); }}
            options={[
              { value: '', label: 'All Actions' },
              { value: 'CLIENT_CREATED', label: 'Client Created' },
              { value: 'CLIENT_UPDATED', label: 'Client Updated' },
              { value: 'CLIENT_DELETED', label: 'Client Deleted' },
              { value: 'STATUS_CHANGED', label: 'Status Changed' },
              { value: 'PAYMENT_ADDED', label: 'Payment Added' },
              { value: 'FOLLOWUP_CREATED', label: 'Follow-up Created' },
              { value: 'FOLLOWUP_COMPLETED', label: 'Follow-up Completed' },
            ]}
            placeholder="All Actions"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 dark:border-slate-700 border-t-violet-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-slate-600">No activity logs found</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/[0.04]">
            {logs.map((log) => (
              <div key={log._id} className="px-5 py-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${ACTION_DOT[log.actionType] || 'bg-gray-400 dark:bg-slate-600'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${ACTION_BADGE[log.actionType] || 'bg-gray-100 dark:bg-slate-500/20 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-500/20'}`}>
                      {log.actionType.replace(/_/g, ' ')}
                    </span>
                    {log.clientId && (
                      <Link
                        to={`/clients/${log.clientId._id}`}
                        className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition font-medium"
                      >
                        {log.clientId.fullName || log.clientId.email}
                      </Link>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-slate-300">{log.description}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-600 mt-1">
                    {new Date(log.createdAt).toLocaleString()}
                    {log.userId && <span className="ml-2 text-gray-300 dark:text-slate-700">· {log.userId}</span>}
                  </p>
                </div>
              </div>
            ))}
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
