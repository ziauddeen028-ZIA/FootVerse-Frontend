import React from 'react';
import { User, Mail, Shield, Award, Calendar, ChevronLeft, BarChart2, Key, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth, ROLE_LABELS } from '../context/AuthContext';
import { MyStatsView } from '../components/stats/MyStatsView';

export const ProfilePage = () => {
  const { user, profile, activeRole } = useAuth();

  if (!user && activeRole === 'guest') {
    return (
      <div className="max-w-md mx-auto my-12 text-center saas-card rounded-3xl p-8 space-y-4 bg-white dark:bg-[#101C14] border border-slate-200 dark:border-[#1E3A29]">
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#16261C] border border-slate-200/80 dark:border-[#1E3A29] mx-auto flex items-center justify-center p-2 shadow-md shadow-green-600/10">
          <img src="/logo.webp" alt="FootVerse Logo" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Guest Profile</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          You are currently viewing FootVerse as a guest. Sign in or register to set up your player card or manage your team.
        </p>
        <Link
          to="/register"
          className="block w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-xl shadow-md transition"
        >
          Register Account
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <Link to="/" className="inline-flex items-center text-xs font-semibold text-green-600 dark:text-green-400 hover:underline">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>

        <Link
          to="/stats?tab=my-stats"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-300 text-xs font-bold hover:bg-green-100 dark:hover:bg-green-900/60 transition"
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Full Stats Hub</span>
        </Link>
      </div>

      {/* Profile Overview Card */}
      <div className="saas-card rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#101C14] border border-slate-200/80 dark:border-[#1E3A29]">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 border-b border-slate-100 dark:border-[#1E3A29] pb-6 mb-6">
          <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-green-600/30">
            {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'P'}
          </div>

          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {profile?.full_name || 'FootVerse Athlete'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start space-x-1.5 mt-1">
              <Mail className="w-3.5 h-3.5" />
              <span>{user?.email || 'Registered User'}</span>
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <span className="px-3 py-1 bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 text-xs font-bold rounded-full">
                {ROLE_LABELS[profile?.role || activeRole]}
              </span>
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full">
                Position: {profile?.preferred_position || 'Forward'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#16261C] border border-slate-200 dark:border-[#1E3A29]">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Account ID</span>
            <p className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200 truncate mt-1">
              {user?.id || 'demo-user-id'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#16261C] border border-slate-200 dark:border-[#1E3A29]">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Member Since</span>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              <span>{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Team & Squad Management Quick Card */}
      {user?.id && (
        <div className="rounded-3xl p-6 bg-gradient-to-br from-[#0c2e1b] via-[#092215] to-[#05130b] border border-emerald-500/30 shadow-xl shadow-green-950/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
          <div className="flex items-center space-x-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-green-500/15 border border-green-400/30 flex items-center justify-center text-green-400 shrink-0 mx-auto sm:mx-0 shadow-inner">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold font-heading text-white tracking-tight">
                My Teams & Squad Roster
              </h3>
              <p className="text-xs sm:text-sm text-green-100/85 mt-0.5 font-medium leading-relaxed">
                Manage your squads or enter an 8-character team code to join instantly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Link
              to="/teams/join"
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-xl shadow-md shadow-green-600/20 transition flex items-center justify-center space-x-1.5"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Join with Code</span>
            </Link>
            <Link
              to="/teams-manage"
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-white dark:bg-[#101C14] hover:bg-slate-100 dark:hover:bg-[#1E3A29] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#1E3A29] font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>My Teams</span>
            </Link>
          </div>
        </div>
      )}

      {/* Personal Player Performance & Tournament History */}
      {user?.id && (
        <div className="pt-2">
          <MyStatsView />
        </div>
      )}
    </div>
  );
};

