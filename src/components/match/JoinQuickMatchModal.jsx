import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Zap,
  Hash,
  Shield,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  PlusCircle
} from 'lucide-react';
import { matchService } from '../../services/matchService';
import { teamService } from '../../services/teamService';
import { useAuth } from '../../context/AuthContext';

export const JoinQuickMatchModal = ({ isOpen, onClose, initialCode = '' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState(initialCode);
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCode(initialCode || '');
      setError('');
      setSuccess('');
      setTimeout(() => inputRef.current?.focus(), 100);

      const fetchUserTeams = async () => {
        setLoadingTeams(true);
        try {
          const res = await teamService.getMyTeams();
          const list = res.teams || res.data?.teams || res || [];
          setTeams(list);
          if (list.length > 0) {
            setSelectedTeamId(list[0].id);
          } else {
            setSelectedTeamId('');
          }
        } catch (err) {
          console.error('Error fetching teams in join quick match modal:', err);
          setError('Failed to load your eligible teams. Please try again.');
        } finally {
          setLoadingTeams(false);
        }
      };
      fetchUserTeams();
    }
  }, [isOpen, initialCode]);

  const handleCodeChange = (e) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase().slice(0, 12);
    setCode(val);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setError('Please enter an 8-character Match Code.');
      return;
    }

    if (!selectedTeamId) {
      setError('Please select one of your teams to join as Team B.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await matchService.joinByCode({ code: cleanCode, teamId: selectedTeamId });
      const match = res.match || res.data?.match || res;
      setSuccess(`Joined Quick Match! Redirecting... 🎉`);
      setTimeout(() => {
        onClose();
        if (match?.id) {
          navigate(`/matches/${match.id}`);
        }
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to join match with this code.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-white dark:bg-[#101C14] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#1E3A29] overflow-hidden animate-fade-in my-auto">
        <div className="h-1.5 w-full bg-gradient-to-r from-green-500 via-emerald-400 to-green-600" />

        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#16261C] transition z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5">
          {/* Header */}
          <div className="space-y-1 text-left pr-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold tracking-wide">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Join with Match Code</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white">
              Join Quick Match
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter the 8-character Match Code and select which of your teams will play as Team B.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 text-green-600 dark:text-green-400 text-xs font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Match Code Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                <span>8-Character Match Code</span>
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="e.g. 7F3A9C12"
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-[#16261C] border border-slate-200 dark:border-[#1E3A29] rounded-2xl text-base font-mono font-bold tracking-widest text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600 uppercase"
                  required
                />
              </div>
            </div>

            {/* Select Team */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  <span>Select Your Team (Team B)</span>
                </span>
                <span className="text-[11px] text-green-600 dark:text-green-400 font-semibold">
                  {teams.length} eligible
                </span>
              </label>

              {loadingTeams ? (
                <div className="h-11 rounded-xl bg-slate-100 dark:bg-[#16261C] animate-pulse flex items-center px-4 text-xs text-slate-400">
                  Loading your teams...
                </div>
              ) : teams.length === 0 ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs space-y-2">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    No Eligible Teams
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    You must be a member or manager of a team to join this match.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/teams');
                    }}
                    className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition text-xs shadow-sm"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Create or Join a Team</span>
                  </button>
                </div>
              ) : (
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#16261C] border border-slate-200 dark:border-[#1E3A29] rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-600 cursor-pointer"
                  required
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.shortName ? `(${t.shortName})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E3A29] text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#16261C] transition text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingTeams || teams.length === 0}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 active:bg-green-700 text-white text-xs font-bold shadow-lg shadow-green-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Join Match</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
