import api from './api';

export const matchService = {
  getAll: () => api.get('/matches'),
  getByTournament: (tournamentId) => api.get(`/matches/tournament/${tournamentId}`),
  getById: (id) => api.get(`/matches/${id}`),
  create: (data) => api.post('/matches', data),
  update: (id, data) => api.put(`/matches/${id}`, data),
  delete: (id) => api.delete(`/matches/${id}`),
  updateKnockoutResult: (tournamentId, matchId, data) => api.put(`/tournaments/${tournamentId}/knockout/matches/${matchId}/result`, data),
  
  // Match Events
  getEvents: (matchId) => api.get(`/match-events/match/${matchId}`),
  addEvent: (data) => api.post('/match-events', data),
  deleteEvent: (id) => api.delete(`/match-events/${id}`),
};
