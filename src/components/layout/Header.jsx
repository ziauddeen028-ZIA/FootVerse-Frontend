import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GlobalSearchBar } from './GlobalSearchBar';
import {
  Sun, Moon, Bell, ChevronDown, User, LogOut,
  CheckCheck, BellOff, CheckCircle2, AlertCircle, Info, RefreshCw
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth, ROLES, ROLE_LABELS } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

// ─── Helpers ────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  success: { icon: CheckCircle2, dot: 'bg-green-500', text: 'text-green-500' },
  error:   { icon: AlertCircle,  dot: 'bg-red-500',   text: 'text-red-500'   },
  warning: { icon: AlertCircle,  dot: 'bg-amber-500', text: 'text-amber-500' },
  info:    { icon: Info,         dot: 'bg-green-600', text: 'text-green-600' },
};
function getCfg(type) { return TYPE_CONFIG[type] || TYPE_CONFIG.info; }

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Notification Dropdown ────────────────────────────────────────────────────
function NotificationDropdown({ onClose }) {
  const { notifications, unreadCount, loading, fetchNotifications, markOneRead, markAllRead } = useNotifications();
  const recent = notifications.slice(0, 6);

  return (
    <div className="absolute right-0 mt-2 w-80 floating-glass rounded-2xl shadow-2xl z-50 overflow-hidden border border-slate-200/90 dark:border-[#1E3A29]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-[#1E3A29]">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-bold text-slate-800 dark:text-white">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-green-600 text-white text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1A2E22] transition"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-slate-100 dark:hover:bg-[#1A2E22] transition"
              title="Mark all read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="max-h-72 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-[#16261C] animate-pulse" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <BellOff className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            <p className="text-xs text-slate-400 dark:text-slate-500">No notifications yet</p>
          </div>
        ) : (
          <div className="py-1">
            {recent.map(n => {
              const isRead = n.isRead || n.is_read;
              const cfg = getCfg(n.type);
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#16261C] transition-colors cursor-pointer ${
                    !isRead ? 'bg-green-50/40 dark:bg-green-950/25' : ''
                  }`}
                  onClick={() => { if (!isRead) markOneRead(n.id); onClose(); }}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${cfg.text}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold text-slate-800 dark:text-slate-200 truncate ${!isRead ? 'font-bold' : ''}`}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                      {n.message}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!isRead && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {timeAgo(n.createdAt || n.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 dark:border-[#1E3A29] px-4 py-2.5">
        <Link
          to="/notifications"
          onClick={onClose}
          className="flex items-center justify-center text-xs font-semibold text-green-600 dark:text-green-400 hover:underline"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
export const Header = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user, profile, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const notifRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    }
    if (isNotifOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isNotifOpen]);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-[#101C14]/95 border-b border-slate-200/85 dark:border-[#1E3A29] backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 transition-colors duration-200">
      <div className="flex items-center justify-between gap-4">

        {/* Search Bar & Mobile Logo */}
        <div className="flex items-center gap-2.5 flex-1 max-w-md">
          <Link to="/" className="md:hidden flex items-center flex-shrink-0" aria-label="FootVerse Home">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#16261C] border border-slate-200/80 dark:border-[#1E3A29] p-0.5 flex items-center justify-center shadow-xs">
              <img src="/logo.webp" alt="FootVerse Logo" className="w-full h-full object-contain rounded-lg" />
            </div>
          </Link>
          <div className="w-full">
            <GlobalSearchBar />
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#16261C] rounded-xl transition"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Notifications Button + Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { if (user) setIsNotifOpen(p => !p); else navigate('/login'); }}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#16261C] rounded-xl transition relative"
              title="Notifications"
              id="header-notifications-btn"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-green-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && user && (
              <NotificationDropdown onClose={() => setIsNotifOpen(false)} />
            )}
          </div>

          {/* Profile Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-[#16261C] transition"
            >
              <div className="w-8 h-8 rounded-lg bg-green-600 text-white font-bold flex items-center justify-center text-xs shadow-sm shadow-green-600/20">
                {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </button>

            {isUserMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 floating-glass rounded-2xl shadow-xl py-1 z-50 border border-slate-200 dark:border-[#1E3A29]"
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <div className="px-4 py-2 border-b border-slate-100 dark:border-[#1E3A29]">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {profile?.full_name || 'FootVerse Athlete'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email || 'Registered User'}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#16261C]"
                >
                  <User className="w-3.5 h-3.5 mr-2 text-green-600 dark:text-green-400" /> Profile Settings
                </Link>
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-[#16261C]"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2" /> Sign Out
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full flex items-center px-4 py-2 text-xs text-green-600 dark:text-green-400 hover:bg-slate-100 dark:hover:bg-[#16261C]"
                  >
                    <User className="w-3.5 h-3.5 mr-2" /> Sign In
                  </Link>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
