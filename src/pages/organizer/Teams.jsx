import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, MapPin, Building, Trophy, Shield } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { Toast } from '../../components/common/Toast';
import { LoadingSkeleton } from '../../components/organizer/LoadingSkeleton';
import { TeamFormModal } from '../../components/organizer/TeamFormModal';

import { teamService } from '../../services/teamService';
import { tournamentService } from '../../services/tournamentService';

export const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [tournamentFilter, setTournamentFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
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
      const [teamsRes, tournamentsRes] = await Promise.all([
        teamService.getAll(),
        tournamentService.getAll()
      ]);
      setTeams(teamsRes.teams || []);
      setTournaments(tournamentsRes.tournaments || []);
    } catch (err) {
      setError('Failed to load teams or tournaments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Derived state (Filtering and Sorting)
  const filteredTeams = useMemo(() => {
    let result = [...teams];

    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        t =>
          t.name.toLowerCase().includes(q) ||
          t.shortName.toLowerCase().includes(q) ||
          t.city?.toLowerCase().includes(q) ||
          t.homeGround?.toLowerCase().includes(q) ||
          t.tournament?.name?.toLowerCase().includes(q)
      );
    }

    // Tournament filter
    if (tournamentFilter !== 'all') {
      result = result.filter(t => t.tournamentId === tournamentFilter || t.tournament?.id === tournamentFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortOrder === 'oldest') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortOrder === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortOrder === 'name_desc') {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });

    return result;
  }, [teams, searchQuery, tournamentFilter, sortOrder]);

  // Modal Actions
  const handleOpenCreate = () => {
    setSelectedTeam(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (team) => {
    setSelectedTeam(team);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (team) => {
    setSelectedTeam(team);
    setIsConfirmOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (selectedTeam) {
        // Edit
        const res = await teamService.update(selectedTeam.id, formData);
        setTeams(prev => prev.map(t => (t.id === selectedTeam.id ? res.team : t)));
        showToast('Team updated successfully.');
      } else {
        // Create
        const res = await teamService.create(formData);
        setTeams(prev => [res.team, ...prev]);
        showToast('Team created successfully.');
      }
      setIsFormOpen(false);
    } catch (err) {
      showToast(err.message || 'Action failed. Please check inputs and permissions.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTeam) return;
    setIsSubmitting(true);
    try {
      await teamService.delete(selectedTeam.id);
      setTeams(prev => prev.filter(t => t.id !== selectedTeam.id));
      showToast('Team deleted successfully.');
      setIsConfirmOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to delete team.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Teams"
        subtitle="Manage participating clubs, squads, and registrations."
        actionLabel="Create Team"
        actionIcon={Plus}
        onAction={handleOpenCreate}
      />

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-[#141C2E] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search teams by name, city, tournament..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Tournament Filter */}
          <div className="relative flex-1 md:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={tournamentFilter}
              onChange={(e) => setTournamentFilter(e.target.value)}
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

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="flex-1 md:w-40 px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Teams Grid / Data View */}
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : error ? (
        <div className="text-center text-red-500 p-10 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
          <p>{error}</p>
          <button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl">
            Retry
          </button>
        </div>
      ) : filteredTeams.length === 0 ? (
        <EmptyState
          title="No Teams Found"
          description={
            searchQuery || tournamentFilter !== 'all'
              ? 'Try adjusting your search or tournament filter.'
              : "You haven't created any teams yet."
          }
          actionLabel={!searchQuery && tournamentFilter === 'all' ? 'Create First Team' : undefined}
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTeams.map(team => (
            <div
              key={team.id}
              className="bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col"
            >
              <div className="p-6 flex-1">
                {/* Header Row: Tournament Badge & Actions */}
                <div className="flex justify-between items-start mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <Trophy className="w-3.5 h-3.5" />
                    {team.tournament?.name || 'Unassigned'}
                  </span>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(team)}
                      className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="Edit Team"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(team)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete Team"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Team Logo / Avatar & Title */}
                <div className="flex items-center gap-4 mb-4">
                  {team.logoUrl ? (
                    <img
                      src={team.logoUrl}
                      alt={team.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50 shrink-0"
                      style={{
                        backgroundColor: team.primaryColor || '#1E50FF',
                        color: team.secondaryColor || '#FFFFFF'
                      }}
                    >
                      {team.shortName || team.name.slice(0, 3).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-1">
                      {team.name}
                    </h3>
                    <span className="inline-block text-xs font-mono font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md tracking-wider">
                      {team.shortName}
                    </span>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{team.city || 'City: Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{team.homeGround || 'Home Ground: Not specified'}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Color Swatches */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span>Team Colors</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 shadow-xs"
                    style={{ backgroundColor: team.primaryColor || '#1E50FF' }}
                    title={`Primary: ${team.primaryColor}`}
                  />
                  <span
                    className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 shadow-xs"
                    style={{ backgroundColor: team.secondaryColor || '#FFFFFF' }}
                    title={`Secondary: ${team.secondaryColor}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals & Toast */}
      <TeamFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedTeam}
        tournaments={tournaments}
        existingTeams={teams}
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Delete Team"
        message={`Are you sure you want to delete "${selectedTeam?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
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
