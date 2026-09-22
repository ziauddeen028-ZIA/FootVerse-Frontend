import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Sparkles, 
  Plus, 
  Hash, 
  Copy, 
  CheckCheck, 
  Key,
  Crown,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import { teamService } from '../services/teamService';
import { playerService } from '../services/playerService';
import { tournamentService } from '../services/tournamentService';
import { useAuth } from '../context/AuthContext';
import { Toast } from '../components/common/Toast';
import { TeamFormModal } from '../components/organizer/TeamFormModal';
import { JoinByCodeModal } from '../components/team/JoinByCodeModal';
import { TeamStatsView } from '../components/stats/TeamStatsView';

export const TeamDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [managedTeams, setManagedTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [tournaments, setTournaments] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isJoinCodeOpen, setIsJoinCodeOpen] = useState(false);
  const [teamCode, setTeamCode] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Load ALL teams the user is affiliated with (manager, captain, or plain member)
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [teamsRes, tournsRes, playerMembershipsRes] = await Promise.all([
          teamService.getAll(),
          tournamentService.getAll().catch(() => ({ tournaments: [] })),
          playerService.getByPlayer(user.id).catch(() => ({ teamMembers: [] }))
        ]);

        const allTeams = teamsRes?.teams || [];
        setTournaments(tournsRes?.tournaments || []);

        // 1. Teams where user is manager or captain (has management control)
        const managedOrCaptained = allTeams.filter(t =>
          t.managerId === user.id ||
          t.manager?.id === user.id ||
          t.members?.some(m => (m.playerId === user.id || m.player?.id === user.id) && m.isCaptain)
        );

        // 2. Teams user is a plain member of (joined via code or request)
        const membershipTeamIds = new Set(
          (playerMembershipsRes?.teamMembers || []).map(m => m.team?.id).filter(Boolean)
        );
        const memberOnly = allTeams.filter(t =>
          membershipTeamIds.has(t.id) &&
          !managedOrCaptained.some(mt => mt.id === t.id)
        );

        // Combine — managed/captained first, then plain memberships
        const allUserTeams = [...managedOrCaptained, ...memberOnly];

        setManagedTeams(allUserTeams);
        if (allUserTeams.length > 0) {
          setSelectedTeamId(prev => prev && allUserTeams.some(t => t.id === prev) ? prev : allUserTeams[0].id);
        }
      } catch (err) {
        console.error('Error fetching team data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Load team code when selected team changes (only available to manager/captain)
  useEffect(() => {
    if (!user || !selectedTeamId) {
      setTeamCode(null);
      return;
    }

    const fetchTeamCode = async () => {
      try {
        const codeRes = await teamService.getTeamCode(selectedTeamId);
        setTeamCode(codeRes?.teamCode || null);
      } catch {
        setTeamCode(null);
      }
    };

    fetchTeamCode();
  }, [selectedTeamId, user]);

  const handleCopyCode = async () => {
    if (!teamCode) return;
    try {
      await navigator.clipboard.writeText(teamCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = teamCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  // After joining a team by code — immediately refresh ALL affiliations and select the new team without reload
  const handleJoinCodeSuccess = async (teamName, joinedTeamId) => {
    setToast({ message: `You joined "${teamName}" successfully!`, type: 'success' });

    try {
      const [teamsRes, playerMembershipsRes] = await Promise.all([
        teamService.getAll(),
        playerService.getByPlayer(user.id).catch(() => ({ teamMembers: [] }))
      ]);

      const allTeams = teamsRes?.teams || [];

      const managedOrCaptained = allTeams.filter(t =>
        t.managerId === user.id ||
        t.manager?.id === user.id ||
        t.members?.some(m => (m.playerId === user.id || m.player?.id === user.id) && m.isCaptain)
      );

      const membershipTeamIds = new Set(
        (playerMembershipsRes?.teamMembers || []).map(m => m.team?.id).filter(Boolean)
      );
      const memberOnly = allTeams.filter(t =>
        membershipTeamIds.has(t.id) &&
        !managedOrCaptained.some(mt => mt.id === t.id)
      );

      const allUserTeams = [...managedOrCaptained, ...memberOnly];
      setManagedTeams(allUserTeams);

      // Auto-select the newly joined team
      if (joinedTeamId) {
        setSelectedTeamId(joinedTeamId);
      } else {
        const joined = allUserTeams.find(t => t.name === teamName);
        if (joined) setSelectedTeamId(joined.id);
      }
    } catch (err) {
      console.error('Error refreshing teams after join:', err);
    }
  };

  const handleCreateTeamSubmit = async (formData) => {
    try {
      const res = await teamService.create(formData);
      setToast({ message: 'Team created successfully!', type: 'success' });
      setIsFormOpen(false);

      // Refresh all team affiliations
      const [teamsRes, playerMembershipsRes] = await Promise.all([
        teamService.getAll(),
        playerService.getByPlayer(user.id).catch(() => ({ teamMembers: [] }))
      ]);
      const allTeams = teamsRes?.teams || [];
      const managedOrCaptained = allTeams.filter(t =>
        t.managerId === user.id || t.manager?.id === user.id
      );
      const membershipTeamIds = new Set(
        (playerMembershipsRes?.teamMembers || []).map(m => m.team?.id).filter(Boolean)
      );
      const memberOnly = allTeams.filter(t =>
        membershipTeamIds.has(t.id) && !managedOrCaptained.some(mt => mt.id === t.id)
      );
      const allUserTeams = [...managedOrCaptained, ...memberOnly];
      setManagedTeams(allUserTeams);

      if (res?.team?.id) {
        setSelectedTeamId(res.team.id);
      }
    } catch (err) {
      setToast({ message: err.message || 'Failed to create team.', type: 'error' });
    }
  };

  const getUserTeamRole = (team) => {
    if (team.managerId === user.id || team.manager?.id === user.id) return 'Manager';
    if (team.members?.some(m => (m.playerId === user.id || m.player?.id === user.id) && m.isCaptain)) return 'Captain';
    return 'Squad Member';
  };

  if (!user) {
    return (
      <div className="saas-card rounded-3xl p-12 text-center max-w-xl mx-auto my-12 bg-white dark:bg-[#101C14] border border-slate-200 dark:border-[#1E3A29] shadow-sm space-y-4">
        <Shield className="w-12 h-12 text-green-600 dark:text-green-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sign In Required</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Please sign in to access your Team Dashboard and review squad join requests.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-xs shadow-md transition"
        >
          Sign In
        </button>
      </div>
    );
  }

  const selectedTeam = managedTeams.find(t => t.id === selectedTeamId);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* 1. Header Hero */}
      <div className="saas-card rounded-3xl p-6 sm:p-8 bg-slate-900 dark:bg-[#101C14] text-white border border-slate-800 dark:border-[#1E3A29] shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>My Teams</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
              Team Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 dark:text-slate-400 mt-1">
              View your team profiles, roster, match stats, and tournament campaigns.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              id="open-join-by-code-btn"
              onClick={() => setIsJoinCodeOpen(true)}
              className="px-4 py-2.5 bg-[#16261C] hover:bg-[#1E3A29] text-green-300 font-bold rounded-2xl text-xs border border-green-700/40 shadow-sm transition flex items-center space-x-2"
            >
              <Key className="w-4 h-4 text-green-400" />
              <span>Join with Team Code</span>
            </button>

            <button
              onClick={() => setIsFormOpen(true)}
              className="px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl text-xs shadow-md shadow-green-600/20 transition flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Team</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Zero teams empty state — when user has no teams at all */}
      {managedTeams.length === 0 && !loading && (
        <div className="saas-card rounded-3xl p-10 sm:p-14 bg-green-50/50 dark:bg-[#101C14] border border-green-200 dark:border-[#1E3A29] text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-green-600/10 dark:bg-green-500/10 flex items-center justify-center mx-auto shadow-inner">
            <Shield className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              You are not in a team yet
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              You haven't joined or created a team. Enter a team code from your captain to join instantly, or create your own squad.
            </p>
          </div>
          <div className="flex items-center justify-center flex-wrap gap-3 pt-2">
            <button
              id="player-join-by-code-btn"
              onClick={() => setIsJoinCodeOpen(true)}
              className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-green-600/25 transition inline-flex items-center space-x-2"
            >
              <Key className="w-4 h-4" />
              <span>Join with Team Code</span>
            </button>
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-[#16261C] dark:hover:bg-[#1E3A29] text-white font-bold rounded-2xl text-xs sm:text-sm border border-slate-700 dark:border-[#1E3A29] shadow-md transition inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Team</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Selectable Team Cards/Tabs — when user belongs to 1 or more teams */}
      {managedTeams.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Your Teams ({managedTeams.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400">Select a team to view its full profile</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {managedTeams.map((team) => {
              const isSelected = team.id === selectedTeamId;
              const role = getUserTeamRole(team);

              return (
                <div
                  key={team.id}
                  onClick={() => setSelectedTeamId(team.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between space-y-3 group ${
                    isSelected
                      ? 'bg-green-50 dark:bg-[#16261C] border-green-600 dark:border-green-500 ring-2 ring-green-600/40 shadow-md'
                      : 'bg-white dark:bg-[#101C14] border-slate-200/80 dark:border-[#1E3A29] hover:border-green-500 dark:hover:border-green-500/60 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0 bg-green-600"
                      style={{ backgroundColor: team.primaryColor || '#16A34A' }}
                    >
                      {team.logoUrl ? (
                        <img src={team.logoUrl} alt={team.name} loading="lazy" className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <span>{team.shortName || team.name?.substring(0, 3)?.toUpperCase() || 'FC'}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                          {team.name}
                        </h4>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {team.city || 'Club'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#1E3A29] text-[11px]">
                    <span className={`px-2 py-0.5 rounded-md font-bold flex items-center space-x-1 ${
                      role === 'Manager'
                        ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300'
                        : role === 'Captain'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-100 dark:bg-[#16261C] text-slate-700 dark:text-slate-300'
                    }`}>
                      {role === 'Captain' && <Crown className="w-3 h-3" />}
                      {role === 'Manager' && <Shield className="w-3 h-3" />}
                      {role === 'Squad Member' && <UserCheck className="w-3 h-3" />}
                      <span>{role}</span>
                    </span>

                    {team.matchesPlayed !== undefined && (
                      <span className="text-slate-400 font-semibold">
                        {team.matchesPlayed} Matches
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Team Code Section — shown when manager/captain is viewing their team */}
      {teamCode && selectedTeam && (
        <div className="saas-card rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#101C14] border border-slate-200 dark:border-[#1E3A29] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-green-600/10 text-green-600 dark:text-green-400 flex items-center justify-center">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Team Code</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Share with players so they can join <span className="font-semibold text-slate-900 dark:text-white">{selectedTeam.name}</span> instantly
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#16261C] border border-slate-200 dark:border-[#1E3A29]">
                <span className="font-mono text-xl font-extrabold tracking-[0.3em] text-slate-900 dark:text-white">
                  {teamCode}
                </span>
              </div>
              <button
                id="copy-team-code-btn"
                onClick={handleCopyCode}
                title={codeCopied ? 'Copied!' : 'Copy code'}
                className={`p-2.5 rounded-2xl border font-bold text-xs transition flex items-center space-x-1.5 ${
                  codeCopied
                    ? 'bg-green-50 dark:bg-green-950/40 border-green-300 dark:border-green-700 text-green-600 dark:text-green-400'
                    : 'bg-slate-50 dark:bg-[#16261C] border-slate-200 dark:border-[#1E3A29] text-slate-600 dark:text-slate-300 hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-600 dark:hover:text-green-400 hover:border-green-300'
                }`}
              >
                {codeCopied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{codeCopied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Full Team Profile — reuses existing TeamStatsView (team info, roster, stats, tournaments, join requests) */}
      {selectedTeamId && (
        <div className="pt-2">
          <TeamStatsView
            key={selectedTeamId}
            initialTeamId={selectedTeamId}
            hideSelector={true}
          />
        </div>
      )}

      <TeamFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateTeamSubmit}
        tournaments={tournaments}
        existingTeams={managedTeams}
      />

      <JoinByCodeModal
        isOpen={isJoinCodeOpen}
        onClose={() => setIsJoinCodeOpen(false)}
        onSuccess={handleJoinCodeSuccess}
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
