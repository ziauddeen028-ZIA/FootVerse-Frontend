import api from './api';

export const teamJoinRequestService = {
  // Player creates a join request for a team
  createRequest: (teamId) => api.post('/team-join-requests', { teamId }),

  // Get current user's request status for a specific team
  getStatus: (teamId) => api.get(`/team-join-requests/status/${teamId}`),

  // Manager fetches join requests for their managed team(s)
  getManagerRequests: (teamId = '') =>
    api.get(`/team-join-requests/manager${teamId ? `?teamId=${teamId}` : ''}`),

  // Manager approves a join request
  approveRequest: (requestId) => api.post(`/team-join-requests/${requestId}/approve`),

  // Manager rejects a join request
  rejectRequest: (requestId) => api.post(`/team-join-requests/${requestId}/reject`),
};

export default teamJoinRequestService;
