import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Users, 
  Activity, 
  ArrowUpRight, 
  Calendar, 
  Flame, 
  Shield, 
  Sparkles, 
  Plus, 
  ChevronRight, 
  Award, 
  Zap, 
  Clock, 
  BarChart2, 
  Radio
} from 'lucide-react';
import { useAuth, ROLES, ROLE_LABELS } from '../context/AuthContext';

export const DashboardShell = () => {
  const { activeRole, profile, user } = useAuth();
  const navigate = useNavigate();

  // Organizer users should always land in their dedicated panel
  useEffect(() => {
    if (activeRole === ROLES.ORGANIZER) {
      navigate('/organizer', { replace: true });
    }
  }, [activeRole, navigate]);

  // Mock data for Phase 1 preview
  const liveMatch = {
    league: 'FootVerse Premier League • Week 8',
    homeTeam: 'Strikers FC',
    awayTeam: 'Titans FC',
    homeScore: 2,
    awayScore: 1,
    minute: "67'",
    stadium: 'Arena Park, Pitch A',
    possession: '54% - 46%',
    shotsOnTarget: '6 - 4'
  };

  const upcomingTournament = {
    name: 'Champions Cup 2026',
    format: 'Knockout • 16 Teams',
    prizePool: '$10,000',
    startDate: 'Aug 15, 2026',
    teamsRegistered: 13,
    maxTeams: 16,
    city: 'Metropolis'
  };

  const topScorers = [
    { rank: 1, name: 'Marcus Rashford', team: 'Strikers FC', goals: 12, assists: 4, matches: 8 },
    { rank: 2, name: 'Erling Haaland', team: 'Titans FC', goals: 11, assists: 2, matches: 7 },
    { rank: 3, name: 'Kylian Mbappé', team: 'Galacticos', goals: 9, assists: 6, matches: 8 },
    { rank: 4, name: 'Bukayo Saka', team: 'Gunners FC', goals: 7, assists: 8, matches: 7 },
  ];

  const teamRankings = [
    { rank: 1, team: 'Strikers FC', p: 8, w: 7, d: 1, l: 0, pts: 22, form: ['W', 'W', 'W', 'D', 'W'] },
    { rank: 2, team: 'Titans FC', p: 8, w: 6, d: 1, l: 1, pts: 19, form: ['W', 'W', 'L', 'W', 'W'] },
    { rank: 3, team: 'Galacticos', p: 8, w: 5, d: 2, l: 1, pts: 17, form: ['D', 'W', 'W', 'W', 'L'] },
    { rank: 4, team: 'Apex Predators', p: 8, w: 4, d: 2, l: 2, pts: 14, form: ['L', 'W', 'D', 'W', 'W'] },
  ];

  const recentMatches = [
    { home: 'Galacticos', away: 'Apex Predators', homeScore: 3, awayScore: 1, date: 'Yesterday', mvp: 'K. Mbappé' },
    { home: 'Thunder FC', away: 'Vipers SC', homeScore: 0, awayScore: 2, date: '2 days ago', mvp: 'D. Nunez' },
    { home: 'Gunners FC', away: 'Spartans', homeScore: 4, awayScore: 2, date: '3 days ago', mvp: 'B. Saka' },
  ];

  const isGuest = !user || activeRole === ROLES.GUEST;

  return (
    <div className="space-y-8 pb-12">
      
      {/* 1. COMPACT PREMIUM WELCOME HERO WITH ARTWORK */}
      <div className="saas-card rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-[#10172A] to-[#151D33] text-white border border-slate-800 shadow-xl overflow-hidden relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pro Tournament OS Engine</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold font-heading tracking-tight text-white leading-tight">
              {!isGuest ? (
                <>
                  Welcome back,{' '}
                  <span className="text-blue-400">
                    {profile?.full_name || user?.email?.split('@')[0]}
                  </span> 👋
                </>
              ) : (
                <>
                  Welcome to <span className="text-blue-400">FootVerse Arena</span> ⚽
                </>
              )}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              {!isGuest ? (
                'Track live match scores, schedule fixture draws, oversee team rosters, and manage tournament leaderboards.'
              ) : (
                'Explore live scores, tournament leaderboards, team standings, top goalscorers, and player statistics across the ecosystem.'
              )}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-medium text-slate-300 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Status: <strong className="text-white">{ROLE_LABELS[activeRole] || 'Guest Visitor'}</strong></span>
              </span>

              {isGuest && (
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/30 transition flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Sign In / Register</span>
                </button>
              )}
            </div>
          </div>

          {/* Football Artwork on Right */}
          <div className="w-full md:w-64 lg:w-72 flex-shrink-0 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-3xl" />
            <img 
              src="/hero_artwork.png" 
              alt="Futuristic Football Artwork" 
              className="w-48 sm:w-56 lg:w-64 object-contain relative z-10 drop-shadow-2xl hover:scale-105 transition duration-300" 
            />
          </div>

        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        
        <div className="saas-card p-5 sm:p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Tournaments</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white mt-1">24</h3>
            <span className="text-[10px] font-bold text-emerald-500 flex items-center space-x-0.5 mt-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>+4 this month</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        <div className="saas-card p-5 sm:p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Matches</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white mt-1">3</h3>
            <span className="text-[10px] font-bold text-emerald-500 flex items-center space-x-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>1 Live right now</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Radio className="w-6 h-6" />
          </div>
        </div>

        <div className="saas-card p-5 sm:p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Registered Teams</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white mt-1">128</h3>
            <span className="text-[10px] font-bold text-emerald-500 flex items-center space-x-0.5 mt-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>12 pending approval</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="saas-card p-5 sm:p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Goals Scored</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white mt-1">412</h3>
            <span className="text-[10px] font-bold text-slate-400 mt-1">Avg 2.8 per match</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <Flame className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* 3. MAIN CONTENT GRID: LIVE MATCH & UPCOMING TOURNAMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LIVE MATCH CARD (2 Columns on large screens) */}
        <div className="lg:col-span-2 saas-card p-6 sm:p-7 rounded-3xl space-y-5">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>LIVE SCORECENTER</span>
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">• {liveMatch.league}</span>
            </div>

            <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold">
              Min {liveMatch.minute}
            </span>
          </div>

          {/* Teams & Scoreboard */}
          <div className="py-4 px-6 rounded-2xl bg-slate-50 dark:bg-[#0D121F] border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
            
            {/* Home Team */}
            <div className="flex flex-col items-center space-y-2 flex-1 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                ST
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{liveMatch.homeTeam}</span>
              <span className="text-[10px] text-slate-400">Home</span>
            </div>

            {/* Score Display */}
            <div className="flex flex-col items-center space-y-1 px-6">
              <div className="text-3xl sm:text-5xl font-black font-heading tracking-wider text-slate-900 dark:text-white">
                {liveMatch.homeScore} : {liveMatch.awayScore}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">2nd Half</span>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center space-y-2 flex-1 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                TT
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{liveMatch.awayTeam}</span>
              <span className="text-[10px] text-slate-400">Away</span>
            </div>

          </div>

          {/* Quick Match Metrics */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] font-bold uppercase">Ball Possession</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{liveMatch.possession}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] font-bold uppercase">Shots On Target</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{liveMatch.shotsOnTarget}</p>
            </div>
          </div>

        </div>

        {/* FEATURED UPCOMING TOURNAMENT CARD */}
        <div className="saas-card p-6 sm:p-7 rounded-3xl space-y-5 flex flex-col justify-between">
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold">
                Featured Tournament
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                Open Registration
              </span>
            </div>

            <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mb-2">
              {upcomingTournament.name}
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Format: {upcomingTournament.format}
            </p>

            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Prize Pool</span>
                <span className="font-bold text-slate-900 dark:text-white">{upcomingTournament.prizePool}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Start Date</span>
                <span className="font-bold text-slate-900 dark:text-white">{upcomingTournament.startDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Teams Registered</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {upcomingTournament.teamsRegistered} / {upcomingTournament.maxTeams}
                </span>
              </div>
            </div>
          </div>

          <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2">
            <span>Register Squad</span>
            <ChevronRight className="w-4 h-4" />
          </button>

        </div>

      </div>

      {/* 4. SECONDARY GRID: TOP SCORERS & TEAM RANKINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TOP GOALSCORERS WIDGET */}
        <div className="saas-card p-6 sm:p-7 rounded-3xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                Golden Boot Leaderboard
              </h3>
            </div>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold cursor-pointer hover:underline">
              View All
            </span>
          </div>

          <div className="space-y-3">
            {topScorers.map((player) => (
              <div 
                key={player.name}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition"
              >
                <div className="flex items-center space-x-3">
                  <span className={`w-6 h-6 rounded-lg text-xs font-extrabold flex items-center justify-center ${
                    player.rank === 1 ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400' : 'text-slate-400'
                  }`}>
                    #{player.rank}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{player.name}</h4>
                    <p className="text-[10px] text-slate-400">{player.team}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-xs font-semibold">
                  <div className="text-right">
                    <span className="text-slate-900 dark:text-white font-bold">{player.goals} Goals</span>
                    <span className="block text-[10px] text-slate-400">{player.assists} assists</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TEAM RANKINGS TABLE */}
        <div className="saas-card p-6 sm:p-7 rounded-3xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                League Standings
              </h3>
            </div>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold cursor-pointer hover:underline">
              Full Table
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold">
                  <th className="pb-2">#</th>
                  <th className="pb-2">Team</th>
                  <th className="pb-2 text-center">P</th>
                  <th className="pb-2 text-center">W</th>
                  <th className="pb-2 text-center">D</th>
                  <th className="pb-2 text-center">L</th>
                  <th className="pb-2 text-right">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {teamRankings.map((team) => (
                  <tr key={team.team} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 font-bold text-slate-400">{team.rank}</td>
                    <td className="py-3 font-bold text-slate-900 dark:text-white">{team.team}</td>
                    <td className="py-3 text-center text-slate-500">{team.p}</td>
                    <td className="py-3 text-center text-slate-500">{team.w}</td>
                    <td className="py-3 text-center text-slate-500">{team.d}</td>
                    <td className="py-3 text-center text-slate-500">{team.l}</td>
                    <td className="py-3 text-right font-extrabold text-blue-600 dark:text-blue-400">{team.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* 5. QUICK ACTIONS & RECENT MATCHES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* QUICK ACTIONS GRID */}
        <div className="lg:col-span-2 saas-card p-6 sm:p-7 rounded-3xl space-y-4">
          <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
            Quick Actions
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60 hover:border-blue-500/50 cursor-pointer transition text-center space-y-2 group">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center group-hover:scale-110 transition">
                <Trophy className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Host Tournament</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60 hover:border-blue-500/50 cursor-pointer transition text-center space-y-2 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center group-hover:scale-110 transition">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Register Team</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60 hover:border-blue-500/50 cursor-pointer transition text-center space-y-2 group">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center group-hover:scale-110 transition">
                <Zap className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Log Event</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60 hover:border-blue-500/50 cursor-pointer transition text-center space-y-2 group">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center group-hover:scale-110 transition">
                <Award className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Leaderboards</p>
            </div>
          </div>
        </div>

        {/* RECENT MATCHES FEED */}
        <div className="saas-card p-6 sm:p-7 rounded-3xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
              Recent Match Results
            </h3>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3">
            {recentMatches.map((m, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 text-xs flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{m.home} vs {m.away}</p>
                  <p className="text-[10px] text-slate-400">MVP: {m.mvp} • {m.date}</p>
                </div>
                <span className="font-extrabold font-mono text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-xl">
                  {m.homeScore} - {m.awayScore}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
