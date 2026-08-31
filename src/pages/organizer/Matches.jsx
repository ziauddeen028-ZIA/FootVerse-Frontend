import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, Calendar, MapPin, Edit2, Trash2, Trophy, Shield, Clock, Activity, Zap, Radio, FileText, LayoutGrid, GitBranch, Table } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { Toast } from '../../components/common/Toast';
import { LoadingSkeleton } from '../../components/organizer/LoadingSkeleton';
import { MatchFormModal } from '../../components/organizer/MatchFormModal';
import { KnockoutBracket } from '../../components/organizer/KnockoutBracket';
import { LeagueDashboard } from '../../components/organizer/LeagueDashboard';

import { matchService } from '../../services/matchService';
import { tournamentService } from '../../services/tournamentService';
import { teamService } from '../../services/teamService';

export const Matches = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTournament = searchParams.get('tournament') || 'all';
  const initialView = searchParams.get('view') === 'bracket' 
    ? 'bracket' 
    : searchParams.get('view') === 'league' 
    ? 'league' 
    : 'list';

  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View state (List vs Knockout Bracket)
  const [viewMode, setViewMode] = useState(initialView);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [tournamentFilter, setTournamentFilter] = useState(initialTournament);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('date_asc');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast state
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [matchesRes, tournamentsRes, teamsRes] = await Promise.all([
        matchService.getAll(),
        tournamentService.getAll(),
        teamService.getAll()
      ]);

      setMatches(matchesRes.matches || []);
      setTournaments(tournamentsRes.tournaments || []);
      setTeams(teamsRes.teams || []);
    } catch (err) {
      console.error('Failed to fetch match data:', err);
      setError('Failed to load matches, tournaments, or teams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync tournamentFilter from searchParams when searchParams change (e.g. returning from LiveMatch)
  useEffect(() => {
    const tParam = searchParams.get('tournament');
    if (tParam && tParam !== tournamentFilter) {
      setTournamentFilter(tParam);
    }
  }, [searchParams]);

  // Selected tournament object helper
  const selectedTournamentObj = useMemo(() => {
    if (!tournamentFilter || tournamentFilter === 'all') return null;
    return tournaments.find(t => t.id === tournamentFilter) || null;
  }, [tournamentFilter, tournaments]);

  // Disabled states for view controls
  const isBracketDisabled = useMemo(() => {
    if (tournamentFilter === 'all') return true;
    if (selectedTournamentObj?.format === 'league') return true;
    return false;
  }, [tournamentFilter, selectedTournamentObj]);

  const isLeagueDisabled = useMemo(() => {
    if (tournamentFilter === 'all') return true;
    if (selectedTournamentObj?.format === 'knockout') return true;
    return false;
  }, [tournamentFilter, selectedTournamentObj]);

  // Automatically adapt view mode based on selected tournament format
  useEffect(() => {
    if (tournamentFilter === 'all') {
      if (viewMode !== 'list') setViewMode('list');
    } else if (selectedTournamentObj) {
      const format = selectedTournamentObj.format;
      if (format === 'knockout' && viewMode === 'league') {
        setViewMode('bracket');
      } else if (format === 'league' && viewMode === 'bracket') {
        setViewMode('league');
      }
    }
  }, [tournamentFilter, selectedTournamentObj, viewMode]);

  // Derived state (Filtering and Sorting)
  const filteredMatches = useMemo(() => {
    let result = [...matches];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(m => {
        const homeName = m.homeTeam?.name?.toLowerCase() || '';
        const homeShort = m.homeTeam?.shortName?.toLowerCase() || '';
        const awayName = m.awayTeam?.name?.toLowerCase() || '';
        const awayShort = m.awayTeam?.shortName?.toLowerCase() || '';
        const venue = m.venue?.toLowerCase() || '';
        const tourneyName = m.tournament?.name?.toLowerCase() || '';
        return (
          homeName.includes(q) ||
          homeShort.includes(q) ||
          awayName.includes(q) ||
          awayShort.includes(q) ||
          venue.includes(q) ||
          tourneyName.includes(q)
        );
      });
    }

    // Tournament filter
    if (tournamentFilter !== 'all') {
      result = result.filter(
        m => m.tournamentId === tournamentFilter || m.tournament?.id === tournamentFilter
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(m => m.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    // Sorting
    result.sort((a, b) => {
      const dateA = new Date(a.matchDate || 0).getTime();
      const dateB = new Date(b.matchDate || 0).getTime();

      if (sortOrder === 'date_asc') {
        return dateA - dateB;
      }
      if (sortOrder === 'date_desc') {
        return dateB - dateA;
      }
      if (sortOrder === 'status') {
        return (a.status || '').localeCompare(b.status || '');
      }
      return 0;
    });

    return result;
  }, [matches, searchQuery, tournamentFilter, statusFilter, sortOrder]);

  // Actions
  const handleOpenCreate = () => {
    setSelectedMatch(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (match) => {
    setSelectedMatch(match);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (match) => {
    setSelectedMatch(match);
    setIsConfirmOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (selectedMatch) {
        // Edit match
        const res = await matchService.update(selectedMatch.id, formData);
        showToast(res.message || 'Match updated successfully!');
        
        // Optimistic update
        setMatches(prev =>
          prev.map(m => (m.id === selectedMatch.id ? { ...m, ...res.match } : m))
        );
      } else {
        // Create match
        const res = await matchService.create(formData);
        showToast(res.message || 'Match scheduled successfully!');

        if (res.match) {
          setMatches(prev => [...prev, res.match]);
        }
      }
      setIsFormOpen(false);
      fetchData(); // Refresh to ensure complete populated relations
    } catch (err) {
      console.error('Error saving match:', err);
      showToast(err.response?.data?.error || 'Failed to save match. Please check inputs.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMatch) return;
    setIsSubmitting(true);
    try {
      await matchService.delete(selectedMatch.id);
      showToast('Match deleted successfully!');
      setMatches(prev => prev.filter(m => m.id !== selectedMatch.id));
      setIsConfirmOpen(false);
      setSelectedMatch(null);
    } catch (err) {
      console.error('Error deleting match:', err);
      showToast(err.response?.data?.error || 'Failed to delete match.', 'error');
    } finally {
      setIsSubmitting(false);
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'live':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            LIVE
          </span>
        );
      case 'halftime':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            HALF TIME
          </span>
        );
      case 'completed':
      case 'fulltime':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="text-xs">✅</span>
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Cancelled
          </span>
        );
      case 'scheduled':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            Scheduled
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Matches"
          subtitle="Schedule, edit, and organize tournament fixtures."
        />
        <LoadingSkeleton type="card" count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Header */}
      <PageHeader
        title="Matches"
        subtitle="Manage and organize all tournament fixtures and game schedules."
        actionLabel="Create Match"
        actionIcon={Plus}
        onAction={handleOpenCreate}
      />

      {/* Filters Bar & View Switcher */}
      <div className="bg-white dark:bg-[#141C2E] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search teams, venue, or tournament..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters, View Switcher & Sorting */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setViewMode('list');
                setSearchParams(prev => {
                  const n = new URLSearchParams(prev);
                  n.delete('view');
                  return n;
                });
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="List View (All Fixtures)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>

            <button
              type="button"
              disabled={isBracketDisabled}
              onClick={() => {
                if (isBracketDisabled) return;
                setViewMode('bracket');
                setSearchParams(prev => {
                  const n = new URLSearchParams(prev);
                  n.set('view', 'bracket');
                  return n;
                });
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isBracketDisabled
                  ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-600'
                  : viewMode === 'bracket'
                  ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/20'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={
                tournamentFilter === 'all'
                  ? 'Select a specific tournament to view bracket'
                  : isBracketDisabled
                  ? 'Knockout bracket not applicable for league format'
                  : 'Knockout Bracket View'
              }
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Knockout Bracket</span>
            </button>

            <button
              type="button"
              disabled={isLeagueDisabled}
              onClick={() => {
                if (isLeagueDisabled) return;
                setViewMode('league');
                setSearchParams(prev => {
                  const n = new URLSearchParams(prev);
                  n.set('view', 'league');
                  return n;
                });
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isLeagueDisabled
                  ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-600'
                  : viewMode === 'league'
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={
                tournamentFilter === 'all'
                  ? 'Select a specific tournament to view standings'
                  : isLeagueDisabled
                  ? 'Standings table not applicable for knockout format'
                  : 'League / Group Standings View'
              }
            >
              <Table className="w-3.5 h-3.5" />
              <span>League Table</span>
            </button>
          </div>

          {/* Tournament Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={tournamentFilter}
              onChange={e => {
                const val = e.target.value;
                setTournamentFilter(val);
                const selectedTourney = tournaments.find(t => t.id === val);
                let targetView = viewMode;

                if (val === 'all') {
                  targetView = 'list';
                  setViewMode('list');
                } else if (selectedTourney?.format === 'knockout') {
                  if (viewMode === 'league') {
                    targetView = 'bracket';
                    setViewMode('bracket');
                  }
                } else if (selectedTourney?.format === 'league') {
                  if (viewMode === 'bracket') {
                    targetView = 'league';
                    setViewMode('league');
                  }
                }

                setSearchParams(prev => {
                  const n = new URLSearchParams(prev);
                  if (val === 'all') {
                    n.delete('tournament');
                    n.delete('view');
                  } else {
                    n.set('tournament', val);
                    if (targetView !== 'list') n.set('view', targetView);
                    else n.delete('view');
                  }
                  return n;
                });
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tournaments</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Sort */}
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date_asc">Date (Earliest First)</option>
            <option value="date_desc">Date (Latest First)</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Content Rendering: Bracket View vs League View vs List View */}
      {viewMode === 'bracket' ? (
        <KnockoutBracket
          matches={matches}
          tournaments={tournaments}
          selectedTournamentId={tournamentFilter}
          onSelectTournament={(tId) => {
            setTournamentFilter(tId);
            setSearchParams(prev => {
              const n = new URLSearchParams(prev);
              if (tId === 'all') n.delete('tournament');
              else n.set('tournament', tId);
              return n;
            });
          }}
        />
      ) : viewMode === 'league' ? (
        <LeagueDashboard
          matches={matches}
          tournaments={tournaments}
          teams={teams}
          selectedTournamentId={tournamentFilter}
          onSelectTournament={(tId) => {
            setTournamentFilter(tId);
            setSearchParams(prev => {
              const n = new URLSearchParams(prev);
              if (tId === 'all') n.delete('tournament');
              else n.set('tournament', tId);
              return n;
            });
          }}
          onOpenCreateMatch={handleOpenCreate}
          onOpenEditMatch={handleOpenEdit}
          onOpenDeleteMatch={handleOpenDelete}
          onRefresh={fetchData}
        />
      ) : (
        /* Matches Grid / Empty state */
        filteredMatches.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title={searchQuery || tournamentFilter !== 'all' || statusFilter !== 'all' ? 'No matches found' : 'No matches scheduled'}
            description={
              searchQuery || tournamentFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or clear active filters.'
                : 'Start by scheduling your first fixture using the button above.'
            }
            actionLabel={!searchQuery && tournamentFilter === 'all' && statusFilter === 'all' ? 'Create Match' : undefined}
            onAction={!searchQuery && tournamentFilter === 'all' && statusFilter === 'all' ? handleOpenCreate : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMatches.map(match => {
            const isCompleted = match.status?.toLowerCase() === 'completed' || match.status?.toLowerCase() === 'fulltime';
            const isLiveOrHalftime = match.status?.toLowerCase() === 'live' || match.status?.toLowerCase() === 'halftime';
            const hasScores = match.homeScore !== undefined && match.awayScore !== undefined && match.homeScore !== null && match.awayScore !== null;
            const isDraw = isCompleted && ((match.homeScore ?? 0) === (match.awayScore ?? 0)) && !match.winnerTeamId;
            const isHomeWinner = isCompleted && (
              ((match.homeScore ?? 0) > (match.awayScore ?? 0)) ||
              (Boolean(match.winnerTeamId) && match.winnerTeamId === match.homeTeamId)
            );
            const isAwayWinner = isCompleted && (
              ((match.awayScore ?? 0) > (match.homeScore ?? 0)) ||
              (Boolean(match.winnerTeamId) && match.winnerTeamId === match.awayTeamId)
            );

            return (
              <div
                key={match.id}
                className="bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between"
              >
                {/* Top info: Tournament Name & Status */}
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                    <Trophy className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">
                      {match.tournament?.name || 'Tournament'}
                    </span>
                    {match.roundName && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                        {match.roundName}
                      </span>
                    )}
                  </div>
                  <div className="shrink-0">{getStatusBadge(match.status)}</div>
                </div>

                {/* Match Teams Visual */}
                <div className="py-5 grid grid-cols-7 items-center text-center">
                  {/* Home Team */}
                  <div className={`col-span-3 flex flex-col items-center gap-2 transition-all ${isAwayWinner ? 'opacity-55' : 'opacity-100'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                      isHomeWinner
                        ? 'bg-blue-500/20 dark:bg-blue-500/30 border-2 border-emerald-500/70 dark:border-emerald-400/80 ring-2 ring-emerald-500/20 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400'
                    }`}>
                      {match.homeTeam?.logoUrl ? (
                        <img src={match.homeTeam.logoUrl} alt={match.homeTeam.name || 'Home Team'} className="w-full h-full object-cover rounded-xl" />
                      ) : match.homeTeam?.shortName || match.homeTeam?.name ? (
                        match.homeTeam?.shortName || match.homeTeam?.name?.substring(0, 3).toUpperCase()
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold tracking-wider">TBD</span>
                      )}
                    </div>
                    <span className={`text-sm line-clamp-1 ${
                      isHomeWinner
                        ? 'font-bold text-slate-900 dark:text-white'
                        : match.homeTeam?.name
                        ? isAwayWinner
                          ? 'font-medium text-slate-500 dark:text-slate-400'
                          : 'font-semibold text-slate-900 dark:text-white'
                        : 'text-slate-400 dark:text-slate-500 italic'
                    }`}>
                      {match.homeTeam?.name || 'TBD'}
                    </span>
                  </div>

                  {/* VS / Score Indicator */}
                  <div className="col-span-1 flex flex-col items-center gap-0.5">
                    {isCompleted || isLiveOrHalftime || hasScores ? (
                      <>
                        <span className="text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800/90 px-2.5 py-1 rounded-lg tabular-nums tracking-wide">
                          {match.homeScore ?? 0} : {match.awayScore ?? 0}
                        </span>
                        {match.tieBreakMethod === 'penalty' && match.homePenaltyScore !== null && match.homePenaltyScore !== undefined && (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                            ({match.homePenaltyScore}–{match.awayPenaltyScore}P)
                          </span>
                        )}
                        {match.tieBreakMethod === 'toss' && (
                          <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                            Toss
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg">
                        VS
                      </span>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className={`col-span-3 flex flex-col items-center gap-2 transition-all ${isHomeWinner ? 'opacity-55' : 'opacity-100'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                      isAwayWinner
                        ? 'bg-purple-500/20 dark:bg-purple-500/30 border-2 border-emerald-500/70 dark:border-emerald-400/80 ring-2 ring-emerald-500/20 text-purple-600 dark:text-purple-400 shadow-sm'
                        : 'bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30 text-purple-600 dark:text-purple-400'
                    }`}>
                      {match.awayTeam?.logoUrl ? (
                        <img src={match.awayTeam.logoUrl} alt={match.awayTeam.name || 'Away Team'} className="w-full h-full object-cover rounded-xl" />
                      ) : match.awayTeam?.shortName || match.awayTeam?.name ? (
                        match.awayTeam?.shortName || match.awayTeam?.name?.substring(0, 3).toUpperCase()
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold tracking-wider">TBD</span>
                      )}
                    </div>
                    <span className={`text-sm line-clamp-1 ${
                      isAwayWinner
                        ? 'font-bold text-slate-900 dark:text-white'
                        : match.awayTeam?.name
                        ? isHomeWinner
                          ? 'font-medium text-slate-500 dark:text-slate-400'
                          : 'font-semibold text-slate-900 dark:text-white'
                        : 'text-slate-400 dark:text-slate-500 italic'
                    }`}>
                      {match.awayTeam?.name || 'TBD'}
                    </span>
                  </div>
                </div>

                {/* Bottom Info & Quick Actions */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formatMatchDateTime(match.matchDate)}</span>
                    </div>
                    {match.venue && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[140px] sm:max-w-[180px]">{match.venue}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100/60 dark:border-slate-800/60">
                    <div className="flex items-center gap-1.5">
                      {/* Scheduled matches → Manage Live (only if both teams are assigned) */}
                      {match.status === 'scheduled' && (
                        (match.homeTeamId && match.awayTeamId && match.homeTeam && match.awayTeam) ? (
                          <button
                            onClick={() => {
                              const tId = match.tournamentId || match.tournament?.id || tournamentFilter;
                              const tourneyParam = tId && tId !== 'all' ? `?tournament=${tId}` : '';
                              navigate(`/organizer/matches/${match.id}/live${tourneyParam}`);
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                            title="Manage Live Match"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            Manage Live
                          </button>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 rounded-lg cursor-not-allowed border border-slate-200/50 dark:border-slate-700/50"
                            title="Both teams must qualify before this match can be started"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            Teams TBD
                          </span>
                        )
                      )}
                      {/* Live matches → View Live */}
                      {match.status === 'live' && (
                        <button
                          onClick={() => {
                            const tId = match.tournamentId || match.tournament?.id || tournamentFilter;
                            const tourneyParam = tId && tId !== 'all' ? `?tournament=${tId}` : '';
                            navigate(`/organizer/matches/${match.id}/live${tourneyParam}`);
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                          title="View Live Match"
                        >
                          <Radio className="w-3.5 h-3.5 animate-pulse" />
                          View Live
                        </button>
                      )}
                      {/* Halftime matches → Resume Match */}
                      {match.status === 'halftime' && (
                        <button
                          onClick={() => {
                            const tId = match.tournamentId || match.tournament?.id || tournamentFilter;
                            const tourneyParam = tId && tId !== 'all' ? `?tournament=${tId}` : '';
                            navigate(`/organizer/matches/${match.id}/live${tourneyParam}`);
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                          title="Resume Match"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          Resume Match
                        </button>
                      )}
                      {/* Completed / Fulltime matches → View Summary (read-only) */}
                      {(match.status === 'completed' || match.status === 'fulltime') && (
                        <button
                          onClick={() => {
                            const tId = match.tournamentId || match.tournament?.id || tournamentFilter;
                            const tourneyParam = tId && tId !== 'all' ? `?tournament=${tId}` : '';
                            const readOnlyParam = tourneyParam ? '&readonly=true' : '?readonly=true';
                            navigate(`/organizer/matches/${match.id}/live${tourneyParam}${readOnlyParam}`);
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                          title="View Match Summary"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View Summary
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(match)}
                        className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Match"
                        aria-label="Edit Match"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(match)}
                        className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Delete Match"
                        aria-label="Delete Match"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )
    )}

      {/* Match Form Modal */}
      <MatchFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedMatch}
        tournaments={tournaments}
        teams={teams}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Match"
        message={
          selectedMatch
            ? `Are you sure you want to delete the match between ${selectedMatch.homeTeam?.name || 'TBD'} and ${selectedMatch.awayTeam?.name || 'TBD'}? This action cannot be undone.`
            : 'Are you sure you want to delete this match?'
        }
        confirmLabel="Delete Match"
        isLoading={isSubmitting}
        isDestructive={true}
      />
    </div>
  );
};
