import type { LucideIcon } from "lucide-react";

export type SocialFeedTab =
  | "all"
  | "following"
  | "popular"
  | "news"
  | "market";

export interface SocialUser {
  name: string;
  username: string;
  avatarUrl: string;
  level?: number;
  verified?: boolean;
  status?: "online" | "playing" | "offline";
}

export interface SocialPostMedia {
  url: string;
  alt: string;
  type?: "image" | "video";
}

export interface SocialPost {
  id: number | string;
  author: SocialUser;
  authorUserId?: number;
  createdAt: string;
  visibility: "public" | "followers";
  content: string;
  media: SocialPostMedia[];
  reactions: {
    likes: number;
    comments: number;
    shares: number;
  };
  likedByMe?: boolean;
  followedByMe?: boolean;
  source?: "backend" | "lookingForPlayer";
  comments?: SocialComment[];
}

export type PostVisibility = "PUBLIC" | "FRIENDS" | "PRIVATE";
export type FriendRequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED";
export type ChatRoomType = "DIRECT" | "GROUP";
export type LookingForPlayerStatus = "OPEN" | "CLOSED" | "CANCELLED";

export interface SocialPostResponse {
  id: number;
  userId: number;
  content: string;
  imageUrl: string | null;
  mediaType?: "IMAGE" | "VIDEO" | null;
  media?: Array<{
    url: string;
    mediaType: "IMAGE" | "VIDEO";
    contentType: string;
    size: number;
  }>;
  visibility: PostVisibility;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
  likedByCurrentUser?: boolean;
}

export interface SocialPostCreateRequest {
  content: string;
  imageUrl?: string;
  mediaUrls?: string[];
  visibility?: PostVisibility;
}

export interface SocialMediaUploadResponse {
  imageUrl: string;
  fileName: string;
  contentType: string;
  mediaType: "IMAGE" | "VIDEO";
  size: number;
}

export interface SocialPostLikeResponse {
  id: number;
  postId: number;
  userId: number;
  createdAt: string;
}

export interface SocialComment {
  id: number;
  postId: number;
  userId: number;
  author?: SocialUser;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SocialCommentCreateRequest {
  content: string;
}

export interface FriendRequestCreateRequest {
  receiverUserId: number;
}

export interface FriendRequestResponse {
  id: number;
  senderUserId: number;
  receiverUserId: number;
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FriendshipResponse {
  id: number;
  userId: number;
  friendUserId: number;
  createdAt: string;
}

export interface FollowCreateRequest {
  followingUserId: number;
}

export interface FollowResponse {
  id: number;
  followerUserId: number;
  followingUserId: number;
  createdAt: string;
}

export interface BlockUserRequest {
  blockedUserId: number;
}

export interface UserBlockResponse {
  id: number;
  blockerUserId: number;
  blockedUserId: number;
  createdAt: string;
}

export interface ChatRoomCreateRequest {
  roomName?: string;
  roomType: ChatRoomType;
}

export interface ChatRoomResponse {
  id: number;
  roomName: string | null;
  roomType: ChatRoomType;
  createdByUserId: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessageCreateRequest {
  chatRoomId: number;
  content: string;
}

export interface MessageResponse {
  id: number;
  chatRoomId: number;
  senderUserId: number;
  content: string;
  isRead: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LookingForPlayerCreateRequest {
  gameId: number;
  title: string;
  description?: string;
  platform: string;
  preferredRole?: string;
  playerLevel?: string;
  microphoneRequired?: boolean;
  playTime?: string;
}

export interface LookingForPlayerPostResponse {
  id: number;
  userId: number;
  gameId: number;
  title: string;
  description: string | null;
  platform: string;
  preferredRole: string | null;
  playerLevel: string | null;
  microphoneRequired: boolean | null;
  playTime: string | null;
  status: LookingForPlayerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ComposerAction {
  label: string;
  icon: LucideIcon;
}

export type ComposerMediaType = "image" | "video";

export interface ComposerSubmitPayload {
  content: string;
  mediaFile?: File;
  mediaFiles?: Array<{
    file: File;
    type: ComposerMediaType;
  }>;
  mediaType?: ComposerMediaType;
}

export interface SuggestedGroup {
  id: string;
  name: string;
  members: string;
  description: string;
  imageUrl: string;
}

export interface ActiveEvent {
  id: string;
  title: string;
  date: {
    day: string;
    month: string;
    detail: string;
  };
  tag: string;
  tagTone: "purple" | "green";
  attendeeAvatars: string[];
  extraAttendees: number;
}

export interface OnlineFriend {
  id: string;
  name: string;
  statusText: string;
  avatarUrl: string;
  status: "online" | "playing";
}
