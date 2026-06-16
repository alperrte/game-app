import axiosClient, { apiClient } from "../../../lib/axios";
import type { AxiosProgressEvent } from "axios";
import { SOCIAL_API_ENDPOINTS } from "../../../lib/constants";
import type {
  BlockUserRequest,
  ChatRoomCreateRequest,
  ChatRoomResponse,
  DirectChatRoomCreateRequest,
  FollowCreateRequest,
  FollowResponse,
  FriendRequestCreateRequest,
  FriendRequestResponse,
  FriendshipResponse,
  LookingForPlayerCreateRequest,
  LookingForPlayerPostResponse,
  MessageCreateRequest,
  MessageResponse,
  SocialComment,
  SocialCommentCreateRequest,
  SocialCommentLikeResponse,
  SocialMediaUploadResponse,
  SocialPostCreateRequest,
  SocialPostLikeResponse,
  SocialPostResponse,
  UserBlockResponse,
} from "../types/social.types";

export const socialService = {
  uploadImage: async (
    file: File,
    onUploadProgress?: (event: AxiosProgressEvent) => void,
  ) => {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await axiosClient.post<SocialMediaUploadResponse>(
      SOCIAL_API_ENDPOINTS.imageUploads,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress,
      },
    );

    return data;
  },

  uploadVideo: async (
    file: File,
    onUploadProgress?: (event: AxiosProgressEvent) => void,
  ) => {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await axiosClient.post<SocialMediaUploadResponse>(
      SOCIAL_API_ENDPOINTS.videoUploads,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress,
      },
    );

    return data;
  },

  getPublicPosts: () =>
    apiClient.get<SocialPostResponse[]>(SOCIAL_API_ENDPOINTS.publicPosts),

  getPostsByUser: (userId: number | string) =>
    apiClient.get<SocialPostResponse[]>(SOCIAL_API_ENDPOINTS.userPosts(userId)),

  createPost: (request: SocialPostCreateRequest) =>
    apiClient.post<SocialPostResponse, SocialPostCreateRequest>(
      SOCIAL_API_ENDPOINTS.posts,
      request,
    ),

  deletePost: (postId: number | string) =>
    apiClient.delete(SOCIAL_API_ENDPOINTS.postById(postId)),

  likePost: (postId: number | string) =>
    apiClient.post<SocialPostLikeResponse, Record<string, never>>(
      SOCIAL_API_ENDPOINTS.postLikes(postId),
      {},
    ),

  getPostLikes: (postId: number | string) =>
    apiClient.get<SocialPostLikeResponse[]>(
      SOCIAL_API_ENDPOINTS.postLikes(postId),
    ),

  unlikePost: (postId: number | string) =>
    apiClient.delete(SOCIAL_API_ENDPOINTS.postLikes(postId)),

  getComments: (postId: number | string) =>
    apiClient.get<SocialComment[]>(SOCIAL_API_ENDPOINTS.postComments(postId)),

  addComment: (postId: number | string, request: SocialCommentCreateRequest) =>
    apiClient.post<SocialComment, SocialCommentCreateRequest>(
      SOCIAL_API_ENDPOINTS.postComments(postId),
      request,
    ),

  deleteComment: (commentId: number | string) =>
    apiClient.delete(SOCIAL_API_ENDPOINTS.commentById(commentId)),

  likeComment: (commentId: number | string) =>
    apiClient.post<SocialCommentLikeResponse, Record<string, never>>(
      SOCIAL_API_ENDPOINTS.commentLikes(commentId),
      {},
    ),

  unlikeComment: (commentId: number | string) =>
    apiClient.delete(SOCIAL_API_ENDPOINTS.commentLikes(commentId)),

  sendFriendRequest: (request: FriendRequestCreateRequest) =>
    apiClient.post<FriendRequestResponse, FriendRequestCreateRequest>(
      SOCIAL_API_ENDPOINTS.friendRequests,
      request,
    ),

  acceptFriendRequest: (requestId: number | string) =>
    apiClient.put<FriendRequestResponse, Record<string, never>>(
      SOCIAL_API_ENDPOINTS.acceptFriendRequest(requestId),
      {},
    ),

  rejectFriendRequest: (requestId: number | string) =>
    apiClient.put<FriendRequestResponse, Record<string, never>>(
      SOCIAL_API_ENDPOINTS.rejectFriendRequest(requestId),
      {},
    ),

  cancelFriendRequest: (requestId: number | string) =>
    apiClient.put<FriendRequestResponse, Record<string, never>>(
      SOCIAL_API_ENDPOINTS.cancelFriendRequest(requestId),
      {},
    ),

  getIncomingFriendRequests: (userId: number | string) =>
    apiClient.get<FriendRequestResponse[]>(
      SOCIAL_API_ENDPOINTS.incomingFriendRequests(userId),
    ),

  getOutgoingFriendRequests: (userId: number | string) =>
    apiClient.get<FriendRequestResponse[]>(
      SOCIAL_API_ENDPOINTS.outgoingFriendRequests(userId),
    ),

  getFriends: (userId: number | string) =>
    apiClient.get<FriendshipResponse[]>(SOCIAL_API_ENDPOINTS.friends(userId)),

  removeFriend: (userId: number | string, friendUserId: number | string) =>
    apiClient.delete(SOCIAL_API_ENDPOINTS.friendById(userId, friendUserId)),

  followUser: (request: FollowCreateRequest) =>
    apiClient.post<FollowResponse, FollowCreateRequest>(
      SOCIAL_API_ENDPOINTS.follows,
      request,
    ),

  unfollowUser: (followingUserId: number | string) =>
    apiClient.delete(SOCIAL_API_ENDPOINTS.follows, { followingUserId }),

  getFollowing: (userId: number | string) =>
    apiClient.get<FollowResponse[]>(SOCIAL_API_ENDPOINTS.following(userId)),

  getFollowers: (userId: number | string) =>
    apiClient.get<FollowResponse[]>(SOCIAL_API_ENDPOINTS.followers(userId)),

  blockUser: (request: BlockUserRequest) =>
    apiClient.post<UserBlockResponse, BlockUserRequest>(
      SOCIAL_API_ENDPOINTS.blocks,
      request,
    ),

  unblockUser: (blockedUserId: number | string) =>
    apiClient.delete(SOCIAL_API_ENDPOINTS.blocks, { blockedUserId }),

  getBlockedUsers: (userId: number | string) =>
    apiClient.get<UserBlockResponse[]>(
      SOCIAL_API_ENDPOINTS.blockedUsers(userId),
    ),

  createChatRoom: (request: ChatRoomCreateRequest) =>
    apiClient.post<ChatRoomResponse, ChatRoomCreateRequest>(
      SOCIAL_API_ENDPOINTS.chatRooms,
      request,
    ),

  findOrCreateDirectChatRoom: (request: DirectChatRoomCreateRequest) =>
    apiClient.post<ChatRoomResponse, DirectChatRoomCreateRequest>(
      SOCIAL_API_ENDPOINTS.directChatRooms,
      request,
    ),

  getMyChatRooms: () =>
    apiClient.get<ChatRoomResponse[]>(SOCIAL_API_ENDPOINTS.myChatRooms),

  getChatRoom: (chatRoomId: number | string) =>
    apiClient.get<ChatRoomResponse>(
      SOCIAL_API_ENDPOINTS.chatRoomById(chatRoomId),
    ),

  getUserChatRooms: (userId: number | string) =>
    apiClient.get<ChatRoomResponse[]>(
      SOCIAL_API_ENDPOINTS.userChatRooms(userId),
    ),

  sendMessage: (request: MessageCreateRequest) =>
    apiClient.post<MessageResponse, MessageCreateRequest>(
      SOCIAL_API_ENDPOINTS.messages,
      request,
    ),

  toggleMessageReaction: (messageId: number | string, emoji: string) =>
    apiClient.post<MessageResponse, { emoji: string }>(
      SOCIAL_API_ENDPOINTS.messageReactions(messageId),
      { emoji },
    ),

  getChatRoomMessages: (chatRoomId: number | string) =>
    apiClient.get<MessageResponse[]>(
      SOCIAL_API_ENDPOINTS.chatRoomMessages(chatRoomId),
    ),

  markChatRoomAsRead: (chatRoomId: number | string) =>
    apiClient.post<void, Record<string, never>>(
      SOCIAL_API_ENDPOINTS.markChatRoomRead(chatRoomId),
      {},
    ),

  hideChatRoom: (chatRoomId: number | string) =>
    apiClient.post<void, Record<string, never>>(
      SOCIAL_API_ENDPOINTS.hideChatRoom(chatRoomId),
      {},
    ),

  deleteMessage: (messageId: number | string) =>
    apiClient.delete(SOCIAL_API_ENDPOINTS.messageById(messageId)),

  createLookingForPlayerPost: (request: LookingForPlayerCreateRequest) =>
    apiClient.post<LookingForPlayerPostResponse, LookingForPlayerCreateRequest>(
      SOCIAL_API_ENDPOINTS.lookingForPlayer,
      request,
    ),

  getOpenLookingForPlayerPosts: () =>
    apiClient.get<LookingForPlayerPostResponse[]>(
      SOCIAL_API_ENDPOINTS.openLookingForPlayer,
    ),

  getLookingForPlayerPostsByUser: (userId: number | string) =>
    apiClient.get<LookingForPlayerPostResponse[]>(
      SOCIAL_API_ENDPOINTS.userLookingForPlayer(userId),
    ),

  getOpenLookingForPlayerPostsByGame: (gameId: number | string) =>
    apiClient.get<LookingForPlayerPostResponse[]>(
      SOCIAL_API_ENDPOINTS.gameOpenLookingForPlayer(gameId),
    ),

  closeLookingForPlayerPost: (postId: number | string) =>
    apiClient.put<LookingForPlayerPostResponse, Record<string, never>>(
      SOCIAL_API_ENDPOINTS.closeLookingForPlayer(postId),
      {},
    ),

  cancelLookingForPlayerPost: (postId: number | string) =>
    apiClient.put<LookingForPlayerPostResponse, Record<string, never>>(
      SOCIAL_API_ENDPOINTS.cancelLookingForPlayer(postId),
      {},
    ),
};
