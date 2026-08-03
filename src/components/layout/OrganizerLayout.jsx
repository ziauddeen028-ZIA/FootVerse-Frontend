import React from 'react';
import { Outlet } from 'react-router-dom';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Trophy,
  Swords,
  Users,
  UserCheck,
  LogOut,
  User,
  Sparkles,
  Home,
} from 'lucide-react';
import { useAuth, ROLE_LABELS } from '../../context/AuthContext';
import { Header } from './Header';

// ─── Organizer Nav Config ────────────────────────────────────────────────────
const organizerNavItems = [
  { label: 'Dashboard',   path: '/organizer',             icon: LayoutDashboard, end: true },
  { label: 'Tournaments', path: '/organizer/tournaments', icon: Trophy },
  { label: 'Teams',       path: '/organizer/teams',       icon: Users },
  { label: 'Players',     path: '/organizer/players',     icon: UserCheck },
  { label: 'Matches',     path: '/organizer/matches',     icon: Swords },
];

// ─── Organizer Sidebar ───────────────────────────────────────────────────────
const OrganizerSidebar = () => {
  const { user, profile, activeRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white dark:bg-[#111726] border-r border-slate-200/80 dark:border-slate-800/80 h-screen sticky top-0 z-30 transition-colors duration-200 flex-shrink-0">

      {/* Top Logo Brand */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800/60">
        <NavLink to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-blue-600/20 group-hover:scale-105 transition">
            ⚽
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
              FootVerse
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Organizer Panel
            </span>
          </div>
        </NavLink>
      </div>

      {/* Organizer Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        <div className="px-3 pb-2">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-500 dark:text-blue-400 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Organizer Tools
          </p>
        </div>

        {organizerNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              <Icon className="w-5 h-5 transition-transform group-hover:scale-110 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* Back to Public View */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-4">
          <NavLink
            to="/"
            className="flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-all group"
          >
            <Home className="w-5 h-5 transition-transform group-hover:scale-110 flex-shrink-0" />
            <span>Back to Public View</span>
          </NavLink>
        </div>
      </div>

      {/* Bottom User Profile Section */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0D121F]">
        {user ? (
          <div className="flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-[#141C2E] border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <NavLink to="/profile" className="flex items-center space-x-3 flex-1 min-w-0 pr-2">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'O'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {profile?.full_name || user.email.split('@')[0]}
                </p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold truncate">
                  {ROLE_LABELS[activeRole] || activeRole}
                </p>
              </div>
            </NavLink>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 text-red-500" />
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

// ─── Organizer Mobile Bottom Nav ─────────────────────────────────────────────
const OrganizerMobileNav = () => {
  const mobileItems = [
    { label: 'Home',        path: '/organizer',             icon: LayoutDashboard, end: true },
    { label: 'Tournaments', path: '/organizer/tournaments', icon: Trophy },
    { label: 'Teams',       path: '/organizer/teams',       icon: Users },
    { label: 'Players',     path: '/organizer/players',     icon: UserCheck },
    { label: 'Matches',     path: '/organizer/matches',     icon: Swords },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-card border-t border-slate-200/80 dark:border-slate-800/80 backdrop-blur-lg px-2 py-1.5">
      <div className="flex items-center justify-around">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center py-1 px-3 rounded-2xl transition-all relative ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

// ─── OrganizerLayout ─────────────────────────────────────────────────────────
/**
 * OrganizerLayout
 * Used by all /organizer/* routes.
 * Has its own dedicated sidebar and mobile bottom navigation.
 * Reuses the shared Header component.
 * Page content is injected via <Outlet />.
 */
export const OrganizerLayout = () => {
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors duration-200">

      {/* Dedicated Organizer Sidebar */}
      <OrganizerSidebar />

      {/* Main Content Workspace */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">

        {/* Shared Header (theme, search, role switcher, profile) */}
        <Header />

        {/* Page Body Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Dedicated Organizer Mobile Bottom Navigation */}
      <OrganizerMobileNav />

    </div>
  );
};
