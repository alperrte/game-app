import { apiClient, axiosClient } from "../../../lib/axios";
import { USER_API_ENDPOINTS } from "../../../lib/constants";
import type {
  UserProfileResponse,
  UserProfileRequest,
  PrivacySettingsResponse,
  PrivacySettingsRequest,
  ConnectedAccountResponse,
  ConnectedAccountRequest,
  ReviewClientResponse,
  AssignedBadgeResponse,
  BadgeCatalogItem,
  AssignBadgeRequest,
} from "../types/user";
import type { UserAuditLog } from "../types/audit";
import type { SocialPostResponse } from "../../social/types/social.types";

export const userService = {
  getProfile: (userId: string) =>
    apiClient.get<UserProfileResponse>(USER_API_ENDPOINTS.profile(userId)),

  getProfileByUsername: (username: string) =>
    apiClient.get<UserProfileResponse>(USER_API_ENDPOINTS.profileByUsername(username)),

  getMyProfile: () =>
    apiClient.get<UserProfileResponse>(USER_API_ENDPOINTS.me),

  getUserReviews: (userId: number | string) =>
    apiClient.get<ReviewClientResponse[]>(USER_API_ENDPOINTS.userReviews(userId)),

  getUserPosts: (userId: number | string) =>
    apiClient.get<SocialPostResponse[]>(USER_API_ENDPOINTS.userPosts(userId)),

  setupProfile: (request: UserProfileRequest) =>
    apiClient.post<UserProfileResponse>(USER_API_ENDPOINTS.setupProfile, request),

  updateProfile: (request: UserProfileRequest) =>
    apiClient.put<UserProfileResponse>(USER_API_ENDPOINTS.updateProfile, request),

  getPrivacySettings: () =>
    apiClient.get<PrivacySettingsResponse>(USER_API_ENDPOINTS.privacy),

  updatePrivacySettings: (request: PrivacySettingsRequest) =>
    apiClient.put<PrivacySettingsResponse>(USER_API_ENDPOINTS.privacy, request),

  getConnectedAccounts: () =>
    apiClient.get<ConnectedAccountResponse[]>(USER_API_ENDPOINTS.connectedAccounts),

  connectAccount: (request: ConnectedAccountRequest) =>
    apiClient.post<ConnectedAccountResponse>(USER_API_ENDPOINTS.connectedAccounts, request),

  disconnectAccount: (id: number) =>
    apiClient.delete(USER_API_ENDPOINTS.disconnectAccount(id)),

  getAuditLogs: () =>
    apiClient.get<UserAuditLog[]>(USER_API_ENDPOINTS.auditLogs),

  getProfilesBatch: (userIds: string[]) =>
    apiClient.post<UserProfileResponse[]>(USER_API_ENDPOINTS.batch, { userIds }),


  uploadFile: async (file: File, type: "avatar" | "cover" | "background") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    const { data } = await axiosClient.post<UserProfileResponse>(
      USER_API_ENDPOINTS.upload,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return data;
  },

  getAdminBadgeCatalog: () =>
    apiClient.get<BadgeCatalogItem[]>(USER_API_ENDPOINTS.adminBadgeCatalog),

  getAdminUserBadges: (userId: string) =>
    apiClient.get<AssignedBadgeResponse[]>(USER_API_ENDPOINTS.adminUserBadges(userId)),

  assignAdminBadge: (userId: string, request: AssignBadgeRequest) =>
    apiClient.put<AssignedBadgeResponse, AssignBadgeRequest>(
      USER_API_ENDPOINTS.adminUserBadges(userId),
      request,
    ),

  removeAdminBadge: (userId: string, badgeKey: string) =>
    apiClient.delete(USER_API_ENDPOINTS.adminUserBadge(userId, badgeKey)),
};
