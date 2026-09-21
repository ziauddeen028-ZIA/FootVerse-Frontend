import React, { useState, useEffect } from 'react';
import { Trophy, Key, Shield, Hash, X, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { tournamentJoinRequestService } from '../../services/tournamentJoinRequestService';
import { teamService } from '../../services/teamService';
import { useAuth } from '../../context/AuthContext';

export const JoinTournamentCodeModal = ({ isOpen, onClose, onSuccess, initialTeams = [] }) => {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [teams, setTeams] = useState(initialTeams);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [error, setError] = useState(null);

  // Load user's managed/captained teams when modal opens
  useEffect(() => {
    if (!isOpen || !user) return;
    setError(null);
    setCode('');

    const fetchTeams = async () => {
      try {
        setLoadingTeams(true);
        const res = await teamService.getAll();
        const allTeams = res?.teams || [];

        // Filter for teams user is manager or captain of
        const userTeams = allTeams.filter(t =>
          t.managerId === user.id ||
          t.manager?.id === user.id ||
          t.members?.some(m => (m.playerId === user.id || m.player?.id === user.id) && m.isCaptain)
        );

        setTeams(userTeams);
        if (userTeams.length > 0) {
          setSelectedTeamId(userTeams[0].id);
        }
      } catch (err) {
        console.warn('Could not fetch teams for tournament join modal:', err);
      } finally {
        setLoadingTeams(false);
      }
    };

    fetchTeams();
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter an 8-12 character tournament invite code.');
      return;
    }

    if (!selectedTeamId) {
      setError('Please select a team to register for this tournament.');
      return;
    }

    setLoading(true);
    try {
      const res = await tournamentJoinRequestService.joinByCode(cleanCode, selectedTeamId);
      const tournamentId = res?.joinRequest?.tournamentId || res?.joinRequest?.tournament?.id;
      const tournamentName = res?.joinRequest?.tournament?.name || 'the tournament';

      if (onSuccess) {
        onSuccess(tournamentId, tournamentName);
      }
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to join tournament. Please check your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#111726] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-600/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold flex-shrink-0">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-0.5">
                <Sparkles className="w-3 h-3" />
                <span>Instant Registration</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Join with Tournament Code
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Enter the tournament invite code provided by the organizer to enroll your squad immediately without waiting for approval.
        </p>

        {/* Error banner */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tournament Code Input */}
          <div className="space-y-1.5">
            <label htmlFor="modal-tournament-code-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Tournament Invite Code
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="modal-tournament-code-input"
                type="text"
                autoFocus
                maxLength={16}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. TRN892ABC"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-mono font-bold tracking-widest text-center text-base focus:outline-none focus:ring-2 focus:ring-violet-500 uppercase placeholder:tracking-normal placeholder:font-normal placeholder:text-sm"
              />
            </div>
          </div>

          {/* Team Selection */}
          <div className="space-y-1.5">
            <label htmlFor="modal-tournament-team-select" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Registering Team
            </label>
            {loadingTeams ? (
              <div className="p-3 text-center text-xs text-slate-400">Loading your teams...</div>
            ) : teams.length === 0 ? (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300 text-xs">
                You do not manage any teams yet. Create a team first to enter tournaments.
              </div>
            ) : (
              <div className="relative">
                <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  id="modal-tournament-team-select"
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.id} className="bg-white dark:bg-slate-900">
                      {team.name} ({team.city || 'Club'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              id="submit-tournament-code-btn"
              type="submit"
              disabled={loading || !code.trim() || !selectedTeamId || teams.length === 0}
              className="flex-1 py-3 px-4 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Join Tournament</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinTournamentCodeModal;
