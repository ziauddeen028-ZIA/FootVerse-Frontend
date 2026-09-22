import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  UserCheck,
  UserPlus,
  Clock,
  XCircle,
  Check,
  X
} from 'lucide-react';
import statsService from '../../services/statsService';
import teamJoinRequestService from '../../services/teamJoinRequestService';
import { useAuth } from '../../context/AuthContext';
import { Toast } from '../common/Toast';

export const TeamStatsView = ({ initialTeamId = null, hideSelector = false, noTeamMessage = null }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState(initialTeamId);
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(hideSelector ? false : true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Join request state
  const [joinRequestStatus, setJoinRequestStatus] = useState('none');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [managerRequests, setManagerRequests] = useState([]);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Sync initialTeamId prop if updated externally
  useEffect(() => {
    if (initialTeamId) {
      setSelectedTeamId(initialTeamId);
    }
  }, [initialTeamId]);

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

  // Fetch join request status & manager join requests for selected team
  useEffect(() => {
    if (!selectedTeamId || !user) {
      setJoinRequestStatus('none');
      setManagerRequests([]);
      return;
    }

    const fetchRequestData = async () => {
      try {
        const statusRes = await teamJoinRequestService.getStatus(selectedTeamId);
        setJoinRequestStatus(statusRes.status || 'none');

        const managerRes = await teamJoinRequestService.getManagerRequests(selectedTeamId);
        setManagerRequests(managerRes.joinRequests || []);
      } catch (err) {
        console.warn('Failed to load join request status:', err);
      }
    };

    fetchRequestData();
  }, [selectedTeamId, user]);

  // Player action: Create Join Request
  const handleJoinTeam = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const res = await teamJoinRequestService.createRequest(selectedTeamId);
      setJoinRequestStatus('pending');
      setToast({ message: res.message || 'Join request submitted to team manager!', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Failed to submit join request.', type: 'error' });
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Manager action: Approve Request
  const handleApproveRequest = async (requestId) => {
    try {
      await teamJoinRequestService.approveRequest(requestId);
      setToast({ message: 'Team Request Approved', type: 'success' });

      const managerRes = await teamJoinRequestService.getManagerRequests(selectedTeamId);
      setManagerRequests(managerRes.joinRequests || []);

      if (selectedTeamId) {
        const res = await statsService.getTeamStats(selectedTeamId);
        setTeamData(res);
      }
    } catch (err) {
      setToast({ message: err.message || 'Failed to approve request.', type: 'error' });
    }
  };

  // Manager action: Reject Request
  const handleRejectRequest = async (requestId) => {
    try {
      await teamJoinRequestService.rejectRequest(requestId);
      setToast({ message: 'Team Request Rejected', type: 'warning' });

      const managerRes = await teamJoinRequestService.getManagerRequests(selectedTeamId);
      setManagerRequests(managerRes.joinRequests || []);
    } catch (err) {
      setToast({ message: err.message || 'Failed to reject request.', type: 'error' });
    }
  };

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.shortName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* ─── 1. TEAM SELECTOR & SEARCH (hidden in My Team mode) ──── */}
      {!hideSelector && (
        <div className="saas-card rounded-2xl p-4 sm:p-5 bg-white dark:bg-[#101C14] border border-slate-200/80 dark:border-[#1E3A29] shadow-sm space-y-3.5">
          {/* Top Row: Search Control & Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search team by club name, abbreviation, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-[#16261C] border border-slate-200 dark:border-[#1E3A29] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-600 text-slate-900 dark:text-white transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {user && (
              <Link
                to="/teams-manage"
                className="px-3.5 py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center justify-center space-x-1.5 shrink-0 self-start sm:self-auto"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Manage / Create Team</span>
              </Link>
            )}
          </div>

          {/* Horizontal Scrollable Team Selector */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 max-w-full">
            {filteredTeams.map((t) => {
              const isSelected = t.id === selectedTeamId;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTeamId(t.id);
                    navigate(`/teams/${t.id}`);
                  }}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                    isSelected
                      ? 'bg-green-600 text-white shadow-md shadow-green-600/30 ring-2 ring-green-500/50'
                      : 'bg-slate-100 dark:bg-[#16261C] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1E3A29] border border-transparent dark:border-[#1E3A29]'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 opacity-80 shrink-0" />
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
            {filteredTeams.length === 0 && (
              <span className="text-xs text-slate-400 py-1 italic">No teams matching "{searchQuery}"</span>
            )}
          </div>
        </div>
      )}

      {statsLoading ? (
        <div className="saas-card rounded-2xl p-12 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-[#101C14] border border-slate-200 dark:border-[#1E3A29]">
          <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium">Loading club statistics...</p>
        </div>
      ) : teamData?.team ? (
        <div className="space-y-8">
          {/* ─── 2. CLUB HERO HEADER ───────────────────────────────── */}
          <div className="saas-card rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-[#0C1B12] to-[#07130C] text-white border border-slate-800 dark:border-[#1E3A29] shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 relative z-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
                <div 
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-green-500/25 flex-shrink-0"
                  style={{ backgroundColor: teamData.team.primaryColor || '#16A34A' }}
                >
                  {teamData.team.shortName || teamData.team.name?.substring(0, 3)?.toUpperCase() || 'FC'}
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold">
                      {teamData.team.city || 'Club'}
                    </span>
                    {teamData.team.manager && (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
                        Manager: {teamData.team.manager}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
                    {teamData.team.name}
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Home Ground: {teamData.team.homeGround || 'FootVerse Arena'}
                  </p>
                </div>
              </div>

              {/* Header Action & Status Controls */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {/* Authorization Badge */}
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

                {/* Player Join Team / Request Status Button */}
                {!teamData.isAuthorizedMember && (
                  <div>
                    {joinRequestStatus === 'none' && (
                      <button
                        onClick={handleJoinTeam}
                        disabled={isSubmittingRequest}
                        className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-xs font-bold shadow-md shadow-green-600/30 transition disabled:opacity-50"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>{isSubmittingRequest ? 'Submitting...' : 'Join Team'}</span>
                      </button>
                    )}
                    {joinRequestStatus === 'pending' && (
                      <div className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
                        <Clock className="w-4 h-4" />
                        <span>Request Pending</span>
                      </div>
                    )}
                    {joinRequestStatus === 'approved' && (
                      <div className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Request Approved</span>
                      </div>
                    )}
                    {joinRequestStatus === 'rejected' && (
                      <button
                        onClick={handleJoinTeam}
                        disabled={isSubmittingRequest}
                        className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 text-xs font-bold transition disabled:opacity-50"
                        title="Your previous request was rejected. Click to apply again."
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Request Rejected (Re-apply)</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── MANAGER JOIN REQUESTS SECTION ──────────────────────── */}
          {managerRequests.length > 0 && (
            <div className="saas-card rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#101C14] border border-green-500/30 dark:border-[#1E3A29] shadow-lg space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E3A29] pb-4">
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Team Join Requests
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 font-bold">
                    {managerRequests.filter(r => r.status === 'pending').length} Pending
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {managerRequests.map((reqItem) => (
                  <div
                    key={reqItem.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-[#16261C] border border-slate-200/60 dark:border-[#1E3A29] flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-green-600/10 text-green-700 dark:text-green-400 font-bold text-sm flex items-center justify-center overflow-hidden border border-green-500/20 flex-shrink-0">
                        {reqItem.player?.avatarUrl ? (
                          <img src={reqItem.player.avatarUrl} alt={reqItem.player.fullName} loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <span>{reqItem.player?.fullName?.charAt(0)?.toUpperCase() || 'P'}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {reqItem.player?.fullName || 'Anonymous Player'}
                        </h5>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 text-[10px] font-bold">
                            {reqItem.player?.preferredPosition || 'Player'}
                          </span>
                          {reqItem.status === 'pending' ? (
                            <span className="text-[10px] text-amber-500 font-bold">Pending</span>
                          ) : (
                            <span className={`text-[10px] font-bold ${reqItem.status === 'approved' ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {reqItem.status.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {reqItem.status === 'pending' && (
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={() => handleApproveRequest(reqItem.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition flex items-center space-x-1"
                          title="Approve player and add to roster"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleRejectRequest(reqItem.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm transition flex items-center space-x-1"
                          title="Reject request"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── 3. OVERALL TEAM PERFORMANCE (PUBLIC) ──────────────── */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white tracking-tight">
                Overall Team Performance
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-md bg-green-500/10 text-green-700 dark:text-green-400 font-bold">
                Public Record
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Matches Played */}
              <div className="saas-card rounded-2xl p-5 bg-white dark:bg-[#101C14] border border-slate-200/80 dark:border-[#1E3A29] shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Matches Played
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {teamData.overallPerformance.matchesPlayed}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Competitive fixtures</p>
              </div>

              {/* Record (W / D / L) */}
              <div className="saas-card rounded-2xl p-5 bg-white dark:bg-[#101C14] border border-slate-200/80 dark:border-[#1E3A29] shadow-sm">
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
              <div className="saas-card rounded-2xl p-5 bg-white dark:bg-[#101C14] border border-slate-200/80 dark:border-[#1E3A29] shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Goals (GF / GA)
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-green-600 dark:text-green-400 mt-1">
                  {teamData.overallPerformance.goalsFor} : {teamData.overallPerformance.goalsAgainst}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  GD: {teamData.overallPerformance.goalsFor - teamData.overallPerformance.goalsAgainst > 0 ? '+' : ''}
                  {teamData.overallPerformance.goalsFor - teamData.overallPerformance.goalsAgainst}
                </p>
              </div>

              {/* Clean Sheets */}
              <div className="saas-card rounded-2xl p-5 bg-white dark:bg-[#101C14] border border-slate-200/80 dark:border-[#1E3A29] shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Clean Sheets
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {teamData.overallPerformance.cleanSheets}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Shutouts preserved</p>
              </div>

              {/* Tournaments */}
              <div className="saas-card rounded-2xl p-5 bg-white dark:bg-[#101C14] border border-slate-200/80 dark:border-[#1E3A29] shadow-sm col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Tournaments
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">
                  {teamData.overallPerformance.tournamentsCount}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Campaigns contested</p>
              </div>
            </div>
          </div>

          {/* ─── 4. TOURNAMENT & MATCH HISTORY (PUBLIC) ─────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tournament Campaigns */}
            <div className="saas-card rounded-2xl p-6 bg-white dark:bg-[#101C14] border border-slate-200/80 dark:border-[#1E3A29] shadow-sm space-y-4">
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-green-600 dark:text-green-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Tournament Campaigns ({teamData.tournamentHistory.length})
                </h3>
              </div>

              {teamData.tournamentHistory.length === 0 ? (
                <p className="text-xs text-slate-400">No campaigns recorded yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {teamData.tournamentHistory.map((t) => (
                    <Link
                      key={t.id}
                      to={`/tournaments/${t.id}`}
                      className="block p-3.5 rounded-xl bg-slate-50 dark:bg-[#16261C] border border-slate-200/60 dark:border-[#1E3A29] space-y-2 hover:border-green-500/50 hover:bg-green-50/30 dark:hover:bg-green-950/20 transition cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition truncate">
                          {t.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 font-bold uppercase">
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
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Match History */}
            <div className="lg:col-span-2 saas-card rounded-2xl p-6 bg-white dark:bg-[#101C14] border border-slate-200/80 dark:border-[#1E3A29] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
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
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#16261C] border border-slate-200/60 dark:border-[#1E3A29] hover:border-slate-300 transition text-xs"
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

          {/* ─── 5. SQUAD ROSTER (PUBLIC READ-ONLY) ─────────────────── */}
          <div className="saas-card rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#101C14] border border-slate-200 dark:border-[#1E3A29] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1E3A29] pb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="text-base sm:text-lg font-bold font-heading text-slate-900 dark:text-white tracking-tight">
                  Registered Squad Roster
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#16261C] text-slate-600 dark:text-slate-300 font-bold border border-slate-200/50 dark:border-[#1E3A29]/50">
                  {teamData.squad?.length || 0} Players
                </span>
              </div>

              {teamData.isAuthorizedMember ? (
                <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Authorized Member View</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Public Squad View</span>
                </span>
              )}
            </div>

            {/* Public Read-Only Squad Roster */}
            {!teamData.squad || teamData.squad.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-[#16261C] border border-slate-200/80 dark:border-[#1E3A29] space-y-2">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  No registered players yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamData.squad.map((player) => (
                  <Link
                    key={player.id}
                    to={`/players?id=${player.id}`}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-[#16261C] border border-slate-200/60 dark:border-[#1E3A29] flex items-center justify-between space-x-3.5 hover:border-green-500/60 dark:hover:border-green-400/60 hover:shadow-md transition-all group cursor-pointer"
                    title={`View ${player.fullName}'s profile`}
                  >
                    <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                      {/* Avatar / Photo or Initials */}
                      <div className="relative flex-shrink-0">
                        <div className="w-11 h-11 rounded-2xl bg-slate-200 dark:bg-[#101C14] text-slate-800 dark:text-white font-black text-xs flex items-center justify-center overflow-hidden border border-slate-300 dark:border-[#1E3A29]">
                          {player.avatarUrl ? (
                            <img src={player.avatarUrl} alt={player.fullName} loading="lazy" className="w-full h-full object-cover" />
                          ) : (
                            <span>{player.fullName.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        {player.isCaptain && (
                          <span
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-md border-2 border-white dark:border-[#101C14]"
                            title="Team Captain"
                          >
                            C
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                          {player.fullName}
                        </h5>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-950/80 text-green-700 dark:text-green-300 text-[10px] font-bold">
                            {player.position}
                          </span>
                          {player.jerseyNumber && (
                            <span className="text-[10px] font-bold text-slate-400 font-mono">
                              #{player.jerseyNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-green-500 transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}

            {/* Detailed performance matrix for Authorized Members only */}
            {teamData.isAuthorizedMember && teamData.detailedPerformance?.roster && (
              <div className="pt-6 border-t border-slate-100 dark:border-[#1E3A29] space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Detailed Authorized Performance Breakdown
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-[#1E3A29] text-slate-400 uppercase tracking-wider font-semibold">
                        <th className="py-3 px-3">Player</th>
                        <th className="py-3 px-3">Position</th>
                        <th className="py-3 px-3">Jersey</th>
                        <th className="py-3 px-3">Matches</th>
                        <th className="py-3 px-3">Goals</th>
                        <th className="py-3 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1E3A29]">
                      {teamData.detailedPerformance.roster.map((player) => (
                        <tr key={player.id} className="hover:bg-slate-50 dark:hover:bg-[#16261C] transition">
                          <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-full bg-green-600/10 text-green-700 dark:text-green-400 flex items-center justify-center font-bold text-xs">
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
                          <td className="py-3 px-3 font-black text-green-600 dark:text-green-400">
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
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="saas-card rounded-2xl p-12 text-center text-slate-400 bg-white dark:bg-[#101C14] border border-slate-200 dark:border-[#1E3A29]">
          <p>Please select a team to view their statistics.</p>
        </div>
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

export default TeamStatsView;
