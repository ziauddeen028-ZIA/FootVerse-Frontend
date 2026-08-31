import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Calendar, 
  Users, 
  Sparkles, 
  Zap, 
  Radio, 
  FileText, 
  Clock, 
  MapPin, 
  Edit2, 
  Trash2, 
  Plus, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  Activity,
  AlertCircle,
  Flame,
  BarChart2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LeagueStandings } from './LeagueStandings';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Toast } from '../common/Toast';
import { tournamentService } from '../../services/tournamentService';
import { matchService } from '../../services/matchService';

export const LeagueDashboard = ({
  selectedTournamentId = null,
  tournaments = [],
  matches = [],
  teams = [],
  onSelectTournament,
  onOpenCreateMatch,
  onOpenEditMatch,
  onOpenDeleteMatch,
  onRefresh
}) => {
  const navigate = useNavigate();

  // Standings state
  const [standingsData, setStandingsData] = useState({ standings: [] });
  const [loadingStandings, setLoadingStandings] = useState(false);
  const [activeMatchday, setActiveMatchday] = useState('all');

  // Fixture generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Find active tournament details
  const currentTournament = useMemo(() => {
    if (!selectedTournamentId || selectedTournamentId === 'all') {
      // Find the first league tournament if available
      return tournaments.find(t => t.format === 'league') || tournaments[0] || null;
    }
    return tournaments.find(t => t.id === selectedTournamentId) || null;
  }, [selectedTournamentId, tournaments]);

  const activeId = currentTournament?.id || null;

  // Filter matches for current tournament
  const tournamentMatches = useMemo(() => {
    if (!activeId) return [];
    return matches.filter(m => m.tournamentId === activeId || m.tournament?.id === activeId);
  }, [matches, activeId]);

  // Filter teams for current tournament
  const tournamentTeams = useMemo(() => {
    if (!activeId) return [];
    return teams.filter(t => t.tournamentId === activeId || t.tournament?.id === activeId);
  }, [teams, activeId]);

  // Fetch standings when active tournament changes
  const fetchStandings = async (tourneyId) => {
    if (!tourneyId) return;
    try {
      setLoadingStandings(true);
      const res = await tournamentService.getStandings(tourneyId);
      let flatStandings = res.standings || [];
      if (res.groups && res.groups.length > 0 && flatStandings.length === 0) {
        // Flatten all groups into a single sorted league table
        const combined = res.groups.flatMap(g => g.standings || []);
        combined.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
          if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
          if (b.won !== a.won) return b.won - a.won;
          return (a.team?.name || '').localeCompare(b.team?.name || '');
        });
        flatStandings = combined.map((entry, idx) => ({
          ...entry,
          position: idx + 1
        }));
      }
      setStandingsData({
        standings: flatStandings
      });
    } catch (err) {
      console.error('Failed to fetch league standings:', err);
    } finally {
      setLoadingStandings(false);
    }
  };

  useEffect(() => {
    if (activeId) {
      fetchStandings(activeId);
    }
  }, [activeId, matches]);

  // Group matches by roundName / Matchday
  const matchdays = useMemo(() => {
    const map = {};
    for (const m of tournamentMatches) {
      const name = m.roundName || 'Unassigned';
      if (!map[name]) map[name] = [];
      map[name].push(m);
    }
    // Sort matchdays naturally (Matchday 1, Matchday 2, ...)
    const sortedKeys = Object.keys(map).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );
    return { map, keys: sortedKeys };
  }, [tournamentMatches]);

  // Filter matches by active matchday
  const displayedMatches = useMemo(() => {
    if (activeMatchday === 'all') {
      return tournamentMatches;
    }
    return matchdays.map[activeMatchday] || [];
  }, [tournamentMatches, matchdays, activeMatchday]);

  // League Progress Statistics
  const stats = useMemo(() => {
    const total = tournamentMatches.length;
    const completed = tournamentMatches.filter(
      m => m.status === 'completed' || m.status === 'fulltime'
    ).length;
    const live = tournamentMatches.filter(
      m => m.status === 'live' || m.status === 'halftime'
    ).length;
    const scheduled = total - completed - live;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Get leader
    const leader = standingsData.standings[0] || null;

    return { total, completed, live, scheduled, percentage, leader };
  }, [tournamentMatches, standingsData]);

  // Handle generating fixtures
  const handleGenerateFixtures = async () => {
    if (!activeId) return;
    setIsGenerating(true);
    try {
      const res = await tournamentService.generateLeagueFixtures(activeId);
      showToast(res.message || 'Round-robin fixtures generated successfully!');
      setIsConfirmOpen(false);
      if (onRefresh) await onRefresh();
      await fetchStandings(activeId);
    } catch (err) {
      console.error('Error generating fixtures:', err);
      const errMsg = err.response?.data?.error || err.message || 'Failed to generate league fixtures.';
      showToast(errMsg, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatMatchDateTime = (dateStr) => {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'TBD';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'live':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            LIVE
          </span>
        );
      case 'halftime':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            HT
          </span>
        );
      case 'completed':
      case 'fulltime':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            FT
          </span>
        );
      case 'scheduled':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            Scheduled
          </span>
        );
    }
  };

  // If no league tournaments exist at all
  const leagueTournaments = tournaments.filter(t => t.format === 'league');

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Tournament Selector Header Bar */}
      <div className="bg-white dark:bg-[#141C2E] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {currentTournament?.name || 'Select League Tournament'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                League Format
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {currentTournament?.location ? `📍 ${currentTournament.location}` : 'Manage league table and matchday schedules'}
            </p>
          </div>
        </div>

        {/* Dropdown switch & actions */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={activeId || ''}
            onChange={(e) => onSelectTournament && onSelectTournament(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:flex-none"
          >
            {leagueTournaments.length > 0 ? (
              leagueTournaments.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.status})
                </option>
              ))
            ) : (
              tournaments.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.format})
                </option>
              ))
            )}
          </select>

          {/* Quick Schedule match button */}
          {onOpenCreateMatch && (
            <button
              onClick={onOpenCreateMatch}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm shadow-blue-600/20 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Match</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress & Overview KPI Bar */}
      {currentTournament && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-[#141C2E] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
              <span>Teams</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">
              {tournamentTeams.length} <span className="text-xs font-normal text-slate-400">/ {currentTournament.maxTeams || 16} max</span>
            </p>
          </div>

          <div className="bg-white dark:bg-[#141C2E] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
              <span>Matchdays</span>
              <Calendar className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">
              {matchdays.keys.length} <span className="text-xs font-normal text-slate-400">rounds</span>
            </p>
          </div>

          <div className="bg-white dark:bg-[#141C2E] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
              <span>Played</span>
              <CheckCircle2 className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">
              {stats.completed} <span className="text-xs font-normal text-slate-400">/ {stats.total} ({stats.percentage}%)</span>
            </p>
          </div>

          <div className="bg-white dark:bg-[#141C2E] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
              <span>League Leader</span>
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {stats.leader?.team?.name || 'TBD'}
            </p>
            {stats.leader && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold">
                {stats.leader.points} pts ({stats.leader.won}W - {stats.leader.drawn}D)
              </span>
            )}
          </div>
        </div>
      )}

      {/* No Fixtures Alert / Generate CTA */}
      {tournamentMatches.length === 0 && (
        <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-blue-600/5 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-slate-900 border border-blue-200 dark:border-blue-800/80 rounded-2xl p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-600/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Generate Full League Schedule
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Automatically create round-robin pairings where every registered team plays each other across structured matchdays.
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
              {tournamentTeams.length} teams currently registered
            </p>
          </div>

          <button
            onClick={() => setIsConfirmOpen(true)}
            disabled={tournamentTeams.length < 2 || isGenerating}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-md ${
              tournamentTeams.length >= 2
                ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30 hover:scale-105'
                : 'bg-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isGenerating
                ? 'Generating...'
                : tournamentTeams.length < 2
                ? 'Register at least 2 teams first'
                : 'Generate League Fixtures'}
            </span>
          </button>
        </div>
      )}

      {/* Standings Table Component */}
      <LeagueStandings
        standings={standingsData.standings}
        tournamentName={currentTournament?.name}
        isLoading={loadingStandings}
      />

      {/* Matchday Fixtures Section */}
      {tournamentMatches.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#141C2E] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                League Fixtures
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {displayedMatches.length} matches
              </span>
            </div>

            {/* Matchday Filter Tabs */}
            {matchdays.keys.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none max-w-full">
                <button
                  type="button"
                  onClick={() => setActiveMatchday('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    activeMatchday === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All Fixtures
                </button>
                {matchdays.keys.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setActiveMatchday(day)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      activeMatchday === day
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Matches Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {displayedMatches.map((match) => {
              const isCompleted = match.status === 'completed' || match.status === 'fulltime';
              const isLive = match.status === 'live' || match.status === 'halftime';
              const hasScores = match.homeScore !== null && match.awayScore !== null;
              const isHomeWinner = isCompleted && ((match.homeScore ?? 0) > (match.awayScore ?? 0));
              const isAwayWinner = isCompleted && ((match.awayScore ?? 0) > (match.homeScore ?? 0));

              return (
                <div
                  key={match.id}
                  className="bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  {/* Top Bar: Round Name & Status */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                      {match.roundName || 'League Match'}
                    </span>
                    <div>{getStatusBadge(match.status)}</div>
                  </div>

                  {/* Match Teams Visual */}
                  <div className="py-4 grid grid-cols-7 items-center text-center">
                    {/* Home Team */}
                    <div className={`col-span-3 flex flex-col items-center gap-1.5 ${isAwayWinner ? 'opacity-55' : 'opacity-100'}`}>
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                        isHomeWinner
                          ? 'bg-blue-500/20 border-2 border-emerald-500 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {match.homeTeam?.logoUrl ? (
                          <img src={match.homeTeam.logoUrl} alt={match.homeTeam.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          match.homeTeam?.shortName || match.homeTeam?.name?.substring(0, 3).toUpperCase() || 'HOM'
                        )}
                      </div>
                      <span className={`text-xs sm:text-sm line-clamp-1 ${isHomeWinner ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                        {match.homeTeam?.name || 'TBD'}
                      </span>
                    </div>

                    {/* VS / Score Indicator */}
                    <div className="col-span-1 flex flex-col items-center">
                      {isCompleted || isLive || hasScores ? (
                        <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg tabular-nums">
                          {match.homeScore ?? 0} : {match.awayScore ?? 0}
                        </span>
                      ) : (
                        <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg">
                          VS
                        </span>
                      )}
                    </div>

                    {/* Away Team */}
                    <div className={`col-span-3 flex flex-col items-center gap-1.5 ${isHomeWinner ? 'opacity-55' : 'opacity-100'}`}>
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                        isAwayWinner
                          ? 'bg-purple-500/20 border-2 border-emerald-500 text-purple-600 dark:text-purple-400 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {match.awayTeam?.logoUrl ? (
                          <img src={match.awayTeam.logoUrl} alt={match.awayTeam.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          match.awayTeam?.shortName || match.awayTeam?.name?.substring(0, 3).toUpperCase() || 'AWA'
                        )}
                      </div>
                      <span className={`text-xs sm:text-sm line-clamp-1 ${isAwayWinner ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                        {match.awayTeam?.name || 'TBD'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Bar: Schedule Info & Action buttons */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatMatchDateTime(match.matchDate)}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto">
                      {match.status === 'scheduled' && (
                        <button
                          onClick={() => navigate(`/organizer/matches/${match.id}/live`)}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Manage Live</span>
                        </button>
                      )}

                      {match.status === 'live' && (
                        <button
                          onClick={() => navigate(`/organizer/matches/${match.id}/live`)}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        >
                          <Radio className="w-3.5 h-3.5 animate-pulse" />
                          <span>Live Console</span>
                        </button>
                      )}

                      {(match.status === 'completed' || match.status === 'fulltime') && (
                        <button
                          onClick={() => navigate(`/organizer/matches/${match.id}/live?readonly=true`)}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Summary</span>
                        </button>
                      )}

                      {/* Edit & Delete */}
                      <div className="flex items-center gap-1 ml-1">
                        {onOpenEditMatch && (
                          <button
                            onClick={() => onOpenEditMatch(match)}
                            className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Match"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onOpenDeleteMatch && (
                          <button
                            onClick={() => onOpenDeleteMatch(match)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Delete Match"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Fixture Generation */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Generate Round-Robin League Fixtures"
        message={`Are you sure you want to generate all league fixtures for "${currentTournament?.name}"? This will pair every registered team against one another across structured matchdays.`}
        confirmLabel="Generate Schedule"
        onConfirm={handleGenerateFixtures}
        onCancel={() => setIsConfirmOpen(false)}
        isLoading={isGenerating}
      />
    </div>
  );
};
