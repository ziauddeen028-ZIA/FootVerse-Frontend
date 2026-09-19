import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  UserPlus, 
  Check, 
  X, 
  Sparkles, 
  Calendar, 
  ChevronRight,
  Clock,
  AlertCircle,
  Plus
} from 'lucide-react';
import teamJoinRequestService from '../services/teamJoinRequestService';
import { teamService } from '../services/teamService';
import { playerService } from '../services/playerService';
import { tournamentService } from '../services/tournamentService';
import { useAuth } from '../context/AuthContext';
import { Toast } from '../components/common/Toast';
import { TeamFormModal } from '../components/organizer/TeamFormModal';

export const TeamDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [managedTeams, setManagedTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [joinRequests, setJoinRequests] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Load manager's teams & tournaments
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [res, tournsRes] = await Promise.all([
          teamService.getAll(),
          tournamentService.getAll().catch(() => ({ tournaments: [] }))
        ]);
        const allTeams = res?.teams || [];
        setTournaments(tournsRes?.tournaments || []);
        
        // Filter teams managed or captained by current user
        const userTeams = allTeams.filter(t => 
          t.managerId === user.id || 
          t.manager?.id === user.id ||
          t.members?.some(m => (m.playerId === user.id || m.player?.id === user.id) && m.isCaptain)
        );
        
        setManagedTeams(userTeams);
        if (userTeams.length > 0) {
          setSelectedTeamId(userTeams[0].id);
        }
      } catch (err) {
        console.error('Error fetching manager teams:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Load join requests and squad members when selected team changes
  useEffect(() => {
    if (!user) return;

    const fetchTeamDetails = async () => {
      try {
        setRequestsLoading(true);
        const [reqRes, membersRes] = await Promise.all([
          teamJoinRequestService.getManagerRequests(selectedTeamId),
          selectedTeamId ? playerService.getByTeam(selectedTeamId) : Promise.resolve({ teamMembers: [] })
        ]);

        setJoinRequests(reqRes.joinRequests || []);
        setTeamMembers(membersRes.teamMembers || []);
      } catch (err) {
        console.error('Error fetching team dashboard details:', err);
      } finally {
        setRequestsLoading(false);
      }
    };

    fetchTeamDetails();
  }, [selectedTeamId, user]);

  const handleApprove = async (requestId) => {
    try {
      await teamJoinRequestService.approveRequest(requestId);
      setToast({ message: 'Team Request Approved', type: 'success' });

      // Refresh requests & squad
      const [reqRes, membersRes] = await Promise.all([
        teamJoinRequestService.getManagerRequests(selectedTeamId),
        playerService.getByTeam(selectedTeamId)
      ]);
      setJoinRequests(reqRes.joinRequests || []);
      setTeamMembers(membersRes.teamMembers || []);
    } catch (err) {
      setToast({ message: err.message || 'Failed to approve request.', type: 'error' });
    }
  };

  const handleReject = async (requestId) => {
    try {
      await teamJoinRequestService.rejectRequest(requestId);
      setToast({ message: 'Team Request Rejected', type: 'warning' });

      // Refresh requests
      const reqRes = await teamJoinRequestService.getManagerRequests(selectedTeamId);
      setJoinRequests(reqRes.joinRequests || []);
    } catch (err) {
      setToast({ message: err.message || 'Failed to reject request.', type: 'error' });
    }
  };

  const handleCreateTeamSubmit = async (formData) => {
    try {
      const res = await teamService.create(formData);
      setToast({ message: 'Team created successfully!', type: 'success' });
      setIsFormOpen(false);

      // Refresh manager teams
      const allRes = await teamService.getAll();
      const allTeams = allRes?.teams || [];
      const userTeams = allTeams.filter(t => t.managerId === user.id || t.manager?.id === user.id);
      const teamsToUse = userTeams.length > 0 ? userTeams : allTeams;
      setManagedTeams(teamsToUse);

      if (res?.team?.id) {
        setSelectedTeamId(res.team.id);
      }
    } catch (err) {
      setToast({ message: err.message || 'Failed to create team.', type: 'error' });
    }
  };

  if (!user) {
    return (
      <div className="saas-card rounded-3xl p-12 text-center max-w-xl mx-auto my-12 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <Shield className="w-12 h-12 text-blue-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sign In Required</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Please sign in to access your Team Dashboard and review squad join requests.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition"
        >
          Sign In
        </button>
      </div>
    );
  }

  const selectedTeam = managedTeams.find(t => t.id === selectedTeamId);
  const pendingRequests = joinRequests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* 1. Header Hero */}
      <div className="saas-card rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-[#10172A] to-[#151D33] text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Manager Control Hub</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
              Team Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Review player join requests, oversee squad roster, and manage team details.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {managedTeams.length > 0 && (
              <div className="flex items-center space-x-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700">
                <Shield className="w-4 h-4 text-blue-400 ml-2" />
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="bg-transparent text-white text-xs font-bold py-1.5 pr-3 focus:outline-none cursor-pointer"
                >
                  {managedTeams.map(t => (
                    <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => setIsFormOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs shadow-md transition flex items-center space-x-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Team</span>
            </button>
          </div>
        </div>
      </div>

      {/* Zero teams banner */}
      {managedTeams.length === 0 && !loading && (
        <div className="saas-card rounded-3xl p-8 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 text-center space-y-4">
          <Shield className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Form Your Team as Captain or Manager</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
            You don't manage or captain any team yet. Click below to create your standalone squad and start building your roster!
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your Team Now</span>
          </button>
        </div>
      )}
      <div className="saas-card rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Join Requests
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Players requesting to join {selectedTeam?.name || 'your team'}
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold self-start sm:self-auto">
            {pendingRequests.length} Pending
          </span>
        </div>

        {requestsLoading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading requests...</p>
          </div>
        ) : joinRequests.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              No join requests yet
            </p>
            <p className="text-xs text-slate-400">
              When players request to join your team, they will appear here for your review.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {joinRequests.map((reqItem) => {
              const isPending = reqItem.status === 'pending';
              const isApproved = reqItem.status === 'approved';

              return (
                <div
                  key={reqItem.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center justify-center overflow-hidden border border-blue-500/20 flex-shrink-0">
                      {reqItem.player?.avatarUrl ? (
                        <img src={reqItem.player.avatarUrl} alt={reqItem.player.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{reqItem.player?.fullName?.charAt(0)?.toUpperCase() || 'P'}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {reqItem.player?.fullName || 'Athlete'}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                          {reqItem.player?.preferredPosition || 'Player'}
                        </span>
                        {reqItem.player?.email && (
                          <span className="text-[10px] text-slate-400 truncate">
                            {reqItem.player.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => handleApprove(reqItem.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleReject(reqItem.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm transition flex items-center space-x-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        isApproved
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                      }`}>
                        {reqItem.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Registered Squad Roster Section */}
      <div className="saas-card rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Current Squad Roster
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official roster for {selectedTeam?.name || 'this team'}
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
            {teamMembers.length} Members
          </span>
        </div>

        {teamMembers.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No squad members registered yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center">
                    {member.player?.fullName?.charAt(0)?.toUpperCase() || 'P'}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      {member.player?.fullName || 'Player'}
                    </h5>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
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
                  className="text-slate-400 hover:text-blue-500 transition"
                  title="View Player Profile"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <TeamFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateTeamSubmit}
        tournaments={tournaments}
        existingTeams={managedTeams}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
};

export default TeamDashboard;
