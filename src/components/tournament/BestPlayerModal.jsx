import React, { useState, useEffect } from 'react';
import {
  Star, ChevronRight, ArrowLeft, Check, X, Search, Loader2, AlertCircle, Users
} from 'lucide-react';
import { tournamentService } from '../../services/tournamentService';
import { teamService } from '../../services/teamService';
import { playerService } from '../../services/playerService';
import { clearTournamentAwardsCache } from './TournamentAwardsSummary';

const ModalAvatar = ({ url, name }) => {
  const initials = name
    ? name
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  if (url) {
    return (
      <img
        src={url}
        alt={name || 'Player'}
        loading="lazy"
        className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-800 bg-slate-100 dark:bg-slate-800 shrink-0"
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 ring-2 ring-white dark:ring-slate-800">
      {initials}
    </div>
  );
};

export const BestPlayerModal = ({ isOpen, onClose, tournamentId, currentBestPlayer, onSaved }) => {
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

        // Attach playerCount and group info to each team
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
      t.shortName?.toLowerCase().includes(q) ||
      t.groupName?.toLowerCase().includes(q)
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
      clearTournamentAwardsCache(tournamentId);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white dark:bg-[#101C14] rounded-3xl border border-slate-200 dark:border-[#1E3A29] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1E3A29] shrink-0 bg-slate-50/60 dark:bg-[#07130C]/60">
          <div className="flex items-center gap-3">
            {selectedTeam ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedTeam(null);
                  setSearch('');
                }}
                className="p-1.5 -ml-1 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                title="Back to Teams"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="p-2.5 rounded-2xl bg-violet-600/10 text-violet-600 dark:text-violet-400">
                <Star className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {selectedTeam ? `Select Player · ${selectedTeam.name}` : 'Select Best Player (MVP)'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedTeam ? 'Step 2 of 2: Pick one player from this squad' : 'Step 1 of 2: Choose a participating club'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Team Banner (when on Step 2) */}
        {selectedTeam && (
          <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xs text-slate-400">Selected Squad:</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{selectedTeam.name}</span>
              {selectedTeam.groupName && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 px-1.5 py-0.5 rounded">
                  {selectedTeam.groupName}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedTeam(null);
                setSearch('');
              }}
              className="text-xs text-violet-600 hover:text-violet-500 font-semibold"
            >
              Change Club
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-[#1E3A29] shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={selectedTeam ? 'Filter players by name, jersey, position…' : 'Search participating squads…'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-[#07130C] border border-slate-200 dark:border-[#1E3A29] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="mx-6 mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[220px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
              <span className="text-xs">Loading squads and players…</span>
            </div>
          ) : !selectedTeam ? (
            /* Step 1: Team List */
            filteredTeams.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No clubs matching "{search}"</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredTeams.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTeam(t);
                      setSearch('');
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-[#16261C] border border-transparent hover:border-slate-200/80 dark:hover:border-[#1E3A29] transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#16261C] flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 overflow-hidden shrink-0 border border-slate-200/60 dark:border-[#1E3A29]">
                        {t.logoUrl ? (
                          <img src={t.logoUrl} alt={t.name} loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          t.shortName || t.name.slice(0, 3).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                            {t.name}
                          </p>
                          {t.groupName && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 px-1.5 py-0.2 rounded">
                              {t.groupName}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {t.playerCount != null ? `${t.playerCount} registered player${t.playerCount === 1 ? '' : 's'}` : 'Click to inspect roster'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            )
          ) : (
            /* Step 2: Player List for Selected Team */
            filteredTeamPlayers.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                <p>No players found {search ? `matching "${search}"` : 'in this squad'}.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredTeamPlayers.map(p => {
                  const isSelected = p.id === selectedPlayerId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlayerId(isSelected ? null : p.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                        isSelected
                          ? 'bg-violet-50 dark:bg-violet-950/30 border-violet-400/80 dark:border-violet-600 ring-1 ring-violet-400/40 shadow-xs'
                          : 'hover:bg-slate-50 dark:hover:bg-[#16261C] border-slate-100 dark:border-[#1E3A29]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ModalAvatar url={p.avatarUrl} name={p.fullName} />
                        <div className="min-w-0">
                          <p className={`text-xs sm:text-sm font-bold truncate ${isSelected ? 'text-violet-700 dark:text-violet-300' : 'text-slate-900 dark:text-white'}`}>
                            {p.fullName}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {p.preferredPosition || 'Player'}
                            {p.jerseyNumber != null && ` · #${p.jerseyNumber}`}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                          isSelected
                            ? 'bg-violet-600 border-violet-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Selected Player Preview & Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-[#1E3A29] bg-slate-50/60 dark:bg-[#07130C]/60 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 w-full sm:w-auto">
            {selectedPlayer ? (
              <>
                <ModalAvatar url={selectedPlayer.avatarUrl} name={selectedPlayer.fullName} />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 block leading-tight uppercase">Selected MVP:</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">{selectedPlayer.fullName}</span>
                </div>
              </>
            ) : (
              <span className="text-xs text-slate-400 italic">No player selected</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {selectedPlayerId && (
              <button
                type="button"
                onClick={() => setSelectedPlayerId(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors"
                disabled={saving}
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#1E3A29] text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/30 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <Star className="w-3.5 h-3.5" />
                  <span>Confirm Best Player</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BestPlayerModal;
