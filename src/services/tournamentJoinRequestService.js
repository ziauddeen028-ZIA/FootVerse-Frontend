import api from './api';

export const tournamentJoinRequestService = {
  // Team Manager submits request for a team to join a tournament
  createRequest: (tournamentId, teamId) =>
    api.post('/tournament-join-requests', { tournamentId, teamId }),

  // Get request status for a specific tournament and team
  getStatus: (tournamentId, teamId) =>
    api.get(`/tournament-join-requests/status/${tournamentId}/${teamId}`),

  // Tournament Organizer fetches join requests for their hosted tournaments
  getOrganizerRequests: (tournamentId = '') =>
    api.get(`/tournament-join-requests/organizer${tournamentId ? `?tournamentId=${tournamentId}` : ''}`),

  // Organizer approves a join request (registers team)
  approveRequest: (requestId) =>
    api.post(`/tournament-join-requests/${requestId}/approve`),

  // Organizer rejects a join request
  rejectRequest: (requestId) =>
    api.post(`/tournament-join-requests/${requestId}/reject`),
};

export default tournamentJoinRequestService;
