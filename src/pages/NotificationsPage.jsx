import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, BellOff, CheckCheck, Trophy, Users, Swords,
  Target, Info, CheckCircle2, AlertCircle, ChevronRight,
  RefreshCw
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

// ─── Type helpers ─────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-200/60 dark:ring-emerald-800/60',
    dot: 'bg-emerald-500'
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-500 dark:text-red-400',
    ring: 'ring-red-200/60 dark:ring-red-800/60',
    dot: 'bg-red-500'
  },
  warning: {
    icon: AlertCircle,
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
    ring: 'ring-amber-200/60 dark:ring-amber-800/60',
    dot: 'bg-amber-500'
  },
  info: {
    icon: Info,
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    ring: 'ring-blue-200/60 dark:ring-blue-800/60',
    dot: 'bg-blue-500'
  },
};

function getConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.info;
}

// ─── Infer an icon from title text ───────────────────────────────────────────
function guessIcon(title = '') {
  const t = title.toLowerCase();
  if (t.includes('tournament')) return Trophy;
  if (t.includes('team'))       return Users;
  if (t.includes('match'))      return Swords;
  if (t.includes('goal'))       return Target;
  return null;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Single notification card ─────────────────────────────────────────────────
function NotificationCard({ notification, onMarkRead }) {
  const isRead = notification.isRead || notification.is_read;
  const cfg = getConfig(notification.type);
  const GuessedIcon = guessIcon(notification.title);
  const Icon = GuessedIcon || cfg.icon;

  const cardContent = (
    <div
      className={`group flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer
        ${isRead
          ? 'bg-white dark:bg-[#111726] border-slate-200/80 dark:border-slate-800/80 opacity-70 hover:opacity-100'
          : `bg-white dark:bg-[#111726] border-slate-200/80 dark:border-slate-800/80 
             ring-2 ${cfg.ring} shadow-sm hover:shadow-md`
        }`}
      onClick={() => !isRead && onMarkRead(notification.id)}
      role="article"
      aria-label={notification.title}
    >
      {/* Icon badge */}
      <div className={`mt-0.5 flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bg}`}>
        <Icon className={`w-5 h-5 ${cfg.text}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold text-slate-900 dark:text-white leading-snug
            ${!isRead ? 'font-bold' : ''}`}>
            {notification.title}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!isRead && (
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
            )}
            <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
              {timeAgo(notification.createdAt || notification.created_at)}
            </span>
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
          {notification.message}
        </p>
        {!isRead && (
          <p className="mt-1.5 text-[11px] text-blue-500 dark:text-blue-400 font-medium">
            Click to mark as read
          </p>
        )}
      </div>

      {/* Chevron */}
      {notification.link && (
        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0 mt-1 group-hover:text-blue-500 transition-colors" />
      )}
    </div>
  );

  if (notification.link) {
    return (
      <Link to={notification.link} className="block" onClick={() => !isRead && onMarkRead(notification.id)}>
        <div
          className={`group flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer
            ${isRead
              ? 'bg-white dark:bg-[#111726] border-slate-200/80 dark:border-slate-800/80 opacity-70 hover:opacity-100'
              : `bg-white dark:bg-[#111726] border-slate-200/80 dark:border-slate-800/80 
                 ring-2 ${cfg.ring} shadow-sm hover:shadow-md`
            }`}
          role="article"
        >
          <div className={`mt-0.5 flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bg}`}>
            <Icon className={`w-5 h-5 ${cfg.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className={`text-sm font-semibold text-slate-900 dark:text-white leading-snug ${!isRead ? 'font-bold' : ''}`}>
                {notification.title}
              </p>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {!isRead && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />}
                <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                  {timeAgo(notification.createdAt || notification.created_at)}
                </span>
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
              {notification.message}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0 mt-1 group-hover:text-blue-500 transition-colors" />
        </div>
      </Link>
    );
  }

  return cardContent;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function NotificationsPage() {
  const { notifications, unreadCount, loading, fetchNotifications, markOneRead, markAllRead } = useNotifications();

  const [filter, setFilter] = React.useState('all'); // 'all' | 'unread'

  const displayed = useMemo(() => {
    if (filter === 'unread') return notifications.filter(n => !(n.isRead || n.is_read));
    return notifications;
  }, [notifications, filter]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-900/40 flex items-center justify-center">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Notifications
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl transition"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl w-fit">
        {[
          { key: 'all', label: 'All', count: notifications.length },
          { key: 'unread', label: 'Unread', count: unreadCount }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === tab.key
                ? 'bg-white dark:bg-[#111726] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                filter === tab.key
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Notification List ── */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[76px] rounded-2xl bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <BellOff className="w-7 h-7 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-base font-semibold text-slate-600 dark:text-slate-300">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
            {filter === 'unread'
              ? 'You\'re all caught up! Switch to "All" to see past notifications.'
              : 'Notifications for team invites, match results, and tournament updates will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(n => (
            <NotificationCard
              key={n.id}
              notification={n}
              onMarkRead={markOneRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}
