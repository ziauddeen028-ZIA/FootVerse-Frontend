import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Trophy, 
  Swords, 
  Users, 
  UserCheck, 
  BarChart3, 
  Radio, 
  Bell, 
  Settings, 
  LogOut, 
  User,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useAuth, ROLE_LABELS } from '../../context/AuthContext';

export const Sidebar = () => {
  const { user, profile, activeRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Tournaments', path: '/tournaments-preview', icon: Trophy },
    { label: 'Matches', path: '/matches-preview', icon: Swords },
    { label: 'Teams', path: '/teams-preview', icon: Users },
    { label: 'Players', path: '/players-preview', icon: UserCheck },
    { label: 'Statistics', path: '/stats-preview', icon: BarChart3 },
    { 
      label: 'Live Matches', 
      path: '/matches-preview', 
      icon: Radio, 
      isLive: true 
    },
    { label: 'Notifications', path: '/notifications-preview', icon: Bell, badge: '3' },
    { label: 'Settings', path: '/settings-preview', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white dark:bg-[#111726] border-r border-slate-200/80 dark:border-slate-800/80 h-screen sticky top-0 z-30 transition-colors duration-200 flex-shrink-0">
      
      {/* Top Logo Brand */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
        <NavLink to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-blue-600/20 group-hover:scale-105 transition">
            ⚽
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
              FootVerse
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Pro Tournament OS
            </span>
          </div>
        </NavLink>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        <div className="px-3 pb-2">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Main Menu
          </p>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.label + item.path}
              to={item.path}
              className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                }`} />
                <span>{item.label}</span>
              </div>

              <div className="flex items-center space-x-1.5">
                {item.isLive && (
                  <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>LIVE</span>
                  </span>
                )}
                {item.badge && !item.isLive && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold">
                    {item.badge}
                  </span>
                )}
              </div>
            </NavLink>
          );
        })}
      </div>

      {/* Bottom User Profile Section */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0D121F]">
        {user || activeRole !== 'guest' ? (
          <div className="flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-[#141C2E] border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <NavLink to="/profile" className="flex items-center space-x-3 flex-1 min-w-0 pr-2">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {profile?.full_name || (user ? user.email.split('@')[0] : 'FootVerse User')}
                </p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold truncate">
                  {ROLE_LABELS[activeRole] || activeRole}
                </p>
              </div>
            </NavLink>

            <button
              onClick={user ? handleLogout : () => navigate('/login')}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={user ? 'Sign Out' : 'Sign In'}
            >
              {user ? <LogOut className="w-4 h-4 text-red-500" /> : <User className="w-4 h-4 text-blue-500" />}
            </button>
          </div>
        ) : (
          <NavLink
            to="/login"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition flex items-center justify-center space-x-2"
          >
            <User className="w-4 h-4" />
            <span>Sign In / Register</span>
          </NavLink>
        )}
      </div>

    </aside>
  );
};
