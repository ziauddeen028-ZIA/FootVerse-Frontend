import React, { useState, useRef, useEffect } from 'react';
import { X, Hash, ArrowRight, CheckCircle, AlertCircle, Loader2, Users } from 'lucide-react';
import teamJoinRequestService from '../../services/teamJoinRequestService';

/**
 * JoinByCodeModal
 * Allows a logged-in player to enter an 8-character team code and instantly join a team.
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - onSuccess: (teamName: string) => void — called after successful join
 */
export const JoinByCodeModal = ({ isOpen, onClose, onSuccess }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRef = useRef(null);

  // Focus input when modal opens and reset state
  useEffect(() => {
    if (isOpen) {
      setCode('');
      setError('');
      setSuccess('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();

    if (!trimmed) {
      setError('Please enter a team code.');
      return;
    }
    if (trimmed.length !== 8) {
      setError('Team codes are exactly 8 characters long.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await teamJoinRequestService.joinByCode(trimmed);
      const teamName = res?.team?.name || 'the team';
      const teamId = res?.team?.id || null;
      setSuccess(`You have successfully joined "${teamName}"! 🎉`);
      setTimeout(() => {
        onSuccess?.(teamName, teamId);
        onClose?.();
      }, 1800);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    // Allow only alphanumeric, max 8 chars
    const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
    setCode(val);
    if (error) setError('');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="relative w-full max-w-md bg-white dark:bg-[#0F1623] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 dark:bg-blue-500/10 flex items-center justify-center mb-3">
              <Hash className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Join with Team Code
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Enter the 8-character code shared by your team captain or manager to join instantly — no approval needed.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Team Code
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  id="team-code-input"
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="e.g. A3F9C21B"
                  maxLength={8}
                  disabled={loading || Boolean(success)}
                  className={`w-full px-4 py-3 rounded-2xl border font-mono text-lg font-bold tracking-widest text-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-60 disabled:cursor-not-allowed ${error ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-400' : 'border-slate-200 dark:border-slate-700'}`}
                  autoComplete="off"
                  spellCheck={false}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400">
                  {code.length}/8
                </span>
              </div>
            </div>

            {error && (
              <div className="flex items-start space-x-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700 dark:text-rose-400 font-medium leading-snug">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-start space-x-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium leading-snug">{success}</p>
              </div>
            )}

            <button
              id="join-by-code-submit"
              type="submit"
              disabled={loading || code.length !== 8 || Boolean(success)}
              className="w-full py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md flex items-center justify-center space-x-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Joining...</span></>
              ) : success ? (
                <><CheckCircle className="w-4 h-4" /><span>Joined!</span></>
              ) : (
                <><Users className="w-4 h-4" /><span>Join Team</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-[10px] text-slate-400 text-center">
            Don't have a code? Ask your team captain or manager to share it from their Team Dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinByCodeModal;
