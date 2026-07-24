import React from 'react';
import { User, Mail, Shield, Award, Calendar, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth, ROLE_LABELS } from '../context/AuthContext';

export const ProfilePage = () => {
  const { user, profile, activeRole, openAuthModal } = useAuth();

  if (!user && activeRole === 'guest') {
    return (
      <div className="max-w-md mx-auto my-12 text-center saas-card rounded-3xl p-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center text-2xl font-bold">
          ⚽
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Guest Profile</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          You are currently viewing FootVerse as a guest. Sign in or register to set up your player card or manage your team.
        </p>
        <Link
          to="/register"
          className="block w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition"
        >
          Register Account
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/" className="inline-flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </Link>

      <div className="glass-card rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
          <div className="w-20 h-20 rounded-full primary-gradient flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-blue-500/30">
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
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full">
                {ROLE_LABELS[profile?.role || activeRole]}
              </span>
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full">
                Position: {profile?.preferred_position || 'Forward'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Account ID</span>
            <p className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200 truncate mt-1">
              {user?.id || 'demo-user-id'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Member Since</span>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
