import { apiClient } from "../../../lib/axios";
import { USER_API_ENDPOINTS } from "../../../lib/constants";
import type {
  FollowResponse,
  FriendshipResponse,
} from "../types/social.types";

export type RelationshipSnapshot = {
  isFollowing: boolean;
  isFriend: boolean;
  hasIncomingRequestFromTarget: boolean;
  hasOutgoingRequestToTarget: boolean;
  isBlockedByMe: boolean;
};

export type SocialCounts = {
  followers: number;
  following: number;
  friends: number;
  posts: number;
};

export type SocialConnections = {
  followers: FollowResponse[];
  following: FollowResponse[];
  friends: FriendshipResponse[];
};

type RelationshipResponse = {
  following: boolean;
  friend: boolean;
  incomingRequestFromTarget: boolean;
  outgoingRequestToTarget: boolean;
  blockedByMe: boolean;
};

export const socialProfileService = {
  getConnections: (userId: number) =>
    apiClient.get<SocialConnections>(
      USER_API_ENDPOINTS.socialConnections(userId),
    ),

  async getCounts(userId: number): Promise<SocialCounts> {
    const [connections, posts] = await Promise.all([
      this.getConnections(userId),
      apiClient.get<unknown[]>(USER_API_ENDPOINTS.userPosts(userId)),
    ]);

    return {
      followers: connections.followers.length,
      following: connections.following.length,
      friends: connections.friends.length,
      posts: posts.length,
    };
  },

  async getRelationshipSnapshot(
    _myUserId: number,
    targetUserId: number,
  ): Promise<RelationshipSnapshot> {
    const response = await apiClient.get<RelationshipResponse>(
      USER_API_ENDPOINTS.relationship(targetUserId),
    );

    return {
      isFollowing: response.following,
      isFriend: response.friend,
      hasIncomingRequestFromTarget: response.incomingRequestFromTarget,
      hasOutgoingRequestToTarget: response.outgoingRequestToTarget,
      isBlockedByMe: response.blockedByMe,
    };
  },
};
