export type PostVisibility = "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE";

export interface PostResponse {
  id: number;
  userId: number;
  content: string;
  imageUrl: string | null;
  visibility: PostVisibility;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
}

export interface FriendshipResponse {
  id: number;
  userId: number;
  friendUserId: number;
  createdAt: string;
}

export interface FollowResponse {
  id: number;
  followerUserId: number;
  followingUserId: number;
  createdAt: string;
}
