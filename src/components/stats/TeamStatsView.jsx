import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  Trophy, 
  Users, 
  Calendar, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  ArrowUpRight, 
  Activity, 
  Flame,
  UserCheck
} from 'lucide-react';
import statsService from '../../services/statsService';
import { useAuth } from '../../context/AuthContext';

export const TeamStatsView = ({ initialTeamId = null, hideSelector = false, noTeamMessage = null }) => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState(initialTeamId);
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(hideSelector ? false : true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load teams list (skipped in hideSelector mode)
  useEffect(() => {
    if (hideSelector) return;
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const res = await statsService.getTeamsList();
        const teamList = res.teams || [];
        setTeams(teamList);

        if (!selectedTeamId && teamList.length > 0) {
          const defaultTeam = teamList.find(t => t.matchesPlayed > 0) || teamList[0];
          setSelectedTeamId(defaultTeam.id);
        }
      } catch (err) {
        console.error('Failed to load teams list:', err);
        setError('Failed to load teams.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [hideSelector]);

  // Fetch detailed team stats
  useEffect(() => {
    if (!selectedTeamId) return;

    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        setError(null);
        const res = await statsService.getTeamStats(selectedTeamId);
        setTeamData(res);
      } catch (err) {
        console.error('Failed to load team stats:', err);
        setError('Failed to load team statistics.');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [selectedTeamId, user]);

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.shortName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* ─── 1. TEAM SELECTOR & SEARCH (hidden in My Team mode) ──── */}
      {!hideSelector && (
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search team by club name, abbreviation or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1 max-w-full">
            {filteredTeams.slice(0, 6).map((t) => {
              const isSelected = t.id === selectedTeamId;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTeamId(t.id)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-[#111726]'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{t.name}</span>
                  {t.matchesPlayed > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                      {t.matchesPlayed}M
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {statsLoading ? (
        <div className="saas-card rounded-2xl p-12 text-center text-slate-400 dark:text-slate-500">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium">Loading club statistics...</p>
        </div>
      ) : teamData?.team ? (
        <div className="space-y-8">
          {/* ─── 2. CLUB HERO HEADER ───────────────────────────────── */}
          <div className="saas-card rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-[#10172A] to-[#151D33] text-white border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 relative z-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
                <div 
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-500/25 flex-shrink-0"
                  style={{ backgroundColor: teamData.team.primaryColor || '#1E50FF' }}
                >
                  {teamData.team.shortName || teamData.team.name?.substring(0, 3)?.toUpperCase() || 'FC'}
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold">
                      {teamData.team.city || 'Club'}
                    </span>
                    {teamData.team.manager && (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
                        Manager: {teamData.team.manager}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {teamData.team.name}
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Home Ground: {teamData.team.homeGround || 'FootVerse Arena'}
                  </p>
                </div>
              </div>

              {/* Privacy Authorization Badge */}
              <div className="flex items-center">
                {teamData.isAuthorizedMember ? (
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Squad Member Access Unlocked</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-xs font-semibold">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Public Overview Mode</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── 3. OVERALL TEAM PERFORMANCE (PUBLIC) ──────────────── */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Activity className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Overall Team Performance
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                Public Record
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Matches Played */}
              <div className="saas-card rounded-2xl p-5 bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Matches Played
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {teamData.overallPerformance.matchesPlayed}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Competitive fixtures</p>
              </div>

              {/* Record (W / D / L) */}
              <div className="saas-card rounded-2xl p-5 bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  W / D / L
                </span>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1 flex items-center space-x-1">
                  <span className="text-emerald-600 dark:text-emerald-400">{teamData.overallPerformance.wins}W</span>
                  <span className="text-slate-400">-</span>
                  <span className="text-amber-500">{teamData.overallPerformance.draws}D</span>
                  <span className="text-slate-400">-</span>
                  <span className="text-rose-600 dark:text-rose-400">{teamData.overallPerformance.losses}L</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Win/Draw/Loss record</p>
              </div>

              {/* Goals (GF / GA) */}
              <div className="saas-card rounded-2xl p-5 bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Goals (GF / GA)
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                  {teamData.overallPerformance.goalsFor} : {teamData.overallPerformance.goalsAgainst}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  GD: {teamData.overallPerformance.goalsFor - teamData.overallPerformance.goalsAgainst > 0 ? '+' : ''}
                  {teamData.overallPerformance.goalsFor - teamData.overallPerformance.goalsAgainst}
                </p>
              </div>

              {/* Clean Sheets */}
              <div className="saas-card rounded-2xl p-5 bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Clean Sheets
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {teamData.overallPerformance.cleanSheets}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Shutouts preserved</p>
              </div>

              {/* Tournaments */}
              <div className="saas-card rounded-2xl p-5 bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 shadow-sm col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Tournaments
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                  {teamData.overallPerformance.tournamentsCount}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Campaigns contested</p>
              </div>
            </div>
          </div>

          {/* ─── 4. TOURNAMENT & MATCH HISTORY (PUBLIC) ─────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tournament Campaigns */}
            <div className="saas-card rounded-2xl p-6 bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Tournament Campaigns ({teamData.tournamentHistory.length})
                </h3>
              </div>

              {teamData.tournamentHistory.length === 0 ? (
                <p className="text-xs text-slate-400">No campaigns recorded yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {teamData.tournamentHistory.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {t.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold uppercase">
                          {t.format || 'Knockout'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{t.matchesPlayed} Matches</span>
                        <span>{t.wins}W - {t.draws}D - {t.losses}L</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {t.goalsFor}:{t.goalsAgainst}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Match History */}
            <div className="lg:col-span-2 saas-card rounded-2xl p-6 bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Match History ({teamData.matchHistory.length})
                  </h3>
                </div>
                <span className="text-xs text-slate-400">Chronological</span>
              </div>

              {teamData.matchHistory.length === 0 ? (
                <p className="text-xs text-slate-400">No match results available.</p>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {teamData.matchHistory.map((m) => {
                    const isWin = m.result === 'W';
                    const isLoss = m.result === 'L';

                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 hover:border-slate-300 transition text-xs"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-[10px] text-white flex-shrink-0 ${
                            isWin ? 'bg-emerald-600' : isLoss ? 'bg-rose-600' : 'bg-amber-500'
                          }`}>
                            {m.result}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              vs {m.opponent}
                            </span>
                            <div className="text-[10px] text-slate-400">
                              {m.tournamentName} • {m.roundName}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 font-mono">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {m.scoreDisplay}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {m.date ? new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ─── 5. DETAILED SQUAD PERFORMANCE (PRIVACY GUARDED) ───── */}
          <div className="saas-card rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Detailed Squad & Roster Performance
                </h3>
              </div>

              {teamData.isAuthorizedMember ? (
                <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Authorized Member View</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Private Details Protected</span>
                </span>
              )}
            </div>

            {/* If Authorized: Show Detailed Roster Matrix */}
            {teamData.isAuthorizedMember && teamData.detailedPerformance?.roster ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-3">Player</th>
                      <th className="py-3 px-3">Position</th>
                      <th className="py-3 px-3">Jersey</th>
                      <th className="py-3 px-3">Matches</th>
                      <th className="py-3 px-3">Goals</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {teamData.detailedPerformance.roster.map((player) => (
                      <tr key={player.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                            {player.fullName.charAt(0).toUpperCase()}
                          </div>
                          <span>{player.fullName}</span>
                          {player.isCaptain && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[9px] font-bold">
                              CPT
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-500">{player.position}</td>
                        <td className="py-3 px-3 text-slate-500 font-mono">#{player.jerseyNumber || '-'}</td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{player.matchesPlayed}</td>
                        <td className="py-3 px-3 font-black text-blue-600 dark:text-blue-400">
                          {player.goals > 0 ? `⚽ ${player.goals}` : '0'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                            Active Squad
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* If Unauthorized: Clean Locked Notice */
              <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 mx-auto flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Detailed Roster Performance is Restricted
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Individual squad member performance metrics, player goals breakdown and internal tactical rosters are private. Only registered players of this team, the team manager, and tournament administrators have permission to view them.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="saas-card rounded-2xl p-12 text-center text-slate-400">
          <p>Please select a team to view their statistics.</p>
        </div>
      )}
    </div>
  );
};

export default TeamStatsView;
