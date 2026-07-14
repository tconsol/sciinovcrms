import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SocketProvider } from '../context/SocketContext';
import api from '../services/api';
import openSidebarIcon from '../assets/opensidebar.png';
import closeSidebarIcon from '../assets/closesidebar.png';
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineClock,
  HiOutlineClipboardList,
  HiOutlineLogout,
  HiOutlineX,
  HiOutlineChevronDown,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineCog,
  HiOutlineSearch,
  HiOutlineDocumentText,
} from 'react-icons/hi';

function QuickSearch() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = async (val) => {
    if (!val.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const { data } = await api.get('/clients', { params: { search: val, limit: 6 } });
      setResults(data.clients || []);
      setOpen(true);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQ(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), 300);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && results.length > 0) {
      navigate(`/clients/${results[0]._id}`);
      setQ(''); setResults([]); setOpen(false);
    }
    if (e.key === 'Escape') setOpen(false);
  };

  const pick = (id) => {
    navigate(`/clients/${id}`);
    setQ(''); setResults([]); setOpen(false);
  };

  return (
    <div ref={ref} className="relative hidden md:flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 rounded-xl hover:border-violet-400 dark:hover:border-violet-500/50 focus-within:border-violet-500 dark:focus-within:border-violet-500/60 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all w-56">
        <HiOutlineSearch className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
        <input
          type="text"
          value={q}
          onChange={handleChange}
          onKeyDown={handleKey}
          onFocus={() => q && results.length && setOpen(true)}
          placeholder="Search client..."
          className="bg-transparent text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 outline-none flex-1"
        />
        {loading && <div className="w-3 h-3 border border-gray-300 dark:border-slate-600 border-t-violet-500 rounded-full animate-spin shrink-0" />}
        {q && !loading && (
          <button type="button" onClick={() => { setQ(''); setResults([]); setOpen(false); }}>
            <HiOutlineX className="w-3 h-3 text-gray-400 dark:text-slate-500" />
          </button>
        )}
      </div>
      <button type="button" onClick={() => q.trim() && search(q)}
        disabled={!q.trim() || loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-900/30 disabled:opacity-40 disabled:cursor-not-allowed transition">
        <HiOutlineSearch className="w-3.5 h-3.5" />
        Search
      </button>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-2 left-0 w-72 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl z-[300] overflow-hidden">
          {results.map((c) => (
            <button key={c._id} type="button" onClick={() => pick(c._id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition text-left group">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {c.fullName?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-slate-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 truncate">{c.fullName}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{c.email}</p>
              </div>
            </button>
          ))}
          <div className="px-4 py-2 border-t border-gray-100 dark:border-white/[0.06] text-[10px] text-gray-400 dark:text-slate-600">
            Press Enter to open first result · Esc to close
          </div>
        </div>
      )}

      {open && q && results.length === 0 && !loading && (
        <div className="absolute top-full mt-2 left-0 w-72 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl z-[300] px-4 py-4 text-center text-xs text-gray-400 dark:text-slate-600">
          No clients found for "{q}"
        </div>
      )}
    </div>
  );
}

const allNavItems = [
  { to: '/', icon: HiOutlineHome, label: 'Dashboard', end: true, superAdminOnly: true },
  { to: '/clients', icon: HiOutlineUsers, label: 'Clients' },
  { to: '/conversations', icon: HiOutlineClock, label: 'Conversations' },
  { to: '/documents', icon: HiOutlineDocumentText, label: 'Documents' },
  { to: '/activity-logs', icon: HiOutlineClipboardList, label: 'Activity Logs', superAdminOnly: true },
  { to: '/admin', icon: HiOutlineCog, label: 'Admin Config', superAdminOnly: true },
];

const formatRole = (role) =>
  (role || '')
    .replace('ROLE_', '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Member';

export default function Layout() {
  const { user, logout, credentialsRef } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isSuperAdmin = user?.roles?.includes('ROLE_SUPER_ADMIN');
  const navItems = allNavItems.filter((item) => !item.superAdminOnly || isSuperAdmin);

  const launchsciinov = () => {
    window.open('https://sciinovdbms.com/', '_blank');
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
      sidebarExpanded ? '' : 'justify-center'
    } ${
      isActive
        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/30'
        : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white'
    }`;

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 dark:border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40 shrink-0">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          {sidebarExpanded && (
            <div>
              <h1 className="text-sm font-bold text-gray-900 dark:text-white">sciinov</h1>
              <p className="text-xs text-gray-400 dark:text-slate-500">CRM</p>
            </div>
          )}
        </div>
        {sidebarExpanded && (
          <button
            type="button"
            onClick={() => setSidebarExpanded(false)}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] transition lg:hidden"
          >
            <HiOutlineX className="w-4 h-4 text-gray-400 dark:text-slate-400" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={linkClass}
            title={!sidebarExpanded ? item.label : ''}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {sidebarExpanded && <span className="text-sm font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-200 dark:border-white/[0.06]">
        <button
          type="button"
          onClick={handleLogout}
          title="Logout"
          className={`flex items-center gap-3 w-full px-3 py-2.5 text-gray-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all duration-200 text-sm font-medium ${sidebarExpanded ? '' : 'justify-center'}`}
        >
          <HiOutlineLogout className="w-5 h-5 shrink-0" />
          {sidebarExpanded && 'Logout'}
        </button>
      </div>
    </div>
  );

  return (
    <SocketProvider>
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col border-r border-gray-200 dark:border-white/[0.06] transition-all duration-300 shrink-0 ${
        sidebarExpanded ? 'w-60' : 'w-[68px]'
      }`}>
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {!sidebarExpanded && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarExpanded(true)}
          />
          <aside className="relative w-60 h-full border-r border-gray-200 dark:border-white/[0.06] overflow-y-auto">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/[0.06] shrink-0 z-30">
          <div className="px-4 lg:px-6 py-3 flex items-center justify-between h-16 gap-4">
            {/* Left: Toggle + Welcome */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
                title={sidebarExpanded ? 'Close sidebar' : 'Open sidebar'}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] transition"
              >
                <img
                  src={sidebarExpanded ? closeSidebarIcon : openSidebarIcon}
                  alt={sidebarExpanded ? 'Close sidebar' : 'Open sidebar'}
                  className="w-5 h-5 dark:invert"
                />
              </button>
              <div className="hidden sm:block">
                <p className="text-xs text-gray-400 dark:text-slate-500">Welcome back</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.username || user?.email || 'User'}</p>
              </div>
            </div>

            {/* Center: Search */}
            <div className="flex-1 flex items-center justify-center min-w-0">
              <QuickSearch />
            </div>

            {/* Right: theme toggle + user dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Quick Links */}
              <div className="hidden sm:flex items-center gap-1.5 mr-1">
                <button
                  type="button"
                  onClick={launchsciinov}
                  title="Open sciinov DBMS (auto-login)"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  sciinov DBMS
                </button>
                <a
                  href="http://hrms.sciinovdbms.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open HRMS"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  HRMS
                </a>
              </div>

              <button
                type="button"
                onClick={toggle}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] transition text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
              >
                {isDark ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
              </button>

              {/* User dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0">
                    {(user?.username || user?.email || 'U')[0]?.toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white leading-none">{user?.username || user?.email || 'User'}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{formatRole(user?.roles?.[0])}</p>
                  </div>
                  <HiOutlineChevronDown className={`w-4 h-4 text-gray-400 dark:text-slate-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl z-[200] overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {(user?.username || user?.email || 'U')[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.username || user?.email || 'User'}</p>
                          <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{user?.roles?.map(formatRole).join(', ') || 'Member'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition flex items-center gap-2.5 font-medium"
                      >
                        <HiOutlineLogout className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
    </SocketProvider>
  );
}
