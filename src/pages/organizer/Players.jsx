import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, User, Trophy, Shield, Hash, Target, Mail } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { Toast } from '../../components/common/Toast';
import { LoadingSkeleton } from '../../components/organizer/LoadingSkeleton';
import { PlayerFormModal } from '../../components/organizer/PlayerFormModal';

import { playerService } from '../../services/playerService';
import { teamService } from '../../services/teamService';
import { tournamentService } from '../../services/tournamentService';

export const Players = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [tournamentFilter, setTournamentFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
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
      const [playersRes, teamsRes, tournamentsRes] = await Promise.all([
        playerService.getAll(),
        teamService.getAll(),
        tournamentService.getAll()
      ]);
      setPlayers(playersRes.teamMembers || []);
      setTeams(teamsRes.teams || []);
      setTournaments(tournamentsRes.tournaments || []);
    } catch (err) {
      setError('Failed to load players, teams, or tournaments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter teams dropdown based on selected tournament filter
  const availableTeamFilters = useMemo(() => {
    if (tournamentFilter === 'all') return teams;
    return teams.filter(t => t.tournamentId === tournamentFilter || t.tournament?.id === tournamentFilter);
  }, [teams, tournamentFilter]);

  // Derived state (Filtering and Sorting)
  const filteredPlayers = useMemo(() => {
    let result = [...players];

    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        p =>
          p.player?.fullName?.toLowerCase().includes(q) ||
          p.player?.email?.toLowerCase().includes(q) ||
          String(p.jerseyNumber).includes(q) ||
          p.position?.toLowerCase().includes(q) ||
          p.team?.name?.toLowerCase().includes(q) ||
          p.team?.tournament?.name?.toLowerCase().includes(q)
      );
    }

    // Tournament filter
    if (tournamentFilter !== 'all') {
      result = result.filter(
        p => p.team?.tournamentId === tournamentFilter || p.team?.tournament?.id === tournamentFilter
      );
    }

    // Team filter
    if (teamFilter !== 'all') {
      result = result.filter(p => p.teamId === teamFilter || p.team?.id === teamFilter);
    }

    // Sort
    result.sort((a, b) => {
      const nameA = a.player?.fullName || '';
      const nameB = b.player?.fullName || '';

      if (sortOrder === 'newest') {
        return new Date(b.joinedAt || 0).getTime() - new Date(a.joinedAt || 0).getTime();
      }
      if (sortOrder === 'oldest') {
        return new Date(a.joinedAt || 0).getTime() - new Date(b.joinedAt || 0).getTime();
      }
      if (sortOrder === 'name_asc') {
        return nameA.localeCompare(nameB);
      }
      if (sortOrder === 'name_desc') {
        return nameB.localeCompare(nameA);
      }
      return 0;
    });

    return result;
  }, [players, searchQuery, tournamentFilter, teamFilter, sortOrder]);

  // Handle Tournament Filter Change
  const handleTournamentFilterChange = (e) => {
    const val = e.target.value;
    setTournamentFilter(val);
    setTeamFilter('all'); // Reset team filter on tournament change
  };

  // Actions
  const handleOpenCreate = () => {
    setSelectedPlayer(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (player) => {
    setSelectedPlayer(player);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (player) => {
    setSelectedPlayer(player);
    setIsConfirmOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (selectedPlayer) {
        // Edit
        const res = await playerService.update(selectedPlayer.id, formData);
        setPlayers(prev => prev.map(p => (p.id === selectedPlayer.id ? res.teamMember : p)));
        showToast('Player updated successfully.');
      } else {
        // Create
        const res = await playerService.create(formData);
        setPlayers(prev => [res.teamMember, ...prev]);
        showToast('Player registered successfully.');
      }
      setIsFormOpen(false);
    } catch (err) {
      showToast(err.message || 'Action failed. Please check inputs and permissions.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPlayer) return;
    setIsSubmitting(true);
    try {
      await playerService.delete(selectedPlayer.id);
      setPlayers(prev => prev.filter(p => p.id !== selectedPlayer.id));
      showToast('Player removed from team successfully.');
      setIsConfirmOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to remove player.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPositionBadge = (pos) => {
    switch (pos) {
      case 'Goalkeeper':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Defender':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Midfielder':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Forward':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Players"
        subtitle="Manage squad rosters, positions, and player profiles."
        actionLabel="Register Player"
        actionIcon={Plus}
        onAction={handleOpenCreate}
      />

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white dark:bg-[#141C2E] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        {/* Search Input */}
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search players by name, jersey #, position, team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters & Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Tournament Filter */}
          <div className="relative flex-1 min-w-[140px] sm:w-44">
            <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={tournamentFilter}
              onChange={handleTournamentFilterChange}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="all">All Tournaments</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Team Filter */}
          <div className="relative flex-1 min-w-[140px] sm:w-44">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="all">All Teams</option>
              {availableTeamFilters.map(tm => (
                <option key={tm.id} value={tm.id}>
                  {tm.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="flex-1 sm:w-36 px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Data View / Player Grid */}
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : error ? (
        <div className="text-center text-red-500 p-10 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
          <p>{error}</p>
          <button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl">
            Retry
          </button>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <EmptyState
          title="No Players Found"
          description={
            searchQuery || tournamentFilter !== 'all' || teamFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : "You haven't registered any players yet."
          }
          actionLabel={!searchQuery && tournamentFilter === 'all' && teamFilter === 'all' ? 'Register First Player' : undefined}
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPlayers.map(playerMember => {
            const player = playerMember.player;
            const team = playerMember.team;
            const tournament = team?.tournament;

            return (
              <div
                key={playerMember.id}
                className="bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col"
              >
                <div className="p-6 flex-1">
                  {/* Card Top Row: Position & Actions */}
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPositionBadge(playerMember.position)}`}>
                      {playerMember.position || 'Player'}
                    </span>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(playerMember)}
                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Edit Player"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(playerMember)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Remove Player"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Player Avatar & Info */}
                  <div className="flex items-center gap-4 mb-4">
                    {player?.avatarUrl ? (
                      <img
                        src={player.avatarUrl}
                        alt={player.fullName}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-sm shrink-0"
                        style={{ backgroundColor: team?.primaryColor || '#1E50FF' }}
                      >
                        {player?.fullName
                          ? player.fullName
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()
                          : 'P'}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                        {player?.fullName || 'Unnamed Player'}
                      </h3>
                      {player?.email && !player.email.includes('@footverse.local') && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          {player.email}
                        </p>
                      )}
                    </div>

                    {/* Jersey Number Badge */}
                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 leading-none mb-0.5">
                        NO
                      </span>
                      <span className="text-lg font-extrabold font-mono text-blue-600 dark:text-blue-400 leading-none">
                        {playerMember.jerseyNumber}
                      </span>
                    </div>
                  </div>

                  {/* Player Details: Team & Tournament */}
                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="truncate">
                        Team: <strong className="text-slate-900 dark:text-white">{team?.name || 'Free Agent'}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="truncate">
                        Tournament: <strong className="text-slate-900 dark:text-white">{tournament?.name || 'Unassigned'}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Bio / Details */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                  <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {player?.bio || `Position: ${playerMember.position || 'Midfielder'}`}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                    {team?.shortName || ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals & Toast */}
      <PlayerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedPlayer}
        tournaments={tournaments}
        teams={teams}
        existingPlayers={players}
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Remove Player"
        message={`Are you sure you want to remove "${selectedPlayer?.player?.fullName}" from "${selectedPlayer?.team?.name}"? The player's profile will be retained.`}
        confirmLabel="Remove"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsConfirmOpen(false)}
        isDestructive={true}
        isLoading={isSubmitting}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
};
