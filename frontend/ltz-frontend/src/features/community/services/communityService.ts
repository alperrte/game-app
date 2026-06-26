import { apiClient } from "../../../lib/axios";
import { SOCIAL_API_ENDPOINTS } from "../../../lib/constants";
import type {
  Community,
  CommunityCreateRequest,
  CommunityMember,
  CommunityInvitation,
  CommunityUpdateRequest,
  CommunityEvent,
  CommunityEventCreateRequest,
  CommunityEventUpdateRequest,
} from "../types/community.types";

export const communityService = {
  getCommunities: (query = "", page = 0, size = 20) =>
    apiClient.get<Community[]>(SOCIAL_API_ENDPOINTS.communities, {
      query,
      page,
      size,
    }),

  getMyCommunities: () =>
    apiClient.get<Community[]>(SOCIAL_API_ENDPOINTS.myCommunities),

  createCommunity: (request: CommunityCreateRequest) =>
    apiClient.post<Community, CommunityCreateRequest>(
      SOCIAL_API_ENDPOINTS.communities,
      request,
    ),

  updateCommunity: (communityId: number, request: CommunityUpdateRequest) =>
    apiClient.put<Community, CommunityUpdateRequest>(
      SOCIAL_API_ENDPOINTS.communityById(communityId),
      request,
    ),

  getCommunityMembers: (communityId: number) =>
    apiClient.get<CommunityMember[]>(
      SOCIAL_API_ENDPOINTS.communityMembers(communityId),
    ),

  inviteMember: (communityId: number, userId: number) =>
    apiClient.post<CommunityInvitation, { userId: number }>(
      SOCIAL_API_ENDPOINTS.communityInvitations(communityId),
      { userId },
    ),

  getMyInvitations: () =>
    apiClient.get<CommunityInvitation[]>(
      SOCIAL_API_ENDPOINTS.myCommunityInvitations,
    ),

  acceptInvitation: (invitationId: number) =>
    apiClient.post<Community, Record<string, never>>(
      SOCIAL_API_ENDPOINTS.acceptCommunityInvitation(invitationId),
      {},
    ),

  rejectInvitation: (invitationId: number) =>
    apiClient.post<void, Record<string, never>>(
      SOCIAL_API_ENDPOINTS.rejectCommunityInvitation(invitationId),
      {},
    ),

  removeMember: (communityId: number, userId: number) =>
    apiClient.delete(
      SOCIAL_API_ENDPOINTS.communityMember(communityId, userId),
    ),

  transferOwnership: (communityId: number, userId: number) =>
    apiClient.put<Community, { userId: number }>(
      SOCIAL_API_ENDPOINTS.communityOwnership(communityId),
      { userId },
    ),

  deleteCommunity: (communityId: number) =>
    apiClient.delete(SOCIAL_API_ENDPOINTS.communityById(communityId)),

  joinCommunity: (communityId: number) =>
    apiClient.post<Community, Record<string, never>>(
      SOCIAL_API_ENDPOINTS.joinCommunity(communityId),
      {},
    ),

  leaveCommunity: (communityId: number) =>
    apiClient.delete(SOCIAL_API_ENDPOINTS.communityMembership(communityId)),

  getUpcomingEvents: (page = 0, size = 20) =>
    apiClient.get<CommunityEvent[]>(SOCIAL_API_ENDPOINTS.upcomingEvents, {
      page,
      size,
    }),

  getCommunityEvents: (communityId: number, page = 0, size = 20) =>
    apiClient.get<CommunityEvent[]>(
      SOCIAL_API_ENDPOINTS.communityEvents(communityId),
      { page, size },
    ),

  createEvent: (communityId: number, request: CommunityEventCreateRequest) =>
    apiClient.post<CommunityEvent, CommunityEventCreateRequest>(
      SOCIAL_API_ENDPOINTS.communityEvents(communityId),
      request,
    ),

  updateEvent: (eventId: number, request: CommunityEventUpdateRequest) =>
    apiClient.put<CommunityEvent, CommunityEventUpdateRequest>(
      SOCIAL_API_ENDPOINTS.eventById(eventId),
      request,
    ),

  cancelEvent: (eventId: number) =>
    apiClient.put<CommunityEvent, Record<string, never>>(
      SOCIAL_API_ENDPOINTS.cancelEvent(eventId),
      {},
    ),

  deleteEvent: (eventId: number) =>
    apiClient.delete(SOCIAL_API_ENDPOINTS.eventById(eventId)),

  joinEvent: (eventId: number) =>
    apiClient.post<CommunityEvent, Record<string, never>>(
      SOCIAL_API_ENDPOINTS.joinEvent(eventId),
      {},
    ),

  leaveEvent: (eventId: number) =>
    apiClient.delete(SOCIAL_API_ENDPOINTS.eventParticipation(eventId)),

  getCommunityById: (communityId: number) =>
    apiClient.get<Community>(SOCIAL_API_ENDPOINTS.communityById(communityId)),
};
