import api from './api';

export const matchService = {
  getAll: (params) => api.get(params ? `/matches?${new URLSearchParams(params).toString()}` : '/matches'),
  getByTournament: (tournamentId) => api.get(`/matches/tournament/${tournamentId}`),
  getById: (id) => api.get(`/matches/${id}`),
  getByCode: (code) => api.get(`/matches/code/${encodeURIComponent(code)}`),
  create: (data) => api.post('/matches', data),
  createQuickMatch: (data) => api.post('/matches/quick', data),
  joinByCode: (data) => api.post('/matches/join-by-code', data),
  update: (id, data) => api.put(`/matches/${id}`, data),
  delete: (id) => api.delete(`/matches/${id}`),
  updateKnockoutResult: (tournamentId, matchId, data) => api.put(`/tournaments/${tournamentId}/knockout/matches/${matchId}/result`, data),
  
  // Match Events
  getEvents: (matchId) => api.get(`/match-events/match/${matchId}`),
  addEvent: (data) => api.post('/match-events', data),
  deleteEvent: (id) => api.delete(`/match-events/${id}`),
};
