import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import {
  HiOutlineUsers,
  HiOutlineCurrencyDollar,
  HiOutlineCheckCircle,
  HiOutlineTrendingUp,
  HiOutlineClock,
  HiOutlineExclamation,
} from 'react-icons/hi';

const STATUS_BADGE = {
  PAID: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20',
  REGISTERED: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20',
  DECLINED: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20',
  NEXT_EDITION_INTEREST: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20',
};

function StatCard({ icon: Icon, label, value, gradient, sub, trend }) {
  return (
    <div className={`${gradient} rounded-2xl p-5 text-white relative overflow-hidden`}>
      <div className="absolute inset-0 bg-black/10 rounded-2xl" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <span className="text-xs bg-white/20 px-2 py-1 rounded-lg font-medium">{trend}</span>
          )}
        </div>
        <p className="text-sm font-medium text-white/80 mb-1">{label}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {sub && <p className="text-xs text-white/60 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 dark:border-slate-700 border-t-violet-500" />
      </div>
    );
  }

  if (!data) return <p className="text-gray-400 dark:text-slate-500">Failed to load dashboard data.</p>;

  const { stats, clientsByRole, recentActivity, recentClients } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-slate-500 text-sm mt-1">Your CRM overview at a glance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={HiOutlineUsers} label="Total Clients" value={stats.totalClients} gradient="bg-gradient-to-br from-blue-600 to-blue-700" trend="+12%" />
        <StatCard icon={HiOutlineCheckCircle} label="Paid Clients" value={stats.paidClients} gradient="bg-gradient-to-br from-emerald-600 to-emerald-700" sub={`${stats.totalClients > 0 ? Math.round((stats.paidClients / stats.totalClients) * 100) : 0}% of total`} />
        <StatCard icon={HiOutlineCurrencyDollar} label="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} gradient="bg-gradient-to-br from-violet-600 to-indigo-700" trend="+8.5%" />
        <StatCard icon={HiOutlineTrendingUp} label="Conversion Rate" value={`${stats.conversionRate}%`} gradient="bg-gradient-to-br from-purple-600 to-purple-700" sub="Registered → Paid" />
        <StatCard icon={HiOutlineClock} label="Pending Follow-ups" value={stats.pendingFollowUps} gradient="bg-gradient-to-br from-amber-600 to-amber-700" />
        <StatCard icon={HiOutlineExclamation} label="Overdue Follow-ups" value={stats.overdueFollowUps} gradient="bg-gradient-to-br from-red-600 to-red-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm dark:shadow-none">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-5">Status Breakdown</h3>
          <div className="space-y-4">
            {[
              { label: 'Registered', value: stats.registeredClients, color: 'bg-blue-500' },
              { label: 'Paid', value: stats.paidClients, color: 'bg-emerald-500' },
              { label: 'Declined', value: stats.declinedClients, color: 'bg-red-500' },
              { label: 'Next Edition Interest', value: stats.nextEditionClients, color: 'bg-amber-500' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-xs font-medium text-gray-600 dark:text-slate-300">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min((item.value / (stats.totalClients || 1)) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm dark:shadow-none">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-5">Clients by Role</h3>
          <div className="space-y-3">
            {clientsByRole.length > 0 ? (
              clientsByRole.map((item, index) => {
                const colors = [
                  'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
                  'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
                  'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
                ];
                return (
                  <div key={item._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-100 dark:border-white/[0.06] hover:bg-gray-100 dark:hover:bg-white/[0.06] transition">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-lg border ${colors[index % 3]}`}>{item._id}</span>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">{item.count}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-center py-8 text-gray-400 dark:text-slate-600 text-sm">No role data yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Clients</h3>
            <Link to="/clients" className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition">View all →</Link>
          </div>
          <div className="space-y-1">
            {recentClients.length > 0 ? (
              recentClients.map((client) => (
                <Link key={client._id} to={`/clients/${client._id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.04] transition group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {client.fullName?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-slate-200 group-hover:text-gray-900 dark:group-hover:text-white truncate">{client.fullName}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{client.email}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-lg font-medium whitespace-nowrap ml-2 ${STATUS_BADGE[client.status]}`}>{client.status}</span>
                </Link>
              ))
            ) : (
              <p className="text-center py-8 text-gray-400 dark:text-slate-600 text-sm">No clients yet</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            <Link to="/activity-logs" className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition">View all →</Link>
          </div>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {recentActivity.length > 0 ? (
              recentActivity.map((log) => (
                <div key={log._id} className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.04] transition">
                  <div className="w-1 shrink-0 rounded-full bg-violet-400 dark:bg-violet-500/50 mt-1" />
                  <div>
                    <p className="text-sm text-gray-700 dark:text-slate-300">{log.description}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-600 mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-gray-400 dark:text-slate-600 text-sm">No activity yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
