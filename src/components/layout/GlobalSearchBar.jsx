import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Loader2,
  Trophy,
  Shield,
  User,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { tournamentService } from '../../services/tournamentService';
import { statsService } from '../../services/statsService';

export const GlobalSearchBar = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    tournaments: [],
    teams: [],
    players: []
  });

  const navigate = useNavigate();
  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation & shortcut support
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search effect
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults({ tournaments: [], teams: [], players: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    const timer = setTimeout(async () => {
      try {
        const [tournamentsRes, teamsRes, playersRes] = await Promise.allSettled([
          tournamentService.getAll({ search: trimmed }),
          statsService.getTeamsList(trimmed),
          statsService.getPlayersList(trimmed)
        ]);

        const rawTournaments =
          tournamentsRes.status === 'fulfilled'
            ? tournamentsRes.value?.data?.tournaments || tournamentsRes.value?.tournaments || []
            : [];

        const rawTeams =
          teamsRes.status === 'fulfilled'
            ? teamsRes.value?.data?.teams || teamsRes.value?.teams || []
            : [];

        const rawPlayers =
          playersRes.status === 'fulfilled'
            ? playersRes.value?.data?.players || playersRes.value?.players || []
            : [];

        // Client-side fallback filter to ensure partial & case-insensitive matching in all cases
        const qLower = trimmed.toLowerCase();

        const filteredTournaments = rawTournaments.filter(t =>
          (t.name && t.name.toLowerCase().includes(qLower)) ||
          (t.location && t.location.toLowerCase().includes(qLower))
        ).slice(0, 5);

        const filteredTeams = rawTeams.filter(t =>
          (t.name && t.name.toLowerCase().includes(qLower)) ||
          (t.shortName && t.shortName.toLowerCase().includes(qLower)) ||
          (t.city && t.city.toLowerCase().includes(qLower))
        ).slice(0, 5);

        const filteredPlayers = rawPlayers.filter(p =>
          (p.fullName && p.fullName.toLowerCase().includes(qLower)) ||
          (p.preferredPosition && p.preferredPosition.toLowerCase().includes(qLower)) ||
          (p.teamName && p.teamName.toLowerCase().includes(qLower))
        ).slice(0, 5);

        setResults({
          tournaments: filteredTournaments,
          teams: filteredTeams,
          players: filteredPlayers
        });
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (path) => {
    setIsOpen(false);
    setQuery('');
    navigate(path);
  };

  const handleClear = () => {
    setQuery('');
    setResults({ tournaments: [], teams: [], players: [] });
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const totalResults =
    results.tournaments.length + results.teams.length + results.players.length;

  const hasSearched = query.trim().length > 0;

  return (
    <div className="relative w-full" ref={searchContainerRef}>
      {/* Search Input Bar */}
      <div className="relative flex items-center w-full">
        {loading ? (
          <Loader2 className="w-4 h-4 absolute left-3.5 top-3 text-green-600 dark:text-green-400 animate-spin pointer-events-none" />
        ) : (
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
        )}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          placeholder="Search tournaments, teams, players..."
          className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-[#16261C] border border-slate-200 dark:border-[#1E3A29] rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
          aria-label="Search FootVerse"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-2.5 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#1E3A29] transition"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Results Dropdown — Mobile: Nearly full-width with side margins directly below header; Desktop: Anchored below search input */}
      {isOpen && hasSearched && (
        <div className="fixed inset-x-3 top-[60px] sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:w-[460px] md:w-[500px] mt-1.5 bg-white dark:bg-[#101C14] border border-slate-200/90 dark:border-[#1E3A29] rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl max-w-[calc(100vw-24px)] sm:max-w-none">
          {/* Header Bar */}
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-[#1E3A29] flex items-center justify-between bg-slate-50/80 dark:bg-[#16261C]/80">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Search Results
            </span>
            {loading ? (
              <span className="text-[11px] font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Searching...
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {totalResults} {totalResults === 1 ? 'match' : 'matches'}
              </span>
            )}
          </div>

          {/* Results List with vertical scrolling & touch-friendly tap targets */}
          <div className="max-h-[60vh] sm:max-h-[380px] overflow-y-auto overscroll-contain divide-y divide-slate-100 dark:divide-[#1E3A29]/60">
            {/* 1. TOURNAMENTS */}
            {results.tournaments.length > 0 && (
              <div className="py-1.5">
                <div className="px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Tournaments ({results.tournaments.length})</span>
                </div>
                {results.tournaments.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelect(`/tournaments/${t.slug || t.id}`)}
                    className="w-full px-4 py-3 sm:py-2.5 min-h-[52px] sm:min-h-[44px] text-left flex items-center justify-between hover:bg-green-50/70 dark:hover:bg-[#16261C] active:bg-green-100/70 dark:active:bg-[#1A2E22] transition group"
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                          {t.name}
                        </p>
                        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                          {t.location && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" />
                              {t.location}
                            </span>
                          )}
                          {t.format && (
                            <span className="capitalize px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1E3A29] text-[9px] font-semibold">
                              {t.format.replace('_', ' ')}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[10px] sm:text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Tournament
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-green-500 group-hover:translate-x-0.5 transition" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* 2. TEAMS */}
            {results.teams.length > 0 && (
              <div className="py-1.5">
                <div className="px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Teams ({results.teams.length})</span>
                </div>
                {results.teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => handleSelect(`/teams/${team.id}`)}
                    className="w-full px-4 py-3 sm:py-2.5 min-h-[52px] sm:min-h-[44px] text-left flex items-center justify-between hover:bg-green-50/70 dark:hover:bg-[#16261C] active:bg-green-100/70 dark:active:bg-[#1A2E22] transition group"
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500 shrink-0 overflow-hidden">
                        {team.logoUrl ? (
                          <img
                            src={team.logoUrl}
                            alt={team.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Shield className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                          {team.name}
                        </p>
                        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                          {team.shortName && (
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {team.shortName}
                            </span>
                          )}
                          {team.city && <span>• {team.city}</span>}
                          {team.tournamentName && <span>• {team.tournamentName}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[10px] sm:text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        Team
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-green-500 group-hover:translate-x-0.5 transition" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* 3. PLAYERS */}
            {results.players.length > 0 && (
              <div className="py-1.5">
                <div className="px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-green-600 dark:text-green-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Players ({results.players.length})</span>
                </div>
                {results.players.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handleSelect(`/players?id=${player.id}`)}
                    className="w-full px-4 py-3 sm:py-2.5 min-h-[52px] sm:min-h-[44px] text-left flex items-center justify-between hover:bg-green-50/70 dark:hover:bg-[#16261C] active:bg-green-100/70 dark:active:bg-[#1A2E22] transition group"
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center text-green-500 shrink-0 overflow-hidden font-bold text-xs">
                        {player.avatarUrl ? (
                          <img
                            src={player.avatarUrl}
                            alt={player.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          player.fullName?.charAt(0)?.toUpperCase() || 'P'
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                          {player.fullName}
                        </p>
                        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                          {player.preferredPosition && (
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              {player.preferredPosition}
                            </span>
                          )}
                          {player.jerseyNumber !== undefined && player.jerseyNumber !== null && (
                            <span>• #{player.jerseyNumber}</span>
                          )}
                          {player.teamName && (
                            <span className="truncate">• {player.teamName}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[10px] sm:text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                        Player
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-green-500 group-hover:translate-x-0.5 transition" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* NO RESULTS FOUND STATE */}
            {!loading && totalResults === 0 && (
              <div className="py-8 px-4 text-center">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-[#16261C] border border-slate-200 dark:border-[#1E3A29] flex items-center justify-center mx-auto mb-2.5 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  No results found for "{query}"
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
                  Try searching by athlete name, club name, or tournament title.
                </p>
              </div>
            )}
          </div>

          {/* Quick Hub Links Footer */}
          <div className="p-2.5 sm:p-2 bg-slate-50 dark:bg-[#16261C] border-t border-slate-100 dark:border-[#1E3A29] flex items-center justify-between text-[11px] sm:text-[10px] text-slate-500 dark:text-slate-400">
            <span>Quick hubs:</span>
            <div className="flex items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => handleSelect('/tournaments')}
                className="hover:text-green-600 dark:hover:text-green-400 font-semibold"
              >
                Tournaments
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleSelect('/teams')}
                className="hover:text-green-600 dark:hover:text-green-400 font-semibold"
              >
                Teams
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleSelect('/players')}
                className="hover:text-green-600 dark:hover:text-green-400 font-semibold"
              >
                Players
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
