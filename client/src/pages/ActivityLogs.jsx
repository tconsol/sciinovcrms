import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Dropdown from '../components/Dropdown';

const ACTION_COLORS = {
  CLIENT_CREATED: 'bg-green-100 text-green-700',
  CLIENT_UPDATED: 'bg-blue-100 text-blue-700',
  CLIENT_DELETED: 'bg-red-100 text-red-700',
  STATUS_CHANGED: 'bg-purple-100 text-purple-700',
  PAYMENT_ADDED: 'bg-emerald-100 text-emerald-700',
  FOLLOWUP_CREATED: 'bg-amber-100 text-amber-700',
  FOLLOWUP_UPDATED: 'bg-amber-100 text-amber-700',
  FOLLOWUP_COMPLETED: 'bg-green-100 text-green-700',
};

export default function ActivityLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const actionOptions = [
    { value: 'CLIENT_CREATED', label: 'Client Created' },
    { value: 'CLIENT_UPDATED', label: 'Client Updated' },
    { value: 'CLIENT_DELETED', label: 'Client Deleted' },
    { value: 'STATUS_CHANGED', label: 'Status Changed' },
    { value: 'PAYMENT_ADDED', label: 'Payment Added' },
    { value: 'FOLLOWUP_CREATED', label: 'Follow-up Created' },
    { value: 'FOLLOWUP_COMPLETED', label: 'Follow-up Completed' },
  ];

  // Check if user is super_admin
  const isSuperAdmin = user?.roles?.includes('ROLE_SUPER_ADMIN') || user?.roles?.includes('super_admin');
  const isAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('admin');

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (actionFilter) params.actionType = actionFilter;
      
      // Role-based filtering
      // Admin sees only their own logs, Super Admin sees all logs
      if (isAdmin && !isSuperAdmin) {
        params.userId = user?.email || user?.id;
      }

      const { data } = await api.get('/activity-logs', { params });
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, isAdmin, isSuperAdmin, user?.email, user?.id]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Activity Logs</h2>
          <p className="text-sm text-gray-500">{pagination.total} total entries</p>
        </div>
        <Dropdown
          value={actionFilter}
          onChange={setActionFilter}
          options={actionOptions}
          placeholder="All Actions"
          className="w-48"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10 text-gray-400">No activity logs found</div>
        ) : (
          <div className="divide-y">
            {logs.map((log) => (
              <div key={log._id} className="px-5 py-4 flex items-start gap-4 hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${ACTION_COLORS[log.actionType] || 'bg-gray-100 text-gray-600'}`}>
                      {log.actionType.replace(/_/g, ' ')}
                    </span>
                    {log.clientId && (
                      <Link
                        to={`/clients/${log.clientId._id}`}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        {log.clientId.fullName || log.clientId.email}
                      </Link>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{log.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(log.createdAt).toLocaleString()}
                    {log.userId && <span className="ml-2">by {log.userId}</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => fetchLogs(pagination.page + 1)}
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
