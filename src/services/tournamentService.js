import api from './api';

export const tournamentService = {
  getAll: (params) => api.get(params ? `/tournaments?${new URLSearchParams(params).toString()}` : '/tournaments'),
  getOrganizerDashboard: () => api.get('/tournaments/organizer/dashboard'),
  getBySlug: (slug) => api.get(`/tournaments/${slug}`),
  create: (data) => api.post('/tournaments', data),
  update: (id, data) => api.put(`/tournaments/${id}`, data),
  delete: (id) => api.delete(`/tournaments/${id}`),
  
  // Bracket, League & Standings endpoints
  generateKnockout: (tournamentId, data = {}) => api.post(`/tournaments/${tournamentId}/knockout/generate`, data),
  generateKnockoutBracket: (tournamentId, data = {}) => api.post(`/tournaments/${tournamentId}/knockout/generate`, data),
  generateHybridBracket: (tournamentId, data = {}) => api.post(`/tournaments/${tournamentId}/hybrid/generate`, data),
  generateGroupKnockout: (tournamentId, data = {}) => {
    const payload = typeof data === 'object' ? data : { qualifyingTeamsPerGroup: data };
    return api.post(`/tournaments/${tournamentId}/hybrid/generate`, payload);
  },
  // Group Stage Fixture Generation
  generateGroupFixtures: (tournamentId, data = {}) => api.post(`/tournaments/${tournamentId}/group-stage/generate`, data),
  generateGroupStageFixtures: (tournamentId, data = {}) => api.post(`/tournaments/${tournamentId}/group-stage/generate`, data),
  // League Fixture Generation
  generateLeague: (tournamentId, data = {}) => api.post(`/tournaments/${tournamentId}/league/generate`, data),
  generateLeagueFixtures: (tournamentId, data = {}) => api.post(`/tournaments/${tournamentId}/league/generate`, data),
  getStandings: (tournamentId) => api.get(`/tournaments/${tournamentId}/standings`),

  // Phase 9 Statistics Endpoints
  getTopScorer: (tournamentId) => api.get(`/stats/tournament/${tournamentId}/top-scorer`),
  getBestKeeper: (tournamentId) => api.get(`/stats/tournament/${tournamentId}/best-keeper`),
  getBestPlayer: (tournamentId) => api.get(`/stats/tournament/${tournamentId}/best-player`),
  setBestPlayer: (tournamentId, playerId) => api.put(`/stats/tournament/${tournamentId}/best-player`, { playerId }),
  getStatsOverview: (tournamentId) => api.get(`/stats/tournament/${tournamentId}/overview`),
  getTournamentPlayers: (tournamentId) => api.get(`/stats/tournament/${tournamentId}/players`),
};


