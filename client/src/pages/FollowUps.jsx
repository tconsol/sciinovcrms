import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import Dropdown from '../components/Dropdown';

export default function FollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showOverdue, setShowOverdue] = useState(false);

  const fetchFollowUps = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (showOverdue) params.overdue = 'true';

      const { data } = await api.get('/follow-ups', { params });
      setFollowUps(data.followUps);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to fetch follow-ups');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showOverdue]);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  const markComplete = async (id) => {
    try {
      await api.put(`/follow-ups/${id}`, { status: 'COMPLETED' });
      toast.success('Follow-up completed');
      fetchFollowUps(pagination.page);
    } catch {
      toast.error('Failed to update follow-up');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this follow-up?')) return;
    try {
      await api.delete(`/follow-ups/${id}`);
      toast.success('Follow-up deleted');
      fetchFollowUps(pagination.page);
    } catch {
      toast.error('Failed to delete follow-up');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Follow-ups</h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showOverdue}
              onChange={(e) => {
                setShowOverdue(e.target.checked);
                if (e.target.checked) setStatusFilter('');
              }}
              className="rounded border-gray-300"
            />
            Overdue only
          </label>
          <div className="w-48">
            <Dropdown
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                if (value) setShowOverdue(false);
              }}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'COMPLETED', label: 'Completed' },
              ]}
              placeholder="Filter by Status"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : followUps.length === 0 ? (
          <div className="text-center py-10 text-gray-400">No follow-ups found</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Client', 'Date', 'Notes', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {followUps.map((f) => {
                const isOverdue = f.status === 'PENDING' && new Date(f.followUpDate) < new Date();
                return (
                  <tr key={f._id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3 text-sm">
                      {f.clientId ? (
                        <Link to={`/clients/${f.clientId._id}`} className="text-indigo-600 hover:underline font-medium">
                          {f.clientId.fullName}
                        </Link>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                        {new Date(f.followUpDate).toLocaleString()}
                      </span>
                      {isOverdue && <span className="ml-2 text-xs text-red-500 font-medium">OVERDUE</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{f.notes || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        f.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {f.status === 'PENDING' && (
                          <button
                            onClick={() => markComplete(f._id)}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(f._id)}
                          className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
              onClick={() => fetchFollowUps(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => fetchFollowUps(pagination.page + 1)}
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
