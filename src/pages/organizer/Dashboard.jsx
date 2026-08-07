import React, { useState, useEffect } from 'react';
import { Trophy, Users, UserCheck, Swords, Activity, AlertCircle } from 'lucide-react';
import { DashboardCard } from '../../components/organizer/DashboardCard';
import { LoadingSkeleton } from '../../components/organizer/LoadingSkeleton';

import { tournamentService } from '../../services/tournamentService';
import { teamService } from '../../services/teamService';
import { matchService } from '../../services/matchService';
import { playerService } from '../../services/playerService';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    tournaments: 0,
    teams: 0,
    players: 0,
    upcomingMatches: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch primary entities
        const [tournamentsRes, teamsRes] = await Promise.all([
          tournamentService.getAll(),
          teamService.getAll()
        ]);

        const tournaments = tournamentsRes.tournaments || [];
        const teams = teamsRes.teams || [];

        // Fetch matches for all tournaments concurrently
        const matchPromises = tournaments.map(t => matchService.getByTournament(t.id).catch(() => ({ matches: [] })));
        const matchesResults = await Promise.all(matchPromises);

        // Flatten and filter for upcoming matches
        const allMatches = matchesResults.flatMap(res => res.matches || []);
        const upcomingMatches = allMatches.filter(m => m.status !== 'Completed').length;

        // Fetch team members (players) across all teams
        // Using Promise.all with catch to prevent single team errors from breaking the dashboard
        // Fetch all players
        const playersRes = await playerService.getAll();

        const totalPlayers = playersRes.teamMembers?.length || 0;

        setStats({
          tournaments: tournaments.length,
          teams: teams.length,
          players: totalPlayers,
          upcomingMatches,
        });

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
            colorClass="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
          />
          <DashboardCard
            title="Registered Teams"
            value={stats.teams}
            icon={Users}
            colorClass="bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400"
          />
          <DashboardCard
            title="Total Players"
            value={stats.players}
            icon={UserCheck}
            colorClass="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
          />
          <DashboardCard
            title="Upcoming Matches"
            value={stats.upcomingMatches}
            icon={Swords}
            colorClass="bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400"
          />
        </div>
      )}

      {/* Recent Activity (Placeholder as per requirements) */}
      <div className="bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Recent Activity
          </h2>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Static Placeholder Data */}
              {[
                { id: 1, action: "New tournament 'Summer Cup 2026' was created.", time: "2 hours ago", color: "bg-blue-500" },
                { id: 2, action: "Team 'FC Falcons' registered for Summer Cup 2026.", time: "5 hours ago", color: "bg-purple-500" },
                { id: 3, action: "Match result: Tigers 2 - 1 Lions", time: "1 day ago", color: "bg-emerald-500" },
              ].map(item => (
                <div key={item.id} className="flex gap-4 relative">
                  <div className="absolute top-8 left-5 w-px h-full bg-slate-200 dark:bg-slate-700 -z-10 last:hidden"></div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 ${item.color}`}>
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="pt-2">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.action}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
