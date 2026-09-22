import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  Trophy, 
  Users, 
  Activity, 
  Calendar, 
  Flame, 
  Shield, 
  Sparkles, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp,
  Award, 
  Zap, 
  Clock, 
  BarChart2, 
  Radio, 
  Search, 
  MapPin, 
  Layers, 
  TrendingUp, 
  ArrowRight,
  UserCheck,
  Swords,
  Key,
  Hash,
  CheckCircle2
} from 'lucide-react';
import { useAuth, ROLES, ROLE_LABELS } from '../context/AuthContext';
import { tournamentService } from '../services/tournamentService';
import { matchService } from '../services/matchService';
import { statsService } from '../services/statsService';
import { teamService } from '../services/teamService';
import { playerService } from '../services/playerService';
import { JoinTournamentCodeModal } from '../components/tournament/JoinTournamentCodeModal';
import { Toast } from '../components/common/Toast';
import { cleanTournamentDescription } from '../utils/substitutionUtils';

export const HomePage = () => {
  const { activeRole, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isLiveParam = searchParams.get('live') === 'true' || location.search.includes('live=true');
  const [tournaments, setTournaments] = useState([]);
  const [myTournaments, setMyTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [matchFilter, setMatchFilter] = useState(isLiveParam ? 'live' : 'all');
  const [tournamentFilter, setTournamentFilter] = useState('all');
  const [tournamentScope, setTournamentScope] = useState(
    searchParams.get('tab') === 'my' || location.pathname === '/my-tournaments' ? 'my' : 'all'
  );
  const [isTournamentCodeModalOpen, setIsTournamentCodeModalOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchPublicData = useCallback(async () => {
    try {
      setLoading(true);
      const [tournamentsRes, matchesRes, playersRes, teamsRes, userTeamsRes, userMembershipsRes] = await Promise.allSettled([
        tournamentService.getAll(),
        matchService.getAll(),
        statsService.getPlayersList(),
        statsService.getTeamsList(),
        user ? teamService.getAll() : Promise.resolve({ teams: [] }),
        user ? playerService.getByPlayer(user.id) : Promise.resolve({ teamMembers: [] })
      ]);

      let fetchedTournaments = [];
      if (tournamentsRes.status === 'fulfilled' && tournamentsRes.value?.tournaments) {
        fetchedTournaments = tournamentsRes.value.tournaments;
        setTournaments(fetchedTournaments);
      }
      if (matchesRes.status === 'fulfilled' && matchesRes.value?.matches) {
        setMatches(matchesRes.value.matches);
      }
      if (playersRes.status === 'fulfilled' && playersRes.value?.players) {
        setPlayers(playersRes.value.players);
      }
      if (teamsRes.status === 'fulfilled' && teamsRes.value?.teams) {
        setTeams(teamsRes.value.teams);
      }

      // Compute user's enrolled tournaments
      if (user) {
        const allUserTeams = userTeamsRes.status === 'fulfilled' ? userTeamsRes.value?.teams || [] : [];
        const playerMemberships = userMembershipsRes.status === 'fulfilled' ? userMembershipsRes.value?.teamMembers || [] : [];

        const myAffiliatedTeams = allUserTeams.filter(t =>
          t.managerId === user.id ||
          t.manager?.id === user.id ||
          t.members?.some(m => (m.playerId === user.id || m.player?.id === user.id) && m.isCaptain) ||
          playerMemberships.some(pm => pm.team?.id === t.id || pm.teamId === t.id)
        );

        const myTeamTournMap = new Map();
        myAffiliatedTeams.forEach(t => {
          const tId = t.tournamentId || t.tournament?.id;
          if (tId) {
            myTeamTournMap.set(tId, t);
          }
        });

        const userTourns = fetchedTournaments.filter(t =>
          t.organizerId === user.id || myTeamTournMap.has(t.id)
        ).map(t => ({
          ...t,
          myTeam: myTeamTournMap.get(t.id) || null,
          isOrganizer: t.organizerId === user.id
        }));

        setMyTournaments(userTourns);
      } else {
        setMyTournaments([]);
      }
    } catch (err) {
      console.error('Error fetching public home page data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPublicData();
  }, [fetchPublicData]);

  const handleTournamentCodeSuccess = async (tournamentId, tournamentName) => {
    setToast({ message: `Successfully registered for "${tournamentName}"!`, type: 'success' });
    await fetchPublicData();
    if (tournamentId) {
      navigate(`/tournaments/${tournamentId}`);
    }
  };

  // Handle route-specific filters and scrolling
  useEffect(() => {
    if (isLiveParam) {
      setMatchFilter('live');
    } else if (location.pathname === '/matches' && !location.search.includes('live=true')) {
      setMatchFilter('all');
    }

    if (location.pathname === '/tournaments' || location.pathname === '/tournaments-preview') {
      const timer = setTimeout(() => {
        const el = document.getElementById('tournaments-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(timer);
    } else if (location.pathname === '/matches' || location.pathname === '/matches-preview') {
      const timer = setTimeout(() => {
        const el = document.getElementById('matches-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, location.search, isLiveParam]);

  const isGuest = !user || activeRole === ROLES.GUEST;

  // Fallback demo items if backend database is brand new / empty
  const displayTournaments = tournaments.length > 0 ? tournaments : [
    {
      id: 'demo-t1',
      name: 'Champions Cup 2026',
      format: 'knockout',
      location: 'Metropolis Arena, Pitch A',
      startDate: '2026-08-15',
      maxTeams: 16,
      registeredTeamsCount: 12,
      entryFee: 150,
      description: 'The premier knockout championship for elite clubs across the metro region.'
    },
    {
      id: 'demo-t2',
      name: 'FootVerse Super League',
      format: 'league',
      location: 'National Sports Complex',
      startDate: '2026-09-01',
      maxTeams: 10,
      registeredTeamsCount: 8,
      entryFee: 200,
      description: 'Double round-robin league season with weekly televised fixtures and awards.'
    },
    {
      id: 'demo-t3',
      name: 'All-Stars Invitational',
      format: 'group_stage',
      location: 'Central Stadium',
      startDate: '2026-10-10',
      maxTeams: 8,
      registeredTeamsCount: 6,
      entryFee: 100,
      description: 'Group stage round-robin leading into high-stakes knockout semi-finals.'
    }
  ];

  const displayMatches = matches.length > 0 ? matches : [
    {
      id: 'demo-m1',
      roundName: 'Quarter-Final',
      status: 'live',
      matchDate: new Date().toISOString(),
      venue: 'Metropolis Stadium - Pitch 1',
      homeScore: 2,
      awayScore: 1,
      homeTeam: { name: 'Strikers FC', shortName: 'STK', logoUrl: null },
      awayTeam: { name: 'Titans SC', shortName: 'TTN', logoUrl: null },
      tournament: { name: 'Champions Cup 2026' }
    },
    {
      id: 'demo-m2',
      roundName: 'Round of 16',
      status: 'scheduled',
      matchDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      venue: 'Arena Park, Pitch 3',
      homeScore: 0,
      awayScore: 0,
      homeTeam: { name: 'Galacticos FC', shortName: 'GLC', logoUrl: null },
      awayTeam: { name: 'Apex Predators', shortName: 'APX', logoUrl: null },
      tournament: { name: 'Champions Cup 2026' }
    },
    {
      id: 'demo-m3',
      roundName: 'Week 8',
      status: 'completed',
      matchDate: new Date(Date.now() - 86400000 * 2).toISOString(),
      venue: 'Riverside Ground',
      homeScore: 3,
      awayScore: 2,
      homeTeam: { name: 'Gunners FC', shortName: 'GUN', logoUrl: null },
      awayTeam: { name: 'Thunderbolts SC', shortName: 'THN', logoUrl: null },
      tournament: { name: 'FootVerse Super League' }
    }
  ];

  const displayPlayers = players.length > 0 ? players : [
    { id: 'p1', fullName: 'Marcus Rashford', teamName: 'Strikers FC', preferredPosition: 'Forward', goals: 14 },
    { id: 'p2', fullName: 'Erling Haaland', teamName: 'Titans SC', preferredPosition: 'Striker', goals: 12 },
    { id: 'p3', fullName: 'Kylian Mbappé', teamName: 'Galacticos FC', preferredPosition: 'Winger', goals: 10 },
    { id: 'p4', fullName: 'Bukayo Saka', teamName: 'Gunners FC', preferredPosition: 'Right Wing', goals: 8 },
    { id: 'p5', fullName: 'Kevin De Bruyne', teamName: 'Apex Predators', preferredPosition: 'Playmaker', goals: 7 }
  ];

  // Filter matches
  const isHomePage = location.pathname === '/' || location.pathname === '/dashboard';
  const [isMatchesExpanded, setIsMatchesExpanded] = useState(!isHomePage);
  const matchGridRef = useRef(null);
  const matchGridInnerRef = useRef(null);
  const [matchGridHeight, setMatchGridHeight] = useState('none');

  const allFilteredMatches = displayMatches.filter(m => {
    if (matchFilter === 'live') return m.status === 'live' || m.status === 'in_progress';
    if (matchFilter === 'upcoming') return m.status === 'scheduled' || m.status === 'upcoming';
    if (matchFilter === 'completed') return m.status === 'completed' || m.status === 'fulltime';
    return true;
  });

  const matchesPreview = allFilteredMatches.slice(0, 6);
  const hasMoreMatches = isHomePage && allFilteredMatches.length > 6;
  const visibleMatches = (!isHomePage || isMatchesExpanded) ? allFilteredMatches : matchesPreview;
  const liveMatchesCount = displayMatches.filter(m => m.status === 'live' || m.status === 'in_progress').length;

  useEffect(() => {
    if (!isHomePage || !matchGridInnerRef.current) {
      setMatchGridHeight('none');
      return;
    }
    requestAnimationFrame(() => {
      if (matchGridInnerRef.current) {
        const fullHeight = matchGridInnerRef.current.scrollHeight;
        setMatchGridHeight(`${fullHeight}px`);
      }
    });
  }, [isHomePage, isMatchesExpanded, visibleMatches.length]);

  const handleToggleMatches = useCallback(() => {
    if (isMatchesExpanded) {
      setIsMatchesExpanded(false);
      setTimeout(() => {
        const el = document.getElementById('matches-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } else {
      setIsMatchesExpanded(true);
    }
  }, [isMatchesExpanded]);

  // Filter tournaments and limit to 6 for concise home display
  const filteredTournaments = displayTournaments.filter(t => {
    if (tournamentFilter === 'knockout') return t.format === 'knockout';
    if (tournamentFilter === 'league') return t.format === 'league' || t.format === 'round_robin';
    if (tournamentFilter === 'group_stage') return t.format === 'group_stage' || t.format === 'group_knockout';
    return true;
  }).slice(0, 6);

  const formatBadgeStyle = (format) => {
    switch (format?.toLowerCase()) {
      case 'knockout':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'league':
      case 'round_robin':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'group_stage':
      case 'group_knockout':
      case 'hybrid':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getFormatLabel = (format) => {
    switch (format?.toLowerCase()) {
      case 'knockout': return 'Knockout Cup';
      case 'league':
      case 'round_robin': return 'League / Round Robin';
      case 'group_stage':
      case 'group_knockout':
      case 'hybrid': return 'Group Stage + Knockout';
      default: return 'Tournament';
    }
  };

  return (
    <div className="space-y-10 pb-16">
      
      {/* ─── 1. HERO SECTION ──────────────────────────────────────────────── */}
      <section className="saas-card rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-slate-900 via-[#0C1B12] to-[#07130C] text-white border border-slate-800 dark:border-[#1E3A29] shadow-2xl overflow-hidden relative">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
          
          <div className="space-y-5 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-semibold shadow-inner">
              <Sparkles className="w-4 h-4 text-green-400 animate-pulse" />
              <span>From Kickoff to Final</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black font-heading tracking-tight text-white leading-tight">
              Where Every Match {' '}
              <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-green-200 bg-clip-text text-transparent">
                Becomes a Story
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans max-w-xl mx-auto lg:mx-0">
              Live scores, match updates, tournaments, teams, and player stats — all in one place.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <Link
                to="/tournaments"
                className="px-6 py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-green-600/30 transition flex items-center space-x-2 group"
              >
                <Trophy className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span>Explore Tournaments</span>
                <ChevronRight className="w-4 h-4" />
              </Link>

              <Link
                to="/matches"
                className="px-6 py-3 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 font-bold rounded-2xl text-xs sm:text-sm transition flex items-center space-x-2"
              >
                <Swords className="w-4 h-4 text-green-400" />
                <span>Live Match Center</span>
              </Link>

              {activeRole === ROLES.ORGANIZER && (
                <Link
                  to="/organizer"
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center space-x-1.5"
                >
                  <Activity className="w-4 h-4" />
                  <span>Organizer Console</span>
                </Link>
              )}

              {isGuest && (
                <Link
                  to="/register"
                  className="px-5 py-3 bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Join / Register Free</span>
                </Link>
              )}
            </div>

            {/* Quick Status Bar */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-3 text-xs text-slate-400 border-t border-slate-800/80 dark:border-[#1E3A29]">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                <strong className="text-slate-200">
                  {liveMatchesCount > 0 ? `${liveMatchesCount} Match Live Now` : 'Live Match Center Ready'}
                </strong>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-green-400" />
                <span>Automated Standings & Brackets</span>
              </span>
            </div>
          </div>

          {/* Football Artwork with Glow Effects */}
          <div className="w-full lg:w-80 flex-shrink-0 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-green-600/25 to-emerald-600/15 rounded-full blur-3xl animate-pulse" />
            <img 
              src="/hero_artwork.png" 
              alt="FootVerse Football Engine Artwork" 
              className="w-52 sm:w-64 lg:w-72 object-contain relative z-10 drop-shadow-2xl hover:scale-105 transition duration-500" 
            />
          </div>

        </div>
      </section>

      {/* ─── 2. MATCH SCORECENTER HUB (6 MOST RECENT MATCHES) ─────────────── */}
      <section id="matches-section" className="saas-card p-6 sm:p-8 rounded-3xl space-y-6 scroll-mt-20">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-[#1E3A29]">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Swords className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white">
                Match Scorecenter
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live scoreboards, scheduled fixtures, and recent match results.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Pills */}
            <div className="flex items-center bg-slate-100 dark:bg-[#16261C] p-1 rounded-2xl border border-slate-200 dark:border-[#1E3A29] overflow-x-auto">
              {[
                { id: 'all', label: 'All' },
                { id: 'live', label: '🔴 Live', badge: liveMatchesCount },
                { id: 'upcoming', label: '📅 Upcoming' },
                { id: 'completed', label: '⏱️ Results' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setMatchFilter(tab.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    matchFilter === tab.id
                      ? 'bg-white dark:bg-green-600 text-green-700 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="px-1.5 py-0.2 bg-red-500 text-white text-[10px] rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* View All Matches Button */}
            <Link
              to="/matches"
              className="px-3.5 py-1.5 bg-green-50 dark:bg-green-950/70 hover:bg-green-100 dark:hover:bg-green-900/60 text-green-700 dark:text-green-400 font-bold text-xs rounded-xl border border-green-200/80 dark:border-green-800/80 transition flex items-center space-x-1 whitespace-nowrap"
            >
              <span>View All Matches</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Matches Grid */}
        {visibleMatches.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <Radio className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No matches found in this category</p>
            <p className="text-xs text-slate-400">Switch filter tab above or check back when games are underway.</p>
          </div>
        ) : (
          <div
            ref={matchGridRef}
            className="overflow-hidden"
            style={{
              maxHeight: (isHomePage && matchGridHeight !== 'none') ? matchGridHeight : 'none',
              transition: isHomePage ? 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
            }}
          >
            <div ref={matchGridInnerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleMatches.map(match => {
                const isLive = match.status === 'live' || match.status === 'in_progress';
                const isCompleted = match.status === 'completed' || match.status === 'fulltime';
                const isScheduled = match.status === 'scheduled' || match.status === 'upcoming';

                const homeName = match.homeTeam?.name || 'Home Team';
                const awayName = match.awayTeam?.name || 'Away Team';
                const homeScore = match.homeScore ?? 0;
                const awayScore = match.awayScore ?? 0;

                return (
                  <Link
                    key={match.id}
                    to={`/matches/${match.id}`}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer group saas-card-hover ${
                      isLive
                        ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30 shadow-md ring-1 ring-emerald-500/20'
                        : 'bg-slate-50/80 dark:bg-[#16261C]/80 border-slate-200/70 dark:border-[#1E3A29]'
                    }`}
                  >
                    {/* Top Bar: Tournament & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
                        {match.tournament?.name || 'FootVerse Tournament'}
                      </span>

                      {isLive && (
                        <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-[10px] font-black tracking-wider flex items-center space-x-1 flex-shrink-0 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          <span>LIVE</span>
                        </span>
                      )}

                      {isCompleted && (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-[#101C14] text-slate-700 dark:text-slate-300 text-[10px] font-bold flex-shrink-0">
                          FULL TIME
                        </span>
                      )}

                      {isScheduled && (
                        <span className="px-2.5 py-0.5 rounded-full bg-green-50 dark:bg-green-950/80 text-green-700 dark:text-green-400 text-[10px] font-bold flex-shrink-0">
                          SCHEDULED
                        </span>
                      )}
                    </div>

                    {/* Team vs Team Scoreboard */}
                    <div className="py-3 px-4 rounded-xl bg-white dark:bg-[#101C14] border border-slate-200/60 dark:border-[#1E3A29] space-y-3 group-hover:border-green-500/40 transition">
                      
                      {/* Home Team */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                          <div className="w-7 h-7 rounded-lg bg-green-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                            {match.homeTeam?.shortName || homeName.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {homeName}
                          </span>
                        </div>
                        <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                          {isScheduled ? '-' : homeScore}
                        </span>
                      </div>

                      {/* Away Team */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                            {match.awayTeam?.shortName || awayName.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {awayName}
                          </span>
                        </div>
                        <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                          {isScheduled ? '-' : awayScore}
                        </span>
                      </div>

                    </div>

                    {/* Match Info & Venue Footer */}
                    <div className="pt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center space-x-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{match.venue || match.roundName || 'Arena Field'}</span>
                      </span>

                      <span className="flex items-center space-x-1 font-medium flex-shrink-0">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {match.matchDate ? new Date(match.matchDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'TBD'}
                        </span>
                      </span>
                    </div>

                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom action: expand/collapse on homepage */}
        <div className="pt-2 flex justify-center">
          {isHomePage && hasMoreMatches ? (
            <button
              onClick={handleToggleMatches}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#16261C] dark:hover:bg-[#1E3A29] text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 group"
            >
              <span>{isMatchesExpanded ? 'View Less' : `View All ${allFilteredMatches.length} Matches`}</span>
              {isMatchesExpanded 
                ? <ChevronUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 text-green-600 dark:text-green-400" /> 
                : <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5 text-green-600 dark:text-green-400" />
              }
            </button>
          ) : isHomePage ? (
            <Link
              to="/matches"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#16261C] dark:hover:bg-[#1E3A29] text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center space-x-2"
            >
              <span>View Full Match Center & Fixtures Calendar</span>
              <ChevronRight className="w-4 h-4 text-green-600 dark:text-green-400" />
            </Link>
          ) : null}
        </div>

      </section>

      {/* ─── 3. FEATURED TOURNAMENTS & CUPS ───────────────────────────────── */}
      <section id="tournaments-section" className="saas-card p-6 sm:p-8 rounded-3xl space-y-6 scroll-mt-20">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-[#1E3A29]">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white">
                {tournamentScope === 'my' ? 'My Tournaments' : 'Featured Tournaments & Cups'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {tournamentScope === 'my'
                ? 'Tournaments your squad is registered in, active fixture brackets, and match schedules.'
                : 'Explore open registration leagues, knockout cups, and tournament leaderboards.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Scope Toggle: All Tournaments vs My Tournaments */}
            {user && (
              <div className="flex items-center bg-slate-100 dark:bg-[#16261C] p-1 rounded-2xl border border-slate-200 dark:border-[#1E3A29]">
                <button
                  id="tab-all-tournaments"
                  onClick={() => setTournamentScope('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    tournamentScope === 'all'
                      ? 'bg-white dark:bg-green-600 text-green-700 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All Tournaments
                </button>
                <button
                  id="tab-my-tournaments"
                  onClick={() => setTournamentScope('my')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                    tournamentScope === 'my'
                      ? 'bg-white dark:bg-green-600 text-green-700 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>My Tournaments</span>
                  {myTournaments.length > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      tournamentScope === 'my' ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {myTournaments.length}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Format Filter Tabs (All Tournaments scope only) */}
            {tournamentScope === 'all' && (
              <div className="flex items-center bg-slate-100 dark:bg-[#16261C] p-1 rounded-2xl border border-slate-200 dark:border-[#1E3A29] overflow-x-auto">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'knockout', label: 'Knockout' },
                  { id: 'league', label: 'League' },
                  { id: 'group_stage', label: 'Group + KO' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setTournamentFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      tournamentFilter === tab.id
                        ? 'bg-white dark:bg-green-600 text-green-700 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Join with Tournament Code Button */}
            {user && (
              <button
                id="open-tournament-code-btn"
                onClick={() => setIsTournamentCodeModalOpen(true)}
                className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold text-xs rounded-xl shadow-md shadow-green-600/20 transition flex items-center space-x-1.5 whitespace-nowrap"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Join with Code</span>
              </button>
            )}

            {/* View All Tournaments Link */}
            {tournamentScope === 'all' && (
              <Link
                to="/tournaments"
                className="px-3.5 py-1.5 bg-green-50 dark:bg-green-950/70 hover:bg-green-100 dark:hover:bg-green-900/60 text-green-700 dark:text-green-400 font-bold text-xs rounded-xl border border-green-200/80 dark:border-green-800/80 transition flex items-center space-x-1 whitespace-nowrap"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* ─── SCOPE 1: MY TOURNAMENTS ────────────────────────────────────── */}
        {tournamentScope === 'my' && (
          <div>
            {myTournaments.length === 0 ? (
              <div className="p-10 sm:p-12 rounded-3xl bg-green-50/40 dark:bg-green-950/20 border border-green-200/60 dark:border-green-900/40 text-center space-y-5">
                <div className="w-16 h-16 rounded-3xl bg-green-600/10 dark:bg-green-500/10 flex items-center justify-center mx-auto">
                  <Trophy className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    You have not joined any tournaments yet
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                    Have an invite code from the organizer? Enter it to enroll your squad immediately, or explore upcoming open tournaments.
                  </p>
                </div>
                <div className="flex items-center justify-center flex-wrap gap-3 pt-2">
                  <button
                    id="my-tournaments-join-code-btn"
                    onClick={() => setIsTournamentCodeModalOpen(true)}
                    className="px-5 py-2.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold rounded-xl text-xs shadow-md shadow-green-600/25 transition inline-flex items-center space-x-2"
                  >
                    <Key className="w-4 h-4" />
                    <span>Join with Tournament Code</span>
                  </button>
                  <button
                    onClick={() => setTournamentScope('all')}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-[#16261C] dark:hover:bg-[#1E3A29] text-white font-bold rounded-xl text-xs shadow-md transition inline-flex items-center space-x-2"
                  >
                    <Trophy className="w-4 h-4 text-green-400" />
                    <span>Browse Open Tournaments</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTournaments.map(t => {
                  const registered = t.registeredTeamsCount || t.registeredTeams || 0;
                  const max = t.maxTeams || 16;
                  const progressPercent = Math.min(Math.round((registered / max) * 100), 100);

                  return (
                    <Link
                      key={t.id}
                      to={`/tournaments/${t.id}`}
                      className="saas-card saas-card-hover p-6 rounded-3xl border border-green-200/80 dark:border-[#1E3A29] bg-white dark:bg-[#101C14] flex flex-col justify-between space-y-4 cursor-pointer group shadow-sm"
                    >
                      <div>
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${formatBadgeStyle(t.format)}`}>
                            {getFormatLabel(t.format)}
                          </span>

                          {t.myTeam ? (
                            <span className="px-2.5 py-1 rounded-xl bg-green-100 dark:bg-green-950/80 text-green-800 dark:text-green-300 text-[10px] font-bold flex items-center space-x-1">
                              <Shield className="w-3 h-3" />
                              <span>{t.myTeam.name}</span>
                            </span>
                          ) : t.isOrganizer ? (
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                              Organizer
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl bg-green-100 dark:bg-green-950/80 text-green-700 dark:text-green-400 text-[10px] font-bold">
                              Enrolled
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white line-clamp-1 group-hover:text-green-600 dark:group-hover:text-green-400 transition">
                          {t.name}
                        </h3>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {cleanTournamentDescription(t.description) || 'View tournament brackets, registered squads, and match schedules.'}
                        </p>

                        <div className="space-y-2.5 pt-4 text-xs">
                          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                            <span className="flex items-center space-x-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate max-w-[150px]">{t.location || 'Metropolis'}</span>
                            </span>
                            <span className="flex items-center space-x-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{t.startDate ? new Date(t.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Upcoming'}</span>
                            </span>
                          </div>

                          <div className="space-y-1 pt-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-500 dark:text-slate-400">Squads Enrolled</span>
                              <span className="font-bold text-green-600 dark:text-green-400">
                                {registered} / {max}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-[#16261C] rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-green-600 h-1.5 rounded-full transition-all duration-500" 
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-[#1E3A29] flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Registered</span>
                        </span>

                        <span className="px-4 py-2 bg-green-600 group-hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5">
                          <span>View Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── SCOPE 2: ALL TOURNAMENTS ───────────────────────────────────── */}
        {tournamentScope === 'all' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map(t => {
              const registered = t.registeredTeamsCount || t.registeredTeams || 0;
              const max = t.maxTeams || 16;
              const progressPercent = Math.min(Math.round((registered / max) * 100), 100);

              return (
                <Link
                  key={t.id}
                  to={`/tournaments/${t.id}`}
                  className="saas-card saas-card-hover p-6 rounded-3xl border flex flex-col justify-between space-y-4 cursor-pointer group"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${formatBadgeStyle(t.format)}`}>
                        {getFormatLabel(t.format)}
                      </span>

                      <span className="px-2.5 py-1 rounded-xl bg-green-100 dark:bg-green-950/80 text-green-700 dark:text-green-400 text-[10px] font-bold">
                        Open Registration
                      </span>
                    </div>

                    <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white line-clamp-1 group-hover:text-green-600 dark:group-hover:text-green-400 transition">
                      {t.name}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {cleanTournamentDescription(t.description) || 'Join top regional squads in this high-intensity football competition.'}
                    </p>

                    <div className="space-y-2.5 pt-4 text-xs">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span className="flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[150px]">{t.location || 'Metropolis'}</span>
                        </span>
                        <span className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{t.startDate ? new Date(t.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Upcoming'}</span>
                        </span>
                      </div>

                      {/* Progress Bar for Registration */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500 dark:text-slate-400">Registered Teams</span>
                          <span className="font-bold text-green-600 dark:text-green-400">
                            {registered} / {max}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-[#16261C] rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-green-600 h-1.5 rounded-full transition-all duration-500" 
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-[#1E3A29] flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Entry Fee</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {t.entryFee ? `₹ ${t.entryFee}` : 'Free Entry'}
                      </span>
                    </div>

                    <span className="px-4 py-2 bg-green-600 group-hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5">
                      <span>View Hub</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                </Link>
              );
            })}
          </div>
        )}

        {tournamentScope === 'all' && (
          <div className="pt-2 flex justify-center">
            <Link
              to="/tournaments"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#16261C] dark:hover:bg-[#1E3A29] text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center space-x-2"
            >
              <span>Browse All Platform Tournaments & Full Brackets</span>
              <ChevronRight className="w-4 h-4 text-green-600 dark:text-green-400" />
            </Link>
          </div>
        )}

      </section>

      {/* ─── 4. PLATFORM VALUE PILLARS & FEATURES ─────────────────────────── */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-bold border border-green-500/20">
            <Zap className="w-3.5 h-3.5" />
            <span>Engine Highlights</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-heading text-slate-900 dark:text-white">
            Built for Grassroots Glory & Pro Tournaments
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Everything organizers, captains, and footballers need to manage world-class competitions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div className="saas-card p-6 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-950/60 text-green-600 dark:text-green-400 flex items-center justify-center border border-green-200/50 dark:border-green-800/50">
              <Radio className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">
              Live Scorekeeper & Events
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Log goals, assists, yellow/red cards, and substitutions minute-by-minute with live fan broadcast scorecards.
            </p>
          </div>

          <div className="saas-card p-6 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/50">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">
              Automated Brackets & Draw
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Generate single knockout elimination trees, multi-group round-robins, and dynamic tiebreaker points tables.
            </p>
          </div>

          <div className="saas-card p-6 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200/50 dark:border-teal-800/50">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">
              Player Career Passports
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Track lifetime goal tallies, golden boot races, MVP trophies, and disciplinary histories across every cup.
            </p>
          </div>

          <div className="saas-card p-6 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-lime-50 dark:bg-lime-950/60 text-lime-700 dark:text-lime-400 flex items-center justify-center border border-lime-200/50 dark:border-lime-800/50">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white">
              Verified Club Rosters
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Digital team registration, jersey number assignments, transfer verification, and lineup management.
            </p>
          </div>

        </div>
      </section>

      {/* ─── 5. BOTTOM CTA CALLOUT ────────────────────────────────────────── */}
      <section className="saas-card rounded-3xl p-8 sm:p-10 bg-gradient-to-r from-[#0C1B12] via-[#101C14] to-[#07130C] text-white border border-green-900/40 shadow-xl relative overflow-hidden text-center space-y-5">
        <div className="max-w-2xl mx-auto space-y-3 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-white">
            Ready to Kick Off Your Next Football Tournament?
          </h2>
          <p className="text-xs sm:text-sm text-green-200">
            Join hundreds of teams, organizers, and footballers on the fastest-growing amateur and pro football tournament OS.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              to="/tournaments"
              className="px-6 py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center space-x-2"
            >
              <Trophy className="w-4 h-4 text-white" />
              <span>Browse Tournaments</span>
            </Link>

            <Link
              to="/stats"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-extrabold rounded-2xl text-xs sm:text-sm border border-white/20 shadow-md transition flex items-center space-x-2"
            >
              <BarChart2 className="w-4 h-4 text-green-400" />
              <span>Explore Analytics & Stats</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Modals & Toast Feedback */}
      <JoinTournamentCodeModal
        isOpen={isTournamentCodeModalOpen}
        onClose={() => setIsTournamentCodeModalOpen(false)}
        onSuccess={handleTournamentCodeSuccess}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

    </div>
  );
};

export default HomePage;
