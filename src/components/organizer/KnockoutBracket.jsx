import React, { useState, useMemo } from 'react';
import { Trophy, Zap, Radio, Clock, Shield, Sparkles, ChevronRight, Award, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── Standard Round Ordering ──────────────────────────────────────────────────
const ROUND_ORDER_WEIGHTS = {
  'round of 64': 1,
  'round of 32': 2,
  'round of 16': 3,
  'quarter final': 4,
  'quarter-final': 4,
  'quarterfinal': 4,
  'semi final': 5,
  'semi-final': 5,
  'semifinal': 5,
  'final': 6,
  'grand final': 6,
  'third place': 7,
  '3rd place': 7,
};

const getRoundWeight = (roundName = '') => {
  const norm = roundName.toLowerCase().trim();
  for (const [key, weight] of Object.entries(ROUND_ORDER_WEIGHTS)) {
    if (norm.includes(key)) return weight;
  }
  return 10;
};

// ─── Match Team Row ───────────────────────────────────────────────────────────
const TeamRow = ({ team, score, penalties, tieBreakMethod, isWinner, isLoser, isTBD, side = 'home' }) => {
  const badgeColors =
    side === 'home'
      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
      : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';

  return (
    <div
      className={`flex items-center justify-between px-3 py-2 transition-all ${
        isWinner
          ? 'bg-emerald-500/15 font-bold text-white'
          : isLoser
          ? 'opacity-40 grayscale-[30%] text-slate-400'
          : isTBD
          ? 'text-slate-500 italic'
          : 'text-slate-200'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
        {/* Team Logo / Avatar */}
        <div
          className={`w-6 h-6 rounded-md border flex items-center justify-center font-bold text-[10px] shrink-0 overflow-hidden ${
            isTBD
              ? 'border-dashed border-slate-700 bg-slate-800/60 text-slate-500'
              : isWinner
              ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
              : badgeColors
          }`}
        >
          {team?.logoUrl ? (
            <img src={team.logoUrl} alt={team.name || 'Team'} className="w-full h-full object-cover" />
          ) : team?.shortName || team?.name ? (
            team.shortName || team.name.substring(0, 3).toUpperCase()
          ) : (
            '?'
          )}
        </div>

        {/* Team Name */}
        <span className="text-xs truncate font-semibold" title={team?.name || 'TBD'}>
          {team?.name || 'TBD'}
        </span>

        {/* Winner checkmark / trophy indicator */}
        {isWinner && (
          <span className="shrink-0 text-emerald-400 text-[10px] font-bold">
            ✓
          </span>
        )}
      </div>

      {/* Score and penalty display */}
      <div className="flex items-center gap-1.5 shrink-0">
        {penalties !== null && penalties !== undefined && tieBreakMethod === 'penalty' && (
          <span className="text-[10px] font-bold text-amber-400 tabular-nums">
            ({penalties}p)
          </span>
        )}
        <span
          className={`w-6 h-6 rounded flex items-center justify-center text-xs tabular-nums font-black ${
            isWinner
              ? 'bg-emerald-500 text-white shadow-xs'
              : score !== null && score !== undefined
              ? 'bg-slate-800 text-slate-200'
              : 'text-slate-600'
          }`}
        >
          {score !== null && score !== undefined ? score : '-'}
        </span>
      </div>
    </div>
  );
};

// ─── Bracket Match Card ───────────────────────────────────────────────────────
const BracketMatchCard = ({ match, onOpenLive, isFinal = false }) => {
  const isLive = match.status === 'live';
  const isHalftime = match.status === 'halftime';
  const isFinished = match.status === 'fulltime' || match.status === 'completed';
  const hasBothTeams = Boolean(match.homeTeamId && match.awayTeamId && match.homeTeam && match.awayTeam);

  // Winner evaluation
  let isHomeWinner = false;
  let isAwayWinner = false;

  if (isFinished) {
    if (match.winnerTeamId) {
      isHomeWinner = match.winnerTeamId === match.homeTeamId;
      isAwayWinner = match.winnerTeamId === match.awayTeamId;
    } else if (match.homeScore != null && match.awayScore != null) {
      if (match.homeScore > match.awayScore) isHomeWinner = true;
      else if (match.awayScore > match.homeScore) isAwayWinner = true;
    }
  }

  const isHomeLoser = isFinished && isAwayWinner;
  const isAwayLoser = isFinished && isHomeWinner;

  return (
    <div
      className={`group relative w-[220px] sm:w-[250px] rounded-xl transition-all duration-200 border bg-slate-900/95 ${
        isFinal
          ? 'border-amber-500/60 bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-900 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/30'
          : isLive
          ? 'border-red-500/60 shadow-lg shadow-red-500/10 ring-1 ring-red-500/30'
          : 'border-slate-800 shadow-md hover:border-slate-700 hover:shadow-lg'
      }`}
    >
      {/* Header with Match Position / Status */}
      <div className="px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[10px] font-bold tracking-wider text-slate-400">
        <span className="uppercase truncate max-w-[130px]">
          {match.roundName || `Match #${match.bracketPosition || 1}`}
        </span>

        {isLive ? (
          <span className="inline-flex items-center gap-1 text-red-500 font-bold uppercase animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Live
          </span>
        ) : isHalftime ? (
          <span className="text-amber-500 font-bold uppercase">HT</span>
        ) : isFinished ? (
          <span className="text-emerald-400 font-bold uppercase">FT</span>
        ) : hasBothTeams ? (
          <span className="text-blue-400 font-semibold">Ready</span>
        ) : (
          <span className="text-slate-500 italic">TBD</span>
        )}
      </div>

      {/* Team Rows */}
      <div className="divide-y divide-slate-800/80">
        <TeamRow
          team={match.homeTeam}
          score={isFinished || isLive || isHalftime ? match.homeScore : null}
          penalties={match.homePenaltyScore}
          tieBreakMethod={match.tieBreakMethod}
          isWinner={isHomeWinner}
          isLoser={isHomeLoser}
          isTBD={!match.homeTeamId || !match.homeTeam}
          side="home"
        />
        <TeamRow
          team={match.awayTeam}
          score={isFinished || isLive || isHalftime ? match.awayScore : null}
          penalties={match.awayPenaltyScore}
          tieBreakMethod={match.tieBreakMethod}
          isWinner={isAwayWinner}
          isLoser={isAwayLoser}
          isTBD={!match.awayTeamId || !match.awayTeam}
          side="away"
        />
      </div>

      {/* Footer / Quick Action */}
      <div className="px-3 py-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 bg-slate-950/50 rounded-b-xl">
        <span className="truncate max-w-[140px]">
          {match.matchDate
            ? new Date(match.matchDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            : 'Date TBD'}
        </span>

        {hasBothTeams && (
          <button
            onClick={() => onOpenLive(match.id, isFinished)}
            className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded transition-all ${
              isLive
                ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
                : isFinished
                ? 'text-blue-400 hover:bg-blue-500/10'
                : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
            }`}
            title={isFinished ? 'View Match Summary' : isLive ? 'Manage Live Match' : 'Start Match'}
          >
            {isLive ? <Radio className="w-3 h-3 animate-pulse" /> : <Zap className="w-3 h-3" />}
            <span>{isFinished ? 'View' : isLive ? 'Live' : 'Start'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Bracket Tree Connector (Left-to-Right Pair Merger) ────────────────────────
const PairConnector = ({ topWinner = false, bottomWinner = false }) => {
  return (
    <div className="flex items-center justify-center shrink-0 w-10 sm:w-12 h-full">
      <svg className="w-full h-full" viewBox="0 0 40 100" preserveAspectRatio="none" fill="none">
        {/* Top branch line */}
        <path
          d="M 0 25 H 20 V 50"
          stroke={topWinner ? '#10b981' : '#475569'}
          strokeWidth={topWinner ? '2.5' : '1.5'}
          strokeOpacity={topWinner ? '1' : '0.4'}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Bottom branch line */}
        <path
          d="M 0 75 H 20 V 50"
          stroke={bottomWinner ? '#10b981' : '#475569'}
          strokeWidth={bottomWinner ? '2.5' : '1.5'}
          strokeOpacity={bottomWinner ? '1' : '0.4'}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Stem line leading into next round match */}
        <path
          d="M 20 50 H 40"
          stroke={topWinner || bottomWinner ? '#10b981' : '#475569'}
          strokeWidth={topWinner || bottomWinner ? '2.5' : '1.5'}
          strokeOpacity={topWinner || bottomWinner ? '1' : '0.4'}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

// ─── Single Stem Connector ────────────────────────────────────────────────────
const StemConnector = ({ active = false }) => {
  return (
    <div className="flex items-center justify-center shrink-0 w-10 sm:w-12 h-full">
      <svg className="w-full h-full" viewBox="0 0 40 100" preserveAspectRatio="none" fill="none">
        <path
          d="M 0 50 H 40"
          stroke={active ? '#f59e0b' : '#475569'}
          strokeWidth={active ? '2.5' : '1.5'}
          strokeOpacity={active ? '1' : '0.4'}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

// ─── Main Knockout Bracket Component ──────────────────────────────────────────
export const KnockoutBracket = ({
  matches = [],
  tournaments = [],
  selectedTournamentId,
  onSelectTournament,
}) => {
  const navigate = useNavigate();
  const [selectedRoundFilter, setSelectedRoundFilter] = useState('all');

  // Filter knockout matches for selected tournament
  const knockoutMatches = useMemo(() => {
    if (!matches || matches.length === 0) return [];

    let list = matches;
    if (selectedTournamentId && selectedTournamentId !== 'all') {
      list = list.filter((m) => m.tournamentId === selectedTournamentId || m.tournament?.id === selectedTournamentId);
    }

    return list.filter((m) => {
      if (m.bracketPosition != null) return true;
      const r = (m.roundName || '').toLowerCase();
      return (
        r.includes('round') ||
        r.includes('quarter') ||
        r.includes('semi') ||
        r.includes('final') ||
        r.includes('knockout')
      );
    });
  }, [matches, selectedTournamentId]);

  // Group matches by round in Left-to-Right progression order
  const { allRounds, finalMatch, thirdPlaceMatch, championTeam } = useMemo(() => {
    const groups = {};
    let final = null;
    let thirdPlace = null;

    knockoutMatches.forEach((m) => {
      const rName = m.roundName || 'Knockout Round';
      const norm = rName.toLowerCase().trim();

      if (norm === 'final' || norm === 'grand final') {
        final = m;
      } else if (norm.includes('third place') || norm.includes('3rd place')) {
        thirdPlace = m;
      } else {
        if (!groups[rName]) {
          groups[rName] = [];
        }
        groups[rName].push(m);
      }
    });

    // Sort matches in each round by bracketPosition
    Object.keys(groups).forEach((r) => {
      groups[r].sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0));
    });

    // Sort rounds by tournament progression order (QF → SF → Final)
    const sortedRoundNames = Object.keys(groups).sort((a, b) => getRoundWeight(a) - getRoundWeight(b));
    const roundsList = sortedRoundNames.map((name) => ({ name, matches: groups[name] }));

    if (final) {
      roundsList.push({ name: 'Final', matches: [final] });
    }

    // Determine champion
    let champ = null;
    if (final && (final.status === 'completed' || final.status === 'fulltime')) {
      if (final.winnerTeam) {
        champ = final.winnerTeam;
      } else if (final.winnerTeamId) {
        champ = final.winnerTeamId === final.homeTeamId ? final.homeTeam : final.awayTeam;
      } else if (final.homeScore > final.awayScore) {
        champ = final.homeTeam;
      } else if (final.awayScore > final.homeScore) {
        champ = final.awayTeam;
      }
    }

    return {
      allRounds: roundsList,
      finalMatch: final,
      thirdPlaceMatch: thirdPlace,
      championTeam: champ,
    };
  }, [knockoutMatches]);

  const handleOpenLive = (matchId, isFinished) => {
    navigate(`/organizer/matches/${matchId}/live${isFinished ? '?readonly=true' : ''}`);
  };

  // Find active tournament
  const currentTournament = useMemo(() => {
    if (!selectedTournamentId || selectedTournamentId === 'all') {
      return tournaments.find((t) => t.format === 'knockout' || t.format === 'hybrid') || tournaments[0];
    }
    return tournaments.find((t) => t.id === selectedTournamentId);
  }, [tournaments, selectedTournamentId]);

  if (knockoutMatches.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
          <Trophy className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          No Knockout Bracket Found
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
          {currentTournament
            ? `The tournament "${currentTournament.name}" does not have a generated knockout bracket yet.`
            : 'Select a tournament with a knockout or hybrid format to view its bracket.'}
        </p>
        {currentTournament && (
          <button
            onClick={() => navigate('/organizer/tournaments')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm"
          >
            <Zap className="w-4 h-4" />
            Go to Tournaments to Generate Bracket
          </button>
        )}
      </div>
    );
  }

  // Filtered rounds based on round selector
  const displayedRounds = useMemo(() => {
    if (selectedRoundFilter === 'all') return allRounds;
    return allRounds.filter((r) => r.name.toLowerCase() === selectedRoundFilter.toLowerCase());
  }, [allRounds, selectedRoundFilter]);

  return (
    <div className="w-full bg-slate-950 text-white rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
      {/* ── Stadium Glow Background ────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-950/40 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* ── Bracket Header & Tournament Info ──────────────────────────────── */}
      <div className="relative z-10 px-6 py-6 border-b border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-black uppercase tracking-widest mb-1">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Knockout Tournament Tree</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>{currentTournament?.name || 'Tournament Knockout Stage'}</span>
            {championTeam && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Champion: {championTeam.name}
              </span>
            )}
          </h2>
        </div>

        {/* Tournament Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {tournaments.length > 1 && (
            <select
              value={selectedTournamentId || 'all'}
              onChange={(e) => onSelectTournament(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white border border-slate-700 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              <option value="all">All Tournaments</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.format})
                </option>
              ))}
            </select>
          )}

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>{knockoutMatches.length} Matches</span>
          </div>
        </div>
      </div>

      {/* ── Round Navigation Selector Tabs ─────────────────────────────────── */}
      <div className="relative z-10 px-6 py-3 border-b border-slate-800/60 bg-slate-950/60 flex items-center justify-between gap-3 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline-block">
            Rounds:
          </span>

          <button
            type="button"
            onClick={() => setSelectedRoundFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedRoundFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            All Rounds (Tree)
          </button>

          {allRounds.map((round) => {
            const isSelected = selectedRoundFilter.toLowerCase() === round.name.toLowerCase();
            return (
              <button
                key={`tab-${round.name}`}
                type="button"
                onClick={() => setSelectedRoundFilter(round.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{round.name}</span>
                <span className="text-[10px] opacity-75">({round.matches.length})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Bracket Canvas (Left-to-Right Cascading Flow with Horizontal Scroll) ─ */}
      <div className="relative z-10 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900 select-none">
        <div className="w-max min-w-max flex items-stretch justify-start px-6 py-8 sm:p-8 md:p-10 gap-0">
          {displayedRounds.map((round, rIndex) => {
            const isLastRound = rIndex === displayedRounds.length - 1;
            const isFinalRound = round.name.toLowerCase() === 'final';

            return (
              <div key={`col-${round.name}-${rIndex}`} className="flex items-stretch">
                {/* Round Column */}
                <div className="flex flex-col items-center">
                  {/* Round Title Header */}
                  <div className="mb-6 text-center">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-300 bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-full shadow-xs">
                      {round.name}
                    </span>
                  </div>

                  {/* Matches Column Container */}
                  <div className="flex flex-col justify-around gap-8 flex-1">
                    {round.matches.map((m) => (
                      <BracketMatchCard
                        key={m.id}
                        match={m}
                        onOpenLive={handleOpenLive}
                        isFinal={isFinalRound}
                      />
                    ))}
                  </div>
                </div>

                {/* Tree Connectors between rounds (Left to Right) */}
                {!isLastRound && (
                 <div className="flex flex-col justify-around my-auto shrink-0 w-10 sm:w-12 h-[calc(100%-3rem)] mt-12">
                    {Array.from({ length: Math.ceil(round.matches.length / 2) }).map((_, pairIdx) => {
                      const match1 = round.matches[pairIdx * 2];
                      const match2 = round.matches[pairIdx * 2 + 1];

                      const isMatch1Winner = match1 && (match1.status === 'completed' || match1.status === 'fulltime') && Boolean(match1.winnerTeamId);
                      const isMatch2Winner = match2 && (match2.status === 'completed' || match2.status === 'fulltime') && Boolean(match2.winnerTeamId);

                      return (
                        <div key={`connector-${pairIdx}`} className="flex-1 flex items-center">
                          <PairConnector
                            topWinner={isMatch1Winner}
                            bottomWinner={isMatch2Winner}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* ── Champion Trophy Showcase (Rightmost Spotlight) ────────── */}
          {selectedRoundFilter === 'all' && (
            <div className="flex items-stretch pl-2">
              <StemConnector active={Boolean(championTeam)} />

              <div className="flex flex-col items-center justify-center pl-2 my-auto">
                <div className="mb-6 text-center">
                  <span className="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-4 py-1.5 rounded-full">
                    Champion
                  </span>
                </div>

                <div
                  className={`w-[220px] sm:w-[240px] rounded-2xl border-2 p-6 flex flex-col items-center text-center transition-all ${
                    championTeam
                      ? 'border-amber-400 bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-900 shadow-2xl shadow-amber-500/20 ring-2 ring-amber-400/40'
                      : 'border-dashed border-slate-800 bg-slate-900/50 text-slate-500'
                  }`}
                >
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center text-amber-400 mb-3 shadow-lg ${
                      championTeam
                        ? 'bg-gradient-to-tr from-amber-500/30 to-amber-300/20 border border-amber-400/60 shadow-amber-500/20 animate-bounce'
                        : 'bg-slate-800/80 border border-slate-700'
                    }`}
                  >
                    <Trophy className="w-8 h-8" />
                  </div>

                  {championTeam ? (
                    <>
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                        Tournament Winner
                      </span>
                      <h4 className="text-base font-black text-white mt-1 line-clamp-1">
                        {championTeam.name}
                      </h4>
                      <span className="text-xs text-emerald-400 font-bold mt-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Qualified & Crowned
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-bold text-slate-400">Trophy Awaiting</span>
                      <span className="text-[10px] text-slate-500 mt-1">
                        Winner of Final will be crowned here
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer Navigation Help & Legend ────────────────────────────────── */}
      <div className="relative z-10 px-6 py-3 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Winner Advanced</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse inline-block" />
            <span>Live Match</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-dashed border-slate-500 inline-block" />
            <span>TBD / Pending</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <span>Tip: Select any round tab above to focus or swipe horizontally to view all rounds</span>
        </div>
      </div>
    </div>
  );
};
