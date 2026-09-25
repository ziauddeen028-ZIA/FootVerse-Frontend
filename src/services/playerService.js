import api from './api';

export const playerService = {
  getAll: (params) => api.get(params ? `/team-members?${new URLSearchParams(params).toString()}` : '/team-members'),
  getByTeam: (teamId) => api.get(`/team-members/team/${teamId}`),
  getByPlayer: (playerId) => api.get(`/team-members/player/${playerId}`),
  create: (data) => api.post('/team-members', data),
  update: (id, data) => api.put(`/team-members/${id}`, data),
  delete: (id) => api.delete(`/team-members/${id}`),
};
