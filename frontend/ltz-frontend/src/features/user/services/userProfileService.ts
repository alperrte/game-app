import { apiClient } from "../../../lib/axios";
import { USER_API_ENDPOINTS } from "../../../lib/constants";
import type { UserProfile } from "../types/userProfile.types";

export const userProfileService = {
  getProfileById: (userId: number | string) =>
    apiClient.get<UserProfile>(USER_API_ENDPOINTS.profileById(userId)),
};
