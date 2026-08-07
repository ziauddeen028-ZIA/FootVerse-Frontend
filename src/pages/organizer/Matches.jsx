import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, Calendar, MapPin, Edit2, Trash2, Trophy, Shield, Clock, Activity, Zap, Radio, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { Toast } from '../../components/common/Toast';
import { LoadingSkeleton } from '../../components/organizer/LoadingSkeleton';
import { MatchFormModal } from '../../components/organizer/MatchFormModal';

import { matchService } from '../../services/matchService';
import { tournamentService } from '../../services/tournamentService';
import { teamService } from '../../services/teamService';

export const Matches = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [tournamentFilter, setTournamentFilter] = useState('all');
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

      {/* Filters Bar */}
      <div className="bg-white dark:bg-[#141C2E] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search teams, venue, or tournament..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters & Sorting */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Tournament Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={tournamentFilter}
              onChange={e => setTournamentFilter(e.target.value)}
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

      {/* Matches Grid / Empty state */}
      {filteredMatches.length === 0 ? (
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
          {filteredMatches.map(match => (
            <div
              key={match.id}
              className="bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between"
            >
              {/* Top info: Tournament Name & Status */}
              <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 truncate">
                  <Trophy className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">
                    {match.tournament?.name || 'Tournament'}
                  </span>
                </div>
                <div>{getStatusBadge(match.status)}</div>
              </div>

              {/* Match Teams Visual */}
              <div className="py-5 grid grid-cols-7 items-center text-center">
                {/* Home Team */}
                <div className="col-span-3 flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                    {match.homeTeam?.logoUrl ? (
                      <img src={match.homeTeam.logoUrl} alt={match.homeTeam.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      match.homeTeam?.shortName || match.homeTeam?.name?.substring(0, 3).toUpperCase() || 'HOME'
                    )}
                  </div>
                  <span className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">
                    {match.homeTeam?.name || 'Home Team'}
                  </span>
                </div>

                {/* VS Indicator */}
                <div className="col-span-1 flex flex-col items-center">
                  <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg">
                    VS
                  </span>
                </div>

                {/* Away Team */}
                <div className="col-span-3 flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">
                    {match.awayTeam?.logoUrl ? (
                      <img src={match.awayTeam.logoUrl} alt={match.awayTeam.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      match.awayTeam?.shortName || match.awayTeam?.name?.substring(0, 3).toUpperCase() || 'AWAY'
                    )}
                  </div>
                  <span className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">
                    {match.awayTeam?.name || 'Away Team'}
                  </span>
                </div>
              </div>

              {/* Bottom Info & Quick Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatMatchDateTime(match.matchDate)}</span>
                  </div>
                  {match.venue && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-[140px]">{match.venue}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  {/* Scheduled matches → Manage Live */}
                  {match.status === 'scheduled' && (
                    <button
                      onClick={() => navigate(`/organizer/matches/${match.id}/live`)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                      title="Manage Live Match"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Manage Live
                    </button>
                  )}
                  {/* Live matches → View Live */}
                  {match.status === 'live' && (
                    <button
                      onClick={() => navigate(`/organizer/matches/${match.id}/live`)}
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
                      onClick={() => navigate(`/organizer/matches/${match.id}/live`)}
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
                      onClick={() => navigate(`/organizer/matches/${match.id}/live?readonly=true`)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                      title="View Match Summary"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Summary
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenEdit(match)}
                    className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Edit Match"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenDelete(match)}
                    className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Delete Match"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
            ? `Are you sure you want to delete the match between ${selectedMatch.homeTeam?.name || 'Home Team'} and ${selectedMatch.awayTeam?.name || 'Away Team'}? This action cannot be undone.`
            : 'Are you sure you want to delete this match?'
        }
        confirmLabel="Delete Match"
        isLoading={isSubmitting}
        isDestructive={true}
      />
    </div>
  );
};
