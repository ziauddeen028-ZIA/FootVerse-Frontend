import React, { useState, useEffect, useRef } from 'react';
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
  Clock,
  ChevronRight,
  AlertCircle,
  Award,
  X,
  UserPlus,
  CheckCircle2,
  XCircle,
  Key,
  Hash
} from 'lucide-react';
import { CustomSelect } from '../components/common/CustomSelect';
import { tournamentService } from '../services/tournamentService';
import { teamService } from '../services/teamService';
import { playerService } from '../services/playerService';
import { matchService } from '../services/matchService';
import { tournamentJoinRequestService } from '../services/tournamentJoinRequestService';
import { useAuth } from '../context/AuthContext';
import { KnockoutBracket } from '../components/organizer/KnockoutBracket';
import { LeagueStandings } from '../components/organizer/LeagueStandings';
import { GroupStageStandings } from '../components/organizer/GroupStageStandings';
import { Toast } from '../components/common/Toast';
import { cleanTournamentDescription } from '../utils/substitutionUtils';

export const TournamentHub = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Standings state (league / group_stage / hybrid)
  const [standings, setStandings] = useState([]);
  const [groups, setGroups] = useState([]);
  const [standingsLoading, setStandingsLoading] = useState(false);

  // Selected Team & Squad state
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberError, setMemberError] = useState(null);

  // Manager Tournament Join Request state
  const [managedTeams, setManagedTeams] = useState([]);
  const [selectedUserTeamId, setSelectedUserTeamId] = useState('');
  const [joinRequestStatus, setJoinRequestStatus] = useState('none');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Code-join state (Captain/Manager joining via invite code)
  const [codeInput, setCodeInput] = useState('');
  const [codeTeamId, setCodeTeamId] = useState('');
  const [isJoiningByCode, setIsJoiningByCode] = useState(false);

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
      location: 'Downtown Arena',
      startDate: '2026-10-05',
      endDate: '2026-10-25',
      maxTeams: 8,
      registeredTeamsCount: 6,
      entryFee: 100,
      description: 'Hybrid tournament featuring group stage qualifiers followed by an intense single-elimination knockout final.'
    }
  ];

  const demoTeams = [
    { id: 'dt1', name: 'Strikers FC', shortName: 'STK', city: 'Metropolis', primaryColor: '#16A34A', secondaryColor: '#FFFFFF', matchesPlayed: 8, wins: 7, draws: 1, losses: 0, goalsFor: 22, goalsAgainst: 6, isCaptain: true },
    { id: 'dt2', name: 'Titans FC', shortName: 'TTN', city: 'Metro East', primaryColor: '#059669', secondaryColor: '#FFFFFF', matchesPlayed: 8, wins: 6, draws: 1, losses: 1, goalsFor: 19, goalsAgainst: 8 },
    { id: 'dt3', name: 'Galacticos', shortName: 'GLX', city: 'Westside', primaryColor: '#0D9488', secondaryColor: '#FFFFFF', matchesPlayed: 8, wins: 5, draws: 2, losses: 1, goalsFor: 17, goalsAgainst: 10 },
    { id: 'dt4', name: 'Apex Predators', shortName: 'APX', city: 'Highland', primaryColor: '#10B981', secondaryColor: '#FFFFFF', matchesPlayed: 8, wins: 4, draws: 2, losses: 2, goalsFor: 14, goalsAgainst: 12 },
    { id: 'dt5', name: 'Thunder FC', shortName: 'THN', city: 'North Bay', primaryColor: '#D97706', secondaryColor: '#000000', matchesPlayed: 8, wins: 3, draws: 1, losses: 4, goalsFor: 11, goalsAgainst: 15 },
    { id: 'dt6', name: 'Vipers SC', shortName: 'VPR', city: 'Southside', primaryColor: '#DC2626', secondaryColor: '#FFFFFF', matchesPlayed: 8, wins: 2, draws: 2, losses: 4, goalsFor: 9, goalsAgainst: 14 }
  ];

  const handleSelectTeam = async (team) => {
    if (selectedTeam?.id === team.id) {
      setSelectedTeam(null);
      setTeamMembers([]);
      return;
    }

    setSelectedTeam(team);
    setLoadingMembers(true);
    setMemberError(null);

    try {
      const res = await playerService.getByTeam(team.id);
      setTeamMembers(res?.teamMembers || []);
    } catch (err) {
      console.error('Error fetching team players:', err);
      setMemberError('Failed to load registered players for this team.');
    } finally {
      setLoadingMembers(false);
    }

    setTimeout(() => {
      rosterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleDeselectTeam = () => {
    setSelectedTeam(null);
    setTeamMembers([]);
  };

  // 1. Load tournament details
  useEffect(() => {
    let isMounted = true;

    const fetchTournamentDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check demo fallback first
        const demo = demoTournaments.find(t => t.id === tournamentId || t.slug === tournamentId);
        if (demo) {
          if (isMounted) {
            setTournament(demo);
            setTeams(demoTeams);
          }
        } else {
          // Fetch from API by slug or ID
          const res = await tournamentService.getBySlug(tournamentId);
          const foundTournament = res?.tournament;

          if (foundTournament && isMounted) {
            setTournament(foundTournament);

            // Fetch teams and filter for this tournament
            try {
              const teamsRes = await teamService.getAll();
              const allTeams = teamsRes?.teams || [];
              const fetchedTeams = allTeams.filter(
                t => t.tournamentId === foundTournament.id || t.tournament?.id === foundTournament.id
              );
              if (isMounted) setTeams(fetchedTeams);
            } catch (err) {
              console.warn('Could not fetch teams list:', err);
            }

            // Fetch matches for this tournament
            try {
              const matchesRes = await matchService.getAll();
              const allMatches = matchesRes?.matches || [];
              const fetchedMatches = allMatches.filter(
                m => m.tournamentId === foundTournament.id || m.tournament?.id === foundTournament.id
              );
              if (isMounted) setMatches(fetchedMatches);
            } catch (err) {
              console.warn('Could not fetch matches list:', err);
            }

            // Fetch Standings depending on tournament format
            const fmt = foundTournament.format?.toLowerCase();
            const needsStandings = fmt === 'league' || fmt === 'round_robin' || fmt === 'group_stage' || fmt === 'group_knockout' || fmt === 'hybrid';
            if (needsStandings) {
              setStandingsLoading(true);
              try {
                const standingsRes = await tournamentService.getStandings(foundTournament.id);
                if (isMounted) {
                  if (standingsRes?.standings) setStandings(standingsRes.standings);
                  if (standingsRes?.groups) setGroups(standingsRes.groups);
                }
              } catch (err) {
                console.warn('Could not fetch standings:', err);
              } finally {
                if (isMounted) setStandingsLoading(false);
              }
            }
          } else {
            if (isMounted) setError('Tournament not found or has been removed.');
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

  // 2. Load manager's teams for tournament join request
  useEffect(() => {
    if (!user || !tournament?.id) return;

    const fetchManagedTeams = async () => {
      try {
        const teamsRes = await teamService.getAll();
        const allTeams = teamsRes?.teams || [];
        // User's managed teams
        const userManaged = allTeams.filter(t => t.managerId === user.id || t.manager?.id === user.id);
        const teamsToUse = userManaged.length > 0 ? userManaged : allTeams.filter(t => !t.tournamentId);

        setManagedTeams(teamsToUse);
        if (teamsToUse.length > 0) {
          setSelectedUserTeamId(teamsToUse[0].id);
        }
      } catch (err) {
        console.warn('Could not fetch managed teams:', err);
      }
    };

    fetchManagedTeams();
  }, [user, tournament?.id]);

  // 3. Fetch status when selectedUserTeamId & tournament.id change
  useEffect(() => {
    if (!user || !tournament?.id || !selectedUserTeamId) return;

    const fetchStatus = async () => {
      try {
        const res = await tournamentJoinRequestService.getStatus(tournament.id, selectedUserTeamId);
        setJoinRequestStatus(res.status || 'none');
        setIsRegistered(Boolean(res.isRegistered));
      } catch (err) {
        console.warn('Could not fetch tournament request status:', err);
      }
    };

    fetchStatus();
  }, [user, tournament?.id, selectedUserTeamId]);

  // Manager action: Request to Join Tournament (approval flow)
  const handleRequestToJoinTournament = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!selectedUserTeamId) {
      setToast({ message: 'Please select a team to request to join.', type: 'error' });
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const res = await tournamentJoinRequestService.createRequest(tournament.id, selectedUserTeamId);
      setJoinRequestStatus('pending');
      setToast({ message: res.message || 'Tournament join request submitted to organizer!', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Failed to submit tournament join request.', type: 'error' });
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Captain/Manager action: Join immediately using invite code
  const handleJoinByCode = async () => {
    if (!user) { navigate('/login'); return; }
    if (!codeInput.trim()) {
      setToast({ message: 'Please enter the tournament invite code.', type: 'error' });
      return;
    }
    if (!codeTeamId) {
      setToast({ message: 'Please select a team.', type: 'error' });
      return;
    }
    setIsJoiningByCode(true);
    try {
      const res = await tournamentJoinRequestService.joinByCode(codeInput.trim(), codeTeamId);
      setToast({ message: res.message || 'Team registered successfully!', type: 'success' });

      setJoinRequestStatus('code_join');
      setIsRegistered(true);
      setCodeInput('');

      // Refresh teams list
      try {
        const teamsRes = await teamService.getAll();
        const allTeams = teamsRes?.teams || [];
        const updatedTeams = allTeams.filter(
          t => t.tournamentId === tournament.id || t.tournament?.id === tournament.id
        );
        setTeams(updatedTeams);
      } catch (err) {
        console.warn('Could not refresh teams list after code join:', err);
      }
    } catch (err) {
      setToast({ message: err.message || 'Failed to join tournament.', type: 'error' });
    } finally {
      setIsJoiningByCode(false);
    }
  };

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
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'group_stage':
      case 'group_knockout':
      case 'hybrid':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'registration_open':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Registration Open</span>
          </span>
        );
      case 'ongoing':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Ongoing Competition</span>
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 dark:bg-[#16261C] border border-slate-300 dark:border-[#1E3A29] text-slate-700 dark:text-slate-300">
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
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400">
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
        <div className="h-6 w-36 bg-slate-200 dark:bg-[#16261C] rounded-lg" />
        <div className="h-64 bg-slate-200 dark:bg-[#16261C] rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-slate-200 dark:bg-[#16261C] rounded-2xl" />
          <div className="h-32 bg-slate-200 dark:bg-[#16261C] rounded-2xl" />
          <div className="h-32 bg-slate-200 dark:bg-[#16261C] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="saas-card p-12 rounded-3xl text-center space-y-5 my-8 max-w-xl mx-auto border border-slate-200 dark:border-[#1E3A29]">
        <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/50 text-red-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white">Tournament Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error || 'The requested tournament could not be loaded.'}</p>
        <Link
          to="/tournaments"
          className="inline-flex items-center space-x-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold text-xs rounded-xl shadow transition"
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
        <Link to="/" className="hover:text-green-600 dark:hover:text-green-400 transition">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/tournaments" className="hover:text-green-600 dark:hover:text-green-400 transition">Tournaments</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[200px]">{tournament.name}</span>
      </div>

      {/* ─── TOURNAMENT HERO BANNER ───────────────────────────────────────── */}
      <section className="saas-card rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-slate-900 via-[#0C1B12] to-[#07130C] text-white border border-slate-800 dark:border-[#1E3A29] shadow-2xl relative overflow-hidden">
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
            <div className="inline-flex items-center space-x-2 text-green-400 text-xs font-bold tracking-wide uppercase">
              <Trophy className="w-4 h-4 text-green-400" />
              <span>FootVerse Official Tournament</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black font-heading tracking-tight text-white leading-tight">
              {tournament.name}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
              {cleanTournamentDescription(tournament.description) || 'Welcome to the tournament hub. View participating team rosters, tournament structure, and fixture schedules.'}
            </p>
          </div>

          {/* Quick Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80 dark:border-[#1E3A29]">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-green-400" />
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
                <Users className="w-3.5 h-3.5 text-teal-400" />
                <span>Teams</span>
              </span>
              <p className="text-sm font-bold text-white">
                {registeredCount} / {maxTeams} Slots
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1">
                <span className="text-sm font-bold text-green-400">₹</span>
                <span>Entry Fee</span>
              </span>
              <p className="text-sm font-bold text-white">
                {tournament.entryFee > 0 ? `₹ ${tournament.entryFee}` : 'Free Entry'}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ─── MANAGER TOURNAMENT JOIN REQUEST CARD (approval flow) ─────────── */}
      {user && managedTeams.length > 0 && (
        <section className="saas-card p-6 rounded-2xl bg-white dark:bg-[#101C14] border border-green-500/30 dark:border-[#1E3A29] shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-[#1E3A29] pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-green-600/10 text-green-700 dark:text-green-400 flex items-center justify-center font-bold">
                <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Team Manager Tournament Registration
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Request to enter your managed team into this tournament.
                </p>
              </div>
            </div>

            {/* Team Selector */}
            <div className="w-full sm:w-60">
              <CustomSelect
                value={selectedUserTeamId}
                onChange={setSelectedUserTeamId}
                options={managedTeams.map(t => ({ value: t.id, label: t.name }))}
                icon={Shield}
                placeholder="Select team"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Selected Team:{' '}
              <strong className="text-slate-900 dark:text-white">
                {managedTeams.find(t => t.id === selectedUserTeamId)?.name || 'None'}
              </strong>
            </div>

            <div>
              {isRegistered ? (
                <div className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Team Registered</span>
                </div>
              ) : joinRequestStatus === 'pending' ? (
                <div className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
                  <Clock className="w-4 h-4" />
                  <span>Request Pending</span>
                </div>
              ) : joinRequestStatus === 'approved' ? (
                <div className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Request Approved &amp; Registered</span>
                </div>
              ) : joinRequestStatus === 'rejected' ? (
                <button
                  onClick={handleRequestToJoinTournament}
                  disabled={isSubmittingRequest}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/30 text-xs font-bold transition disabled:opacity-50"
                  title="Previous request was rejected. Click to re-apply."
                >
                  <XCircle className="w-4 h-4" />
                  <span>Request Rejected (Re-apply)</span>
                </button>
              ) : (
                <button
                  onClick={handleRequestToJoinTournament}
                  disabled={isSubmittingRequest}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-xs font-bold shadow-md shadow-green-600/30 transition disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isSubmittingRequest ? 'Submitting...' : 'Request to Join Tournament'}</span>
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─── JOIN WITH INVITE CODE CARD (Captain / Manager instant join) ──── */}
      {user && managedTeams.length > 0 && !isRegistered && (
        <section className="saas-card p-6 rounded-2xl bg-white dark:bg-[#101C14] border border-green-500/30 dark:border-[#1E3A29] shadow-md space-y-4">
          {/* Header */}
          <div className="flex items-center space-x-3 border-b border-slate-100 dark:border-[#1E3A29] pb-4">
            <div className="w-10 h-10 rounded-2xl bg-green-600/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Join with Tournament Code
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Have an invite code from the organizer? Enter it below to register instantly — no approval needed.
              </p>
            </div>
          </div>

          {/* Inputs row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Code input */}
            <div className="flex-1 flex items-center space-x-2 bg-slate-50 dark:bg-[#16261C] border border-slate-200 dark:border-[#1E3A29] rounded-xl px-3 py-2">
              <Hash className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
              <input
                id="tournament-code-input"
                type="text"
                maxLength={12}
                placeholder="Enter code (e.g. A1B2C3D4)"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                className="bg-transparent w-full text-slate-900 dark:text-white text-sm font-bold tracking-widest placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
              />
            </div>

            {/* Team selector */}
            <div className="w-full sm:w-56">
              <CustomSelect
                value={codeTeamId}
                onChange={setCodeTeamId}
                options={managedTeams.map(t => ({ value: t.id, label: t.name }))}
                icon={Shield}
                placeholder="Select team"
              />
            </div>

            {/* Join button */}
            <button
              id="join-by-code-btn"
              onClick={handleJoinByCode}
              disabled={isJoiningByCode || !codeInput.trim() || !codeTeamId}
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-green-600/30 transition shrink-0"
            >
              <Key className="w-4 h-4" />
              <span>{isJoiningByCode ? 'Joining...' : 'Join Now'}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Only team managers and captains can use this feature. Regular players must join via the team request flow.
          </p>
        </section>
      )}

      {/* ─── TOURNAMENT CAPACITY & DETAILS SUMMARY ─────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="saas-card p-6 rounded-2xl border flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Team Capacity</span>
              <span className="text-xs font-bold text-green-700 dark:text-green-400">{progressPercent}% Filled</span>
            </div>
            <h3 className="text-2xl font-extrabold font-heading text-slate-900 dark:text-white">
              {registeredCount} / {maxTeams}
            </h3>
            <div className="w-full bg-slate-100 dark:bg-[#16261C] rounded-full h-2 overflow-hidden">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Competition Format</span>
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
              {getFormatLabel(tournament.format)}
            </h3>
          </div>
        </div>

        <div className="saas-card p-6 rounded-2xl border flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Venue & Pitch</span>
              <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
              {tournament.location || 'Metropolis Stadium'}
            </h3>
          </div>
        </div>

      </section>

      {/* ─── COMPETITION VIEW — FORMAT-AWARE ──────────────────────────────── */}
      {(() => {
        const fmt = tournament.format?.toLowerCase();

        if (fmt === 'knockout') {
          return (
            <section className="space-y-4">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                  Knockout Fixture Bracket
                </h2>
              </div>
              <KnockoutBracket
                matches={matches}
                tournamentId={tournament.id}
                selectedTournamentId={tournament.id}
                tournaments={tournament ? [tournament] : []}
                readOnly={true}
              />
            </section>
          );
        }

        if (fmt === 'league' || fmt === 'round_robin') {
          return (
            <section className="space-y-4">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                  Official League Standings
                </h2>
              </div>
              {standingsLoading ? (
                <div className="saas-card p-8 text-center text-slate-400 rounded-2xl">Loading standings...</div>
              ) : (
                <LeagueStandings standings={standings} />
              )}
            </section>
          );
        }

        if (fmt === 'group_stage' || fmt === 'group_knockout' || fmt === 'hybrid') {
          return (
            <section className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                    Group Stage Tables
                  </h2>
                </div>
                {standingsLoading ? (
                  <div className="saas-card p-8 text-center text-slate-400 rounded-2xl">Loading group standings...</div>
                ) : (
                  <GroupStageStandings groups={groups} />
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                    Playoff Knockout Tree
                  </h2>
                </div>
                <KnockoutBracket
                  matches={matches}
                  tournamentId={tournament.id}
                  selectedTournamentId={tournament.id}
                  tournaments={tournament ? [tournament] : []}
                  readOnly={true}
                />
              </div>
            </section>
          );
        }

        // Fallback default format: Knockout Bracket
        return (
          <section className="space-y-4">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                Tournament Fixtures & Bracket Tree
              </h2>
            </div>
            <KnockoutBracket
              matches={matches}
              tournamentId={tournament.id}
              selectedTournamentId={tournament.id}
              tournaments={tournament ? [tournament] : []}
              readOnly={true}
            />
          </section>
        );
      })()}

      {/* ─── PARTICIPATING TEAMS ROSTER GRID ──────────────────────────────── */}
      <section className="saas-card p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E3A29] pb-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
              Participating Squads ({teams.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400">Click any club card to inspect player roster</span>
        </div>

        {teams.length === 0 ? (
          <div className="p-8 text-center text-slate-400 rounded-2xl bg-slate-50 dark:bg-[#16261C]">
            No teams registered yet for this tournament.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => {
              const isSelected = selectedTeam?.id === team.id;
              return (
                <div
                  key={team.id}
                  onClick={() => handleSelectTeam(team)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${isSelected
                      ? 'bg-green-50 dark:bg-green-950/40 border-green-600 ring-2 ring-green-600/40 shadow-md'
                      : 'bg-white dark:bg-[#101C14] border-slate-200/80 dark:border-[#1E3A29] hover:border-green-500'
                    }`}
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0"
                      style={{ backgroundColor: team.primaryColor || '#16A34A' }}
                    >
                      {team.logoUrl ? (
                        <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <span>{team.shortName || team.name?.substring(0, 3)?.toUpperCase()}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{team.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {team.city || 'Registered Club'}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90 text-green-600 dark:text-green-400' : 'text-slate-400'}`} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── SELECTED TEAM ROSTER SECTION ─────────────────────────────────── */}
      {selectedTeam && (
        <section ref={rosterRef} className="saas-card p-6 sm:p-8 rounded-3xl space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E3A29] pb-4">
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-xs shadow-md"
                style={{ backgroundColor: selectedTeam.primaryColor || '#16A34A' }}
              >
                {selectedTeam.shortName || selectedTeam.name?.substring(0, 3)?.toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedTeam.name} Roster</h3>
                <p className="text-xs text-slate-400">Registered squad members for this tournament</p>
              </div>
            </div>

            <button
              onClick={handleDeselectTeam}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#16261C] transition"
              title="Close Roster"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {loadingMembers ? (
            <div className="p-8 text-center text-slate-400">Loading squad roster...</div>
          ) : memberError ? (
            <div className="p-4 text-xs text-red-500 bg-red-50 dark:bg-red-950/40 rounded-xl">{memberError}</div>
          ) : teamMembers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 rounded-2xl bg-slate-50 dark:bg-[#16261C]">
              No players registered for this team yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-[#16261C] border border-slate-200/60 dark:border-[#1E3A29] flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-[#101C14] text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center">
                      {member.player?.fullName?.charAt(0)?.toUpperCase() || 'P'}
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {member.player?.fullName || 'Player'}
                      </h5>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-[10px] text-green-600 dark:text-green-400 font-bold">
                          {member.position || 'Midfielder'}
                        </span>
                        {member.jerseyNumber && (
                          <span className="text-[10px] font-mono text-slate-400">
                            #{member.jerseyNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/players?id=${member.player?.id || ''}`}
                    className="text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition"
                    title="View Player Profile"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Toast Notification Component */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

    </div>
  );
};

export default TournamentHub;
