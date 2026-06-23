import axiosClient, { apiClient } from "../../../lib/axios";
import type { AxiosProgressEvent } from "axios";
import { SOCIAL_API_ENDPOINTS } from "../../../lib/constants";
import type { Game, GameFilters, GamePlatform } from "../../game/types/gameTypes";
import type {
  BlockUserRequest,
  ChatRoomCreateRequest,
  ChatRoomMemberResponse,
  ChatRoomResponse,
  ChatRoomUpdateRequest,
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
  SocialCommentUpdateRequest,
  SocialCommentLikeResponse,
  SocialMediaUploadResponse,
  SocialPostCreateRequest,
  SocialPostUpdateRequest,
  SocialPostLikeResponse,
  SocialPostResponse,
  UserBlockResponse,
} from "../types/social.types";

type PaginationParams = {
  page?: number;
  size?: number;
};

const socialGameClient = {
  getGames: (options: { includeSystemRequirementOnly?: boolean } = {}) =>
    apiClient.get<Game[]>(SOCIAL_API_ENDPOINTS.gameCatalogGames, options),

  filterGames: (filters: GameFilters = {}) =>
    apiClient.get<Game[]>(SOCIAL_API_ENDPOINTS.gameCatalogGames, filters),

  getPlatforms: () =>
    apiClient.get<GamePlatform[]>(SOCIAL_API_ENDPOINTS.gameCatalogPlatforms),
};

export const socialService = {
  getComposerGames: socialGameClient.getGames,

  filterComposerGames: socialGameClient.filterGames,

  getComposerPlatforms: socialGameClient.getPlatforms,

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

  uploadFile: async (
    file: File,
    onUploadProgress?: (event: AxiosProgressEvent) => void,
  ) => {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await axiosClient.post<SocialMediaUploadResponse>(
      SOCIAL_API_ENDPOINTS.fileUploads,
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

  getPublicPosts: (pagination: PaginationParams = {}) =>
    apiClient.get<SocialPostResponse[]>(
      SOCIAL_API_ENDPOINTS.publicPosts,
      pagination,
    ),

  getPostById: (postId: number | string) =>
    apiClient.get<SocialPostResponse>(SOCIAL_API_ENDPOINTS.postById(postId)),

  getCommunityPosts: (
    communityId?: number,
    pagination: PaginationParams = {},
  ) =>
    apiClient.get<SocialPostResponse[]>(
      SOCIAL_API_ENDPOINTS.communityPosts,
      { ...pagination, communityId },
    ),

  getPostsByUser: (
    userId: number | string,
    pagination: PaginationParams = {},
  ) =>
    apiClient.get<SocialPostResponse[]>(
      SOCIAL_API_ENDPOINTS.userPosts(userId),
      pagination,
    ),

  createPost: (request: SocialPostCreateRequest) =>
    apiClient.post<SocialPostResponse, SocialPostCreateRequest>(
      SOCIAL_API_ENDPOINTS.posts,
      request,
    ),

  updatePost: (postId: number | string, request: SocialPostUpdateRequest) =>
    apiClient.put<SocialPostResponse, SocialPostUpdateRequest>(
      SOCIAL_API_ENDPOINTS.postById(postId),
      request,
    ),

  votePoll: (postId: number | string, optionId: number) =>
    apiClient.post<import("../types/social.types").PostPoll, { optionId: number }>(
      SOCIAL_API_ENDPOINTS.postPollVotes(postId),
      { optionId },
    ),

  deletePost: (postId: number | string) =>
    apiClient.delete(SOCIAL_API_ENDPOINTS.postById(postId)),

  likePost: (postId: number | string) =>
    apiClient.post<SocialPostLikeResponse, Record<string, never>>(
      SOCIAL_API_ENDPOINTS.postLikes(postId),
      {},
    ),

  getPostLikes: (
    postId: number | string,
    pagination: PaginationParams = {},
  ) =>
    apiClient.get<SocialPostLikeResponse[]>(
      SOCIAL_API_ENDPOINTS.postLikes(postId),
      pagination,
    ),

  unlikePost: (postId: number | string) =>
    apiClient.delete(SOCIAL_API_ENDPOINTS.postLikes(postId)),

  getComments: (
    postId: number | string,
    pagination: PaginationParams = {},
  ) =>
    apiClient.get<SocialComment[]>(
      SOCIAL_API_ENDPOINTS.postComments(postId),
      pagination,
    ),

  addComment: (postId: number | string, request: SocialCommentCreateRequest) =>
    apiClient.post<SocialComment, SocialCommentCreateRequest>(
      SOCIAL_API_ENDPOINTS.postComments(postId),
      request,
    ),

  updateComment: (
    commentId: number | string,
    request: SocialCommentUpdateRequest,
  ) =>
    apiClient.put<SocialComment, SocialCommentUpdateRequest>(
      SOCIAL_API_ENDPOINTS.commentById(commentId),
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

  updateChatRoom: (
    chatRoomId: number | string,
    request: ChatRoomUpdateRequest,
  ) =>
    apiClient.put<ChatRoomResponse, ChatRoomUpdateRequest>(
      SOCIAL_API_ENDPOINTS.chatRoomById(chatRoomId),
      request,
    ),

  getChatRoomMembers: (chatRoomId: number | string) =>
    apiClient.get<ChatRoomMemberResponse[]>(
      SOCIAL_API_ENDPOINTS.chatRoomMembers(chatRoomId),
    ),

  addChatRoomMember: (
    chatRoomId: number | string,
    userId: number,
  ) =>
    apiClient.post<ChatRoomMemberResponse, { userId: number }>(
      SOCIAL_API_ENDPOINTS.chatRoomMembers(chatRoomId),
      { userId },
    ),

  removeChatRoomMember: (
    chatRoomId: number | string,
    userId: number | string,
  ) =>
    apiClient.delete(SOCIAL_API_ENDPOINTS.chatRoomMember(chatRoomId, userId)),

  updateChatRoomMemberRole: (
    chatRoomId: number | string,
    userId: number | string,
    role: "ADMIN" | "MEMBER",
  ) =>
    apiClient.put<ChatRoomMemberResponse, { role: "ADMIN" | "MEMBER" }>(
      SOCIAL_API_ENDPOINTS.chatRoomMemberRole(chatRoomId, userId),
      { role },
    ),

  transferChatRoomOwnership: (
    chatRoomId: number | string,
    userId: number,
  ) =>
    apiClient.put<ChatRoomResponse, { userId: number }>(
      SOCIAL_API_ENDPOINTS.chatRoomOwnership(chatRoomId),
      { userId },
    ),

  leaveChatRoom: (chatRoomId: number | string) =>
    apiClient.delete(SOCIAL_API_ENDPOINTS.chatRoomMembership(chatRoomId)),

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

  getChatRoomMessages: (
    chatRoomId: number | string,
    pagination: PaginationParams = {},
  ) =>
    apiClient.get<MessageResponse[]>(
      SOCIAL_API_ENDPOINTS.chatRoomMessages(chatRoomId),
      pagination,
    ),

  searchChatRoomMessages: (
    chatRoomId: number | string,
    query: string,
    pagination: PaginationParams = {},
  ) =>
    apiClient.get<MessageResponse[]>(
      SOCIAL_API_ENDPOINTS.chatRoomMessageSearch(chatRoomId),
      { ...pagination, query },
    ),

  pinMessage: (chatRoomId: number | string, messageId: number | string) =>
    apiClient.put<ChatRoomResponse, Record<string, never>>(
      SOCIAL_API_ENDPOINTS.pinChatMessage(chatRoomId, messageId),
      {},
    ),

  unpinMessage: async (chatRoomId: number | string) => {
    const { data } = await axiosClient.delete<ChatRoomResponse>(
      SOCIAL_API_ENDPOINTS.pinnedChatMessage(chatRoomId),
    );
    return data;
  },

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

  getOpenLookingForPlayerPosts: (pagination: PaginationParams = {}) =>
    apiClient.get<LookingForPlayerPostResponse[]>(
      SOCIAL_API_ENDPOINTS.openLookingForPlayer,
      pagination,
    ),

  getLookingForPlayerPostsByUser: (
    userId: number | string,
    pagination: PaginationParams = {},
  ) =>
    apiClient.get<LookingForPlayerPostResponse[]>(
      SOCIAL_API_ENDPOINTS.userLookingForPlayer(userId),
      pagination,
    ),

  getOpenLookingForPlayerPostsByGame: (
    gameId: number | string,
    pagination: PaginationParams = {},
  ) =>
    apiClient.get<LookingForPlayerPostResponse[]>(
      SOCIAL_API_ENDPOINTS.gameOpenLookingForPlayer(gameId),
      pagination,
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
