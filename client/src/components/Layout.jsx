import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineCreditCard,
  HiOutlineClock,
  HiOutlineClipboardList,
  HiOutlineLogout,
  HiOutlineX,
  HiOutlineChevronDown,
  HiOutlineChevronRight,
  HiOutlineChevronLeft,
} from 'react-icons/hi';

const navItems = [
  { to: '/', icon: HiOutlineHome, label: 'Dashboard', end: true },
  { to: '/clients', icon: HiOutlineUsers, label: 'Clients' },
  { to: '/payments', icon: HiOutlineCreditCard, label: 'Payments' },
  { to: '/follow-ups', icon: HiOutlineClock, label: 'Follow-ups' },
  { to: '/activity-logs', icon: HiOutlineClipboardList, label: 'Activity Logs' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 justify-center lg:justify-start ${
      isActive
        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Logo - Always Visible */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          {sidebarExpanded && (
            <div>
              <h1 className="text-sm font-bold text-gray-900">SciInov</h1>
              <p className="text-xs text-gray-500">CRM</p>
            </div>
          )}
        </div>
        {sidebarExpanded && (
          <button
            onClick={() => setSidebarExpanded(false)}
            className="p-1 rounded-lg hover:bg-gray-100 transition lg:hidden"
            aria-label="Collapse sidebar"
          >
            <HiOutlineX className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={linkClass}
            title={!sidebarExpanded ? item.label : ''}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {sidebarExpanded && <span className="text-sm font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout - Sidebar */}
      <div className="p-2 border-t border-gray-200 bg-gray-50">
        <button
          onClick={handleLogout}
          title="Logout"
          className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200 font-medium text-sm justify-center lg:justify-start"
        >
          <HiOutlineLogout className="w-5 h-5" />
          {sidebarExpanded && 'Logout'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Desktop Sidebar - Collapsible */}
      <aside className={`hidden lg:flex flex-col bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ${
        sidebarExpanded ? 'w-64' : 'w-20'
      }`}>
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {!sidebarExpanded && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSidebarExpanded(true)}
          />
          <aside className="relative w-64 h-full bg-white shadow-2xl overflow-y-auto">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header - HRMS Style */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 lg:px-8 py-4 flex items-center justify-between h-20">
            {/* Left Section - Toggle Button */}
            <div className="flex items-center gap-4">
              {/* Desktop Toggle */}
              <button
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
                className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 transition"
                aria-label="Toggle sidebar"
              >
                {sidebarExpanded ? (
                  <HiOutlineChevronLeft className="w-6 h-6 text-gray-700" />
                ) : (
                  <HiOutlineChevronRight className="w-6 h-6 text-gray-700" />
                )}
              </button>

              {/* Mobile Toggle */}
              <button
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
                aria-label="Toggle sidebar"
              >
                {sidebarExpanded ? (
                  <HiOutlineChevronLeft className="w-6 h-6 text-gray-700" />
                ) : (
                  <HiOutlineChevronRight className="w-6 h-6 text-gray-700" />
                )}
              </button>
            </div>

            {/* Center Section - Welcome Message */}
            <div className="hidden sm:block flex-1 text-center">
              <p className="text-sm text-gray-500">Welcome back</p>
              <p className="text-lg font-semibold text-gray-900">{user?.username || user?.email || 'User'}</p>
            </div>

            {/* Right Section - User Profile */}
            <div className="flex items-center gap-4">
              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition group"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  
                  {/* User Info - Desktop */}
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-gray-900">{user?.username || user?.email || 'User'}</p>
                    <p className="text-xs text-gray-500">{user?.roles?.[0]?.replace('ROLE_', '') || 'Member'}</p>
                  </div>

                  {/* Chevron */}
                  <HiOutlineChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Menu Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {user?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{user?.username || user?.email || 'User'}</p>
                          <p className="text-xs text-gray-500">{user?.roles?.join(', ') || 'Member'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          handleLogout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-3 font-medium"
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
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gray-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
