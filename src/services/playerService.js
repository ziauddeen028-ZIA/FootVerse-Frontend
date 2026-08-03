import api from './api';

export const playerService = {
  getAll: () => api.get('/team-members'),
  getByTeam: (teamId) => api.get(`/team-members/team/${teamId}`),
  create: (data) => api.post('/team-members', data),
  update: (id, data) => api.put(`/team-members/${id}`, data),
  delete: (id) => api.delete(`/team-members/${id}`),
};
