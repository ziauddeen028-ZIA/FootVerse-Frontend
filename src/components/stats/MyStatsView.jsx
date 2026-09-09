import React, { useState, useEffect } from "react";
import { 
  User, Trophy, ChevronRight, Shield, Activity, CheckCircle2, Flame, Lock, ArrowRight
} from "lucide-react";
import statsService from "../../services/statsService";
import { useAuth } from "../../context/AuthContext";

export const MyStatsView = ({ onSwitchToTeam }) => {
  const { user, profile } = useAuth();
  const [playerData, setPlayerData] = useState(null);
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    const fetchStats = async () => {
      try {
        setLoading(true); setError(null);
        const res = await statsService.getPlayerStats(user.id);
        setPlayerData(res);
        if (res.tournaments && res.tournaments.length > 0) {
          setSelectedTournamentId(res.tournaments[0].tournament.id);
        }
      } catch (err) {
        console.error("Failed to load own stats:", err);
        setError("Failed to load your statistics. Please try again.");
      } finally { setLoading(false); }
    };
    fetchStats();
  }, [user?.id]);

  const activeTournament = playerData?.tournaments?.find(t => t.tournament.id === selectedTournamentId);

  if (!user) {
    return (
      <div className="saas-card rounded-3xl p-12 text-center bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sign in to view your stats</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Your personal career stats, tournament history, and performance details are only visible to you.
        </p>
        <a href="/login" className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition">
          <User className="w-4 h-4" /><span>Sign In</span>
        </a>
      </div>
    );
  }

  if (loading) return (
    <div className="saas-card rounded-2xl p-12 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800">
      <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm font-medium">Loading your statistics...</p>
    </div>
  );

  if (error) return (
    <div className="saas-card rounded-2xl p-12 text-center bg-white dark:bg-[#111726] border border-red-200 dark:border-red-900/50">
      <p className="text-sm text-red-500 font-medium">{error}</p>
    </div>
  );

  const playerName = playerData?.player?.fullName || profile?.fullName || "Athlete";

  return (
    <div className="space-y-8">
      {/* HERO */}
      <div className="saas-card rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-[#10172A] to-[#151D33] text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-blue-600/10 blur-3xl" />
        </div>
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 relative z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-3xl sm:text-4xl font-black shadow-lg shadow-blue-500/25 flex-shrink-0">
            {playerName.charAt(0).toUpperCase()}
          </div>
          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold">
                {playerData?.player?.preferredPosition || "Player"}
              </span>
              {playerData?.player?.jerseyNumber && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">Jersey #{playerData.player.jerseyNumber}</span>
              )}
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">✓ Your Profile</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{playerName}</h1>
            <p className="text-xs text-slate-400 mt-1">Your personal career performance dashboard</p>
          </div>
          {playerData?.tournaments?.length > 0 && playerData.tournaments[0]?.team && (
            <button onClick={onSwitchToTeam} className="flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-bold transition-all">
              <Shield className="w-4 h-4" /><span>My Team</span><ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* OVERALL STATS */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Flame className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Overall Career Statistics</h2>
          <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 font-bold">Career Total</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="saas-card rounded-2xl p-6 bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Overall Goals</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">{playerData?.overallStats?.goals ?? 0}</div>
              <p className="text-[11px] text-slate-500 mt-1">Total career goals scored</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-black">⚽</div>
          </div>
          <div className="saas-card rounded-2xl p-6 bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Matches Played</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">{playerData?.overallStats?.matchesPlayed ?? 0}</div>
              <p className="text-[11px] text-slate-500 mt-1">Competitive appearances</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div className="saas-card rounded-2xl p-6 bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tournaments Played</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">{playerData?.overallStats?.tournamentsPlayed ?? 0}</div>
              <p className="text-[11px] text-slate-500 mt-1">Tournament editions</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* TOURNAMENT HISTORY */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Tournament History</h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">Select a tournament to inspect detailed performance</span>
        </div>
        {!playerData?.tournaments || playerData.tournaments.length === 0 ? (
          <div className="saas-card rounded-2xl p-8 text-center text-slate-400 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800">
            <Trophy className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm">No tournament participation recorded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playerData.tournaments.map((entry) => {
              const isSelected = entry.tournament.id === selectedTournamentId;
              return (
                <div key={entry.tournament.id} onClick={() => setSelectedTournamentId(entry.tournament.id)}
                  className={`cursor-pointer rounded-2xl p-5 transition-all duration-200 saas-card border ${isSelected ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/50 shadow-md" : "bg-white dark:bg-[#111726] border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700"}`}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full">{entry.tournament.format || "Knockout"}</span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{entry.tournament.name}</h3>
                      {entry.team && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                          <Shield className="w-3.5 h-3.5 text-slate-400" /><span>Squad: {entry.team.name}</span>
                        </p>
                      )}
                    </div>
                    {isSelected && <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center"><CheckCircle2 className="w-4 h-4" /></div>}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Matches: <strong className="text-slate-800 dark:text-slate-200">{entry.tournamentStats.matchesPlayed}</strong></span>
                    <span className="text-slate-500">Goals: <strong className="text-blue-600 dark:text-blue-400 font-bold">{entry.tournamentStats.goals}</strong></span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center">Details <ChevronRight className="w-3 h-3 ml-0.5" /></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAILED TOURNAMENT DRILL-DOWN */}
      {activeTournament && (
        <div className="saas-card rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#111726] border border-blue-500/30 dark:border-blue-500/20 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Detailed Tournament Performance</span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">{activeTournament.tournament.name}</h3>
              {activeTournament.team && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Represented <span className="font-semibold text-slate-700 dark:text-slate-300">{activeTournament.team.name}</span></p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <div className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">Tournament Goals</span>
                <div className="text-xl font-black text-blue-600 dark:text-blue-400">{activeTournament.tournamentStats.goals}</div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">Tournament Matches</span>
                <div className="text-xl font-black text-slate-900 dark:text-white">{activeTournament.tournamentStats.matchesPlayed}</div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Match-by-Match Log ({activeTournament.matches.length})</h4>
            {activeTournament.matches.length === 0 ? (
              <p className="text-xs text-slate-400">No match records logged for this tournament.</p>
            ) : (
              <div className="space-y-2">
                {activeTournament.matches.map((m) => (
                  <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 hover:border-slate-300 transition gap-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0 ${m.result === "W" ? "bg-emerald-600" : m.result === "L" ? "bg-rose-600" : "bg-amber-500"}`}>{m.result}</div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">vs {m.opponent}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">{m.roundName}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">{m.date ? new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Date TBD"}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end space-x-4">
                      <span className="text-sm font-black font-mono text-slate-900 dark:text-white">{m.scoreDisplay}</span>
                      <div className="min-w-[90px] text-right">
                        {m.playerGoals > 0 ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-500/20">
                            <span>⚽</span><span>{m.playerGoals} {m.playerGoals === 1 ? "Goal" : "Goals"}</span>
                          </span>
                        ) : <span className="text-xs text-slate-400">Played</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyStatsView;
