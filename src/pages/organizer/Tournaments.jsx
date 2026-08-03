import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Calendar, MapPin, Eye } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { Toast } from '../../components/common/Toast';
import { LoadingSkeleton } from '../../components/organizer/LoadingSkeleton';
import { TournamentFormModal } from '../../components/organizer/TournamentFormModal';

import { tournamentService } from '../../services/tournamentService';

export const Tournaments = () => {
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

  // Toast state
  const [toast, setToast] = useState({ message: '', type: 'success' });

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

  useEffect(() => {
    fetchTournaments();
  }, []);

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

  const getStatusColor = (status) => {
    switch(status) {
      case 'draft': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
      case 'registration_open': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'ongoing': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'completed': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      case 'cancelled': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <PageHeader 
        title="Tournaments" 
        subtitle="Manage your tournaments, brackets, and registrations."
        actionLabel="Create Tournament"
        actionIcon={Plus}
        onAction={handleOpenCreate}
      />

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-[#141C2E] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search tournaments..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-40">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="registration_open">Reg. Open</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <select 
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="flex-1 md:w-40 px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Data View */}
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : error ? (
        <div className="text-center text-red-500 p-10 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
          <p>{error}</p>
          <button onClick={fetchTournaments} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl">Retry</button>
        </div>
      ) : filteredTournaments.length === 0 ? (
        <EmptyState 
          title="No Tournaments Found" 
          description={searchQuery || statusFilter !== 'all' ? "Try adjusting your filters." : "You haven't created any tournaments yet."} 
          actionLabel={!searchQuery && statusFilter === 'all' ? "Create First Tournament" : undefined}
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTournaments.map(tournament => (
            <div key={tournament.id} className="bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(tournament.status)}`}>
                    {formatStatus(tournament.status)}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEdit(tournament)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleOpenDelete(tournament)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-1">{tournament.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 h-10">
                  {tournament.description || "No description provided."}
                </p>

                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{tournament.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>
                      {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'TBD'} - 
                      {tournament.endDate ? new Date(tournament.endDate).toLocaleDateString() : 'TBD'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Teams: <span className="text-slate-900 dark:text-white">{tournament.registeredTeamsCount || 0}/{tournament.maxTeams || 16}</span>
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Fee: <span className="text-slate-900 dark:text-white">{tournament.entryFee > 0 ? `$${tournament.entryFee}` : 'Free'}</span>
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
