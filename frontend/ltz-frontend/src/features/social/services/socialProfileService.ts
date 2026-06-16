import { socialService } from "./socialService";

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

export const socialProfileService = {
  async getCounts(userId: number): Promise<SocialCounts> {
    const [followers, following, friends, posts] = await Promise.all([
      socialService.getFollowers(userId),
      socialService.getFollowing(userId),
      socialService.getFriends(userId),
      socialService.getPostsByUser(userId),
    ]);
    return {
      followers: followers.length,
      following: following.length,
      friends: friends.length,
      posts: posts.length,
    };
  },

  async getRelationshipSnapshot(
    myUserId: number,
    targetUserId: number,
  ): Promise<RelationshipSnapshot> {
    const [following, myFriends, incoming, outgoing, blocked] = await Promise.all([
      socialService.getFollowing(myUserId),
      socialService.getFriends(myUserId),
      socialService.getIncomingFriendRequests(myUserId),
      socialService.getOutgoingFriendRequests(myUserId),
      socialService.getBlockedUsers(myUserId),
    ]);

    return {
      isFollowing: following.some((item) => item.followingUserId === targetUserId),
      isFriend: myFriends.some((item) => item.friendUserId === targetUserId),
      hasIncomingRequestFromTarget: incoming.some(
        (item) => item.senderUserId === targetUserId,
      ),
      hasOutgoingRequestToTarget: outgoing.some(
        (item) => item.receiverUserId === targetUserId,
      ),
      isBlockedByMe: blocked.some((item) => item.blockedUserId === targetUserId),
    };
  },
};
