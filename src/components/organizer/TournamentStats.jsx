import React, { useState, useEffect, useCallback } from 'react';
import {
  Trophy, Shield, Star, ChevronDown, ChevronRight, ArrowLeft, Check,
  X, Search, Loader2, AlertCircle, RefreshCw, Award, Goal, Users
} from 'lucide-react';
import { tournamentService } from '../../services/tournamentService';
import { teamService } from '../../services/teamService';
import { playerService } from '../../services/playerService';
import { BestPlayerModal } from '../tournament/BestPlayerModal';

/* ─────────────────────────── helpers ─────────────────────────── */

const Avatar = ({ url, name, size = 'md' }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-16 h-16 text-base' };
  const initials = name
    ? name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  if (url) {
    return (
      <img
        src={url}
        alt={name || 'Player'}
        loading="lazy"
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-white dark:ring-slate-800 bg-slate-100 dark:bg-slate-800 flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0 ring-2 ring-white dark:ring-slate-800`}>
      {initials}
    </div>
  );
};

const StatCard = ({ icon: Icon, iconBg, label, children, isEmpty, emptyText, isLoading }) => (
  <div className="bg-white dark:bg-[#101C14] rounded-2xl border border-slate-200/80 dark:border-[#1E3A29] shadow-sm overflow-hidden flex flex-col">
    {/* Header */}
    <div className={`flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-[#1E3A29] ${iconBg}`}>
      <Icon className="w-4 h-4" />
      <h3 className="text-sm font-bold tracking-wide uppercase">{label}</h3>
    </div>

    {/* Body */}
    <div className="p-5 flex-1 flex items-center justify-center min-h-[120px]">
      {isLoading ? (
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-xs">Loading…</span>
        </div>
      ) : isEmpty ? (
        <div className="text-center text-slate-400 dark:text-slate-500 text-sm">
          <AlertCircle className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
          <p>{emptyText || 'No data yet'}</p>
        </div>
      ) : (
        children
      )}
    </div>
  </div>
);

/* ─────────────────── Main TournamentStats Component ──────────── */

export const TournamentStats = ({ tournamentId, tournaments = [], isOrganizer = true }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBPModalOpen, setIsBPModalOpen] = useState(false);

  const currentTournament = tournaments.find(t => t.id === tournamentId);

  const fetchStats = useCallback(async () => {
    if (!tournamentId) return;
    setLoading(true);
    setError('');
    try {
      const res = await tournamentService.getStatsOverview(tournamentId);
      setStats(res);
    } catch (err) {
      setError('Failed to load tournament statistics.');
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handlePlayerSaved = (savedBestPlayer) => {
    if (savedBestPlayer !== undefined) {
      setStats(prev => ({
        ...prev,
        bestPlayer: savedBestPlayer
      }));
    }
    fetchStats();
  };

  if (!tournamentId) {
    return (
      <div className="bg-white dark:bg-[#101C14] rounded-2xl border border-slate-200/80 dark:border-[#1E3A29] p-12 text-center">
        <Trophy className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">Select a tournament to view statistics.</p>
      </div>
    );
  }

  const topScorer = stats?.topScorer ?? null;
  const bestKeeper = stats?.bestKeeper ?? null;
  const bestPlayer = stats?.bestPlayer ?? null;

  return (
    <>
      <div className="space-y-5">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-500/20">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tournament Statistics</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentTournament?.name || 'Selected Tournament'} · Auto-calculated from match events
              </p>
            </div>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button onClick={fetchStats} className="ml-auto text-xs font-semibold underline hover:no-underline">Retry</button>
          </div>
        )}

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Top Scorer */}
          <StatCard
            icon={Trophy}
            iconBg="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
            label="🥇 Top Scorer"
            isLoading={loading}
            isEmpty={!topScorer}
            emptyText="No goals recorded yet"
          >
            {topScorer && (
              <div className="flex flex-col items-center text-center gap-3 w-full">
                <div className="relative">
                  <Avatar url={topScorer.player?.avatarUrl} name={topScorer.player?.fullName} size="lg" />
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-yellow-400 border-2 border-white dark:border-[#101C14] flex items-center justify-center">
                    <Trophy className="w-3 h-3 text-yellow-900" />
                  </span>
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {topScorer.player?.fullName}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[140px]">
                    {topScorer.team?.name || '—'}
                    {topScorer.player?.jerseyNumber != null && ` · #${topScorer.player.jerseyNumber}`}
                  </p>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700">
                  <span className="text-xl font-black text-yellow-600 dark:text-yellow-400">
                    {topScorer.goals}
                  </span>
                  <span className="text-xs font-semibold text-yellow-500 dark:text-yellow-500 ml-1.5">
                    {topScorer.goals === 1 ? 'goal' : 'goals'}
                  </span>
                </div>
              </div>
            )}
          </StatCard>

          {/* Best Keeper */}
          <StatCard
            icon={Shield}
            iconBg="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
            label="🧤 Best Keeper"
            isLoading={loading}
            isEmpty={!bestKeeper}
            emptyText="No clean sheets yet"
          >
            {bestKeeper && (
              <div className="flex flex-col items-center text-center gap-3 w-full">
                <div className="relative">
                  <Avatar url={bestKeeper.player?.avatarUrl} name={bestKeeper.player?.fullName} size="lg" />
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-400 border-2 border-white dark:border-[#101C14] flex items-center justify-center">
                    <Shield className="w-3.5 h-3.5 text-emerald-900" />
                  </span>
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {bestKeeper.player?.fullName}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[140px]">
                    {bestKeeper.team?.name || '—'}
                    {bestKeeper.player?.jerseyNumber != null && ` · #${bestKeeper.player.jerseyNumber}`}
                  </p>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700">
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {bestKeeper.cleanSheets}
                  </span>
                  <span className="text-xs font-semibold text-emerald-500 dark:text-emerald-500 ml-1.5">
                    {bestKeeper.cleanSheets === 1 ? 'clean sheet' : 'clean sheets'}
                  </span>
                </div>
              </div>
            )}
          </StatCard>

          {/* Best Player */}
          <StatCard
            icon={Star}
            iconBg="bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400"
            label="⭐ Best Player"
            isLoading={loading}
            isEmpty={!bestPlayer && !isOrganizer}
            emptyText="Not selected yet"
          >
            {bestPlayer ? (
              <div className="flex flex-col items-center text-center gap-3 w-full">
                <div className="relative">
                  <Avatar url={bestPlayer.avatarUrl} name={bestPlayer.fullName} size="lg" />
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-violet-400 border-2 border-white dark:border-[#101C14] flex items-center justify-center">
                    <Star className="w-3.5 h-3.5 text-violet-900" />
                  </span>
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {bestPlayer.fullName}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[160px]">
                    {bestPlayer.team?.name ? `${bestPlayer.team.name} · ` : ''}
                    {bestPlayer.preferredPosition || 'Player'}
                    {bestPlayer.jerseyNumber != null && ` · #${bestPlayer.jerseyNumber}`}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-700">
                  Organizer's Pick
                </span>
                {isOrganizer && (
                  <button
                    onClick={() => setIsBPModalOpen(true)}
                    className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-violet-500 transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                    Change selection
                  </button>
                )}
              </div>
            ) : isOrganizer ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center">
                  <Star className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No player selected</p>
                  <p className="text-xs text-slate-400 mt-0.5">Award the outstanding player of this tournament</p>
                </div>
                <button
                  onClick={() => setIsBPModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 rounded-xl shadow-sm shadow-violet-500/20 transition-all"
                >
                  <Star className="w-3.5 h-3.5" />
                  Select Best Player
                </button>
              </div>
            ) : null}
          </StatCard>
        </div>

        {/* Scorers Leaderboard mini-strip (if more than 1 scorer) */}
        {stats?.topScorer && stats?.leaderboard?.length > 1 && (
          <ScorersLeaderboard leaderboard={stats.leaderboard} />
        )}
      </div>

      {/* Best Player Modal */}
      <BestPlayerModal
        isOpen={isBPModalOpen}
        onClose={() => setIsBPModalOpen(false)}
        tournamentId={tournamentId}
        currentBestPlayer={bestPlayer}
        onSaved={handlePlayerSaved}
      />
    </>
  );
};

/* ──────────────── Scorers Leaderboard Strip ─────────────────── */

const ScorersLeaderboard = ({ leaderboard = [] }) => {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? leaderboard : leaderboard.slice(0, 5);

  return (
    <div className="bg-white dark:bg-[#101C14] rounded-2xl border border-slate-200/80 dark:border-[#1E3A29] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-[#1E3A29] bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          <h3 className="text-sm font-bold uppercase tracking-wide">Top Scorers Leaderboard</h3>
        </div>
        <span className="text-xs font-semibold text-yellow-500">{leaderboard.length} players</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="py-2.5 px-4 text-center w-12">#</th>
              <th className="py-2.5 px-4 text-left">Player</th>
              <th className="py-2.5 px-4 text-left hidden sm:table-cell">Team</th>
              <th className="py-2.5 px-4 text-center text-yellow-600 dark:text-yellow-400">Goals</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {shown.map((item, i) => {
              const isTop = i === 0;
              return (
                <tr key={item.player?.id || i} className={`transition-colors ${isTop ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                  <td className="py-3 px-4 text-center">
                    {isTop ? (
                      <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-yellow-400 text-yellow-900 text-[10px] font-black">1</span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">{i + 1}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar url={item.player?.avatarUrl} name={item.player?.fullName} size="sm" />
                      <div className="min-w-0">
                        <p className={`font-semibold text-sm truncate ${isTop ? 'text-yellow-700 dark:text-yellow-400' : 'text-slate-900 dark:text-white'}`}>
                          {item.player?.fullName}
                        </p>
                        {item.player?.jerseyNumber != null && (
                          <p className="text-[11px] text-slate-400">#{item.player.jerseyNumber}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px] block">{item.team?.name || '—'}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-black ${
                      isTop
                        ? 'bg-yellow-400 text-yellow-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      {item.goals}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {leaderboard.length > 5 && (
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs font-semibold text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors flex items-center gap-1 mx-auto"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            {expanded ? 'Show less' : `Show all ${leaderboard.length} scorers`}
          </button>
        </div>
      )}
    </div>
  );
};
