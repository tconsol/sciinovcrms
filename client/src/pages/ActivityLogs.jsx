import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Dropdown from '../components/Dropdown';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';
import { HiOutlineTrash, HiCheck } from 'react-icons/hi';

function Checkbox({ checked, onChange, indeterminate }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-150 ${
        checked
          ? 'bg-violet-600 border-violet-600 shadow-md shadow-violet-500/40'
          : 'border-gray-300 dark:border-white/20 hover:border-violet-400 dark:hover:border-violet-500 bg-white dark:bg-white/[0.06]'
      }`}
    >
      {checked && <HiCheck className="w-3 h-3 text-white stroke-[3]" />}
      {!checked && indeterminate && <div className="w-2 h-0.5 bg-violet-500 rounded-full" />}
    </button>
  );
}

const ACTION_BADGE = {
  CLIENT_CREATED:    'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  CLIENT_UPDATED:    'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
  CLIENT_DELETED:    'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20',
  STATUS_CHANGED:    'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
  PAYMENT_ADDED:     'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  FOLLOWUP_CREATED:  'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
  FOLLOWUP_UPDATED:  'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
  FOLLOWUP_COMPLETED:'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
};

const ACTION_DOT = {
  CLIENT_CREATED:    'bg-emerald-500',
  CLIENT_UPDATED:    'bg-blue-500',
  CLIENT_DELETED:    'bg-red-500',
  STATUS_CHANGED:    'bg-purple-500',
  PAYMENT_ADDED:     'bg-emerald-500',
  FOLLOWUP_CREATED:  'bg-amber-500',
  FOLLOWUP_UPDATED:  'bg-amber-500',
  FOLLOWUP_COMPLETED:'bg-emerald-500',
};

const paginationBtnCls = 'px-3 py-1.5 text-xs border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-500 dark:text-slate-400 rounded-lg disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white transition';

export default function ActivityLogs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [confirmMode, setConfirmMode] = useState(null); // 'selected' | 'all'

  const isSuperAdmin = user?.roles?.includes('ROLE_SUPER_ADMIN');
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');

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

  const deleteMutation = useMutation({
    mutationFn: (body) => api.delete('/activity-logs', { data: body }),
    onSuccess: (_, body) => {
      toast.success(body.all ? 'All logs deleted' : `${selected.size} log(s) deleted`);
      setSelected(new Set());
      setSelectionMode(false);
      setConfirmMode(null);
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
    onError: () => toast.error('Failed to delete logs'),
  });

  const logs = data?.logs || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  const allCurrentIds = logs.map((l) => l._id);
  const allCurrentSelected = allCurrentIds.length > 0 && allCurrentIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allCurrentSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        allCurrentIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => new Set([...prev, ...allCurrentIds]));
    }
  };

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    if (confirmMode === 'all') {
      deleteMutation.mutate({ all: true });
    } else {
      deleteMutation.mutate({ ids: [...selected] });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Logs</h2>
          <p className="text-gray-400 dark:text-slate-500 text-sm mt-0.5">{pagination.total} total entries</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
          {isSuperAdmin && !selectionMode && (
            <button type="button"
              onClick={() => setSelectionMode(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl text-sm font-semibold transition">
              <HiOutlineTrash className="w-4 h-4" />
              Delete
            </button>
          )}
          {isSuperAdmin && selectionMode && (
            <>
              {someSelected && (
                <button type="button" onClick={() => setConfirmMode('selected')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-red-900/30">
                  <HiOutlineTrash className="w-4 h-4" />
                  Delete Selected ({selected.size})
                </button>
              )}
              <button type="button" onClick={() => setConfirmMode('all')}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl text-sm font-semibold transition">
                <HiOutlineTrash className="w-4 h-4" />
                Delete All
              </button>
              <button type="button"
                onClick={() => { setSelectionMode(false); setSelected(new Set()); }}
                className="px-3 py-2 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-xl text-sm font-medium transition">
                Cancel
              </button>
            </>
          )}
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
          <>
            {/* Select all header */}
            {isSuperAdmin && selectionMode && (
              <div className="px-5 py-3 border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-3 bg-gray-50 dark:bg-white/[0.02]">
                <Checkbox
                  checked={allCurrentSelected}
                  onChange={toggleAll}
                  indeterminate={someSelected && !allCurrentSelected}
                />
                <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                  {allCurrentSelected ? 'Deselect all on page' : 'Select all on page'}
                  {someSelected && <span className="ml-2 text-violet-600 dark:text-violet-400">{selected.size} selected total</span>}
                </span>
              </div>
            )}

            <div className="divide-y divide-gray-100 dark:divide-white/[0.04]">
              {logs.map((log) => (
                <div
                  key={log._id}
                  className={`px-5 py-4 flex items-start gap-4 transition-colors ${
                    selected.has(log._id)
                      ? 'bg-violet-50 dark:bg-violet-500/[0.06]'
                      : 'hover:bg-gray-50 dark:hover:bg-white/[0.02]'
                  }`}
                >
                  {isSuperAdmin && selectionMode && (
                    <div className="mt-1">
                      <Checkbox checked={selected.has(log._id)} onChange={() => toggleOne(log._id)} />
                    </div>
                  )}
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${ACTION_DOT[log.actionType] || 'bg-gray-400 dark:bg-slate-600'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${ACTION_BADGE[log.actionType] || 'bg-gray-100 dark:bg-slate-500/20 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-500/20'}`}>
                        {log.actionType.replace(/_/g, ' ')}
                      </span>
                      {log.clientId && (
                        <Link to={`/clients/${log.clientId._id}`}
                          className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition font-medium">
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
          </>
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

      <ConfirmDialog
        isOpen={Boolean(confirmMode)}
        title={confirmMode === 'all' ? 'Delete All Activity Logs?' : `Delete ${selected.size} Selected Log(s)?`}
        message={confirmMode === 'all'
          ? 'This will permanently delete every activity log. This cannot be undone.'
          : `This will permanently delete ${selected.size} selected log(s). This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous
        onConfirm={handleConfirm}
        onCancel={() => setConfirmMode(null)}
      />
    </div>
  );
}
