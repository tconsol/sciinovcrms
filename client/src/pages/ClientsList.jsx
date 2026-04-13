import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineSearch, HiOutlineTrash, HiOutlinePencil, HiOutlineEye } from 'react-icons/hi';
import Dropdown from '../components/Dropdown';

const STATUS_COLORS = {
  REGISTERED: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  DECLINED: 'bg-red-100 text-red-700',
  NEXT_EDITION_INTEREST: 'bg-amber-100 text-amber-700',
};

export default function ClientsList() {
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', role: '', conferenceId: '' });
  const [conferences, setConferences] = useState([]);

  const fetchClients = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (filters.status) params.status = filters.status;
      if (filters.role) params.role = filters.role;
      if (filters.conferenceId) params.conferenceId = filters.conferenceId;

      const { data } = await api.get('/clients', { params });
      setClients(data.clients);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    api.get('/sciinov/conferences').then(({ data }) => {
      setConferences(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    try {
      await api.delete(`/clients/${id}`);
      toast.success('Client deleted');
      fetchClients(pagination.page);
    } catch {
      toast.error('Failed to delete client');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Clients</h2>
        <Link
          to="/clients/new"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <HiOutlinePlus className="w-5 h-5" />
          Add Client
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <Dropdown
            value={filters.status}
            onChange={(value) => setFilters((f) => ({ ...f, status: value }))}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'REGISTERED', label: 'Registered' },
              { value: 'PAID', label: 'Paid' },
              { value: 'DECLINED', label: 'Declined' },
              { value: 'NEXT_EDITION_INTEREST', label: 'Next Edition Interest' },
            ]}
            placeholder="Filter by Status"
          />
          <Dropdown
            value={filters.role}
            onChange={(value) => setFilters((f) => ({ ...f, role: value }))}
            options={[
              { value: '', label: 'All Roles' },
              { value: 'Speaker', label: 'Speaker' },
              { value: 'Attendee', label: 'Attendee' },
              { value: 'Sponsor', label: 'Sponsor' },
            ]}
            placeholder="Filter by Role"
          />
          <Dropdown
            value={filters.conferenceId}
            onChange={(value) => setFilters((f) => ({ ...f, conferenceId: value }))}
            options={[
              { value: '', label: 'All Conferences' },
              ...conferences.map((c) => ({
                value: c._id || c.id,
                label: c.name || c.title,
              })),
            ]}
            placeholder="Filter by Conference"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-10 text-gray-400">No clients found</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Email', 'Role', 'Status', 'Organization', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clients.map((client) => (
                <tr key={client._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{client.fullName}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{client.email}</td>
                  <td className="px-4 py-3 text-sm">{client.role}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[client.status]}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{client.organization || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link to={`/clients/${client._id}`} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded">
                        <HiOutlineEye className="w-5 h-5" />
                      </Link>
                      <Link to={`/clients/${client._id}/edit`} className="p-1 text-amber-600 hover:bg-amber-50 rounded">
                        <HiOutlinePencil className="w-5 h-5" />
                      </Link>
                      <button onClick={() => handleDelete(client._id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                        <HiOutlineTrash className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {clients.length} of {pagination.total} clients
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchClients(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm">
              {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => fetchClients(pagination.page + 1)}
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
