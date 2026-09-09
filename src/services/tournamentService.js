import api from './api';

export const tournamentService = {
  getAll: () => api.get('/tournaments'),
  getBySlug: (slug) => api.get(`/tournaments/${slug}`),
  create: (data) => api.post('/tournaments', data),
  update: (id, data) => api.put(`/tournaments/${id}`, data),
  delete: (id) => api.delete(`/tournaments/${id}`),
  
  // Bracket, League & Standings endpoints
  generateKnockoutBracket: (tournamentId, data = {}) => api.post(`/tournaments/${tournamentId}/knockout/generate`, data),
  generateHybridBracket: (tournamentId, data = {}) => api.post(`/tournaments/${tournamentId}/hybrid/generate`, data),
  // Group Stage → Knockout: works for group_stage and group_knockout formats via the hybrid/generate endpoint
  generateGroupKnockout: (tournamentId, qualifyingTeamsPerGroup = 2) =>
    api.post(`/tournaments/${tournamentId}/hybrid/generate`, { qualifyingTeamsPerGroup }),
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


