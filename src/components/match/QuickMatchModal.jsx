import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Zap,
  Shield,
  Calendar,
  Clock,
  MapPin,
  Copy,
  Check,
  Play,
  ArrowRight,
  Loader2,
  Share2,
  AlertCircle,
  PlusCircle
} from 'lucide-react';
import { matchService } from '../../services/matchService';
import { teamService } from '../../services/teamService';
import { useAuth } from '../../context/AuthContext';

export const QuickMatchModal = ({ isOpen, onClose, onMatchCreated }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('form'); // 'form' | 'success'
  const [createdMatch, setCreatedMatch] = useState(null);
  const [copied, setCopied] = useState(false);

  // Form State
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [homeTeamId, setHomeTeamId] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [kickoffTime, setKickoffTime] = useState('16:00');
  const [venue, setVenue] = useState('FootVerse Arena - Pitch 1');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch only user's eligible teams (member or manager)
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setCreatedMatch(null);
      setError('');
      setCopied(false);

      const now = new Date();
      setMatchDate(now.toISOString().split('T')[0]);
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setKickoffTime(`${hrs}:${mins}`);

      const fetchMyTeams = async () => {
        setLoadingTeams(true);
        try {
          const res = await teamService.getMyTeams();
          const list = res.teams || res.data?.teams || res || [];
          setTeams(list);
          if (list.length > 0) {
            setHomeTeamId(list[0].id);
          } else {
            setHomeTeamId('');
          }
        } catch (err) {
          console.error('Error loading user teams for quick match:', err);
          setError('Failed to load your eligible teams. Please try again.');
        } finally {
          setLoadingTeams(false);
        }
      };
      fetchMyTeams();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!homeTeamId) {
      setError('Please select one of your teams for Team A (Home Team).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const dateTimeStr = `${matchDate}T${kickoffTime}:00`;
      const payload = {
        homeTeamId,
        awayTeamId: null, // Team B is initially empty for match code joining
        matchDate: new Date(dateTimeStr).toISOString(),
        venue: venue?.trim() || 'Local Pitch',
        roundName: 'Quick Match',
        status: 'scheduled'
      };

      const res = await matchService.createQuickMatch(payload);
      const match = res.match || res.data?.match || res;
      setCreatedMatch(match);
      setStep('success');
      onMatchCreated?.(match);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create Quick Match.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    const code = createdMatch?.matchCode || createdMatch?.refereeName || createdMatch?.id?.slice(0, 8);
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    const code = createdMatch?.matchCode || createdMatch?.refereeName || createdMatch?.id?.slice(0, 8);
    const url = `${window.location.origin}/matches/${createdMatch?.id}`;
    const text = `Join my Quick Match on FootVerse!\nMatch Code: ${code}\nLink: ${url}`;

    if (navigator.share) {
      navigator.share({ title: 'FootVerse Quick Match', text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGoToMatch = () => {
    onClose();
    if (createdMatch?.id) {
      navigate(`/matches/${createdMatch.id}`);
    }
  };

  if (!isOpen) return null;

  const matchCode =
    createdMatch?.matchCode || createdMatch?.refereeName || createdMatch?.id?.slice(0, 8) || 'QM8B4F9A';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-[#101C14] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#1E3A29] overflow-hidden animate-fade-in my-auto">
        <div className="h-1.5 w-full bg-gradient-to-r from-green-500 via-emerald-400 to-green-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#16261C] transition z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5">
            {/* Modal Header */}
            <div className="space-y-1 text-left pr-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold tracking-wide">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Instant Quick Match</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white">
                Create Quick Match
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pick your team (Team A). An 8-character Match Code will be generated for your opponent to connect.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Team A Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    <span>Select Your Team (Team A)</span>
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
                      No Team Memberships Found
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      You must be a member or manager of at least one team to create a Quick Match.
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
                    value={homeTeamId}
                    onChange={(e) => setHomeTeamId(e.target.value)}
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

              {/* Opponent Info Note */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                  <Zap className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  Team B (Opponent) will connect via Match Code
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300/90 leading-relaxed">
                  Once created, an 8-character code will be generated. The opponent enters this code from their account to join as Team B!
                </p>
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date
                  </label>
                  <input
                    type="date"
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#16261C] border border-slate-200 dark:border-[#1E3A29] rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Kickoff Time
                  </label>
                  <input
                    type="time"
                    value={kickoffTime}
                    onChange={(e) => setKickoffTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#16261C] border border-slate-200 dark:border-[#1E3A29] rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
              </div>

              {/* Venue */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Venue / Pitch
                </label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g. FootVerse Arena - Pitch 1"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#16261C] border border-slate-200 dark:border-[#1E3A29] rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
            </div>

            {/* Actions */}
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
                    <span>Creating Match...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Create Quick Match</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* SUCCESS VIEW */
          <div className="p-6 sm:p-8 text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center text-green-500 mx-auto shadow-inner">
              <Zap className="w-8 h-8 fill-current" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white">
                Quick Match Created!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Share this 8-character Match Code with the opposing team captain to join and start the match.
              </p>
            </div>

            {/* Match Code Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#0c2e1b] via-[#092215] to-[#05130b] border border-emerald-500/30 text-white space-y-3 shadow-xl">
              <p className="text-[11px] uppercase tracking-wider text-green-300/80 font-bold">
                8-Character Match Code
              </p>
              <div className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-emerald-300 select-all py-1">
                {matchCode}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 active:bg-green-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied Code!' : 'Copy Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Match</span>
                </button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleGoToMatch}
                className="w-full sm:flex-1 py-3 px-4 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-green-600/30 transition flex items-center justify-center space-x-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Go to Match Page</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto py-3 px-5 rounded-2xl border border-slate-200 dark:border-[#1E3A29] text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#16261C] transition"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
