import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  GitBranch, 
  Shuffle, 
  RotateCcw, 
  Sparkles, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Shield, 
  ArrowRight,
  Sliders,
  Check
} from 'lucide-react';
import { CustomSelect } from '../common/CustomSelect';
import { teamService } from '../../services/teamService';
import { tournamentService } from '../../services/tournamentService';
import { extractTournamentConfig } from '../../utils/substitutionUtils';

/**
 * Computes standard crossover pairings for qualified teams from groups:
 * e.g., 4 groups x 2 qualifiers (8 teams):
 * QF 1: 1st Group A vs 2nd Group B
 * QF 2: 1st Group C vs 2nd Group D
 * QF 3: 1st Group B vs 2nd Group A
 * QF 4: 1st Group D vs 2nd Group C
 */
const pairGroupQualifiers = (groups, qualifyingTeamsPerGroup) => {
  const G = groups.length;
  const Q = qualifyingTeamsPerGroup;

  if (G === 2 && Q === 1) {
    return [groups[0].standings[0]?.team, groups[1].standings[0]?.team].filter(Boolean);
  }

  if (G % 2 === 0 && Q === 2) {
    const topHalf = [];
    const bottomHalf = [];

    for (let k = 0; k < G / 2; k++) {
      const g1 = groups[2 * k];
      const g2 = groups[2 * k + 1];

      if (g1?.standings?.[0]?.team && g2?.standings?.[1]?.team) {
        topHalf.push(g1.standings[0].team);
        topHalf.push(g2.standings[1].team);
      }

      if (g2?.standings?.[0]?.team && g1?.standings?.[1]?.team) {
        bottomHalf.push(g2.standings[0].team);
        bottomHalf.push(g1.standings[1].team);
      }
    }

    return [...topHalf, ...bottomHalf];
  }

  // General fallback
  const result = [];
  for (let pos = 0; pos < Q; pos++) {
    for (let g = 0; g < G; g++) {
      if (groups[g]?.standings?.[pos]?.team) {
        result.push(groups[g].standings[pos].team);
      }
    }
  }
  return result;
};

export const GenerateBracketModal = ({
  isOpen,
  onClose,
  tournament,
  onGenerate,
  isLoading = false,
  qualifiedTeams = null
}) => {
  const [mode, setMode] = useState('automatic'); // 'automatic' | 'manual'
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [matchups, setMatchups] = useState([]);
  const [error, setError] = useState(null);

  const isGroupFormat = useMemo(() => {
    const fmt = tournament?.format?.toLowerCase();
    return fmt === 'group_stage' || fmt === 'group_knockout' || fmt === 'hybrid';
  }, [tournament]);

  const tournamentConfig = useMemo(() => {
    return extractTournamentConfig(tournament);
  }, [tournament]);

  const qualifyingTeamsPerGroup = tournamentConfig.qualifyingTeamsPerGroup || 2;

  // Load qualified teams for group stage OR registered teams for pure knockout
  useEffect(() => {
    if (!isOpen || !tournament?.id) return;
    setError(null);
    setMode('automatic');

    const loadTeams = async () => {
      try {
        setLoadingTeams(true);

        // Case 1: qualifiedTeams prop provided explicitly
        if (qualifiedTeams && Array.isArray(qualifiedTeams) && qualifiedTeams.length > 0) {
          setTeams(qualifiedTeams);
          const numM = Math.floor(qualifiedTeams.length / 2);
          const initialMatchups = Array.from({ length: numM }, (_, i) => ({
            matchNumber: i + 1,
            homeTeamId: qualifiedTeams[2 * i]?.id || '',
            awayTeamId: qualifiedTeams[2 * i + 1]?.id || ''
          }));
          setMatchups(initialMatchups);
          return;
        }

        // Case 2: Group stage tournament format -> fetch standings and extract qualified teams
        if (isGroupFormat) {
          const standingsRes = await tournamentService.getStandings(tournament.id);
          const groups = standingsRes?.groups || [];

          if (groups.length > 0) {
            const pairedQualifiers = pairGroupQualifiers(groups, qualifyingTeamsPerGroup);
            setTeams(pairedQualifiers);

            const numM = Math.floor(pairedQualifiers.length / 2);
            const initialMatchups = Array.from({ length: numM }, (_, i) => ({
              matchNumber: i + 1,
              homeTeamId: pairedQualifiers[2 * i]?.id || '',
              awayTeamId: pairedQualifiers[2 * i + 1]?.id || ''
            }));
            setMatchups(initialMatchups);
            return;
          }
        }

        // Case 3: Pure Knockout tournament -> fetch all registered teams
        const res = await teamService.getAll();
        const allTeams = res?.teams || [];
        const regTeams = allTeams.filter(
          t => t.tournamentId === tournament.id || t.tournament?.id === tournament.id
        );
        setTeams(regTeams);

        const numM = Math.floor(regTeams.length / 2);
        const initialMatchups = Array.from({ length: numM }, (_, i) => ({
          matchNumber: i + 1,
          homeTeamId: regTeams[2 * i]?.id || '',
          awayTeamId: regTeams[2 * i + 1]?.id || ''
        }));
        setMatchups(initialMatchups);
      } catch (err) {
        console.error('Failed to load teams for bracket generation:', err);
        setError('Failed to load teams for bracket generation.');
      } finally {
        setLoadingTeams(false);
      }
    };

    loadTeams();
  }, [isOpen, tournament?.id, qualifiedTeams, isGroupFormat, qualifyingTeamsPerGroup]);

  const teamCount = teams.length;
  const supportedCounts = [2, 4, 8, 16, 32, 64];
  const isValidTeamCount = supportedCounts.includes(teamCount);
  const numMatches = Math.floor(teamCount / 2);

  // Set of all selected team IDs in manual matchups
  const selectedTeamIds = useMemo(() => {
    const ids = new Set();
    matchups.forEach(m => {
      if (m.homeTeamId) ids.add(m.homeTeamId);
      if (m.awayTeamId) ids.add(m.awayTeamId);
    });
    return ids;
  }, [matchups]);

  // Validation: are all matchups completely filled without duplicates?
  const isManualValid = useMemo(() => {
    if (mode !== 'manual') return true;
    if (matchups.length === 0 || matchups.length !== numMatches) return false;

    const allFilled = matchups.every(m => m.homeTeamId && m.awayTeamId && m.homeTeamId !== m.awayTeamId);
    if (!allFilled) return false;

    const allSelected = [];
    matchups.forEach(m => {
      allSelected.push(m.homeTeamId, m.awayTeamId);
    });

    const uniqueSet = new Set(allSelected);
    return uniqueSet.size === teamCount && allSelected.length === teamCount;
  }, [mode, matchups, numMatches, teamCount]);

  if (!isOpen || !tournament) return null;

  const handleMatchupChange = (matchIndex, side, teamId) => {
    setError(null);
    setMatchups(prev => {
      const next = [...prev];
      next[matchIndex] = {
        ...next[matchIndex],
        [side === 'home' ? 'homeTeamId' : 'awayTeamId']: teamId
      };
      return next;
    });
  };

  const handleAutoFill = () => {
    setError(null);
    const newMatchups = [];
    for (let i = 0; i < numMatches; i++) {
      newMatchups.push({
        matchNumber: i + 1,
        homeTeamId: teams[2 * i]?.id || '',
        awayTeamId: teams[2 * i + 1]?.id || ''
      });
    }
    setMatchups(newMatchups);
  };

  const handleShuffle = () => {
    setError(null);
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    const newMatchups = [];
    for (let i = 0; i < numMatches; i++) {
      newMatchups.push({
        matchNumber: i + 1,
        homeTeamId: shuffled[2 * i]?.id || '',
        awayTeamId: shuffled[2 * i + 1]?.id || ''
      });
    }
    setMatchups(newMatchups);
  };

  const handleClear = () => {
    setError(null);
    setMatchups(
      Array.from({ length: numMatches }, (_, i) => ({
        matchNumber: i + 1,
        homeTeamId: '',
        awayTeamId: ''
      }))
    );
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError(null);

    if (!isValidTeamCount) {
      setError(`Knockout brackets require 2, 4, 8, 16, 32, or 64 teams. Currently: ${teamCount} team(s).`);
      return;
    }

    if (mode === 'manual') {
      if (!isManualValid) {
        setError(`Please assign all ${teamCount} teams into the ${numMatches} matchups without duplicates.`);
        return;
      }

      const payloadMatchups = matchups.map(m => ({
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId
      }));

      onGenerate({ 
        mode: 'manual', 
        matchups: payloadMatchups,
        qualifyingTeamsPerGroup 
      });
    } else {
      onGenerate({ 
        mode: 'automatic',
        qualifyingTeamsPerGroup 
      });
    }
  };

  const getRoundOneLabel = () => {
    switch (numMatches) {
      case 8: return 'Round of 16 (8 Fixtures)';
      case 4: return 'Quarter Finals (4 Fixtures)';
      case 2: return 'Semi Finals (2 Fixtures)';
      case 1: return 'Final Match';
      default: return `Round 1 (${numMatches} Fixtures)`;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-[#101C14] rounded-3xl border border-slate-200 dark:border-[#1E3A29] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-[#1E3A29] flex items-start justify-between gap-4 shrink-0 bg-slate-50/50 dark:bg-[#07130C]/50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-green-600/10 text-green-600 dark:text-green-400 flex items-center justify-center font-bold shrink-0">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-0.5">
                <Trophy className="w-3 h-3" />
                <span>{isGroupFormat ? 'Playoff Bracket Generator' : 'Bracket Generator'}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Generate Knockout Bracket
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-sm sm:max-w-md">
                {tournament.name} • {teamCount} {isGroupFormat ? 'Qualified Teams' : 'Registered Teams'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#16261C] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-6 pt-4 pb-2 shrink-0 bg-white dark:bg-[#101C14]">
          <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-[#07130C] border border-slate-200 dark:border-[#1E3A29] gap-1.5">
            <button
              type="button"
              id="mode-automatic-btn"
              onClick={() => setMode('automatic')}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                mode === 'automatic'
                  ? 'bg-white dark:bg-green-600 text-green-600 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGroupFormat ? 'Crossover Pairing' : 'Automatic Pairing'}</span>
            </button>

            <button
              type="button"
              id="mode-manual-btn"
              onClick={() => setMode('manual')}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                mode === 'manual'
                  ? 'bg-white dark:bg-green-600 text-green-600 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Manual Matchups</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {!isValidTeamCount && !loadingTeams && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs space-y-1">
              <div className="font-bold flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Unsupported Team Count</span>
              </div>
              <p>
                Knockout bracket generation requires 2, 4, 8, 16, 32, or 64 teams.
                Currently, {teamCount} team(s) are available.
              </p>
            </div>
          )}

          {/* ─── 1. AUTOMATIC MODE VIEW ─── */}
          {mode === 'automatic' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-green-50/60 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 space-y-3">
                <div className="flex items-center space-x-2 text-green-700 dark:text-green-300 font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>{isGroupFormat ? 'Group Crossover Seeding' : 'Automatic Seeding'}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  All <strong className="text-slate-900 dark:text-white">{teamCount} {isGroupFormat ? 'qualified' : 'registered'} teams</strong> will be seeded into <strong className="text-slate-900 dark:text-white">{numMatches} {getRoundOneLabel()}</strong>.
                  {isGroupFormat
                    ? ' Crossover pairings ensure top seeds from different groups are matched fairly (e.g. 1st Group A vs 2nd Group B). '
                    : ' '}
                  Subsequent round matchups (Quarter Finals, Semi Finals, Final) will automatically populate as match winners advance.
                </p>
              </div>

              {/* Tournament Structure Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#16261C] border border-slate-200/80 dark:border-[#1E3A29] space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Tournament Bracket Preview</span>
                  <span className="text-green-600 dark:text-green-400 font-semibold">{numMatches * 2 - 1} Total Matches</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#101C14] border border-slate-200 dark:border-[#1E3A29] text-center">
                    <span className="text-slate-400 block font-semibold">{numMatches === 4 ? 'Quarter Finals' : 'Round 1'}</span>
                    <span className="text-slate-900 dark:text-white font-bold">{numMatches} Matches</span>
                  </div>
                  {numMatches >= 4 && (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#101C14] border border-slate-200 dark:border-[#1E3A29] text-center">
                      <span className="text-slate-400 block font-semibold">Semi Finals</span>
                      <span className="text-slate-900 dark:text-white font-bold">{Math.max(1, Math.floor(numMatches / 2))} Matches</span>
                    </div>
                  )}
                  {numMatches >= 8 && (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#101C14] border border-slate-200 dark:border-[#1E3A29] text-center">
                      <span className="text-slate-400 block font-semibold">Quarter Finals</span>
                      <span className="text-slate-900 dark:text-white font-bold">4 Matches</span>
                    </div>
                  )}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#101C14] border border-slate-200 dark:border-[#1E3A29] text-center">
                    <span className="text-slate-400 block font-semibold">Championship</span>
                    <span className="text-slate-900 dark:text-white font-bold">1 Final</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── 2. MANUAL MODE VIEW ─── */}
          {mode === 'manual' && (
            <div className="space-y-4">
              {/* Controls bar */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {getRoundOneLabel()}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedTeamIds.size === teamCount
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  }`}>
                    {selectedTeamIds.size} / {teamCount} Teams Assigned
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleAutoFill}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#16261C] dark:hover:bg-[#1E3A29] text-slate-700 dark:text-slate-300 text-xs font-semibold transition flex items-center space-x-1"
                    title="Fill using default seeded order"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Seeded Fill</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShuffle}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#16261C] dark:hover:bg-[#1E3A29] text-slate-700 dark:text-slate-300 text-xs font-semibold transition flex items-center space-x-1"
                    title="Randomly shuffle matchups"
                  >
                    <Shuffle className="w-3 h-3" />
                    <span>Shuffle</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#16261C] dark:hover:bg-[#1E3A29] text-slate-700 dark:text-slate-300 text-xs font-semibold transition flex items-center space-x-1"
                    title="Clear all matchup selections"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Matchups list */}
              <div className="space-y-3">
                {matchups.map((match, idx) => {
                  const isPairComplete = match.homeTeamId && match.awayTeamId && match.homeTeamId !== match.awayTeamId;

                  return (
                    <div
                      key={match.matchNumber}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isPairComplete
                          ? 'bg-slate-50/80 dark:bg-[#16261C] border-slate-200/80 dark:border-[#1E3A29]'
                          : 'bg-white dark:bg-[#101C14] border-slate-200 dark:border-[#1E3A29]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                          <span>{numMatches === 4 ? `Quarter Final ${match.matchNumber}` : `Match ${match.matchNumber}`}</span>
                          {isPairComplete && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {numMatches === 8 ? `Feeds QF ${Math.floor(idx / 2) + 1}` : numMatches === 4 ? `Feeds SF ${Math.floor(idx / 2) + 1}` : 'First Round'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
                        {/* Home Team Select */}
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Home Squad</label>
                          <CustomSelect
                            value={match.homeTeamId}
                            onChange={(val) => handleMatchupChange(idx, 'home', val)}
                            placeholder="Select team..."
                            options={teams.map(t => {
                              const isSelectedElsewhere = selectedTeamIds.has(t.id) && t.id !== match.homeTeamId;
                              return {
                                value: t.id,
                                label: `${t.name} ${t.groupName ? `(${t.groupName})` : ''} ${t.city ? `(${t.city})` : ''} ${isSelectedElsewhere ? '• [Selected]' : ''}`,
                                disabled: isSelectedElsewhere
                              };
                            })}
                          />
                        </div>

                        {/* Away Team Select */}
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Away Squad</label>
                          <CustomSelect
                            value={match.awayTeamId}
                            onChange={(val) => handleMatchupChange(idx, 'away', val)}
                            placeholder="Select team..."
                            options={teams.map(t => {
                              const isSelectedElsewhere = selectedTeamIds.has(t.id) && t.id !== match.awayTeamId;
                              return {
                                value: t.id,
                                label: `${t.name} ${t.groupName ? `(${t.groupName})` : ''} ${t.city ? `(${t.city})` : ''} ${isSelectedElsewhere ? '• [Selected]' : ''}`,
                                disabled: isSelectedElsewhere
                              };
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-[#1E3A29] flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#07130C]/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1E3A29] text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-[#16261C] transition"
          >
            Cancel
          </button>

          <button
            id="confirm-generate-bracket-btn"
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !isValidTeamCount || (mode === 'manual' && !isManualValid)}
            className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-green-600/30 transition flex items-center space-x-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Generate Bracket</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default GenerateBracketModal;
