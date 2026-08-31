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
  generateLeagueFixtures: (tournamentId, data = {}) => api.post(`/tournaments/${tournamentId}/league/generate`, data),
  getStandings: (tournamentId) => api.get(`/tournaments/${tournamentId}/standings`),
};

