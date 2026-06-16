import { apiClient } from "../../../lib/axios";
import { USER_API_ENDPOINTS } from "../../../lib/constants";
import type { UserProfileResponse } from "../types/user";

export const userProfileService = {
  getProfileById: (userId: number | string) =>
    apiClient.get<UserProfileResponse>(USER_API_ENDPOINTS.profileById(userId)),
};

