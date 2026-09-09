import api from './api';

export const statsService = {
  // Player Stats — authenticated (own stats, includes email)
  getPlayersList: (search = '') => 
    api.get(`/stats/players${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  
  getPlayerStats: (playerId) => 
    api.get(`/stats/player/${playerId}`),

  // Public Player Stats — no email, no private team roster (for Search Players feature)
  getPublicPlayerStats: (playerId) =>
    api.get(`/stats/player/${playerId}/public`),

  // Team Stats
  getTeamsList: (search = '') => 
    api.get(`/stats/teams${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  
  getTeamStats: (teamId) => 
    api.get(`/stats/team/${teamId}`),

  getTeamPrivateDetails: (teamId) => 
    api.get(`/stats/team/${teamId}/private`)
};

export default statsService;
