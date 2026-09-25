import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Calendar, MapPin, Eye, Users, GitBranch, Table, Sparkles, Trophy, Check, X, Shield, Copy, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { Toast } from '../../components/common/Toast';
import { CustomSelect } from '../../components/common/CustomSelect';
import { LoadingSkeleton } from '../../components/organizer/LoadingSkeleton';
import { TournamentFormModal } from '../../components/organizer/TournamentFormModal';
import { GenerateBracketModal } from '../../components/organizer/GenerateBracketModal';

import { tournamentService } from '../../services/tournamentService';
import { tournamentJoinRequestService } from '../../services/tournamentJoinRequestService';
import { cleanTournamentDescription } from '../../utils/substitutionUtils';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'registration_open', label: 'Registration Open' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
];

export const Tournaments = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bracket Generation state
  const [isBracketConfirmOpen, setIsBracketConfirmOpen] = useState(false);
  const [selectedTournamentForBracket, setSelectedTournamentForBracket] = useState(null);
  const [isGeneratingBracket, setIsGeneratingBracket] = useState(false);

  // League Generation state
  const [isLeagueConfirmOpen, setIsLeagueConfirmOpen] = useState(false);
  const [selectedTournamentForLeague, setSelectedTournamentForLeague] = useState(null);
  const [isGeneratingLeague, setIsGeneratingLeague] = useState(false);

  // Tournament Join Requests state
  const [joinRequests, setJoinRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Toast state
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Copy code state: stores ID of tournament whose code was just copied
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  const handleCopyCode = (tournament) => {
    if (!tournament.tournamentCode) return;
    navigator.clipboard.writeText(tournament.tournamentCode).then(() => {
      setCopiedCodeId(tournament.id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    }).catch(() => {
      // fallback for older browsers
      const el = document.createElement('textarea');
      el.value = tournament.tournamentCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedCodeId(tournament.id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    });
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await tournamentService.getAll();
      setTournaments(res.tournaments || []);
    } catch (err) {
      setError('Failed to load tournaments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchJoinRequests = async () => {
    try {
      setRequestsLoading(true);
      const res = await tournamentJoinRequestService.getOrganizerRequests();
      setJoinRequests(res.joinRequests || []);
    } catch (err) {
      console.warn('Failed to load organizer join requests:', err);
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
    fetchJoinRequests();
  }, []);

  // Handle Approve Request
  const handleApproveRequest = async (requestId) => {
    try {
      await tournamentJoinRequestService.approveRequest(requestId);
      showToast('Tournament Request Approved', 'success');
      fetchJoinRequests();
      fetchTournaments();
    } catch (err) {
      showToast(err.message || 'Failed to approve request.', 'error');
    }
  };

  // Handle Reject Request
  const handleRejectRequest = async (requestId) => {
    try {
      await tournamentJoinRequestService.rejectRequest(requestId);
      showToast('Tournament Request Rejected', 'warning');
      fetchJoinRequests();
    } catch (err) {
      showToast(err.message || 'Failed to reject request.', 'error');
    }
  };

  // Derived state (Filtering and Sorting)
  const filteredTournaments = useMemo(() => {
    let result = [...tournaments];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(q) || t.location?.toLowerCase().includes(q));
    }

    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [tournaments, searchQuery, statusFilter, sortOrder]);

  // Actions
  const handleOpenCreate = () => {
    setSelectedTournament(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (tournament) => {
    setSelectedTournament(tournament);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (tournament) => {
    setSelectedTournament(tournament);
    setIsConfirmOpen(true);
  };

  const handleOpenGenerateBracket = (tournament) => {
    setSelectedTournamentForBracket(tournament);
    setIsBracketConfirmOpen(true);
  };

  const handleOpenGenerateLeague = (tournament) => {
    setSelectedTournamentForLeague(tournament);
    setIsLeagueConfirmOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (selectedTournament) {
        // Edit
        const res = await tournamentService.update(selectedTournament.id, formData);
        setTournaments(prev => prev.map(t => t.id === selectedTournament.id ? res.tournament : t));
        showToast('Tournament updated successfully.');
      } else {
        // Create
        const res = await tournamentService.create(formData);
        setTournaments(prev => [res.tournament, ...prev]);
        showToast('Tournament created successfully.');
      }
      setIsFormOpen(false);
    } catch (err) {
      showToast(err.message || 'Action failed. Please check inputs and permissions.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTournament) return;
    setIsSubmitting(true);
    try {
      await tournamentService.delete(selectedTournament.id);
      setTournaments(prev => prev.filter(t => t.id !== selectedTournament.id));
      showToast('Tournament deleted successfully.');
      setIsConfirmOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to delete tournament.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateBracketConfirm = async (options = {}) => {
    if (!selectedTournamentForBracket) return;
    setIsGeneratingBracket(true);
    try {
      const res = await tournamentService.generateKnockout(selectedTournamentForBracket.id, options);
      showToast(res.message || 'Knockout bracket generated successfully!');
      setIsBracketConfirmOpen(false);
      setSelectedTournamentForBracket(null);
      fetchTournaments();
    } catch (err) {
      showToast(err.message || 'Failed to generate knockout bracket.', 'error');
    } finally {
      setIsGeneratingBracket(false);
    }
  };

  const handleGenerateLeagueConfirm = async () => {
    if (!selectedTournamentForLeague) return;
    setIsGeneratingLeague(true);
    try {
      const res = await tournamentService.generateLeague(selectedTournamentForLeague.id);
      showToast(res.message || 'League fixtures generated successfully!');
      setIsLeagueConfirmOpen(false);
      setSelectedTournamentForLeague(null);
      fetchTournaments();
    } catch (err) {
      showToast(err.message || 'Failed to generate league fixtures.', 'error');
    } finally {
      setIsGeneratingLeague(false);
    }
  };

  const pendingRequests = joinRequests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Tournaments"
        subtitle="Create and manage your football competitions, schedules, and bracket seeding."
        actionLabel="Host Tournament"
        actionIcon={Plus}
        onAction={handleOpenCreate}
      />

      {/* ─── TOURNAMENT JOIN REQUESTS (ORGANIZER PANEL) ───────────────── */}
      {joinRequests.length > 0 && (
        <div className="bg-white dark:bg-[#101C14] p-6 rounded-2xl border border-green-500/30 dark:border-[#1E3A29] shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E3A29] pb-3">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Team Join Requests for Tournaments
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 font-bold">
                {pendingRequests.length} Pending
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {joinRequests.map((reqItem) => (
              <div
                key={reqItem.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-[#16261C] border border-slate-200 dark:border-[#1E3A29] flex items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-sm shrink-0"
                    style={{ backgroundColor: reqItem.team?.primaryColor || '#16A34A' }}
                  >
                    {reqItem.team?.shortName || reqItem.team?.name?.slice(0, 3)?.toUpperCase() || 'FC'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {reqItem.team?.name || 'Team'}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      Tournament: <strong className="text-green-600 dark:text-green-400">{reqItem.tournament?.name}</strong>
                    </p>
                    {reqItem.team?.manager && (
                      <p className="text-[10px] text-slate-400 truncate">
                        Manager: {reqItem.team.manager.fullName} ({reqItem.team.manager.email})
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {reqItem.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleApproveRequest(reqItem.id)}
                        className="px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold shadow-sm transition flex items-center space-x-1"
                        title="Approve request & register team"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleRejectRequest(reqItem.id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm transition flex items-center space-x-1"
                        title="Reject request"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      reqItem.status === 'approved'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                    }`}>
                      {reqItem.status.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-[#101C14] p-4 rounded-2xl border border-slate-200/80 dark:border-[#1E3A29] shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tournaments by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#16261C] border border-slate-200 dark:border-[#1E3A29] rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex-1 md:w-48">
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS}
              icon={Filter}
            />
          </div>

          {/* Sort Order */}
          <div className="flex-1 md:w-40">
            <CustomSelect
              value={sortOrder}
              onChange={setSortOrder}
              options={SORT_OPTIONS}
            />
          </div>
        </div>
      </div>

      {/* Tournaments Grid / Data View */}
      {loading ? (
        <LoadingSkeleton type="tournament" count={6} />
      ) : error ? (
        <div className="text-center text-red-500 p-10 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
          <p>{error}</p>
          <button onClick={fetchTournaments} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl">
            Retry
          </button>
        </div>
      ) : filteredTournaments.length === 0 ? (
        <EmptyState
          title="No Tournaments Found"
          description={
            searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or status filter.'
              : "You haven't created any tournaments yet. Click below to host your first competition!"
          }
          actionLabel={!searchQuery && statusFilter === 'all' ? 'Host First Tournament' : undefined}
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTournaments.map(tournament => (
            <div
              key={tournament.id}
              className="bg-white dark:bg-[#101C14] rounded-2xl border border-slate-200/80 dark:border-[#1E3A29] overflow-hidden shadow-sm hover:shadow-md hover:border-green-500/60 dark:hover:border-green-500/40 transition-all group flex flex-col"
            >
              <div className="p-6 flex-1">
                {/* Header Row: Status Badge & Actions */}
                <div className="flex justify-between items-start mb-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      tournament.status === 'registration_open'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : tournament.status === 'ongoing'
                        ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                        : tournament.status === 'completed'
                        ? 'bg-slate-100 text-slate-700 dark:bg-[#16261C] dark:text-slate-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-[#16261C] dark:text-slate-400'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        tournament.status === 'registration_open'
                          ? 'bg-emerald-500 animate-pulse'
                          : tournament.status === 'ongoing'
                          ? 'bg-green-500 animate-ping'
                          : tournament.status === 'completed'
                          ? 'bg-slate-400'
                          : 'bg-slate-400'
                      }`}
                    />
                    {tournament.status ? tournament.status.replace('_', ' ').toUpperCase() : 'DRAFT'}
                  </span>

                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => navigate(`/tournaments/${tournament.id}`)}
                      className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-[#16261C] rounded-lg transition-colors"
                      title="View Tournament Hub"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(tournament)}
                      className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-[#16261C] rounded-lg transition-colors"
                      title="Edit Tournament"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(tournament)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete Tournament"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tournament Title */}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-1">
                  {tournament.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                  {cleanTournamentDescription(tournament.description) || 'No description provided.'}
                </p>

                {/* Details list */}
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{tournament.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'TBD'} -{' '}
                      {tournament.endDate ? new Date(tournament.endDate).toLocaleDateString() : 'TBD'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      Teams: <strong className="text-slate-900 dark:text-white">{tournament.registeredTeamsCount || 0}</strong> / {tournament.maxTeams || 16}
                    </span>
                  </div>
                  {/* Tournament Code — visible only if API returned it (organizer/admin) */}
                  {tournament.tournamentCode && (
                    <div className="flex items-center gap-2 pt-1">
                      <Key className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                      <span className="font-bold tracking-widest text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800/60 px-2 py-0.5 rounded-lg text-xs">
                        {tournament.tournamentCode}
                      </span>
                      <button
                        id={`copy-code-${tournament.id}`}
                        onClick={() => handleCopyCode(tournament)}
                        title="Copy invite code"
                        className="ml-1 p-1 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/40 transition"
                      >
                        {copiedCodeId === tournament.id
                          ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                          : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      {copiedCodeId === tournament.id && (
                        <span className="text-[10px] text-emerald-500 font-bold">Copied!</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-slate-50 dark:bg-[#16261C] border-t border-slate-100 dark:border-[#1E3A29] flex justify-between items-center shrink-0">
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-200/80 dark:bg-[#101C14] text-slate-700 dark:text-slate-300 rounded-lg uppercase tracking-wider">
                  {tournament.format || 'Knockout'}
                </span>

                <div className="flex items-center gap-2">
                  {(tournament.format === 'knockout' || tournament.format === 'hybrid' || !tournament.format) && (tournament.registeredTeamsCount || 0) >= 2 && tournament.status !== 'completed' && (
                    <button
                      onClick={() => handleOpenGenerateBracket(tournament)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800/60 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors shadow-sm"
                      title="Generate Knockout Bracket"
                    >
                      <GitBranch className="w-3.5 h-3.5" />
                      Generate Bracket
                    </button>
                  )}
                  {tournament.format === 'league' && (tournament.registeredTeamsCount || 0) >= 2 && tournament.status !== 'completed' && (
                    <button
                      onClick={() => handleOpenGenerateLeague(tournament)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800/60 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors shadow-sm"
                      title="Generate Round-Robin League Fixtures"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Generate Fixtures
                    </button>
                  )}
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Fee: <span className="text-slate-900 dark:text-white">{tournament.entryFee > 0 ? `$${tournament.entryFee}` : 'Free'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals & Toast */}
      <TournamentFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedTournament}
        isLoading={isSubmitting}
      />

      <GenerateBracketModal
        isOpen={isBracketConfirmOpen}
        onClose={() => {
          setIsBracketConfirmOpen(false);
          setSelectedTournamentForBracket(null);
        }}
        tournament={selectedTournamentForBracket}
        onGenerate={handleGenerateBracketConfirm}
        isLoading={isGeneratingBracket}
      />

      <ConfirmDialog 
        isOpen={isLeagueConfirmOpen}
        title="Generate League Fixtures"
        message={`Are you sure you want to generate round-robin league fixtures for "${selectedTournamentForLeague?.name}"? This will pair every registered team against one another across structured matchdays.`}
        confirmLabel="Generate Fixtures"
        onConfirm={handleGenerateLeagueConfirm}
        onCancel={() => {
          setIsLeagueConfirmOpen(false);
          setSelectedTournamentForLeague(null);
        }}
        isLoading={isGeneratingLeague}
      />

      <ConfirmDialog 
        isOpen={isConfirmOpen}
        title="Delete Tournament"
        message={`Are you sure you want to delete "${selectedTournament?.name}"? This action cannot be undone.`}
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
