import api from './api';

export const playerService = {
  // Using team-members API to get players for now based on existing backend
  getTeamMembers: (teamId) => api.get(`/team-members/team/${teamId}`),
  addTeamMember: (data) => api.post('/team-members', data),
  updateTeamMember: (id, data) => api.put(`/team-members/${id}`, data),
  removeTeamMember: (id) => api.delete(`/team-members/${id}`),
};
