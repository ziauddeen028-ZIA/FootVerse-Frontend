import React, { useState, useEffect, useRef, useCallback } from 'react';
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

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`w-20 h-20 rounded-2xl border-2 ${colors} flex items-center justify-center font-black text-lg overflow-hidden`}
      >
        {team?.logoUrl ? (
          <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
        ) : (
          team?.shortName || team?.name?.substring(0, 3).toUpperCase() || '???'
        )}
      </div>
      <span className="text-base font-bold text-slate-900 dark:text-white text-center leading-tight max-w-[120px]">
        {team?.name || 'Team'}
      </span>
    </div>
  );
};

// ─── Score Control ────────────────────────────────────────────────────────────

const ScoreControl = ({ score, onIncrement, onDecrement, disabled }) => (
  <div className="flex flex-col items-center gap-2">
    <button
      onClick={onIncrement}
      disabled={disabled}
      className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white flex items-center justify-center transition-all shadow-md shadow-blue-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      <Plus className="w-5 h-5" />
    </button>
    <span className="text-5xl font-black text-slate-900 dark:text-white tabular-nums w-16 text-center">
      {score}
    </span>
    <button
      onClick={onDecrement}
      disabled={disabled || score === 0}
      className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
    >
      <Minus className="w-5 h-5" />
    </button>
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
  const [toast, setToast] = useState({ message: '', type: 'success' });

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

  const handleEndMatch = async () => {
    setShowEndConfirm(false);
    setIsSaving(true);
    try {
      stopTimer();
      await updateMatchInBackend({ status: STATUS.FULLTIME, homeScore, awayScore });
      showToast('Match ended. Final score saved! 🏁');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to end match.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Score Helpers ───────────────────────────────────────────────────────────

  const isScoreEditable =
    match?.status === STATUS.LIVE || match?.status === STATUS.HALFTIME;

  const saveScore = async (newHome, newAway) => {
    try {
      await matchService.update(matchId, { homeScore: newHome, awayScore: newAway });
    } catch (err) {
      showToast('Score saved locally but backend sync failed.', 'error');
    }
  };

  const handleHomeIncrement = () => {
    const next = homeScore + 1;
    setHomeScore(next);
    saveScore(next, awayScore);
  };
  const handleHomeDecrement = () => {
    if (homeScore === 0) return;
    const next = homeScore - 1;
    setHomeScore(next);
    saveScore(next, awayScore);
  };
  const handleAwayIncrement = () => {
    const next = awayScore + 1;
    setAwayScore(next);
    saveScore(homeScore, next);
  };
  const handleAwayDecrement = () => {
    if (awayScore === 0) return;
    const next = awayScore - 1;
    setAwayScore(next);
    saveScore(homeScore, next);
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
  const isLoggingAllowed =
    currentStatus === STATUS.LIVE || currentStatus === STATUS.HALFTIME;

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
        message={`Are you sure you want to delete this ${eventToDelete?.eventType?.replace('_', ' ')} event at ${eventToDelete?.minute}'? ${
          eventToDelete?.eventType === 'goal'
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
          className={`px-6 py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 ${
            currentStatus === STATUS.LIVE
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
            className={`flex items-center gap-2 font-mono text-xl font-black tabular-nums ${
              timerRunning
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
              {isReadOnly ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                    {homeScore}
                  </span>
                </div>
              ) : (
                <ScoreControl
                  score={homeScore}
                  onIncrement={handleHomeIncrement}
                  onDecrement={handleHomeDecrement}
                  disabled={!isScoreEditable || isSaving}
                />
              )}
            </div>

            {/* Centre divider */}
            <div className="col-span-1 flex flex-col items-center gap-2">
              <span className="text-2xl font-black text-slate-300 dark:text-slate-600">—</span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                vs
              </span>
              <span className="text-2xl font-black text-slate-300 dark:text-slate-600">—</span>
            </div>

            {/* Away Team */}
            <div className="col-span-3 flex flex-col items-center gap-4">
              <TeamBadge team={match.awayTeam} side="away" />
              {isReadOnly ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                    {awayScore}
                  </span>
                </div>
              ) : (
                <ScoreControl
                  score={awayScore}
                  onIncrement={handleAwayIncrement}
                  onDecrement={handleAwayDecrement}
                  disabled={!isScoreEditable || isSaving}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Control Bar ────────────────────────────────────────────────── */}
        {!isFinished && !isReadOnly && (
          <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 flex flex-wrap items-center justify-center gap-3">
            {currentStatus === STATUS.SCHEDULED && (
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
                  onClick={() => setShowEndConfirm(true)}
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
                  onClick={() => setShowEndConfirm(true)}
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

      {/* Hint for score editing */}
      {!isScoreEditable && !isFinished && !isReadOnly && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          Score controls are enabled once the match is started.
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
          <div className="bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
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
                            className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                              isHome
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
                              className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                                isHome
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

