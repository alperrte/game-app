import type { LucideIcon } from "lucide-react";

export type SocialFeedTab =
  | "all"
  | "following"
  | "popular"
  | "news"
  | "market"
  | "communities"
  | "saved";

export interface SocialUser {
  name: string;
  username: string;
  avatarUrl: string;
  userId?: number;
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
  createdAtRaw?: string;
  visibility: "public" | "followers" | "friends" | "private";
  content: string;
  media: SocialPostMedia[];
  rawMediaUrls?: string[];
  reactions: {
    likes: number;
    comments: number;
    shares: number;
  };
  likedByMe?: boolean;
  followedByMe?: boolean;
  savedByMe?: boolean;
  friendStatus?: "none" | "pending" | "friends";
  pendingFriendRequestId?: number;
  source?: "backend" | "lookingForPlayer";
  lookingForPlayerPostId?: number;
  lookingForPlayerStatus?: LookingForPlayerStatus;
  communityId?: number;
  communityName?: string;
  comments?: SocialComment[];
  poll?: PostPoll;
  updatedAt?: string;
}

export type PostVisibility =
  | "PUBLIC"
  | "FOLLOWERS_ONLY"
  | "FRIENDS"
  | "PRIVATE";

export function toUiPostVisibility(
  visibility: PostVisibility,
): SocialPost["visibility"] {
  if (visibility === "PRIVATE") return "private";
  if (visibility === "FOLLOWERS_ONLY") return "followers";
  if (visibility === "FRIENDS") return "friends";
  return "public";
}

export type FriendRequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED";

export type ChatRoomType = "DIRECT" | "GROUP";

export type LookingForPlayerStatus =
  | "OPEN"
  | "CLOSED"
  | "CANCELLED";

export interface SocialPostResponse {
  id: number;
  userId: number;
  communityId?: number | null;
  communityName?: string | null;
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
  poll?: PostPoll;
}

export interface PostPollOption {
  id: number;
  text: string;
  voteCount: number;
  percentage: number;
  selectedByCurrentUser: boolean;
}

export interface PostPoll {
  id: number;
  question: string;
  expiresAt: string;
  closed: boolean;
  totalVotes: number;
  selectedOptionId?: number | null;
  options: PostPollOption[];
}

export interface PostPollCreateRequest {
  question: string;
  options: string[];
  durationMinutes: number;
}

export interface SocialPostCreateRequest {
  content: string;
  communityId?: number;
  imageUrl?: string;
  mediaUrls?: string[];
  visibility?: PostVisibility;
  poll?: PostPollCreateRequest;
}

export interface SocialPostUpdateRequest {
  content: string;
  imageUrl?: string;
  mediaUrls?: string[];
  visibility?: PostVisibility;
}

export interface SocialMediaUploadResponse {
  imageUrl: string;
  fileName: string;
  contentType: string;
  mediaType: "IMAGE" | "VIDEO" | "FILE";
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
  parentCommentId?: number | null;
  replyingToUserId?: number | null;
  replyingToName?: string;
  author?: SocialUser;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  likedByMe?: boolean;
  likedByCurrentUser?: boolean;
  likeCount?: number;
  replies?: SocialComment[];
}

export interface SocialCommentCreateRequest {
  content: string;
  parentCommentId?: number;
  replyingToUserId?: number;
}

export interface SocialCommentUpdateRequest {
  content: string;
}

export interface SocialCommentLikeResponse {
  id: number;
  commentId: number;
  userId: number;
  createdAt: string;
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

export interface DirectChatRoomCreateRequest {
  targetUserId: number;
  targetUsername?: string;
}

export interface ChatRoomCreateRequest {
  roomName?: string;
  roomType: ChatRoomType;
  participantUserIds?: number[];
}

export interface ChatRoomUpdateRequest {
  roomName?: string;
  imageUrl?: string | null;
}

export interface ChatRoomMemberResponse {
  userId: number;
  creator: boolean;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string;
}

export interface ChatRoomResponse {
  id: number;
  roomName: string | null;
  imageUrl?: string | null;
  roomType: ChatRoomType;
  createdByUserId: number;
  createdAt: string;
  updatedAt: string;
  otherParticipantUserId?: number | null;
  lastMessageContent?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
  pinnedMessageId?: number | null;
  pinnedMessage?: MessageResponse | null;
}

export interface MessageCreateRequest {
  chatRoomId: number;
  content?: string;
  replyToMessageId?: number;
  mediaUrl?: string;
}

export interface MessageReactionResponse {
  emoji: string;
  userId: number;
}

export interface MessageResponse {
  id: number;
  chatRoomId: number;
  senderUserId: number;
  content: string;
  isRead: boolean;
  readAt?: string | null;
  isDeleted: boolean;
  replyToMessageId?: number | null;
  replyToSenderUserId?: number | null;
  replyToContent?: string | null;
  messageType?: "TEXT" | "IMAGE" | "VIDEO" | "FILE" | "SYSTEM";
  mediaUrl?: string | null;
  mediaType?: "IMAGE" | "VIDEO" | "FILE" | null;
  reactions?: MessageReactionResponse[];
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
  communityId?: number;
  visibility?: PostVisibility;
  poll?: PostPollCreateRequest;
  mediaFile?: File;
  mediaFiles?: Array<{
    file: File;
    type: ComposerMediaType;
  }>;
  mediaType?: ComposerMediaType;
}

export interface OnlineFriend {
  id: string;
  name: string;
  username: string;
  userId: number;
  statusText: string;
  avatarUrl: string;
  status: "online" | "playing";
}
