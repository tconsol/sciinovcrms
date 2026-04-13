import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  HiOutlineUsers,
  HiOutlineCurrencyDollar,
  HiOutlineCheckCircle,
  HiOutlineTrendingUp,
  HiOutlineClock,
  HiOutlineExclamation,
} from 'react-icons/hi';

function StatCard({ icon: Icon, label, value, color, bgColor, sub, trend }) {
  return (
    <div className={`${bgColor} rounded-2xl shadow-lg p-6 text-white overflow-hidden relative`}>
      {/* Decorative element */}
      <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-10 rounded-full -mr-12 -mt-12`} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${color} bg-opacity-20 backdrop-blur-sm`}>
            <Icon className="w-7 h-7" />
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-xs bg-white bg-opacity-20 px-2 py-1 rounded-lg">
              <span>{trend}</span>
            </div>
          )}
        </div>
        
        <p className="text-sm font-medium opacity-90">{label}</p>
        <p className="text-3xl font-bold mt-2 tracking-tight">{value}</p>
        {sub && <p className="text-xs opacity-75 mt-2">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data: res } = await api.get('/dashboard');
      setData(res);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  if (!data) {
    return <p className="text-gray-500">Failed to load dashboard data.</p>;
  }

  const { stats, clientsByRole, recentActivity, recentClients } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your CRM overview.</p>
      </div>

      {/* Stats Grid - 2 Rows x 3 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Row 1 */}
        <StatCard
          icon={HiOutlineUsers}
          label="Total Clients"
          value={stats.totalClients}
          color="bg-blue-600"
          bgColor="bg-gradient-to-br from-blue-600 to-blue-700"
          trend="+12%"
        />
        <StatCard
          icon={HiOutlineCheckCircle}
          label="Paid Clients"
          value={stats.paidClients}
          color="bg-green-600"
          bgColor="bg-gradient-to-br from-green-600 to-green-700"
          sub={`${stats.totalClients > 0 ? Math.round((stats.paidClients / stats.totalClients) * 100) : 0}% of total`}
        />
        <StatCard
          icon={HiOutlineCurrencyDollar}
          label="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          color="bg-emerald-600"
          bgColor="bg-gradient-to-br from-emerald-600 to-emerald-700"
          trend="+8.5%"
        />

        {/* Row 2 */}
        <StatCard
          icon={HiOutlineTrendingUp}
          label="Conversion Rate"
          value={`${stats.conversionRate}%`}
          color="bg-purple-600"
          bgColor="bg-gradient-to-br from-purple-600 to-purple-700"
          sub="Registered → Paid"
        />
        <StatCard
          icon={HiOutlineClock}
          label="Pending Follow-ups"
          value={stats.pendingFollowUps}
          color="bg-amber-600"
          bgColor="bg-gradient-to-br from-amber-600 to-amber-700"
        />
        <StatCard
          icon={HiOutlineExclamation}
          label="Overdue Follow-ups"
          value={stats.overdueFollowUps}
          color="bg-red-600"
          bgColor="bg-gradient-to-br from-red-600 to-red-700"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Status Breakdown</h3>
          <div className="space-y-4">
            {[
              { label: 'Registered', value: stats.registeredClients, color: 'bg-blue-500', width: 'w-full' },
              { label: 'Paid', value: stats.paidClients, color: 'bg-green-500', width: 'w-3/4' },
              { label: 'Declined', value: stats.declinedClients, color: 'bg-red-500', width: 'w-1/4' },
              { label: 'Next Edition Interest', value: stats.nextEditionClients, color: 'bg-amber-500', width: 'w-1/2' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </div>
                  <span className="font-bold text-gray-900">{item.value}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all duration-300`} style={{width: `${Math.min((item.value / (stats.totalClients || 1)) * 100, 100)}%`}} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clients by Role */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Clients by Role</h3>
          <div className="space-y-4">
            {clientsByRole.length > 0 ? (
              clientsByRole.map((item, index) => {
                const roleColors = ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800'];
                return (
                  <div key={item._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <span className={`text-sm font-semibold px-3 py-1 rounded-lg ${roleColors[index % 3]}`}>
                      {item._id}
                    </span>
                    <span className="text-2xl font-bold text-gray-900">{item.count}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-center py-8 text-gray-400">No role data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Data Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Clients */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Recent Clients</h3>
            <Link to="/clients" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentClients.length > 0 ? (
              recentClients.map((client) => (
                <Link
                  key={client._id}
                  to={`/clients/${client._id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition group"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition">{client.fullName}</p>
                    <p className="text-xs text-gray-500">{client.email}</p>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ml-2 ${
                      client.status === 'PAID'
                        ? 'bg-green-100 text-green-800'
                        : client.status === 'DECLINED'
                        ? 'bg-red-100 text-red-800'
                        : client.status === 'NEXT_EDITION_INTEREST'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {client.status}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-center py-8 text-gray-400">No clients yet</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            <Link to="/activity-logs" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition">
              View all →
            </Link>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentActivity.length > 0 ? (
              recentActivity.map((log) => (
                <div key={log._id} className="border-l-4 border-indigo-500 pl-3 py-2 hover:bg-indigo-50 px-2 rounded transition">
                  <p className="text-sm font-medium text-gray-800">{log.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-gray-400">No activity yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
