import React, { useState, useEffect, useRef } from "react";
import {
  Search, User, Trophy, Shield, ChevronRight, CheckCircle2,
  Activity, Flame, ArrowLeft, Globe, Lock
} from "lucide-react";
import statsService from "../../services/statsService";

// ─── Public Player Stats Panel (drill-down after selecting from search) ───────
const PublicPlayerPanel = ({ playerId, onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);

  useEffect(() => {
    if (!playerId) return;
    const fetch_ = async () => {
      try {
        setLoading(true); setError(null);
        const res = await statsService.getPublicPlayerStats(playerId);
        setData(res);
        if (res.tournaments && res.tournaments.length > 0) {
          setSelectedTournamentId(res.tournaments[0].tournament.id);
        }
      } catch (err) {
        console.error("Failed to load public player stats:", err);
        setError("Could not load this player's stats.");
      } finally { setLoading(false); }
    };
    fetch_();
  }, [playerId]);

  const activeTournament = data?.tournaments?.find(t => t.tournament.id === selectedTournamentId);

  if (loading) return (
    <div className="saas-card rounded-2xl p-12 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800">
      <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm font-medium">Loading player statistics...</p>
    </div>
  );

  if (error) return (
    <div className="saas-card rounded-2xl p-8 text-center bg-white dark:bg-[#111726] border border-red-200 dark:border-red-900/50">
      <p className="text-sm text-red-500 font-medium">{error}</p>
      <button onClick={onBack} className="mt-4 text-xs text-blue-500 hover:text-blue-700 font-semibold">← Back to search</button>
    </div>
  );

  const player = data?.player;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to Search Results</span>
      </button>

      {/* Public Notice Badge */}
      <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
        <Globe className="w-3.5 h-3.5" />
        <span>Public Stats — No private team or roster data shown</span>
      </div>

      {/* Hero */}
      <div className="saas-card rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-[#10172A] to-[#151D33] text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 relative z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white text-3xl sm:text-4xl font-black shadow-lg shadow-indigo-500/25 flex-shrink-0">
            {player?.fullName?.charAt(0)?.toUpperCase() || "P"}
          </div>
          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold">{player?.preferredPosition || "Player"}</span>
              {player?.jerseyNumber && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">Jersey #{player.jerseyNumber}</span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{player?.fullName || "Athlete"}</h2>
            <p className="text-xs text-slate-400 mt-1">Public career performance</p>
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="saas-card rounded-2xl p-6 bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Career Goals</span>
            <div className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">{data?.overallStats?.goals ?? 0}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-xl">⚽</div>
        </div>
        <div className="saas-card rounded-2xl p-6 bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Matches Played</span>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">{data?.overallStats?.matchesPlayed ?? 0}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>
        <div className="saas-card rounded-2xl p-6 bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tournaments</span>
            <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">{data?.overallStats?.tournamentsPlayed ?? 0}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tournament History */}
      {data?.tournaments && data.tournaments.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Trophy className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tournament History</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.tournaments.map((entry) => {
              const isSelected = entry.tournament.id === selectedTournamentId;
              return (
                <div key={entry.tournament.id} onClick={() => setSelectedTournamentId(entry.tournament.id)}
                  className={`cursor-pointer rounded-2xl p-5 transition-all duration-200 saas-card border ${isSelected ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/50 shadow-md" : "bg-white dark:bg-[#111726] border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700"}`}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full">{entry.tournament.format || "Knockout"}</span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">{entry.tournament.name}</h4>
                      {entry.team && (
                        <p className="text-xs text-slate-500 flex items-center space-x-1">
                          <Shield className="w-3.5 h-3.5 text-slate-400" /><span>{entry.team.name}</span>
                        </p>
                      )}
                    </div>
                    {isSelected && <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center"><CheckCircle2 className="w-4 h-4" /></div>}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Matches: <strong className="text-slate-800 dark:text-slate-200">{entry.tournamentStats.matchesPlayed}</strong></span>
                    <span className="text-slate-500">Goals: <strong className="text-blue-600 dark:text-blue-400">{entry.tournamentStats.goals}</strong></span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center">Details <ChevronRight className="w-3 h-3 ml-0.5" /></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Drill-down */}
      {activeTournament && (
        <div className="saas-card rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#111726] border border-blue-500/30 dark:border-blue-500/20 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Tournament Performance</span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">{activeTournament.tournament.name}</h3>
              {activeTournament.team && (
                <p className="text-xs text-slate-500 mt-1">Squad: <span className="font-semibold text-slate-700 dark:text-slate-300">{activeTournament.team.name}</span></p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <div className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">Goals</span>
                <div className="text-xl font-black text-blue-600 dark:text-blue-400">{activeTournament.tournamentStats.goals}</div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">Matches</span>
                <div className="text-xl font-black text-slate-900 dark:text-white">{activeTournament.tournamentStats.matchesPlayed}</div>
              </div>
            </div>
          </div>

          {/* Privacy notice for team details */}
          <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
            <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>Team squad roster and detailed team performance are private to team members only.</span>
          </div>

          {activeTournament.matches.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Match Log ({activeTournament.matches.length})</h4>
              <div className="space-y-2">
                {activeTournament.matches.map((m) => (
                  <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 gap-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0 ${m.result === "W" ? "bg-emerald-600" : m.result === "L" ? "bg-rose-600" : "bg-amber-500"}`}>{m.result}</div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">vs {m.opponent}</span>
                        <div className="text-[11px] text-slate-400">{m.roundName} {m.date ? "· " + new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end space-x-4">
                      <span className="text-sm font-black font-mono text-slate-900 dark:text-white">{m.scoreDisplay}</span>
                      {m.playerGoals > 0 ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-500/20">
                          <span>⚽</span><span>{m.playerGoals} {m.playerGoals === 1 ? "Goal" : "Goals"}</span>
                        </span>
                      ) : <span className="text-xs text-slate-400">Played</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main PlayerSearchView ─────────────────────────────────────────────────────
export const PlayerSearchView = () => {
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const debounceRef = useRef(null);

  // Initial load
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await statsService.getPlayersList("");
        setPlayers(res.players || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await statsService.getPlayersList(query);
        setPlayers(res.players || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  if (selectedPlayerId) {
    return <PublicPlayerPanel playerId={selectedPlayerId} onBack={() => setSelectedPlayerId(null)} />;
  }

  return (
    <div className="space-y-6">
      {/* Public search notice */}
      <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold">
        <Globe className="w-3.5 h-3.5" />
        <span>Public search — anyone can view basic player stats (no private team/roster data)</span>
      </div>

      {/* Search bar */}
      <div className="saas-card rounded-2xl p-4 sm:p-5 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search player by name or position..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="saas-card rounded-2xl p-12 text-center text-slate-400 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800">
          <div className="w-6 h-6 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm">Searching...</p>
        </div>
      ) : players.length === 0 ? (
        <div className="saas-card rounded-2xl p-10 text-center text-slate-400 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800">
          <User className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-medium">No players found{query ? ` for "${query}"` : ""}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlayerId(p.id)}
              className="saas-card rounded-2xl p-5 bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-lg font-black flex-shrink-0">
                  {p.fullName?.charAt(0)?.toUpperCase() || "P"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {p.fullName}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">{p.preferredPosition || "Player"} · {p.teamName || "Free Agent"}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  {p.goals > 0 && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                      <span>⚽</span><span>{p.goals}</span>
                    </span>
                  )}
                </div>
                <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  View Stats <ChevronRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayerSearchView;
