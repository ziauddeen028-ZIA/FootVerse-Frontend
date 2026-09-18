import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Users, 
  Shield, 
  ArrowLeft, 
  Activity, 
  Layers, 
  DollarSign, 
  Clock, 
  Sparkles,
  ChevronRight,
  AlertCircle,
  User,
  Award,
  X,
  Shirt,
  Check
} from 'lucide-react';
import { tournamentService } from '../services/tournamentService';
import { teamService } from '../services/teamService';
import { playerService } from '../services/playerService';
import { matchService } from '../services/matchService';
import { KnockoutBracket } from '../components/organizer/KnockoutBracket';

export const TournamentHub = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected Team & Squad state
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberError, setMemberError] = useState(null);

  // Ref for auto-scrolling to roster section
  const rosterRef = useRef(null);

  // Fallback demo data for demo IDs or when backend has no entries yet
  const demoTournaments = [
    {
      id: 'demo-t1',
      slug: 'champions-cup-2026',
      name: 'Champions Cup 2026',
      format: 'knockout',
      status: 'registration_open',
      location: 'Metropolis Arena, Pitch A',
      startDate: '2026-08-15',
      endDate: '2026-08-30',
      maxTeams: 16,
      registeredTeamsCount: 12,
      entryFee: 150,
      description: 'The premier knockout championship for elite clubs across the metro region. Winner takes home the championship trophy and regional recognition.'
    },
    {
      id: 'demo-t2',
      slug: 'footverse-super-league',
      name: 'FootVerse Super League',
      format: 'league',
      status: 'ongoing',
      location: 'National Sports Complex',
      startDate: '2026-09-01',
      endDate: '2026-11-20',
      maxTeams: 10,
      registeredTeamsCount: 8,
      entryFee: 200,
      description: 'Double round-robin league season with weekly televised fixtures, official referees, and MVP season awards.'
    },
    {
      id: 'demo-t3',
      slug: 'all-stars-invitational',
      name: 'All-Stars Invitational',
      format: 'group_stage',
      status: 'registration_open',
      location: 'Central Stadium',
      startDate: '2026-10-10',
      endDate: '2026-10-25',
      maxTeams: 8,
      registeredTeamsCount: 6,
      entryFee: 100,
      description: 'Group stage round-robin leading into high-stakes knockout semi-finals and championship final.'
    }
  ];

  const demoTeams = [
    { id: 'dt1', name: 'Strikers FC', shortName: 'STK', city: 'Metropolis', primaryColor: '#3B82F6', tournamentId: 'demo-t1' },
    { id: 'dt2', name: 'Titans SC', shortName: 'TTN', city: 'North District', primaryColor: '#6366F1', tournamentId: 'demo-t1' },
    { id: 'dt3', name: 'Galacticos FC', shortName: 'GLC', city: 'Skyline City', primaryColor: '#EC4899', tournamentId: 'demo-t1' },
    { id: 'dt4', name: 'Gunners FC', shortName: 'GUN', city: 'Metro East', primaryColor: '#EF4444', tournamentId: 'demo-t1' },
    { id: 'dt5', name: 'Apex Predators', shortName: 'APX', city: 'South Bay', primaryColor: '#10B981', tournamentId: 'demo-t2' },
    { id: 'dt6', name: 'Thunderbolts SC', shortName: 'THN', city: 'West Valley', primaryColor: '#F59E0B', tournamentId: 'demo-t2' }
  ];

  const scrollToRoster = useCallback(() => {
    // Small delay to let the roster DOM render before scrolling
    setTimeout(() => {
      rosterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const handleSelectTeam = async (team) => {
    if (selectedTeam?.id === team.id) {
      setSelectedTeam(null);
      setTeamMembers([]);
      return;
    }

    setSelectedTeam(team);
    setLoadingMembers(true);
    setMemberError(null);
    scrollToRoster();

    try {
      const res = await playerService.getByTeam(team.id);
      setTeamMembers(res?.teamMembers || []);
    } catch (err) {
      console.error('Error fetching team players:', err);
      setMemberError('Failed to load registered players for this team.');
    } finally {
      setLoadingMembers(false);
      scrollToRoster();
    }
  };

  const handleCloseSquad = () => {
    setSelectedTeam(null);
    setTeamMembers([]);
    setMemberError(null);
  };

  const getPositionBadgeStyle = (position) => {
    switch (position?.toLowerCase()) {
      case 'forward':
      case 'striker':
      case 'winger':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'midfielder':
      case 'playmaker':
      case 'central midfielder':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'defender':
      case 'centre-back':
      case 'fullback':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'goalkeeper':
      case 'keeper':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchTournamentDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        let foundTournament = null;
        let fetchedTeams = [];

        // 1. Try fetching all tournaments and find by ID or slug
        try {
          const tournamentsRes = await tournamentService.getAll();
          const allTournaments = tournamentsRes?.tournaments || [];
          foundTournament = allTournaments.find(
            t => t.id === tournamentId || t.slug === tournamentId
          );
        } catch (err) {
          console.warn('Could not fetch tournament via getAll, trying fallback/slug...', err);
        }

        // 2. If not found in list, attempt direct slug/ID endpoint
        if (!foundTournament) {
          try {
            const singleRes = await tournamentService.getBySlug(tournamentId);
            if (singleRes?.tournament) {
              foundTournament = singleRes.tournament;
            }
          } catch (err) {
            console.warn('Could not fetch tournament via getBySlug:', err);
          }
        }

        // 3. Fallback to demo items if matching demo ID or not in DB
        if (!foundTournament) {
          foundTournament = demoTournaments.find(
            t => t.id === tournamentId || t.slug === tournamentId
          );
        }

        // 4. Fetch teams and filter for this tournament
        try {
          const teamsRes = await teamService.getAll();
          const allTeams = teamsRes?.teams || [];
          fetchedTeams = allTeams.filter(
            t => t.tournamentId === tournamentId || 
                 t.tournament?.id === tournamentId || 
                 (foundTournament && (t.tournamentId === foundTournament.id || t.tournament?.id === foundTournament.id))
          );
        } catch (err) {
          console.warn('Could not fetch teams list:', err);
        }

        // If no backend teams found and demo tournament matched, provide demo teams
        if (fetchedTeams.length === 0 && foundTournament) {
          fetchedTeams = demoTeams.filter(
            t => t.tournamentId === foundTournament.id || t.tournamentId === tournamentId
          );
        }

        // 5. Fetch matches for this tournament
        let fetchedMatches = [];
        if (foundTournament) {
          try {
            const matchesRes = await matchService.getByTournament(foundTournament.id);
            fetchedMatches = matchesRes?.matches || [];
          } catch (err) {
            console.warn('Could not fetch tournament matches:', err);
          }
        }

        if (isMounted) {
          if (foundTournament) {
            setTournament(foundTournament);
            setTeams(fetchedTeams);
            setMatches(fetchedMatches);
          } else {
            setError('Tournament not found or has been removed.');
          }
        }
      } catch (err) {
        console.error('Error loading tournament hub:', err);
        if (isMounted) setError('Failed to load tournament information. Please try again.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTournamentDetails();

    return () => {
      isMounted = false;
    };
  }, [tournamentId]);

  const getFormatLabel = (format) => {
    switch (format?.toLowerCase()) {
      case 'knockout': return 'Knockout Cup';
      case 'league':
      case 'round_robin': return 'Round-Robin League';
      case 'group_stage':
      case 'group_knockout':
      case 'hybrid': return 'Group Stage + Knockout';
      default: return format ? format.replace('_', ' ').toUpperCase() : 'Tournament';
    }
  };

  const getFormatBadgeStyle = (format) => {
    switch (format?.toLowerCase()) {
      case 'knockout':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'league':
      case 'round_robin':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'group_stage':
      case 'group_knockout':
      case 'hybrid':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'registration_open':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Registration Open</span>
          </span>
        );
      case 'ongoing':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span>Ongoing Competition</span>
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400">
            Completed
          </span>
        );
      case 'draft':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-500/10 border border-slate-500/30 text-slate-600 dark:text-slate-400">
            Draft
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
            {status ? status.replace('_', ' ') : 'Active'}
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse pb-16">
        <div className="h-6 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="saas-card p-12 rounded-3xl text-center space-y-5 my-8 max-w-xl mx-auto border border-slate-200 dark:border-slate-800">
        <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/50 text-red-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white">Tournament Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error || 'The requested tournament could not be loaded.'}</p>
        <Link
          to="/tournaments"
          className="inline-flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tournaments</span>
        </Link>
      </div>
    );
  }

  const registeredCount = tournament.registeredTeamsCount ?? teams.length ?? 0;
  const maxTeams = tournament.maxTeams || 16;
  const progressPercent = Math.min(Math.round((registeredCount / maxTeams) * 100), 100);

  return (
    <div className="space-y-8 pb-16">
      
      {/* ─── BREADCRUMB & BACK NAVIGATION ─────────────────────────────────── */}
      <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
        <Link to="/" className="hover:text-blue-500 transition">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/tournaments" className="hover:text-blue-500 transition">Tournaments</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[200px]">{tournament.name}</span>
      </div>

      {/* ─── TOURNAMENT HERO BANNER ───────────────────────────────────────── */}
      <section className="saas-card rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-slate-900 via-[#0F172A] to-[#151E36] text-white border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getFormatBadgeStyle(tournament.format)}`}>
                {getFormatLabel(tournament.format)}
              </span>
              {getStatusBadge(tournament.status)}
            </div>

            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          </div>

          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center space-x-2 text-blue-400 text-xs font-bold tracking-wide uppercase">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>FootVerse Official Tournament</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black font-heading tracking-tight text-white leading-tight">
              {tournament.name}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
              {tournament.description || 'Welcome to the tournament hub. View participating team rosters, tournament structure, and fixture schedules.'}
            </p>
          </div>

          {/* Quick Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Location</span>
              </span>
              <p className="text-sm font-bold text-white truncate">{tournament.location || 'Metropolis Stadium'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dates</span>
              </span>
              <p className="text-sm font-bold text-white">
                {formatDate(tournament.startDate)}
                {tournament.endDate && ` - ${formatDate(tournament.endDate)}`}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>Teams</span>
              </span>
              <p className="text-sm font-bold text-white">
                {registeredCount} / {maxTeams} Slots
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                <span>Entry Fee</span>
              </span>
              <p className="text-sm font-bold text-white">
                {tournament.entryFee > 0 ? `$${tournament.entryFee}` : 'Free Entry'}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ─── TOURNAMENT CAPACITY & DETAILS SUMMARY ─────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="saas-card p-6 rounded-2xl border flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Team Capacity</span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{progressPercent}% Filled</span>
            </div>
            <h3 className="text-2xl font-extrabold font-heading text-slate-900 dark:text-white">
              {registeredCount} / {maxTeams}
            </h3>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {maxTeams - registeredCount > 0 
              ? `${maxTeams - registeredCount} slot(s) remaining for squad registration.`
              : 'Tournament registration is currently full.'}
          </p>
        </div>

        <div className="saas-card p-6 rounded-2xl border flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Competition Format</span>
            <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mt-1">
              {getFormatLabel(tournament.format)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
              {tournament.format === 'knockout' 
                ? 'Single elimination bracket tree with sudden death playoff matches.'
                : tournament.format === 'league'
                ? 'Comprehensive league table with points, goal difference, and weekly fixtures.'
                : 'Group phase round-robin with advancing playoff knockout bracket.'}
            </p>
          </div>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Structured Bracket System</span>
          </span>
        </div>

        <div className="saas-card p-6 rounded-2xl border flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Venue & Pitch</span>
            <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mt-1">
              {tournament.location || 'Metropolis Stadium'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
              Official verified turf with automated timer integration and on-site match event logging.
            </p>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>Official Match Venue</span>
          </span>
        </div>

      </section>

      {/* ─── KNOCKOUT BRACKET SECTION (READ-ONLY) ─────────────────────────── */}
      <KnockoutBracket
        matches={matches}
        tournaments={tournament ? [tournament] : []}
        selectedTournamentId={tournament?.id}
        readOnly={true}
        onMatchClick={(match) => navigate('/matches')}
      />

      {/* ─── PARTICIPATING TEAMS & PLAYERS SECTION ───────────────────────── */}
      <section className="saas-card p-6 sm:p-8 rounded-3xl space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white">
                Participating Teams & Squads ({teams.length})
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clubs competing in {tournament.name}. Click any team to inspect its registered player roster.
            </p>
          </div>

          {selectedTeam && (
            <button
              onClick={handleCloseSquad}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold transition self-start sm:self-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close Roster</span>
            </button>
          )}
        </div>

        {teams.length === 0 ? (
          <div className="text-center py-12 space-y-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <Shield className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Teams Registered Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Registration is currently open. Once team managers register their squads, they will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {teams.map((team, idx) => {
              const isSelected = selectedTeam?.id === team.id;
              const teamInitials = team.shortName || team.name?.substring(0, 3).toUpperCase() || 'FC';
              const teamColor = team.primaryColor || '#3B82F6';

              return (
                <div
                  key={team.id || idx}
                  onClick={() => handleSelectTeam(team)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-500/60 shadow-lg ring-2 ring-blue-500/30'
                      : 'bg-white dark:bg-[#111728] border-slate-200/80 dark:border-slate-800/80 hover:border-blue-400/60 dark:hover:border-blue-500/40 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-12 h-12 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: teamColor }}
                    >
                      {team.logoUrl ? (
                        <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <span>{teamInitials}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                        {team.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {team.city || 'Club Member'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                          {team.shortName || teamInitials}
                        </span>
                        {team.squadCount !== undefined && (
                          <span className="text-[10px] text-slate-400">
                            {team.squadCount} Players
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {isSelected ? 'Roster active below' : 'Click to view squad'}
                    </span>
                    <span className={`inline-flex items-center space-x-1 font-bold text-[11px] px-2 py-0.5 rounded-lg transition ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 group-hover:bg-blue-600 group-hover:text-white'
                    }`}>
                      {isSelected ? <Check className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      <span>{isSelected ? 'Viewing Squad' : 'View Squad'}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── SELECTED TEAM SQUAD ROSTER PANEL ──────────────────────────────── */}
        {selectedTeam && (
          <div ref={rosterRef} className="mt-8 p-6 sm:p-8 rounded-3xl bg-slate-50/80 dark:bg-[#0D121F] border border-blue-500/30 shadow-xl space-y-6 animate-in fade-in duration-300 scroll-mt-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center space-x-4">
                <div
                  className="w-14 h-14 rounded-2xl text-white font-black text-base flex items-center justify-center flex-shrink-0 shadow-lg"
                  style={{ backgroundColor: selectedTeam.primaryColor || '#3B82F6' }}
                >
                  {selectedTeam.logoUrl ? (
                    <img src={selectedTeam.logoUrl} alt={selectedTeam.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <span>{selectedTeam.shortName || selectedTeam.name?.substring(0, 3).toUpperCase()}</span>
                  )}
                </div>

                <div>
                  <div className="inline-flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-500/20 uppercase">
                      Official Team Roster
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white mt-0.5">
                    {selectedTeam.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedTeam.city ? `Club Location: ${selectedTeam.city}` : 'FootVerse Registered Club'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <span>{teamMembers.length} Registered Player(s)</span>
                </div>

                <button
                  onClick={handleCloseSquad}
                  className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                  title="Close Squad Roster"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Squad Members Content */}
            {loadingMembers ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse py-4">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="h-24 bg-slate-200 dark:bg-slate-800/60 rounded-2xl" />
                ))}
              </div>
            ) : memberError ? (
              <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">{memberError}</p>
                <button
                  onClick={() => handleSelectTeam(selectedTeam)}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition"
                >
                  Retry
                </button>
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-10 space-y-3 bg-white/60 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <Shirt className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Players Registered in this Squad</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  The team manager has not listed players for {selectedTeam.name} yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {teamMembers.map((member, idx) => {
                  const targetPlayerId = member.playerId || member.player?.id || member.id;
                  const playerName = member.player?.fullName || member.fullName || 'Squad Player';
                  const jersey = member.jerseyNumber ?? member.jersey ?? '-';
                  const position = member.position || member.player?.preferredPosition || 'Player';
                  const isCaptain = Boolean(member.isCaptain);
                  const avatarUrl = member.player?.avatarUrl || member.avatarUrl;

                  return (
                    <div
                      key={member.id || idx}
                      onClick={() => navigate(`/players?tab=player&id=${targetPlayerId}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/players?tab=player&id=${targetPlayerId}`);
                        }
                      }}
                      className="p-4 rounded-2xl bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between space-x-3.5 shadow-xs hover:border-blue-500/60 dark:hover:border-blue-400/60 hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer group/player focus:outline-none focus:ring-2 focus:ring-blue-500"
                      title={`View ${playerName}'s Public Profile & Stats`}
                    >
                      <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                        {/* Jersey Number Circle / Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 text-white font-black text-sm flex items-center justify-center border border-slate-700/80 shadow-inner group-hover/player:border-blue-500/50 transition-colors">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt={playerName} className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                              <span className="font-mono text-xs">#{jersey}</span>
                            )}
                          </div>
                          {isCaptain && (
                            <span
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-md border-2 border-white dark:border-[#131B2E]"
                              title="Team Captain"
                            >
                              C
                            </span>
                          )}
                        </div>

                        {/* Player Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-1.5">
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover/player:text-blue-600 dark:group-hover/player:text-blue-400 transition-colors">
                              {playerName}
                            </h5>
                          </div>

                          <div className="flex items-center space-x-1.5 mt-1">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getPositionBadgeStyle(position)}`}>
                              {position}
                            </span>
                            {jersey !== '-' && avatarUrl && (
                              <span className="text-[10px] font-bold text-slate-400 font-mono">
                                #{jersey}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* View Profile Action / Chevron */}
                      <div className="flex-shrink-0 pl-1">
                        <span className="w-7 h-7 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center text-slate-400 group-hover/player:text-blue-600 dark:group-hover/player:text-blue-400 group-hover/player:bg-blue-50 dark:group-hover/player:bg-blue-950/60 group-hover/player:border-blue-500/40 transition-all">
                          <ChevronRight className="w-3.5 h-3.5 group-hover/player:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </section>

    </div>
  );
};
