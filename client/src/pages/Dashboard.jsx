import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  HiOutlineUsers, HiOutlineCurrencyDollar, HiOutlineCheckCircle,
  HiOutlineTrendingUp, HiOutlineClock, HiOutlineExclamation,
  HiOutlineCash, HiOutlineChat, HiOutlineUserAdd, HiOutlineCalendar,
  HiOutlineChartBar,
} from 'react-icons/hi';

const PALETTE = ['#6366f1','#10b981','#f59e0b','#3b82f6','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899','#14b8a6'];
const COLOR_MAP = { blue: '#3b82f6', green: '#10b981', red: '#ef4444', amber: '#f59e0b', purple: '#8b5cf6', indigo: '#6366f1' };
const resolveColor = (c) => COLOR_MAP[c] || c || '#6366f1';
const paletteColor = (name = '') => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return PALETTE[Math.abs(h) % PALETTE.length];
};

const PERIODS = [
  { key: 'day',    label: 'Today' },
  { key: 'week',   label: 'This Week' },
  { key: 'month',  label: 'This Month' },
  { key: 'year',   label: 'This Year' },
  { key: 'custom', label: 'Custom' },
];

const ChartTip = ({ active, payload, label, prefix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1117] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white shadow-2xl">
      {label && <p className="text-white/50 mb-1.5 font-medium">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0 inline-block" style={{ backgroundColor: p.color || p.fill }} />
          <span className="text-white/70">{p.name}:</span>
          <strong>{prefix}{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

function KpiCard({ icon: Icon, label, value, trend, color = '#6366f1', small, filled }) {
  if (filled) {
    return (
      <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: `linear-gradient(135deg, ${color}22, ${color}10)`, border: `1px solid ${color}30` }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '30' }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div>
          <p className="text-xs mb-0.5" style={{ color: color + 'cc' }}>{label}</p>
          <p className={`font-bold ${small ? 'text-lg' : 'text-2xl'} text-gray-900 dark:text-white`}>{value}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.07] rounded-2xl p-4 flex flex-col gap-3 hover:border-gray-200 dark:hover:border-white/[0.12] transition-all">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {trend !== undefined && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">{label}</p>
        <p className={`font-bold text-gray-900 dark:text-white ${small ? 'text-lg' : 'text-2xl'}`}>{value}</p>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{children}</h3>;
}

function ChartCard({ title, children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.07] rounded-2xl p-5 ${className}`}>
      {title && <SectionTitle>{title}</SectionTitle>}
      {children}
    </div>
  );
}

function AdminHBar({ data, dataKey, prefix = '' }) {
  if (!data?.length) return <p className="text-center py-8 text-gray-400 dark:text-slate-600 text-sm">No data</p>;
  const chartData = data.map((d) => ({ name: d._id || 'Unknown', value: d[dataKey] || 0 }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(chartData.length * 44, 80)}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 12, left: 4, bottom: 0 }}>
        <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false}
          allowDecimals={false}
          tickFormatter={(v) => prefix ? `${prefix}${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}` : `${v}`} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={90} />
        <Tooltip content={<ChartTip prefix={prefix} />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28}>
          {chartData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function Dashboard() {
  const [period, setPeriod] = useState('day');
  const now = new Date();
  const fmtDate = (d) => d.toISOString().slice(0, 10);
  const [customFrom, setCustomFrom] = useState(fmtDate(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [customTo, setCustomTo]     = useState(fmtDate(now));
  const [queryRange, setQueryRange] = useState({ from: customFrom, to: customTo });

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data),
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics', queryRange.from, queryRange.to],
    queryFn: () => api.get('/dashboard/analytics', { params: queryRange }).then((r) => r.data),
  });

  const { data: statusesData = [] } = useQuery({
    queryKey: ['admin', 'statuses'],
    queryFn: () => api.get('/admin/statuses').then((r) => r.data),
    staleTime: 5 * 60_000,
  });

  const getStatusStyle = (s) => {
    const f = statusesData.find((x) => x.name === s);
    const hex = f?.color ? resolveColor(f.color) : paletteColor(s);
    return { backgroundColor: hex + '22', color: hex, borderColor: hex + '44' };
  };
  const getStatusLabel = (s) => statusesData.find((x) => x.name === s)?.label || s;

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 dark:border-slate-700 border-t-violet-500" />
    </div>
  );
  if (!data) return <p className="text-gray-400 dark:text-slate-500">Failed to load dashboard.</p>;

  const {
    stats, clientsByRole = [], clientsByStatus = [],
    weeklyChart = [], monthlyChart = [], dailyChart = [], yearlyChart = [],
    convsByAdmin = [], paymentsByAdmin = [],
    recentActivity = [], recentClients = [],
  } = data;

  // Period-aware chart data
  const chartData = period === 'custom' ? (analyticsData?.chart || [])
    : period === 'day'   ? []
    : period === 'week'  ? weeklyChart
    : period === 'month' ? dailyChart
    : monthlyChart;

  const chartXKey = period === 'year' ? 'month' : 'day';

  const isCustom = period === 'custom';

  // Period KPIs
  const kpis = isCustom
    ? { revenue: analyticsData?.revenue || 0, conversations: analyticsData?.conversations || 0, clients: analyticsData?.clients || 0, payments: analyticsData?.paymentCount || 0 }
    : {
        day:   { revenue: stats.todayRevenue,  conversations: stats.todayConversations,  clients: stats.todayClients,  payments: stats.todayPayments },
        week:  { revenue: stats.weekRevenue,   conversations: stats.weekConversations,   clients: '—',                 payments: '—' },
        month: { revenue: stats.monthRevenue,  conversations: stats.monthConversations,  clients: stats.monthClients,  payments: '—' },
        year:  { revenue: stats.yearRevenue,   conversations: stats.yearConversations,   clients: '—',                 payments: '—' },
      }[period];

  // Chart data for custom range
  const customChart = analyticsData?.chart || [];

  const pieData = clientsByStatus.map((item) => {
    const sc = statusesData.find((s) => s.name === item._id);
    return { name: sc?.label || item._id || '—', value: item.count, color: sc?.color ? resolveColor(sc.color) : paletteColor(item._id) };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">Live CRM analytics</p>
      </div>

      {/* Overall Stats — top */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard icon={HiOutlineUsers} label="Total Clients" value={stats.totalClients} color="#3b82f6" small filled />
        <KpiCard icon={HiOutlineCheckCircle} label="Paid Clients" value={stats.paidClients} color="#10b981" small filled />
        <KpiCard icon={HiOutlineCurrencyDollar} label="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} color="#6366f1" small filled />
        <KpiCard icon={HiOutlineClock} label="Pending Follow-ups" value={stats.pendingFollowUps} color="#f59e0b" small filled />
        <KpiCard icon={HiOutlineExclamation} label="Overdue" value={stats.overdueFollowUps} color="#ef4444" small filled />
      </div>

      {/* Period Filter */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">Period Analytics</p>
          <div className="flex gap-1 bg-gray-100 dark:bg-white/[0.05] p-1 rounded-2xl border border-gray-200 dark:border-white/[0.08]">
            {PERIODS.map((p) => (
              <button key={p.key} type="button" onClick={() => setPeriod(p.key)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  period === p.key
                    ? 'bg-white dark:bg-white/[0.1] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom date picker — only when custom selected */}
        {period === 'custom' && (
          <div className="flex flex-wrap items-end gap-3 p-4 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-2xl">
            {[['From', customFrom, setCustomFrom], ['To', customTo, setCustomTo]].map(([lbl, val, setter]) => (
              <div key={lbl}>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">{lbl}</p>
                <input type="date" value={val} onChange={(e) => setter(e.target.value)}
                  className="px-3 py-2 bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:[color-scheme:dark] transition-all" />
              </div>
            ))}
            <button type="button" onClick={() => setQueryRange({ from: customFrom, to: customTo })}
              className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-violet-900/30">
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Period KPIs */}
      {isCustom && analyticsLoading ? (
        <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-7 w-7 border-2 border-gray-200 dark:border-slate-700 border-t-violet-500" /></div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard icon={HiOutlineCurrencyDollar} label={`${PERIODS.find(p=>p.key===period)?.label} Revenue`} value={`$${(kpis?.revenue||0).toLocaleString()}`} color="#6366f1" filled={isCustom} />
          <KpiCard icon={HiOutlineChat} label="Conversations" value={kpis?.conversations ?? '—'} color="#10b981" filled={isCustom} />
          <KpiCard icon={HiOutlineUserAdd} label="New Clients" value={kpis?.clients ?? '—'} color="#f59e0b" filled={isCustom} />
          <KpiCard icon={HiOutlineCash} label="Payments" value={kpis?.payments ?? '—'} color="#8b5cf6" filled={isCustom} />
        </div>
      )}

      {/* Main Revenue + Conversations Chart */}
      {period !== 'day' ? (
        <ChartCard title={`Revenue & Conversations — ${PERIODS.find(p=>p.key===period)?.label}`}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gConv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff07" vertical={false} />
              <XAxis dataKey={chartXKey} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false}
                interval={period === 'month' ? 2 : 0} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : `${v}`} />
              <Tooltip content={<ChartTip />} />
              <Legend formatter={(v) => <span style={{ fontSize: 11, color: '#94a3b8' }}>{v}</span>} iconType="circle" iconSize={7} />
              <Area type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#6366f1" strokeWidth={2.5}
                fill="url(#gRev)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
              <Area type="monotone" dataKey="conversations" name="Conversations" stroke="#10b981" strokeWidth={2.5}
                fill="url(#gConv)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard icon={HiOutlineUsers} label="Total Clients" value={stats.totalClients} color="#3b82f6" small />
          <KpiCard icon={HiOutlineCheckCircle} label="Paid Clients" value={stats.paidClients} color="#10b981" small />
          <KpiCard icon={HiOutlineClock} label="Pending Follow-ups" value={stats.pendingFollowUps} color="#f59e0b" small />
          <KpiCard icon={HiOutlineExclamation} label="Overdue" value={stats.overdueFollowUps} color="#ef4444" small />
        </div>
      )}

      {/* Yearly Revenue */}
      <ChartCard title="Yearly Revenue — Last 5 Years">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={yearlyChart} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff07" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} />
            <Tooltip content={<ChartTip prefix="$" />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
            <Bar dataKey="revenue" name="Revenue" radius={[6, 6, 0, 0]} maxBarSize={60}>
              {yearlyChart.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Status + Role */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Client Status Breakdown">
          {pieData.length === 0 ? <p className="text-center py-12 text-gray-400 dark:text-slate-600 text-sm">No clients yet</p> : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                    paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={({ active, payload }) => active && payload?.length
                    ? <div className="bg-[#0f1117] border border-white/10 rounded-xl px-3 py-2 text-xs text-white shadow-2xl">
                        <p className="font-semibold">{payload[0].name}</p>
                        <p className="text-white/60">{payload[0].value} clients</p>
                      </div> : null} />
                  <Legend formatter={(v) => <span style={{ fontSize: 11, color: '#94a3b8' }}>{v}</span>} iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-500 dark:text-slate-400 truncate">{item.name}</span>
                    <span className="text-xs font-bold text-gray-800 dark:text-white ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>

        <ChartCard title="Clients by Role">
          {clientsByRole.length === 0 ? <p className="text-center py-12 text-gray-400 dark:text-slate-600 text-sm">No data</p> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={clientsByRole.map(r => ({ role: r._id||'Unknown', count: r.count }))}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff07" vertical={false} />
                <XAxis dataKey="role" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                <Bar dataKey="count" name="Clients" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {clientsByRole.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Admin Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Conversations by Admin">
          <AdminHBar data={isCustom ? (analyticsData?.convsByAdmin || []) : convsByAdmin} dataKey="count" />
          {(isCustom ? analyticsData?.convsByAdmin : convsByAdmin)?.length > 0 && (
            <div className="mt-4 space-y-1.5 border-t border-gray-100 dark:border-white/[0.06] pt-3">
              {(isCustom ? analyticsData?.convsByAdmin || [] : convsByAdmin).map((a) => (
                <div key={a._id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-slate-300 font-medium">{a._id || 'Unknown'}</span>
                  <div className="flex items-center gap-4 text-gray-400">
                    <span>{a.completed} <span className="text-emerald-500">completed</span></span>
                    <span className="font-bold text-gray-800 dark:text-white">{a.count} total</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard title="Revenue Collected by Admin">
          <AdminHBar data={isCustom ? (analyticsData?.paysByAdmin || []) : paymentsByAdmin} dataKey="total" prefix="$" />
          {(isCustom ? analyticsData?.paysByAdmin : paymentsByAdmin)?.length > 0 && (
            <div className="mt-4 space-y-1.5 border-t border-gray-100 dark:border-white/[0.06] pt-3">
              {(isCustom ? analyticsData?.paysByAdmin || [] : paymentsByAdmin).map((a) => (
                <div key={a._id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-slate-300 font-medium">{a._id || 'Unknown'}</span>
                  <div className="flex items-center gap-4 text-gray-400">
                    <span>{a.count} payments</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">${(a.total||0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>

      {/* Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Recent Clients</SectionTitle>
            <Link to="/clients" className="text-xs text-violet-600 dark:text-violet-400 font-medium hover:underline">View all →</Link>
          </div>
          <div className="space-y-1">
            {recentClients.length > 0 ? recentClients.map((c) => (
              <Link key={c._id} to={`/clients/${c._id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.04] transition group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {c.fullName?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">{c.fullName}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{c.email}</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-lg font-medium whitespace-nowrap ml-2 border" style={getStatusStyle(c.status)}>
                  {getStatusLabel(c.status)}
                </span>
              </Link>
            )) : <p className="text-center py-8 text-gray-400 dark:text-slate-600 text-sm">No clients yet</p>}
          </div>
        </ChartCard>

        <ChartCard title="">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Recent Activity</SectionTitle>
            <Link to="/activity-logs" className="text-xs text-violet-600 dark:text-violet-400 font-medium hover:underline">View all →</Link>
          </div>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {recentActivity.length > 0 ? recentActivity.map((log) => (
              <div key={log._id} className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.04] transition">
                <div className="w-1 shrink-0 rounded-full bg-violet-400/60 mt-1" />
                <div>
                  <p className="text-sm text-gray-700 dark:text-slate-300">{log.description}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-600 mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              </div>
            )) : <p className="text-center py-8 text-gray-400 dark:text-slate-600 text-sm">No activity yet</p>}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
