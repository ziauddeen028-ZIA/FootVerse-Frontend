import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Pause,
  Square,
  RefreshCw,
  Clock,
  MapPin,
  Trophy,
  Plus,
  Minus,
  Radio,
  Trash2,
  Activity,
  Shield,
  User,
  AlertCircle,
  Coins,
  CheckCircle2,
  X,
} from 'lucide-react';

import { Toast } from '../../components/common/Toast';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';

import { matchService } from '../../services/matchService';
import { playerService } from '../../services/playerService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatTimer = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  HALFTIME: 'halftime',
  FULLTIME: 'fulltime',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const EVENT_TYPES = [
  { value: 'goal', label: 'Goal', icon: '⚽' },
  { value: 'yellow_card', label: 'Yellow Card', icon: '🟨' },
  { value: 'red_card', label: 'Red Card', icon: '🟥' },
  { value: 'substitution', label: 'Substitution', icon: '🔄' },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  switch (status) {
    case STATUS.LIVE:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/15 text-red-500 border border-red-500/30 tracking-wider uppercase">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          Live
        </span>
      );
    case STATUS.HALFTIME:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 tracking-wider uppercase">
          Half Time
        </span>
      );
    case STATUS.FULLTIME:
    case STATUS.COMPLETED:
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 tracking-wider uppercase">
          Full Time
        </span>
      );
    case STATUS.CANCELLED:
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30 tracking-wider uppercase">
          Cancelled
        </span>
      );
    case STATUS.SCHEDULED:
    default:
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-500 border border-blue-500/30 tracking-wider uppercase">
          Scheduled
        </span>
      );
  }
};

// ─── Team Badge ───────────────────────────────────────────────────────────────

const TeamBadge = ({ team, side }) => {
  const colors =
    side === 'home'
      ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
      : 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400';

  const isTBD = !team || (!team.name && !team.shortName);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`w-20 h-20 rounded-2xl border-2 ${colors} flex items-center justify-center font-black text-lg overflow-hidden ${
          isTBD ? 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/50 text-slate-400' : ''
        }`}
      >
        {team?.logoUrl ? (
          <img src={team.logoUrl} alt={team.name || 'Team'} className="w-full h-full object-cover" />
        ) : team?.shortName || team?.name ? (
          team?.shortName || team?.name?.substring(0, 3).toUpperCase()
        ) : (
          <span className="text-sm font-black text-slate-400 dark:text-slate-500 tracking-wider">TBD</span>
        )}
      </div>
      <span className={`text-base font-bold text-center leading-tight max-w-[120px] ${
        isTBD ? 'text-slate-400 dark:text-slate-500 italic' : 'text-slate-900 dark:text-white'
      }`}>
        {team?.name || 'TBD'}
      </span>
    </div>
  );
};

// ─── Score Display ────────────────────────────────────────────────────────────

const ScoreDisplay = ({ score, teamId, teamName, isLoggingAllowed, isReadOnly, onLogGoal, color = 'blue' }) => (
  <div className="flex flex-col items-center gap-1.5">
    <span className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
      {score}
    </span>
    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
      Goals
    </span>
    {isLoggingAllowed && !isReadOnly && (
      <button
        type="button"
        onClick={() => onLogGoal(teamId)}
        className={`mt-1 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
          color === 'purple'
            ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200/60 dark:border-purple-800/60'
            : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200/60 dark:border-blue-800/60'
        }`}
        title={`Log goal for ${teamName || 'team'}`}
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Log Goal</span>
      </button>
    )}
  </div>
);

// ─── Event Badge Helper ───────────────────────────────────────────────────────

const EventBadge = ({ type }) => {
  switch (type) {
    case 'goal':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
          <span>⚽</span> Goal
        </span>
      );
    case 'yellow_card':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold">
          <span className="w-2.5 h-3.5 bg-amber-400 rounded-[2px] border border-amber-500 shadow-sm inline-block" /> Yellow Card
        </span>
      );
    case 'red_card':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-bold">
          <span className="w-2.5 h-3.5 bg-red-600 rounded-[2px] border border-red-700 shadow-sm inline-block" /> Red Card
        </span>
      );
    case 'substitution':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold">
          <RefreshCw className="w-3.5 h-3.5 text-blue-500" /> Substitution
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 text-xs font-bold capitalize">
          {type?.replace('_', ' ')}
        </span>
      );
  }
};

// ─── Tie Resolution Modal ──────────────────────────────────────────────────────

const TieResolutionModal = ({
  isOpen,
  onClose,
  match,
  homeScore,
  awayScore,
  onResolveTie,
  onStartExtraTime,
  isLoading,
}) => {
  const [tieMethod, setTieMethod] = useState('penalty'); // 'penalty' | 'toss' | 'extra_time'
  const [homePenalties, setHomePenalties] = useState('5');
  const [awayPenalties, setAwayPenalties] = useState('4');
  const [tossWinnerId, setTossWinnerId] = useState('');
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (match?.homeTeamId && !tossWinnerId) {
      setTossWinnerId(match.homeTeamId);
    }
  }, [match, tossWinnerId]);

  if (!isOpen || !match) return null;

  const hPen = parseInt(homePenalties, 10);
  const aPen = parseInt(awayPenalties, 10);
  const isPenValid = !isNaN(hPen) && !isNaN(aPen) && hPen >= 0 && aPen >= 0 && hPen !== aPen;
  const penaltyWinnerName =
    isPenValid
      ? hPen > aPen
        ? match.homeTeam?.name || 'Home Team'
        : match.awayTeam?.name || 'Away Team'
      : null;

  const handleFlipCoin = () => {
    setIsFlipping(true);
    setTimeout(() => {
      const winner = Math.random() > 0.5 ? match.homeTeamId : match.awayTeamId;
      setTossWinnerId(winner);
      setIsFlipping(false);
    }, 600);
  };



  const handleConfirm = () => {
    if (tieMethod === 'extra_time') {
      onStartExtraTime();
      return;
    }
    if (tieMethod === 'penalty') {
      if (!isPenValid) return;
      onResolveTie({
        tieBreakMethod: 'penalty',
        homePenaltyScore: hPen,
        awayPenaltyScore: aPen,
        winnerTeamId: hPen > aPen ? match.homeTeamId : match.awayTeamId,
      });
      return;
    }
    if (tieMethod === 'toss') {
      if (!tossWinnerId) return;
      onResolveTie({
        tieBreakMethod: 'toss',
        winnerTeamId: tossWinnerId,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#141C2E] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Resolve Tied Knockout Match
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Knockout matches cannot end in a draw. Select a resolution method.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Match Tied Score Info */}
        <div className="px-6 py-4 bg-amber-50/60 dark:bg-amber-900/10 border-b border-amber-200/50 dark:border-amber-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
              {match.homeTeam?.name || 'Home Team'}
            </span>
            <span className="font-black text-sm text-slate-900 dark:text-white px-2 py-0.5 bg-white dark:bg-slate-800 rounded-md border border-amber-300/40 dark:border-amber-700/40 tabular-nums">
              {homeScore} – {awayScore}
            </span>
            <span className="font-semibold text-xs text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
              {match.awayTeam?.name || 'Away Team'}
            </span>
          </div>
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full shrink-0">
            {match.roundName || 'Knockout'}
          </span>
        </div>

        {/* Tab Selection */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl">
            <button
              type="button"
              onClick={() => setTieMethod('penalty')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${tieMethod === 'penalty'
                  ? 'bg-white dark:bg-[#141C2E] text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/60 dark:border-slate-800'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <span>⚽</span>
              <span>Penalties</span>
            </button>
            <button
              type="button"
              onClick={() => setTieMethod('toss')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${tieMethod === 'toss'
                  ? 'bg-white dark:bg-[#141C2E] text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200/60 dark:border-slate-800'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <span>🪙</span>
              <span>Coin Toss</span>
            </button>
            <button
              type="button"
              onClick={() => setTieMethod('extra_time')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${tieMethod === 'extra_time'
                  ? 'bg-white dark:bg-[#141C2E] text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/60 dark:border-slate-800'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Extra Time</span>
            </button>
          </div>

          {/* TAB 1: Penalties */}
          {tieMethod === 'penalty' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/40">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                  Enter the penalty shootout result. The team with higher penalties will be recorded as the knockout winner.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Home Team Penalties */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 line-clamp-1">
                    {match.homeTeam?.name || 'Home Team'}
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={homePenalties}
                      onChange={(e) => setHomePenalties(e.target.value)}
                      className="w-20 h-12 text-center text-2xl font-black bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 tabular-nums"
                    />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Penalties Scored
                  </span>
                </div>

                {/* Away Team Penalties */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 line-clamp-1">
                    {match.awayTeam?.name || 'Away Team'}
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={awayPenalties}
                      onChange={(e) => setAwayPenalties(e.target.value)}
                      className="w-20 h-12 text-center text-2xl font-black bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 tabular-nums"
                    />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Penalties Scored
                  </span>
                </div>
              </div>

              {/* Live Preview */}
              {isPenValid ? (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="truncate">
                    {penaltyWinnerName} wins on penalties ({hPen} – {aPen}) and advances!
                  </span>
                </div>
              ) : (
                <p className="text-xs text-red-500 text-center font-medium">
                  {hPen === aPen ? 'Penalty shootout cannot end in a draw.' : 'Please enter valid penalty scores.'}
                </p>
              )}
            </div>
          )}

          {/* TAB 2: Toss */}
          {tieMethod === 'toss' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/40 flex items-center justify-between gap-3">
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                  Select the winning team decided by coin toss, or use the coin flip simulator.
                </p>
                <button
                  type="button"
                  onClick={handleFlipCoin}
                  disabled={isFlipping}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0 flex items-center gap-1.5"
                >
                  <span className={isFlipping ? 'animate-spin' : ''}>🪙</span>
                  <span>{isFlipping ? 'Flipping...' : 'Flip Coin'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTossWinnerId(match.homeTeamId)}
                  className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${tossWinnerId === match.homeTeamId
                      ? 'bg-blue-500/10 border-blue-500 dark:bg-blue-500/20 ring-2 ring-blue-500/30'
                      : 'bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-bold text-xs text-blue-600 dark:text-blue-400">
                    {match.homeTeam?.shortName || 'HOME'}
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                    {match.homeTeam?.name || 'Home Team'}
                  </span>
                  {tossWinnerId === match.homeTeamId && (
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                      Toss Winner ✓
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setTossWinnerId(match.awayTeamId)}
                  className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${tossWinnerId === match.awayTeamId
                      ? 'bg-purple-500/10 border-purple-500 dark:bg-purple-500/20 ring-2 ring-purple-500/30'
                      : 'bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-bold text-xs text-purple-600 dark:text-purple-400">
                    {match.awayTeam?.shortName || 'AWAY'}
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                    {match.awayTeam?.name || 'Away Team'}
                  </span>
                  {tossWinnerId === match.awayTeamId && (
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-full">
                      Toss Winner ✓
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Extra Time */}
          {tieMethod === 'extra_time' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-200/60 dark:border-emerald-800/40 space-y-2">
                <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Continue Match with Extra Time
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                  The match timer will continue running. You can log additional goals and match events during Extra Time. If the score is still tied when you finish Extra Time, you can resolve via Penalty Shootout or Toss.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || (tieMethod === 'penalty' && !isPenValid) || (tieMethod === 'toss' && !tossWinnerId)}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center gap-2 ${tieMethod === 'extra_time'
                ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-500/20'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-500/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : tieMethod === 'extra_time' ? (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Resume for Extra Time</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm Result & Finish</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const LiveMatch = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Score
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);

  // Timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const intervalRef = useRef(null);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showTieModal, setShowTieModal] = useState(false);
  const [isResolvingTie, setIsResolvingTie] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // ── Knockout Match Detection ────────────────────────────────────────────────
  const isKnockoutMatch = useMemo(() => {
    if (!match) return false;

    // 1. Bracket position explicitly indicates a knockout bracket match
    if (match.bracketPosition != null && match.bracketPosition !== undefined) {
      return true;
    }

    // 2. Tournament format check
    const format = match.tournament?.format?.toLowerCase();
    if (format === 'knockout') {
      return true;
    }

    // 3. Round name check
    const round = (match.roundName || '').toLowerCase().trim();
    const knockoutRounds = [
      'round of 64',
      'round of 32',
      'round of 16',
      'quarter final',
      'quarter-final',
      'quarterfinal',
      'semi final',
      'semi-final',
      'semifinal',
      'final',
      'third place',
      'knockout',
    ];

    if (knockoutRounds.some((kr) => round.includes(kr))) {
      return true;
    }

    // 4. In hybrid tournaments, non-group rounds are knockout
    if (format === 'hybrid' && round && !round.includes('group')) {
      return true;
    }

    if (match.homeSourceMatchId || match.awaySourceMatchId) {
      return true;
    }

    return false;
  }, [match]);

  // ── Match Events & Roster State ─────────────────────────────────────────────
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [homeMembers, setHomeMembers] = useState([]);
  const [awayMembers, setAwayMembers] = useState([]);

  // Form State
  const [eventType, setEventType] = useState('goal');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [playerOutId, setPlayerOutId] = useState('');
  const [playerInId, setPlayerInId] = useState('');
  const [minute, setMinute] = useState('0');
  const [isMinuteCustomized, setIsMinuteCustomized] = useState(false);
  const [details, setDetails] = useState('');
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  // Event Delete State
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);

  const showToast = (message, type = 'success') => setToast({ message, type });

  // ── Auto-fill Minute from Timer ─────────────────────────────────────────────

  useEffect(() => {
    if (!isMinuteCustomized) {
      const calcMin = Math.min(120, Math.max(0, Math.round(timerSeconds / 60)));
      setMinute(String(calcMin));
    }
  }, [timerSeconds, isMinuteCustomized]);

  // ── Fetch Events ────────────────────────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);
      const res = await matchService.getEvents(matchId);
      setEvents(res.matchEvents || res || []);
    } catch (err) {
      console.error('Error fetching match events:', err);
    } finally {
      setLoadingEvents(false);
    }
  }, [matchId]);

  // ── Fetch Rosters ───────────────────────────────────────────────────────────

  const fetchRosters = useCallback(async (homeId, awayId) => {
    try {
      if (homeId) {
        const homeRes = await playerService.getByTeam(homeId);
        setHomeMembers(homeRes.teamMembers || homeRes || []);
      }
      if (awayId) {
        const awayRes = await playerService.getByTeam(awayId);
        setAwayMembers(awayRes.teamMembers || awayRes || []);
      }
    } catch (err) {
      console.error('Error fetching team rosters:', err);
    }
  }, []);

  // ── Fetch match ─────────────────────────────────────────────────────────────

  const fetchMatch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await matchService.getById(matchId);
      const m = res.match || res;
      setMatch(m);
      setHomeScore(m.homeScore ?? 0);
      setAwayScore(m.awayScore ?? 0);

      // Default team selection for event form
      if (m.homeTeamId) {
        setSelectedTeamId(m.homeTeamId);
      }

      // Fetch rosters & events concurrently
      await Promise.all([
        fetchRosters(m.homeTeamId, m.awayTeamId),
        fetchEvents(),
      ]);
    } catch (err) {
      console.error('Error fetching match:', err);
      setError('Failed to load match. Please go back and try again.');
    } finally {
      setLoading(false);
    }
  }, [matchId, fetchEvents, fetchRosters]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  // ── Timer ───────────────────────────────────────────────────────────────────

  const startTimer = () => {
    setTimerRunning(true);
    intervalRef.current = setInterval(() => {
      setTimerSeconds((s) => s + 1);
    }, 1000);
  };

  const stopTimer = () => {
    setTimerRunning(false);
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const resetTimer = () => {
    stopTimer();
    setTimerSeconds(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  // ── Status Updates ──────────────────────────────────────────────────────────

  const updateMatchInBackend = async (data) => {
    const res = await matchService.update(matchId, data);
    const updated = res.match || res;
    setMatch(updated);
    return updated;
  };

  const handleStartMatch = async () => {
    if (!match?.homeTeamId || !match?.awayTeamId || !match?.homeTeam || !match?.awayTeam) {
      showToast('Both teams must be assigned before starting this match.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await updateMatchInBackend({ status: STATUS.LIVE, homeScore, awayScore });
      startTimer();
      showToast('Match is now LIVE! ⚽');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to start match.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleHalfTime = async () => {
    setIsSaving(true);
    try {
      stopTimer();
      await updateMatchInBackend({ status: STATUS.HALFTIME, homeScore, awayScore });
      showToast('Half Time! Timer paused.');
    } catch (err) {
      startTimer(); // revert timer if save failed
      showToast(err.response?.data?.error || 'Failed to set half time.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResume = async () => {
    setIsSaving(true);
    try {
      await updateMatchInBackend({ status: STATUS.LIVE, homeScore, awayScore });
      startTimer();
      showToast('Match resumed!');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to resume match.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInitiateEndMatch = () => {
    const isTied = homeScore === awayScore;
    if (isTied && isKnockoutMatch) {
      setShowTieModal(true);
    } else {
      setShowEndConfirm(true);
    }
  };

  const handleEndMatch = async () => {
    setShowEndConfirm(false);
    setIsSaving(true);
    try {
      stopTimer();
      let winnerId = null;
      if (homeScore > awayScore) {
        winnerId = match.homeTeamId;
      } else if (awayScore > homeScore) {
        winnerId = match.awayTeamId;
      }

      // If knockout match with bracket/tournament and decisive score, advance the winner
      if (isKnockoutMatch && winnerId && match.tournamentId) {
        try {
          const res = await matchService.updateKnockoutResult(match.tournamentId, matchId, {
            homeScore,
            awayScore,
            winnerTeamId: winnerId,
          });
          const updated = res.match || res;
          setMatch(updated);
          showToast(res.message || 'Knockout match ended. Winner advanced! 🏁');
          fetchMatch();
          return;
        } catch (e) {
          console.warn('Knockout update fallback:', e);
        }
      }

      await updateMatchInBackend({
        status: STATUS.FULLTIME,
        homeScore,
        awayScore,
        winnerTeamId: winnerId,
      });
      showToast(
        homeScore === awayScore
          ? 'Match ended in a draw. Final score saved! 🏁'
          : 'Match ended. Final score saved! 🏁'
      );
      fetchMatch();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to end match.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartExtraTime = () => {
    setShowTieModal(false);
    startTimer();
    showToast('Extra Time started! Continue match timer and event logging. ⏱️');
  };

  const handleResolveTie = async ({ tieBreakMethod, homePenaltyScore: hPen, awayPenaltyScore: aPen, winnerTeamId: wId }) => {
    setIsResolvingTie(true);
    try {
      stopTimer();
      const payload = {
        homeScore,
        awayScore,
        tieBreakMethod,
        homePenaltyScore: hPen !== undefined ? hPen : null,
        awayPenaltyScore: aPen !== undefined ? aPen : null,
        winnerTeamId: wId,
        status: STATUS.FULLTIME,
      };

      let updatedMatchData = null;
      if (match.tournamentId) {
        try {
          const res = await matchService.updateKnockoutResult(match.tournamentId, matchId, payload);
          updatedMatchData = res.match || res;
          showToast(res.message || 'Knockout winner advanced and match completed! 🏆');
        } catch (kErr) {
          console.warn('Knockout endpoint fallback:', kErr);
        }
      }

      if (!updatedMatchData) {
        const res = await matchService.update(matchId, payload);
        updatedMatchData = res.match || res;
        showToast(
          tieBreakMethod === 'penalty'
            ? 'Penalty shootout recorded and match completed! 🏆'
            : 'Coin toss recorded and match completed! 🏆'
        );
      }

      setMatch(updatedMatchData);
      setShowTieModal(false);
      fetchMatch();
    } catch (err) {
      console.error('Error resolving tied knockout match:', err);
      showToast(err.response?.data?.error || 'Failed to record tie-break result.', 'error');
    } finally {
      setIsResolvingTie(false);
    }
  };

  // ── Score Helpers ───────────────────────────────────────────────────────────

  const saveScore = async (newHome, newAway) => {
    try {
      await matchService.update(matchId, { homeScore: newHome, awayScore: newAway });
    } catch (err) {
      showToast('Score saved locally but backend sync failed.', 'error');
    }
  };

  const handleQuickLogGoal = (teamId) => {
    if (teamId) {
      setSelectedTeamId(teamId);
      setSelectedPlayerId('');
      setPlayerOutId('');
      setPlayerInId('');
    }
    setEventType('goal');
    const el = document.getElementById('match-event-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ── Event Logger Logic ──────────────────────────────────────────────────────

  // Selected team's roster
  const activeRoster =
    selectedTeamId === match?.homeTeamId ? homeMembers : awayMembers;

  const handleTeamChange = (e) => {
    const newTeamId = e.target.value;
    setSelectedTeamId(newTeamId);
    setSelectedPlayerId(''); // Reset player when team changes
    setPlayerOutId('');
    setPlayerInId('');
  };

  const getPlayerLabel = (pId) => {
    const member = activeRoster.find((m) => (m.player?.id || m.playerId) === pId);
    if (!member) return 'Player';
    const jerseyStr = member.jerseyNumber ? `#${member.jerseyNumber} ` : '';
    return `${jerseyStr}${member.player?.fullName || 'Player'}`;
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();

    if (!isLoggingAllowed) {
      showToast('Event logging is only available while match is Live or at Half Time.', 'error');
      return;
    }

    if (!eventType) {
      showToast('Please select an event type.', 'error');
      return;
    }
    if (!selectedTeamId) {
      showToast('Please select a team.', 'error');
      return;
    }

    // Validation for Substitution vs Regular events
    let targetPlayerId = selectedPlayerId;
    let eventDetailsString = details.trim() || null;

    if (eventType === 'substitution') {
      if (!playerOutId) {
        showToast('Please select the OUT player.', 'error');
        return;
      }
      if (!playerInId) {
        showToast('Please select the IN player.', 'error');
        return;
      }
      if (playerOutId === playerInId) {
        showToast('OUT and IN players cannot be the same player.', 'error');
        return;
      }

      targetPlayerId = playerOutId;
      const subStr = `OUT: ${getPlayerLabel(playerOutId)} → IN: ${getPlayerLabel(playerInId)}`;
      eventDetailsString = details.trim() ? `${subStr} (${details.trim()})` : subStr;
    } else {
      if (!selectedPlayerId) {
        showToast('Please select a player.', 'error');
        return;
      }
    }

    let parsedMin = parseInt(minute, 10);
    if (minute === '' || isNaN(parsedMin)) {
      parsedMin = Math.min(120, Math.max(0, Math.round(timerSeconds / 60)));
    }

    if (isNaN(parsedMin) || parsedMin < 0 || parsedMin > 120) {
      showToast('Minute must be a valid number between 0 and 120.', 'error');
      return;
    }

    try {
      setIsSubmittingEvent(true);

      const payload = {
        matchId,
        teamId: selectedTeamId,
        playerId: targetPlayerId,
        minute: parsedMin,
        eventType,
        details: eventDetailsString,
      };

      await matchService.addEvent(payload);

      // Goal Logic: If Goal event, increment score
      if (eventType === 'goal') {
        let newHome = homeScore;
        let newAway = awayScore;

        if (selectedTeamId === match.homeTeamId) {
          newHome = homeScore + 1;
          setHomeScore(newHome);
        } else if (selectedTeamId === match.awayTeamId) {
          newAway = awayScore + 1;
          setAwayScore(newAway);
        }

        // Sync score with backend match update API
        await saveScore(newHome, newAway);
      }

      showToast('Match event logged successfully! ⚽');

      // Reset form
      setDetails('');
      setSelectedPlayerId('');
      setPlayerOutId('');
      setPlayerInId('');
      setIsMinuteCustomized(false);
      const calcMin = Math.min(120, Math.max(0, Math.round(timerSeconds / 60)));
      setMinute(String(calcMin));

      // Refresh events timeline
      fetchEvents();
    } catch (err) {
      console.error('Error logging event:', err);
      showToast(err.response?.data?.error || 'Failed to log event.', 'error');
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const handleDeleteEventConfirm = async () => {
    if (!eventToDelete) return;

    try {
      setIsDeletingEvent(true);
      await matchService.deleteEvent(eventToDelete.id);

      // Goal Logic on Delete: Decrement score if deleted event was a Goal
      if (eventToDelete.eventType === 'goal') {
        let newHome = homeScore;
        let newAway = awayScore;

        if (eventToDelete.teamId === match.homeTeamId) {
          newHome = Math.max(0, homeScore - 1);
          setHomeScore(newHome);
        } else if (eventToDelete.teamId === match.awayTeamId) {
          newAway = Math.max(0, awayScore - 1);
          setAwayScore(newAway);
        }

        // Sync score with backend match update API
        await saveScore(newHome, newAway);
      }

      showToast('Match event deleted successfully.');
      setEventToDelete(null);
      fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      showToast(err.response?.data?.error || 'Failed to delete event.', 'error');
    } finally {
      setIsDeletingEvent(false);
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────

  const currentStatus = match?.status || STATUS.SCHEDULED;
  const isFinished =
    currentStatus === STATUS.FULLTIME ||
    currentStatus === STATUS.COMPLETED ||
    currentStatus === STATUS.CANCELLED;
  const hasBothTeams = Boolean(match?.homeTeamId && match?.awayTeamId && match?.homeTeam && match?.awayTeam);
  const isLoggingAllowed =
    (currentStatus === STATUS.LIVE || currentStatus === STATUS.HALFTIME) && hasBothTeams;

  const sortedEvents = [...events].sort((a, b) => a.minute - b.minute);

  const isReadOnly = searchParams.get('readonly') === 'true';

  // Match Summary Calculations
  const goalEvents = events.filter((e) => e.eventType === 'goal').sort((a, b) => a.minute - b.minute);
  const yellowCardEvents = events.filter((e) => e.eventType === 'yellow_card').sort((a, b) => a.minute - b.minute);
  const redCardEvents = events.filter((e) => e.eventType === 'red_card').sort((a, b) => a.minute - b.minute);
  const subEvents = events.filter((e) => e.eventType === 'substitution').sort((a, b) => a.minute - b.minute);

  const totalGoals = goalEvents.length;
  const totalCards = yellowCardEvents.length + redCardEvents.length;
  const totalSubs = subEvents.length;

  let winnerText = '';
  let winnerIcon = '🏆';
  if (homeScore > awayScore) {
    winnerText = `${match?.homeTeam?.name || 'Home Team'} Wins!`;
  } else if (awayScore > homeScore) {
    winnerText = `${match?.awayTeam?.name || 'Away Team'} Wins!`;
  } else if (match?.winnerTeamId) {
    const winnerName =
      match.winnerTeam?.name ||
      (match.winnerTeamId === match.homeTeamId ? match.homeTeam?.name : match.awayTeam?.name) ||
      'Winner';
    if (match.tieBreakMethod === 'penalty') {
      winnerText = `${winnerName} Wins on Penalties (${match.homePenaltyScore ?? 0}–${match.awayPenaltyScore ?? 0})!`;
    } else if (match.tieBreakMethod === 'toss') {
      winnerText = `${winnerName} Wins on Coin Toss!`;
    } else {
      winnerText = `${winnerName} Wins!`;
    }
  } else {
    winnerText = 'Match Tied (Draw)';
    winnerIcon = '🤝';
  }

  // ── Loading / Error ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 pb-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-7 w-48 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
        </div>
        <div className="bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200 dark:border-slate-800 p-10 animate-pulse flex flex-col items-center gap-6">
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          <div className="grid grid-cols-3 gap-8 w-full max-w-lg">
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-2xl bg-slate-200 dark:bg-slate-700" />
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
            <div className="flex items-center justify-center">
              <div className="h-16 w-16 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-2xl bg-slate-200 dark:bg-slate-700" />
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/organizer/matches')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Matches
        </button>
        <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!match) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Tied Knockout Match Resolution Modal */}
      <TieResolutionModal
        isOpen={showTieModal}
        onClose={() => setShowTieModal(false)}
        match={match}
        homeScore={homeScore}
        awayScore={awayScore}
        onResolveTie={handleResolveTie}
        onStartExtraTime={handleStartExtraTime}
        isLoading={isResolvingTie}
      />

      {/* End Match Confirm */}
      <ConfirmDialog
        isOpen={showEndConfirm}
        title="End Match?"
        message={`This will set the final score as ${homeScore} – ${awayScore} and mark the match as Full Time. This action cannot be undone.`}
        confirmLabel="End Match"
        isDestructive={true}
        isLoading={isSaving}
        onConfirm={handleEndMatch}
        onCancel={() => setShowEndConfirm(false)}
      />

      {/* Delete Event Confirm */}
      <ConfirmDialog
        isOpen={!!eventToDelete}
        title="Delete Match Event?"
        message={`Are you sure you want to delete this ${eventToDelete?.eventType?.replace('_', ' ')} event at ${eventToDelete?.minute}'? ${eventToDelete?.eventType === 'goal'
            ? 'Deleting a goal event will automatically decrement the team score.'
            : ''
          }`}
        confirmLabel="Delete Event"
        isDestructive={true}
        isLoading={isDeletingEvent}
        onConfirm={handleDeleteEventConfirm}
        onCancel={() => setEventToDelete(null)}
      />

      {/* Back Navigation */}
      <button
        onClick={() => navigate('/organizer/matches')}
        className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Matches
      </button>

      {/* Meta: Tournament + Venue */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
        {match.tournament?.name && (
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {match.tournament.name}
            </span>
          </div>
        )}
        {match.venue && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{match.venue}</span>
          </div>
        )}
      </div>

      {/* ── Main Scoreboard Card ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Status + Timer bar */}
        <div
          className={`px-6 py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 ${currentStatus === STATUS.LIVE
              ? 'bg-red-500/5'
              : currentStatus === STATUS.HALFTIME
                ? 'bg-amber-500/5'
                : isFinished
                  ? 'bg-emerald-500/5'
                  : 'bg-slate-50 dark:bg-slate-900/30'
            }`}
        >
          <StatusBadge status={currentStatus} />

          {/* Timer */}
          <div
            className={`flex items-center gap-2 font-mono text-xl font-black tabular-nums ${timerRunning
                ? 'text-red-500'
                : 'text-slate-400 dark:text-slate-500'
              }`}
          >
            <Clock className={`w-5 h-5 ${timerRunning ? 'text-red-500' : 'text-slate-400'}`} />
            {formatTimer(timerSeconds)}
          </div>
        </div>

        {/* Scoreboard */}
        <div className="px-8 py-8">
          <div className="grid grid-cols-7 items-center gap-4">
            {/* Home Team */}
            <div className="col-span-3 flex flex-col items-center gap-4">
              <TeamBadge team={match.homeTeam} side="home" />
              <ScoreDisplay
                score={homeScore}
                teamId={match.homeTeamId}
                teamName={match.homeTeam?.name}
                isLoggingAllowed={isLoggingAllowed}
                isReadOnly={isReadOnly}
                onLogGoal={handleQuickLogGoal}
                color="blue"
              />
            </div>

            {/* Centre divider */}
            <div className="col-span-1 flex flex-col items-center gap-2">
              <span className="text-2xl font-black text-slate-300 dark:text-slate-600">—</span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                vs
              </span>
              <span className="text-2xl font-black text-slate-300 dark:text-slate-600">—</span>
              {isFinished && match.tieBreakMethod === 'penalty' && match.homePenaltyScore !== null && match.awayPenaltyScore !== null && (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums text-center bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  Pen: {match.homePenaltyScore}–{match.awayPenaltyScore}
                </span>
              )}
              {isFinished && match.tieBreakMethod === 'toss' && (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  Coin Toss
                </span>
              )}
            </div>

            {/* Away Team */}
            <div className="col-span-3 flex flex-col items-center gap-4">
              <TeamBadge team={match.awayTeam} side="away" />
              <ScoreDisplay
                score={awayScore}
                teamId={match.awayTeamId}
                teamName={match.awayTeam?.name}
                isLoggingAllowed={isLoggingAllowed}
                isReadOnly={isReadOnly}
                onLogGoal={handleQuickLogGoal}
                color="purple"
              />
            </div>
          </div>
        </div>

        {/* ── Control Bar ────────────────────────────────────────────────── */}
        {!isFinished && !isReadOnly && (
          <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 flex flex-wrap items-center justify-center gap-3">
            {currentStatus === STATUS.SCHEDULED && (
              hasBothTeams ? (
                <button
                  onClick={handleStartMatch}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 fill-white" />
                  )}
                  Start Match
                </button>
              ) : (
                <div className="flex items-center gap-2 px-5 py-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-semibold">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Teams are TBD. Start Match will be enabled once both qualifying teams advance.</span>
                </div>
              )
            )}

            {currentStatus === STATUS.LIVE && (
              <>
                <button
                  onClick={handleHalfTime}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Pause className="w-4 h-4 fill-white" />
                  )}
                  Half Time
                </button>
                <button
                  onClick={handleInitiateEndMatch}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-500/20 transition-all disabled:opacity-50"
                >
                  <Square className="w-4 h-4 fill-white" />
                  End Match
                </button>
              </>
            )}

            {currentStatus === STATUS.HALFTIME && (
              <>
                <button
                  onClick={handleResume}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Resume 2nd Half
                </button>
                <button
                  onClick={handleInitiateEndMatch}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-500/20 transition-all disabled:opacity-50"
                >
                  <Square className="w-4 h-4 fill-white" />
                  End Match
                </button>
              </>
            )}
          </div>
        )}

        {/* Finished banner */}
        {isFinished && (
          <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-emerald-500/5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              ✅ Match ended — final score recorded.
            </p>
            <button
              onClick={() => navigate('/organizer/matches')}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Matches
            </button>
          </div>
        )}
      </div>

      {/* ── Info Cards Row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div className="bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Kickoff</p>
            <p className="font-semibold text-slate-900 dark:text-white">
              {match.matchDate
                ? new Date(match.matchDate).toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
                : 'TBD'}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
          <Radio className={`w-5 h-5 ${currentStatus === STATUS.LIVE ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Timer</p>
            <p className={`font-bold font-mono ${timerRunning ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
              {formatTimer(timerSeconds)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
          <Trophy className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Current Score</p>
            <p className="font-black text-slate-900 dark:text-white text-lg tracking-wider">
              {homeScore} — {awayScore}
            </p>
          </div>
        </div>
      </div>

      {/* Hint for event/score logging */}
      {!isLoggingAllowed && !isFinished && !isReadOnly && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          Start the match to enable goal and event logging.
        </p>
      )}

      {/* ── STEP 7B.3: FULL TIME MATCH SUMMARY SECTION ───────────────────────── */}
      {isFinished && (
        <div className="bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-lg">
                🏆
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Match Summary
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  Official Full Time Match Report
                </p>
              </div>
            </div>

            {/* Winner / Result Badge */}
            <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 flex items-center gap-2">
              <span className="text-lg">{winnerIcon}</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {winnerText} ({homeScore} – {awayScore})
              </span>
            </div>
          </div>

          {/* Key Metrics Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Total Goals
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {totalGoals}
                </p>
              </div>
              <span className="text-2xl">⚽</span>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Total Cards
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {totalCards}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    ({yellowCardEvents.length}🟨, {redCardEvents.length}🟥)
                  </span>
                </p>
              </div>
              <span className="text-2xl">🟨</span>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/15 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Substitutions
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {totalSubs}
                </p>
              </div>
              <RefreshCw className="w-6 h-6 text-blue-500" />
            </div>
          </div>

          {/* Event Breakdown Lists */}
          {events.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 text-center">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                No events recorded.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Goal Scorers */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span>⚽</span> Goal Scorers ({goalEvents.length})
                </h4>
                {goalEvents.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No goals scored</p>
                ) : (
                  <div className="space-y-2">
                    {goalEvents.map((g) => {
                      const isHome = g.teamId === match.homeTeamId;
                      const teamName = g.team?.shortName || g.team?.name || (isHome ? match.homeTeam?.name : match.awayTeam?.name) || 'Team';
                      const pName = g.player?.fullName || 'Player';
                      return (
                        <div key={g.id} className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span className="font-mono text-slate-500">{g.minute}'</span>
                          <span>{pName}</span>
                          <span className="text-slate-400 font-normal">({teamName})</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cards (Yellow & Red) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span>🟨</span> Cards Disciplinary ({totalCards})
                </h4>
                {totalCards === 0 ? (
                  <p className="text-xs text-slate-400 italic">No cards issued</p>
                ) : (
                  <div className="space-y-2">
                    {yellowCardEvents.map((c) => {
                      const isHome = c.teamId === match.homeTeamId;
                      const teamName = c.team?.shortName || c.team?.name || (isHome ? match.homeTeam?.name : match.awayTeam?.name) || 'Team';
                      const pName = c.player?.fullName || 'Player';
                      return (
                        <div key={c.id} className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span className="w-2.5 h-3.5 bg-amber-400 rounded-[2px] border border-amber-500 shadow-sm inline-block" />
                          <span className="font-mono text-slate-500">{c.minute}'</span>
                          <span>{pName}</span>
                          <span className="text-slate-400 font-normal">({teamName})</span>
                        </div>
                      );
                    })}
                    {redCardEvents.map((c) => {
                      const isHome = c.teamId === match.homeTeamId;
                      const teamName = c.team?.shortName || c.team?.name || (isHome ? match.homeTeam?.name : match.awayTeam?.name) || 'Team';
                      const pName = c.player?.fullName || 'Player';
                      return (
                        <div key={c.id} className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span className="w-2.5 h-3.5 bg-red-600 rounded-[2px] border border-red-700 shadow-sm inline-block" />
                          <span className="font-mono text-slate-500">{c.minute}'</span>
                          <span>{pName}</span>
                          <span className="text-slate-400 font-normal">({teamName})</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Substitutions */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-500" /> Substitutions ({subEvents.length})
                </h4>
                {subEvents.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No substitutions made</p>
                ) : (
                  <div className="space-y-2">
                    {subEvents.map((s) => {
                      const isHome = s.teamId === match.homeTeamId;
                      const teamName = s.team?.shortName || s.team?.name || (isHome ? match.homeTeam?.name : match.awayTeam?.name) || 'Team';
                      return (
                        <div key={s.id} className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span className="font-mono text-slate-500">{s.minute}'</span>
                          <span className="truncate">{s.details || 'Substitution'}</span>
                          <span className="text-slate-400 font-normal shrink-0">({teamName})</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 7B: MATCH EVENTS SECTION ───────────────────────────────────── */}
      <div className="space-y-6 pt-4">
        {/* Section Header */}
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {isReadOnly ? 'Event Timeline' : 'Match Events Logger'}
          </h2>
        </div>

        {/* Event Form Card — hidden in read-only mode */}
        {!isReadOnly && (
          <div id="match-event-form" className="bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">
              Log New Event
            </h3>

            {!isLoggingAllowed && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Event logging is enabled when the match is Live or at Half Time.</span>
              </div>
            )}

            <form onSubmit={handleAddEvent} className="space-y-4">
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${eventType === 'substitution' ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-4`}>
                {/* Event Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={eventType}
                    disabled={!isLoggingAllowed || isSubmittingEvent}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.icon} {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Team */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Team <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedTeamId}
                    disabled={!isLoggingAllowed || isSubmittingEvent}
                    onChange={handleTeamChange}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {match.homeTeamId && (
                      <option value={match.homeTeamId}>
                        Home: {match.homeTeam?.name || 'Home Team'}
                      </option>
                    )}
                    {match.awayTeamId && (
                      <option value={match.awayTeamId}>
                        Away: {match.awayTeam?.name || 'Away Team'}
                      </option>
                    )}
                  </select>
                </div>

                {/* Player / Substitution Players */}
                {eventType === 'substitution' ? (
                  <>
                    {/* OUT Player */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                        OUT Player <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={playerOutId}
                        disabled={!isLoggingAllowed || isSubmittingEvent}
                        onChange={(e) => setPlayerOutId(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Select OUT player...</option>
                        {activeRoster.map((m) => {
                          const pId = m.player?.id || m.playerId;
                          const pName = m.player?.fullName || 'Unknown Player';
                          const jerseyStr = m.jerseyNumber ? `#${m.jerseyNumber} ` : '';
                          return (
                            <option key={`out-${m.id || pId}`} value={pId}>
                              {jerseyStr}{pName}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* IN Player */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                        IN Player <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={playerInId}
                        disabled={!isLoggingAllowed || isSubmittingEvent}
                        onChange={(e) => setPlayerInId(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Select IN player...</option>
                        {activeRoster.map((m) => {
                          const pId = m.player?.id || m.playerId;
                          const pName = m.player?.fullName || 'Unknown Player';
                          const jerseyStr = m.jerseyNumber ? `#${m.jerseyNumber} ` : '';
                          return (
                            <option key={`in-${m.id || pId}`} value={pId}>
                              {jerseyStr}{pName}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </>
                ) : (
                  /* Regular Player Select */
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      Player <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedPlayerId}
                      disabled={!isLoggingAllowed || isSubmittingEvent}
                      onChange={(e) => setSelectedPlayerId(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select player...</option>
                      {activeRoster.map((m) => {
                        const pId = m.player?.id || m.playerId;
                        const pName = m.player?.fullName || 'Unknown Player';
                        const jerseyStr = m.jerseyNumber ? `#${m.jerseyNumber} ` : '';
                        return (
                          <option key={m.id || pId} value={pId}>
                            {jerseyStr}{pName}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {/* Minute */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Minute (0–120) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    disabled={!isLoggingAllowed || isSubmittingEvent}
                    placeholder="Auto-filled"
                    value={minute}
                    onChange={(e) => {
                      setMinute(e.target.value);
                      setIsMinuteCustomized(true);
                    }}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Details */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Details <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isLoggingAllowed || isSubmittingEvent}
                    placeholder="e.g. Tactical change"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                  {isMinuteCustomized
                    ? '⚡ Custom minute active'
                    : '⏱️ Minute auto-filled from live timer'}
                </span>
                <button
                  type="submit"
                  disabled={!isLoggingAllowed || isSubmittingEvent}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingEvent ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Log Event
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Timeline Section */}
        <div className="bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Match Timeline</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {events.length}
              </span>
            </h3>
          </div>

          {loadingEvents ? (
            <div className="space-y-3">
              <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            </div>
          ) : sortedEvents.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No events logged yet"
              description={isReadOnly ? 'No events were recorded during this match.' : 'Use the form above to record goals, cards, and substitutions during the match.'}
            />
          ) : (
            <div className="space-y-3">
              {sortedEvents.map((evt) => {
                const isHome = evt.teamId === match.homeTeamId;
                const teamObj = isHome ? match.homeTeam : match.awayTeam;
                const teamName = evt.team?.name || teamObj?.name || (isHome ? 'Home' : 'Away');
                const playerName = evt.player?.fullName || 'Player';

                return (
                  <div
                    key={evt.id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Minute badge */}
                      <span className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-black font-mono tracking-wider">
                        {evt.minute}'
                      </span>

                      {/* Event Type Badge */}
                      <EventBadge type={evt.eventType} />

                      {/* Player & Team Info */}
                      {evt.eventType === 'substitution' ? (
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {evt.details}
                          </span>
                          <span className="text-slate-400 font-normal">•</span>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-md ${isHome
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                              }`}
                          >
                            {teamName} ({isHome ? 'Home' : 'Away'})
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                            <span>{playerName}</span>
                            <span className="text-slate-400 font-normal">•</span>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-md ${isHome
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                  : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                }`}
                            >
                              {teamName} ({isHome ? 'Home' : 'Away'})
                            </span>
                          </div>

                          {/* Details if available */}
                          {evt.details && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                              ({evt.details})
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Delete Action — hidden in read-only mode */}
                    {!isReadOnly && (
                      <button
                        onClick={() => setEventToDelete(evt)}
                        title="Delete event"
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

