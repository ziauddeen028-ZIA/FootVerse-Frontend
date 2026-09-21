import api from './api';

export const teamService = {
  getAll: () => api.get('/teams'),
  getById: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post('/teams', data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),
  // Returns { teamCode, teamName } — 403 if caller is not manager/captain/admin
  getTeamCode: (id) => api.get(`/teams/${id}/team-code`),
};
