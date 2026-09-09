import React, { useState, useEffect, useCallback } from 'react';
import {
  Trophy, Shield, Star, ChevronDown, ChevronRight, ArrowLeft, Check,
  X, Search, Loader2, AlertCircle, RefreshCw, Award, Goal, Users
} from 'lucide-react';
import { tournamentService } from '../../services/tournamentService';
import { teamService } from '../../services/teamService';
import { playerService } from '../../services/playerService';

/* ─────────────────────────── helpers ─────────────────────────── */

const Avatar = ({ url, name, size = 'md' }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-16 h-16 text-base' };
  const initials = name
    ? name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  if (url) {
    return (
      <img
        src={url}
        alt={name || 'Player'}
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-white dark:ring-slate-800 bg-slate-100 dark:bg-slate-800 flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0 ring-2 ring-white dark:ring-slate-800`}>
      {initials}
    </div>
  );
};

const StatCard = ({ icon: Icon, iconBg, label, children, isEmpty, emptyText, isLoading }) => (
  <div className="bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
    {/* Header */}
    <div className={`flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800 ${iconBg}`}>
      <Icon className="w-4 h-4" />
      <h3 className="text-sm font-bold tracking-wide uppercase">{label}</h3>
    </div>

    {/* Body */}
    <div className="p-5 flex-1 flex items-center justify-center min-h-[120px]">
      {isLoading ? (
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-xs">Loading…</span>
        </div>
      ) : isEmpty ? (
        <div className="text-center text-slate-400 dark:text-slate-500 text-sm">
          <AlertCircle className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
          <p>{emptyText || 'No data yet'}</p>
        </div>
      ) : (
        children
      )}
    </div>
  </div>
);

/* ─────────────── Best Player Selector Modal ─────────────────── */

const BestPlayerModal = ({ isOpen, onClose, tournamentId, currentBestPlayer, onSaved }) => {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState(currentBestPlayer?.id || null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load tournament teams and players
  useEffect(() => {
    if (!isOpen || !tournamentId) return;
    setLoading(true);
    setError('');
    setSelectedTeam(null);
    setSearch('');

    const loadData = async () => {
      try {
        const [teamsRes, playersRes] = await Promise.all([
          teamService.getAll().catch(() => ({ teams: [] })),
          tournamentService.getTournamentPlayers(tournamentId).catch(() => ({ players: [] }))
        ]);

        let playerList = playersRes.players || [];
        if (playerList.length === 0) {
          // Fallback via playerService.getAll()
          try {
            const tmRes = await playerService.getAll();
            const allMembers = tmRes.teamMembers || [];
            const tournamentMembers = allMembers.filter(
              m => m.team?.tournamentId === tournamentId || m.team?.tournament?.id === tournamentId
            );
            const playerMap = {};
            for (const m of tournamentMembers) {
              const p = m.player;
              if (p?.id && !playerMap[p.id]) {
                playerMap[p.id] = {
                  id: p.id,
                  fullName: p.fullName || 'Unknown',
                  avatarUrl: p.avatarUrl || null,
                  jerseyNumber: m.jerseyNumber ?? p.jerseyNumber ?? null,
                  preferredPosition: m.position || p.preferredPosition || '',
                  teamId: m.team?.id,
                  teamName: m.team?.name || ''
                };
              }
            }
            playerList = Object.values(playerMap);
          } catch (e) {
            console.warn('Fallback error loading players:', e);
          }
        }
        setPlayers(playerList);

        // Filter tournament teams
        const allTeams = teamsRes.teams || [];
        let tournamentTeams = allTeams.filter(
          t => t.tournamentId === tournamentId || t.tournament?.id === tournamentId
        );

        // Fallback: derive teams from playerList if tournamentTeams is empty
        if (tournamentTeams.length === 0 && playerList.length > 0) {
          const derived = {};
          playerList.forEach(p => {
            if (p.teamId && !derived[p.teamId]) {
              derived[p.teamId] = {
                id: p.teamId,
                name: p.teamName || 'Unknown Team',
                shortName: (p.teamName || 'TM').slice(0, 3).toUpperCase()
              };
            }
          });
          tournamentTeams = Object.values(derived);
        }

        // Attach playerCount to each team
        const teamsWithCount = tournamentTeams.map(t => {
          const count = playerList.filter(p => p.teamId === t.id || p.teamName === t.name).length;
          return {
            ...t,
            playerCount: count
          };
        });

        setTeams(teamsWithCount);
      } catch (err) {
        console.error('Failed to load tournament data:', err);
        setError('Could not load tournament teams and players. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, tournamentId]);

  // Sync selected player and reset search/step when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPlayerId(currentBestPlayer?.id || null);
      setSelectedTeam(null);
      setSearch('');
      setError('');
    }
  }, [isOpen, currentBestPlayer]);

  // Find currently selected player object (for preview)
  const selectedPlayer = players.find(p => p.id === selectedPlayerId) ||
    (currentBestPlayer?.id === selectedPlayerId ? currentBestPlayer : null);

  // Teams filtered by search
  const filteredTeams = teams.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.name?.toLowerCase().includes(q) ||
      t.shortName?.toLowerCase().includes(q)
    );
  });

  // Players filtered by selected team + search
  const teamPlayers = selectedTeam
    ? players.filter(p => p.teamId === selectedTeam.id || p.teamName === selectedTeam.name)
    : [];

  const filteredTeamPlayers = teamPlayers.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.fullName?.toLowerCase().includes(q) ||
      p.preferredPosition?.toLowerCase().includes(q) ||
      (p.jerseyNumber != null && String(p.jerseyNumber).includes(q))
    );
  });

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await tournamentService.setBestPlayer(tournamentId, selectedPlayerId || null);
      const updatedBestPlayer = res?.tournament?.bestPlayer ?? null;
      if (onSaved) {
        onSaved(updatedBestPlayer);
      }
      onClose();
    } catch (err) {
      setError(err.message || err.response?.data?.error || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            {selectedTeam ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedTeam(null);
                  setSearch('');
                }}
                className="p-1.5 -ml-1 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Back to Teams"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Star className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {selectedTeam ? `Select Player · ${selectedTeam.name}` : 'Select Best Player'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedTeam ? 'Step 2 of 2: Pick one player from this team' : 'Step 1 of 2: Choose a tournament team'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Team Banner (when on Step 2) */}
        {selectedTeam && (
          <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xs text-slate-400">Current Team:</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{selectedTeam.name}</span>
              {selectedTeam.shortName && (
                <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  {selectedTeam.shortName}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedTeam(null);
                setSearch('');
              }}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline shrink-0"
            >
              Switch Team
            </button>
          </div>
        )}

        {/* Search */}
        <div className="px-5 py-3 shrink-0 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={selectedTeam ? `Search players in ${selectedTeam.name}…` : 'Search teams…'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <span className="text-sm font-medium">Loading tournament data…</span>
            </div>
          ) : error ? (
            <p className="text-center text-sm text-red-500 py-8">{error}</p>
          ) : !selectedTeam ? (
            /* STEP 1: TEAMS LIST */
            <>
              {/* Option to clear Best Player */}
              <button
                type="button"
                onClick={() => setSelectedPlayerId(null)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  selectedPlayerId === null
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 shadow-xs'
                    : 'bg-white dark:bg-slate-900/20 border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <X className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No Best Player</p>
                    <p className="text-xs text-slate-400">Leave tournament best player unassigned</p>
                  </div>
                </div>
                {selectedPlayerId === null && (
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                    Selected
                  </span>
                )}
              </button>

              <div className="pt-2 pb-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                  Registered Teams ({filteredTeams.length})
                </p>
              </div>

              {filteredTeams.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>{teams.length === 0 ? 'No teams registered in this tournament.' : 'No teams match your search.'}</p>
                </div>
              ) : (
                filteredTeams.map(t => {
                  const hasSelection = selectedPlayer && (selectedPlayer.teamId === t.id || selectedPlayer.teamName === t.name);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTeam(t);
                        setSearch('');
                      }}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                        hasSelection
                          ? 'bg-amber-50/70 dark:bg-amber-900/15 border-amber-300 dark:border-amber-700/60 shadow-xs'
                          : 'bg-white dark:bg-[#141C2E] border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {t.logoUrl ? (
                          <img src={t.logoUrl} alt={t.name} className="w-9 h-9 rounded-xl object-contain bg-slate-100 dark:bg-slate-800 p-1 shrink-0" />
                        ) : (
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs"
                            style={{ backgroundColor: t.primaryColor || '#1E50FF' }}
                          >
                            {t.shortName || t.name.slice(0, 3).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {t.name}
                            </p>
                            {t.shortName && (
                              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                                {t.shortName}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {t.playerCount} {t.playerCount === 1 ? 'player' : 'players'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {hasSelection && (
                          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span className="hidden sm:inline">Selected Player</span>
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </button>
                  );
                })
              )}
            </>
          ) : (
            /* STEP 2: TEAM PLAYERS LIST */
            <>
              {filteredTeamPlayers.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>{teamPlayers.length === 0 ? `No players registered for ${selectedTeam.name}.` : 'No players match your search.'}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTeam(null);
                      setSearch('');
                    }}
                    className="mt-3 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    ← Choose a different team
                  </button>
                </div>
              ) : (
                filteredTeamPlayers.map(p => {
                  const isSelected = selectedPlayerId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlayerId(p.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all border ${
                        isSelected
                          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 shadow-xs'
                          : 'bg-white dark:bg-slate-900/20 border-slate-200/70 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Avatar url={p.avatarUrl} name={p.fullName} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isSelected ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                          {p.fullName}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                          {p.preferredPosition || 'Player'}
                          {p.jerseyNumber != null && ` · #${p.jerseyNumber}`}
                        </p>
                      </div>
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </>
          )}
        </div>

        {/* Requirement 5: Show selected player clearly */}
        {selectedPlayer ? (
          <div className="mx-5 my-2.5 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-300 dark:border-amber-700/60 rounded-xl flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <Avatar url={selectedPlayer.avatarUrl} name={selectedPlayer.fullName} size="sm" />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 border border-white dark:border-[#141C2E] flex items-center justify-center">
                  <Star className="w-2.5 h-2.5 text-white fill-white" />
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">
                  Selected Best Player
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                  {selectedPlayer.fullName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {selectedPlayer.teamName || selectedTeam?.name || ''}
                  {selectedPlayer.jerseyNumber != null && ` · #${selectedPlayer.jerseyNumber}`}
                  {selectedPlayer.preferredPosition && ` · ${selectedPlayer.preferredPosition}`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPlayerId(null)}
              className="text-xs font-semibold text-slate-400 hover:text-red-500 p-1.5 rounded-lg transition-colors shrink-0 ml-2"
              title="Remove selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : selectedPlayerId === null && (
          <div className="mx-5 my-2 px-3 py-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span>No player selected (Best Player will be unassigned)</span>
          </div>
        )}

        {/* Footer */}
        {error && !loading && (
          <p className="px-5 text-xs text-red-500 shrink-0">{error}</p>
        )}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          {selectedTeam ? (
            <button
              type="button"
              onClick={() => {
                setSelectedTeam(null);
                setSearch('');
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Teams</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-400 disabled:opacity-60 rounded-xl shadow-sm shadow-amber-500/30 transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4 fill-white" />}
              <span>{saving ? 'Saving…' : 'Confirm Selection'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────── Main TournamentStats Component ──────────── */

export const TournamentStats = ({ tournamentId, tournaments = [], isOrganizer = true }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBPModalOpen, setIsBPModalOpen] = useState(false);

  const currentTournament = tournaments.find(t => t.id === tournamentId);

  const fetchStats = useCallback(async () => {
    if (!tournamentId) return;
    setLoading(true);
    setError('');
    try {
      const res = await tournamentService.getStatsOverview(tournamentId);
      setStats(res);
    } catch (err) {
      setError('Failed to load tournament statistics.');
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handlePlayerSaved = (savedBestPlayer) => {
    if (savedBestPlayer !== undefined) {
      setStats(prev => ({
        ...prev,
        bestPlayer: savedBestPlayer
      }));
    }
    fetchStats();
  };

  if (!tournamentId) {
    return (
      <div className="bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center">
        <Trophy className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">Select a tournament to view statistics.</p>
      </div>
    );
  }

  const topScorer = stats?.topScorer ?? null;
  const bestKeeper = stats?.bestKeeper ?? null;
  const bestPlayer = stats?.bestPlayer ?? null;

  return (
    <>
      <div className="space-y-5">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-500/20">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tournament Statistics</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentTournament?.name || 'Selected Tournament'} · Auto-calculated from match events
              </p>
            </div>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button onClick={fetchStats} className="ml-auto text-xs font-semibold underline hover:no-underline">Retry</button>
          </div>
        )}

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Top Scorer */}
          <StatCard
            icon={Trophy}
            iconBg="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
            label="🥇 Top Scorer"
            isLoading={loading}
            isEmpty={!topScorer}
            emptyText="No goals recorded yet"
          >
            {topScorer && (
              <div className="flex flex-col items-center text-center gap-3 w-full">
                <div className="relative">
                  <Avatar url={topScorer.player?.avatarUrl} name={topScorer.player?.fullName} size="lg" />
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-yellow-400 border-2 border-white dark:border-[#141C2E] flex items-center justify-center">
                    <Trophy className="w-3 h-3 text-yellow-900" />
                  </span>
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {topScorer.player?.fullName}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[140px]">
                    {topScorer.team?.name || '—'}
                    {topScorer.player?.jerseyNumber != null && ` · #${topScorer.player.jerseyNumber}`}
                  </p>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700">
                  <span className="text-xl font-black text-yellow-600 dark:text-yellow-400">
                    {topScorer.goals}
                  </span>
                  <span className="text-xs font-semibold text-yellow-500 dark:text-yellow-500 ml-1.5">
                    {topScorer.goals === 1 ? 'goal' : 'goals'}
                  </span>
                </div>
              </div>
            )}
          </StatCard>

          {/* Best Keeper */}
          <StatCard
            icon={Shield}
            iconBg="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
            label="🧤 Best Keeper"
            isLoading={loading}
            isEmpty={!bestKeeper}
            emptyText="No clean sheets yet"
          >
            {bestKeeper && (
              <div className="flex flex-col items-center text-center gap-3 w-full">
                <div className="relative">
                  <Avatar url={bestKeeper.player?.avatarUrl} name={bestKeeper.player?.fullName} size="lg" />
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-400 border-2 border-white dark:border-[#141C2E] flex items-center justify-center">
                    <Shield className="w-3 h-3 text-emerald-900" />
                  </span>
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {bestKeeper.player?.fullName}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[140px]">
                    {bestKeeper.team?.name || '—'}
                    {bestKeeper.player?.jerseyNumber != null && ` · #${bestKeeper.player.jerseyNumber}`}
                  </p>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700">
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {bestKeeper.cleanSheets}
                  </span>
                  <span className="text-xs font-semibold text-emerald-500 dark:text-emerald-500 ml-1.5">
                    {bestKeeper.cleanSheets === 1 ? 'clean sheet' : 'clean sheets'}
                  </span>
                </div>
              </div>
            )}
          </StatCard>

          {/* Best Player */}
          <StatCard
            icon={Star}
            iconBg="bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400"
            label="⭐ Best Player"
            isLoading={loading}
            isEmpty={!bestPlayer && !isOrganizer}
            emptyText="Not selected yet"
          >
            {bestPlayer ? (
              <div className="flex flex-col items-center text-center gap-3 w-full">
                <div className="relative">
                  <Avatar url={bestPlayer.avatarUrl} name={bestPlayer.fullName} size="lg" />
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-violet-400 border-2 border-white dark:border-[#141C2E] flex items-center justify-center">
                    <Star className="w-3 h-3 text-violet-900" />
                  </span>
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {bestPlayer.fullName}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[160px]">
                    {bestPlayer.team?.name ? `${bestPlayer.team.name} · ` : ''}
                    {bestPlayer.preferredPosition || 'Player'}
                    {bestPlayer.jerseyNumber != null && ` · #${bestPlayer.jerseyNumber}`}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-700">
                  Organizer's Pick
                </span>
                {isOrganizer && (
                  <button
                    onClick={() => setIsBPModalOpen(true)}
                    className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-violet-500 transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                    Change selection
                  </button>
                )}
              </div>
            ) : isOrganizer ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center">
                  <Star className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No player selected</p>
                  <p className="text-xs text-slate-400 mt-0.5">Award the outstanding player of this tournament</p>
                </div>
                <button
                  onClick={() => setIsBPModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 rounded-xl shadow-sm shadow-violet-500/20 transition-all"
                >
                  <Star className="w-3.5 h-3.5" />
                  Select Best Player
                </button>
              </div>
            ) : null}
          </StatCard>
        </div>

        {/* Scorers Leaderboard mini-strip (if more than 1 scorer) */}
        {stats?.topScorer && stats?.leaderboard?.length > 1 && (
          <ScorersLeaderboard leaderboard={stats.leaderboard} />
        )}
      </div>

      {/* Best Player Modal */}
      <BestPlayerModal
        isOpen={isBPModalOpen}
        onClose={() => setIsBPModalOpen(false)}
        tournamentId={tournamentId}
        currentBestPlayer={bestPlayer}
        onSaved={handlePlayerSaved}
      />
    </>
  );
};

/* ──────────────── Scorers Leaderboard Strip ─────────────────── */

const ScorersLeaderboard = ({ leaderboard = [] }) => {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? leaderboard : leaderboard.slice(0, 5);

  return (
    <div className="bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          <h3 className="text-sm font-bold uppercase tracking-wide">Top Scorers Leaderboard</h3>
        </div>
        <span className="text-xs font-semibold text-yellow-500">{leaderboard.length} players</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="py-2.5 px-4 text-center w-12">#</th>
              <th className="py-2.5 px-4 text-left">Player</th>
              <th className="py-2.5 px-4 text-left hidden sm:table-cell">Team</th>
              <th className="py-2.5 px-4 text-center text-yellow-600 dark:text-yellow-400">Goals</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {shown.map((item, i) => {
              const isTop = i === 0;
              return (
                <tr key={item.player?.id || i} className={`transition-colors ${isTop ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                  <td className="py-3 px-4 text-center">
                    {isTop ? (
                      <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-yellow-400 text-yellow-900 text-[10px] font-black">1</span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">{i + 1}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar url={item.player?.avatarUrl} name={item.player?.fullName} size="sm" />
                      <div className="min-w-0">
                        <p className={`font-semibold text-sm truncate ${isTop ? 'text-yellow-700 dark:text-yellow-400' : 'text-slate-900 dark:text-white'}`}>
                          {item.player?.fullName}
                        </p>
                        {item.player?.jerseyNumber != null && (
                          <p className="text-[11px] text-slate-400">#{item.player.jerseyNumber}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px] block">{item.team?.name || '—'}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-black ${
                      isTop
                        ? 'bg-yellow-400 text-yellow-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      {item.goals}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {leaderboard.length > 5 && (
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs font-semibold text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors flex items-center gap-1 mx-auto"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            {expanded ? 'Show less' : `Show all ${leaderboard.length} scorers`}
          </button>
        </div>
      )}
    </div>
  );
};
