import { apiClient } from "../../../lib/axios";
import { SOCIAL_API_ENDPOINTS } from "../../../lib/constants";
import type { PostResponse, FriendshipResponse, FollowResponse } from "../types/social.types";

export const socialService = {
  getFriendsByUserId: async (userId: number | string): Promise<FriendshipResponse[]> => {
    return await apiClient.get<FriendshipResponse[]>(
      SOCIAL_API_ENDPOINTS.users.friends(userId)
    );
  },

  getFollowersByUserId: async (userId: number | string): Promise<FollowResponse[]> => {
    return await apiClient.get<FollowResponse[]>(
      SOCIAL_API_ENDPOINTS.users.followers(userId)
    );
  },

  getFollowingByUserId: async (userId: number | string): Promise<FollowResponse[]> => {
    return await apiClient.get<FollowResponse[]>(
      SOCIAL_API_ENDPOINTS.users.following(userId)
    );
  },

  getPostsByUserId: async (userId: number | string): Promise<PostResponse[]> => {
    return await apiClient.get<PostResponse[]>(
      SOCIAL_API_ENDPOINTS.users.posts(userId)
    );
  },
};
