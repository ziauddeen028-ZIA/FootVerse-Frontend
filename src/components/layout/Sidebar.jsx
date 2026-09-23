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
  Shield
} from 'lucide-react';
import { useAuth, ROLE_LABELS } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export const Sidebar = () => {
  const { user, profile, activeRole, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { 
      label: 'Dashboard', 
      path: '/', 
      icon: LayoutDashboard,
      match: (pathname) => pathname === '/' || pathname === '/dashboard'
    },
    { 
      label: 'Tournaments', 
      path: '/tournaments', 
      icon: Trophy,
      match: (pathname, search) => (pathname.startsWith('/tournaments') && !search?.includes('tab=my')) || pathname === '/tournaments-preview'
    },
    ...(user ? [{
      label: 'My Tournaments', 
      path: '/tournaments?tab=my', 
      icon: Trophy,
      match: (pathname, search) => (pathname === '/tournaments' || pathname === '/my-tournaments') && search?.includes('tab=my')
    }] : []),
    { 
      label: 'Matches', 
      path: '/matches', 
      icon: Swords,
      match: (pathname, search) => (pathname === '/matches' || pathname.startsWith('/matches/')) && !search.includes('live=true')
    },
    { 
      label: 'Teams', 
      path: '/teams', 
      icon: Users,
      match: (pathname, search) => (pathname === '/teams' || pathname.startsWith('/teams/')) && !pathname.startsWith('/teams-manage') && !search.includes('tab=team')
    },
    ...(user ? [{
      label: 'My Teams', 
      path: '/teams-manage', 
      icon: Shield,
      match: (pathname) => pathname === '/teams-manage' || pathname === '/teams/join'
    }] : []),
    { 
      label: 'Players', 
      path: '/players', 
      icon: UserCheck,
      match: (pathname, search) => pathname.startsWith('/players') || (pathname.startsWith('/stats') && (search.includes('tab=search') || search.includes('tab=players') || search.includes('tab=player')))
    },
    { 
      label: 'Statistics', 
      path: '/stats', 
      icon: BarChart3,
      match: (pathname, search) => (pathname === '/stats' || pathname.startsWith('/stats/')) && !search.includes('tab=team') && !search.includes('tab=search') && !search.includes('tab=players') && !search.includes('tab=player')
    },
    { 
      label: 'Live Matches', 
      path: '/matches?live=true', 
      icon: Radio, 
      isLive: true,
      match: (pathname, search) => (pathname.startsWith('/matches') && search.includes('live=true')) || pathname === '/live'
    },
    { 
      label: 'Notifications', 
      path: '/notifications', 
      icon: Bell, 
      badge: unreadCount > 0 ? (unreadCount > 9 ? '9+' : String(unreadCount)) : null,
      match: (pathname) => pathname.startsWith('/notifications')
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white dark:bg-[#101C14] border-r border-slate-200/85 dark:border-[#1E3A29] h-screen sticky top-0 z-30 transition-colors duration-200 flex-shrink-0">
      
      {/* Top Logo Brand */}
      <div className="p-6 border-b border-slate-100 dark:border-[#1E3A29] flex items-center justify-between">
        <NavLink to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#16261C] border border-slate-200/80 dark:border-[#1E3A29] flex items-center justify-center p-1 shadow-md shadow-green-600/10 group-hover:scale-105 transition overflow-hidden">
            <img 
              src="/logo.webp" 
              alt="FootVerse Logo" 
              className="w-full h-full object-fill rounded-lg"
            />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
              FootVerse
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-green-600 dark:text-green-400">
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
          const isActive = item.match 
            ? item.match(location.pathname, location.search) 
            : location.pathname === item.path;

          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group select-none cursor-pointer ${
                isActive
                  ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#16261C] hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3 pointer-events-none">
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'
                }`} />
                <span>{item.label}</span>
              </div>

              <div className="flex items-center space-x-1.5 pointer-events-none">
                {item.isLive && (
                  <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>LIVE</span>
                  </span>
                )}
                {item.badge && !item.isLive && (
                  <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 text-xs font-bold">
                    {item.badge}
                  </span>
                )}
              </div>
            </NavLink>
          );
        })}

      </div>

      {/* Bottom User Profile Section */}
      <div className="p-4 border-t border-slate-100 dark:border-[#1E3A29] bg-slate-50/60 dark:bg-[#0B150E]">
        {user || activeRole !== 'guest' ? (
          <div className="flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-[#16261C] border border-slate-200 dark:border-[#1E3A29] shadow-sm">
            <NavLink to="/profile" className="flex items-center space-x-3 flex-1 min-w-0 pr-2">
              <div className="w-9 h-9 rounded-xl bg-green-600 text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {profile?.full_name || (user ? user.email.split('@')[0] : 'FootVerse User')}
                </p>
                <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold truncate">
                  {ROLE_LABELS[activeRole] || activeRole}
                </p>
              </div>
            </NavLink>

            <button
              onClick={user ? handleLogout : () => navigate('/login')}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-[#101C14] transition"
              title={user ? 'Sign Out' : 'Sign In'}
            >
              {user ? <LogOut className="w-4 h-4 text-red-500" /> : <User className="w-4 h-4 text-green-600" />}
            </button>
          </div>
        ) : (
          <NavLink
            to="/login"
            className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-md shadow-green-600/20 transition flex items-center justify-center space-x-2"
          >
            <User className="w-4 h-4" />
            <span>Sign In / Register</span>
          </NavLink>
        )}
      </div>

    </aside>
  );
};
