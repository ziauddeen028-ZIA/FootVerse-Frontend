import React, { useState, useEffect } from 'react';
import { Trophy, Users, UserCheck, Swords, Activity, AlertCircle } from 'lucide-react';
import { DashboardCard } from '../../components/organizer/DashboardCard';
import { LoadingSkeleton } from '../../components/organizer/LoadingSkeleton';

import { tournamentService } from '../../services/tournamentService';
import { teamService } from '../../services/teamService';
import { matchService } from '../../services/matchService';
import { playerService } from '../../services/playerService';

// Format relative time helper
function formatTimeAgo(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }
  const mins = Math.floor(diffInSeconds / 60);
  if (mins < 60) {
    return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
  }
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) {
    return `${hrs} ${hrs === 1 ? 'hour' : 'hours'} ago`;
  }
  const days = Math.floor(hrs / 24);
  if (days < 30) {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}

export const Dashboard = () => {
  const [stats, setStats] = useState({
    tournaments: 0,
    teams: 0,
    players: 0,
    upcomingMatches: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch isolated dashboard data from backend
        const res = await tournamentService.getOrganizerDashboard();
        
        if (res?.stats) {
          setStats({
            tournaments: res.stats.tournaments ?? 0,
            teams: res.stats.teams ?? 0,
            players: res.stats.players ?? 0,
            upcomingMatches: res.stats.upcomingMatches ?? 0,
          });
        }

        const activities = (res?.recentActivities || []).map(a => {
          let IconComponent = Trophy;
          if (a.type === 'team_registered') {
            IconComponent = Users;
          } else if (a.type === 'tournament_created' || a.type === 'tournament_completed') {
            IconComponent = Trophy;
          } else {
            IconComponent = Activity;
          }
          return {
            ...a,
            icon: IconComponent,
            time: formatTimeAgo(a.timestamp),
          };
        });

        setRecentActivities(activities);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard data. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Organizer Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Platform-wide overview of your managed tournaments and entities.
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      {loading ? (
        <LoadingSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard
            title="Total Tournaments"
            value={stats.tournaments}
            icon={Trophy}
            colorClass="bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300"
          />
          <DashboardCard
            title="Registered Teams"
            value={stats.teams}
            icon={Users}
            colorClass="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
          />
          <DashboardCard
            title="Total Players"
            value={stats.players}
            icon={UserCheck}
            colorClass="bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300"
          />
          <DashboardCard
            title="Upcoming Matches"
            value={stats.upcomingMatches}
            icon={Swords}
            colorClass="bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
          />
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white dark:bg-[#101C14] rounded-2xl border border-slate-200/80 dark:border-[#1E3A29] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-[#1E3A29] flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
            Recent Activity
          </h2>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-[#16261C]"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-slate-200 dark:bg-[#16261C] rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 dark:bg-[#16261C] rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="py-6 text-center text-slate-500 dark:text-slate-400 text-sm">
              No recent activity yet.
            </div>
          ) : (
            <div className="space-y-6">
              {recentActivities.map((item, index) => {
                const IconComponent = item.icon || Activity;
                return (
                  <div key={item.id} className="flex gap-4 relative">
                    {index < recentActivities.length - 1 && (
                      <div className="absolute top-8 left-5 w-px h-full bg-slate-200 dark:border-[#1E3A29] dark:bg-[#1E3A29] -z-10"></div>
                    )}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 ${item.color}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="pt-2">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.action}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
