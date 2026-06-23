import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES, SOCIAL_ROUTES, STORAGE_KEYS } from "../../../lib/constants";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { cacheUserIdentity } from "../../../utils/userIdentityCache";
import { useAuthStore } from "../../../store/authStore";
import { useCurrentUserProfile } from "../../user/context/CurrentUserProfileContext";
import { socialService } from "../services/socialService";
import { useChatWidget } from "../context/ChatWidgetContext";
import type {
  SocialPost,
  SocialPostResponse,
  SocialPostUpdateRequest,
  SocialUser,
} from "../types/social.types";
import {
  loadUserProfiles,
  mapBackendPostToSocialPost,
  mapCommentAuthor,
  mapLikeUsers,
  structurePostComments,
  updateCommentInPost,
} from "../utils/socialPostMappers";

function readSavedPostIds(storageKey: string): Set<string> {
  try {
    const rawValue = localStorage.getItem(storageKey);
    const parsedValue: unknown = rawValue ? JSON.parse(rawValue) : [];

    if (!Array.isArray(parsedValue)) return new Set();

    return new Set(parsedValue.map((id) => String(id)));
  } catch {
    return new Set();
  }
}

function writeSavedPostIds(storageKey: string, savedPostIds: Set<string>) {
  localStorage.setItem(
    storageKey,
    JSON.stringify(Array.from(savedPostIds)),
  );
}

function readUserIdentityCache(): Map<number, string> {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEYS.userIdentityCache);
    const parsedValue: unknown = rawValue ? JSON.parse(rawValue) : {};

    if (!parsedValue || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
      return new Map();
    }

    return new Map(
      Object.entries(parsedValue)
        .map(([userId, username]) => [Number(userId), username] as const)
        .filter(
          (entry): entry is readonly [number, string] =>
            Number.isFinite(entry[0]) && typeof entry[1] === "string",
        ),
    );
  } catch {
    return new Map();
  }
}

type UseSocialPostFeedOptions = {
  backendPosts?: SocialPostResponse[];
};

export function useSocialPostFeed({ backendPosts = [] }: UseSocialPostFeedOptions = {}) {
  const { openChat } = useChatWidget();
  const { user } = useAuthStore();
  const { displayName, avatarUrl } = useCurrentUserProfile();
  const navigate = useNavigate();

  const savedPostStorageKey = `${STORAGE_KEYS.savedSocialPosts}:${user?.userId ?? "guest"}`;
  const cachedUsernames = useMemo(() => {
    const cache = readUserIdentityCache();
    if (user?.userId && user.username) {
      cache.set(user.userId, user.username);
    }
    return cache;
  }, [user]);

  const currentUser = useMemo<SocialUser>(
    () => ({
      name: displayName || user?.username || "Sen",
      username: user?.username || "sen",
      userId: user?.userId,
      avatarUrl: avatarUrl || "",
      verified: false,
    }),
    [avatarUrl, displayName, user],
  );

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [busyPostId, setBusyPostId] = useState<number | string | null>(null);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [savedPostIds, setSavedPostIds] = useState(
    () => readSavedPostIds(savedPostStorageKey),
  );
  const [followingUserIds, setFollowingUserIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [friendUserIds, setFriendUserIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [pendingFriendRequests, setPendingFriendRequests] = useState<
    Map<number, number>
  >(() => new Map());

  const relationshipLoadedRef = useRef(false);

  useEffect(() => {
    setSavedPostIds(readSavedPostIds(savedPostStorageKey));
  }, [savedPostStorageKey]);

  useEffect(() => {
    if (!user?.userId || relationshipLoadedRef.current) return;

    let active = true;
    void Promise.resolve().then(async () => {
      try {
        const [following, friends, outgoingRequests] = await Promise.all([
          socialService.getFollowing(user.userId),
          socialService.getFriends(user.userId),
          socialService.getOutgoingFriendRequests(user.userId),
        ]);
        if (!active) return;
        setFollowingUserIds(new Set(following.map((item) => item.followingUserId)));
        setFriendUserIds(new Set(friends.map((item) => item.friendUserId)));
        setPendingFriendRequests(
          new Map(
            outgoingRequests.map((request) => [
              request.receiverUserId,
              request.id,
            ]),
          ),
        );
        relationshipLoadedRef.current = true;
      } catch {
        // optional enrichment
      }
    });

    return () => {
      active = false;
    };
  }, [user?.userId]);

  useEffect(() => {
    let active = true;

    void Promise.resolve().then(async () => {
      if (backendPosts.length === 0) {
        if (active) setPosts([]);
        return;
      }

      const userProfiles = await loadUserProfiles(
        backendPosts.map((post) => post.userId),
      );
      if (!active) return;

      setPosts(
        backendPosts.map((post) =>
          mapBackendPostToSocialPost(
            post,
            currentUser,
            user?.userId,
            followingUserIds,
            savedPostIds,
            userProfiles,
            cachedUsernames,
            friendUserIds,
            pendingFriendRequests,
          ),
        ),
      );
    });

    return () => {
      active = false;
    };
  }, [
    backendPosts,
    cachedUsernames,
    currentUser,
    followingUserIds,
    friendUserIds,
    pendingFriendRequests,
    savedPostIds,
    user?.userId,
  ]);

  const handleToggleLike = useCallback(
    async (postId: number | string, likedByMe: boolean) => {
      if (typeof postId !== "number") return;

      setBusyPostId(postId);
      setFeedError(null);

      try {
        if (likedByMe) {
          await socialService.unlikePost(postId);
        } else {
          await socialService.likePost(postId);
        }

        setPosts((currentPosts) =>
          currentPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  likedByMe: !likedByMe,
                  reactions: {
                    ...post.reactions,
                    likes: Math.max(
                      0,
                      post.reactions.likes + (likedByMe ? -1 : 1),
                    ),
                  },
                }
              : post,
          ),
        );
      } catch (error) {
        setFeedError(getErrorMessage(error, "Beğeni işlemi tamamlanamadı."));
      } finally {
        setBusyPostId(null);
      }
    },
    [],
  );

  const handleLoadComments = useCallback(
    async (postId: number | string) => {
      if (typeof postId !== "number") return;

      setBusyPostId(postId);
      setFeedError(null);

      try {
        const comments = await socialService.getComments(postId);
        const currentPost = posts.find((post) => post.id === postId);
        const userProfiles = await loadUserProfiles(
          comments.flatMap((comment) =>
            [comment.userId, comment.replyingToUserId].filter(
              (userId): userId is number => typeof userId === "number",
            ),
          ),
        );

        setPosts((currentPosts) =>
          currentPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  comments: structurePostComments(
                    comments,
                    currentPost ?? post,
                    currentUser,
                    user?.userId,
                    userProfiles,
                    cachedUsernames,
                  ),
                }
              : post,
          ),
        );
      } catch (error) {
        setFeedError(getErrorMessage(error, "Yorumlar yüklenemedi."));
      } finally {
        setBusyPostId(null);
      }
    },
    [cachedUsernames, currentUser, posts, user?.userId],
  );

  const handleAddComment = useCallback(
    async (postId: number | string, content: string) => {
      if (typeof postId !== "number") return;

      setBusyPostId(postId);
      setFeedError(null);

      try {
        const comment = await socialService.addComment(postId, { content });

        setPosts((currentPosts) =>
          currentPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  comments: [
                    ...(post.comments ?? []),
                    mapCommentAuthor(
                      { ...comment, replies: [] },
                      post,
                      currentUser,
                      user?.userId,
                      new Map(),
                      cachedUsernames,
                    ),
                  ],
                  reactions: {
                    ...post.reactions,
                    comments: post.reactions.comments + 1,
                  },
                }
              : post,
          ),
        );
      } catch (error) {
        setFeedError(getErrorMessage(error, "Yorum gönderilemedi."));
      } finally {
        setBusyPostId(null);
      }
    },
    [cachedUsernames, currentUser, user?.userId],
  );

  const handleAddReply = useCallback(
    async (
      postId: number | string,
      parentCommentId: number,
      content: string,
      replyingToUserId?: number,
    ) => {
      if (typeof postId !== "number") return;

      setBusyPostId(postId);
      setFeedError(null);

      try {
        const comment = await socialService.addComment(postId, {
          content,
          parentCommentId,
          replyingToUserId,
        });
        const userProfiles = await loadUserProfiles(
          [comment.userId, comment.replyingToUserId].filter(
            (userId): userId is number => typeof userId === "number",
          ),
        );
        const currentPost = posts.find((post) => post.id === postId);

        setPosts((currentPosts) =>
          currentPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  comments: (post.comments ?? []).map((parentComment) =>
                    parentComment.id === parentCommentId
                      ? {
                          ...parentComment,
                          replies: [
                            ...(parentComment.replies ?? []),
                            mapCommentAuthor(
                              comment,
                              currentPost ?? post,
                              currentUser,
                              user?.userId,
                              userProfiles,
                              cachedUsernames,
                            ),
                          ],
                        }
                      : parentComment,
                  ),
                  reactions: {
                    ...post.reactions,
                    comments: post.reactions.comments + 1,
                  },
                }
              : post,
          ),
        );
      } catch (error) {
        setFeedError(getErrorMessage(error, "Yanıt gönderilemedi."));
      } finally {
        setBusyPostId(null);
      }
    },
    [cachedUsernames, currentUser, posts, user?.userId],
  );

  const handleToggleCommentLike = useCallback(
    async (
      postId: number | string,
      commentId: number,
      parentCommentId: number | null | undefined,
      likedByMe: boolean,
    ) => {
      if (typeof postId !== "number") return;

      setFeedError(null);

      try {
        if (likedByMe) {
          await socialService.unlikeComment(commentId);
        } else {
          await socialService.likeComment(commentId);
        }

        setPosts((currentPosts) =>
          currentPosts.map((post) =>
            post.id === postId
              ? updateCommentInPost(
                  post,
                  commentId,
                  parentCommentId,
                  (comment) => ({
                    ...comment,
                    likedByMe: !likedByMe,
                    likeCount: Math.max(
                      0,
                      (comment.likeCount ?? 0) + (likedByMe ? -1 : 1),
                    ),
                  }),
                )
              : post,
          ),
        );
      } catch (error) {
        setFeedError(getErrorMessage(error, "Yorum beğenisi güncellenemedi."));
      }
    },
    [],
  );

  const handleDeleteComment = useCallback(
    async (
      postId: number | string,
      commentId: number,
      parentCommentId?: number | null,
    ) => {
      if (typeof postId !== "number") return;

      setBusyPostId(postId);
      setFeedError(null);

      try {
        await socialService.deleteComment(commentId);

        setPosts((currentPosts) =>
          currentPosts.map((post) => {
            if (post.id !== postId) return post;

            if (parentCommentId) {
              return {
                ...post,
                comments: (post.comments ?? []).map((comment) =>
                  comment.id === parentCommentId
                    ? {
                        ...comment,
                        replies: (comment.replies ?? []).filter(
                          (reply) => reply.id !== commentId,
                        ),
                      }
                    : comment,
                ),
                reactions: {
                  ...post.reactions,
                  comments: Math.max(0, post.reactions.comments - 1),
                },
              };
            }

            const deletedComment = (post.comments ?? []).find(
              (comment) => comment.id === commentId,
            );
            const removedReplyCount = deletedComment?.replies?.length ?? 0;

            return {
              ...post,
              comments: (post.comments ?? []).filter(
                (comment) => comment.id !== commentId,
              ),
              reactions: {
                ...post.reactions,
                comments: Math.max(
                  0,
                  post.reactions.comments - 1 - removedReplyCount,
                ),
              },
            };
          }),
        );
      } catch (error) {
        setFeedError(getErrorMessage(error, "Yorum silinemedi."));
      } finally {
        setBusyPostId(null);
      }
    },
    [],
  );

  const handleDeletePost = useCallback(async (postId: number | string) => {
    if (typeof postId !== "number") return;

    setBusyPostId(postId);
    setFeedError(null);

    try {
      await socialService.deletePost(postId);
      setPosts((currentPosts) =>
        currentPosts.filter((post) => post.id !== postId),
      );
    } catch (error) {
      setFeedError(getErrorMessage(error, "Gönderi silinemedi."));
    } finally {
      setBusyPostId(null);
    }
  }, []);

  const handleUpdatePost = useCallback(
    async (postId: number | string, request: SocialPostUpdateRequest) => {
      if (typeof postId !== "number") return;

      setBusyPostId(postId);
      setFeedError(null);

      try {
        const updatedPost = await socialService.updatePost(postId, request);

        setPosts((currentPosts) =>
          currentPosts.map((post) => {
            if (post.id !== postId) return post;

            const mappedPost = mapBackendPostToSocialPost(
              updatedPost,
              currentUser,
              user?.userId,
            );

            return {
              ...mappedPost,
              comments: post.comments,
              followedByMe: post.followedByMe,
              friendStatus: post.friendStatus,
              pendingFriendRequestId: post.pendingFriendRequestId,
              savedByMe: post.savedByMe,
            };
          }),
        );
      } catch (error) {
        setFeedError(getErrorMessage(error, "GÃ¶nderi gÃ¼ncellenemedi."));
      } finally {
        setBusyPostId(null);
      }
    },
    [currentUser, user?.userId],
  );

  const handleUpdateComment = useCallback(
    async (
      postId: number | string,
      commentId: number,
      content: string,
      parentCommentId?: number | null,
    ) => {
      if (typeof postId !== "number") return;

      setBusyPostId(postId);
      setFeedError(null);

      try {
        const updatedComment = await socialService.updateComment(commentId, {
          content,
        });

        setPosts((currentPosts) =>
          currentPosts.map((post) =>
            post.id === postId
              ? updateCommentInPost(
                  post,
                  commentId,
                  parentCommentId,
                  (comment) =>
                    mapCommentAuthor(
                      {
                        ...updatedComment,
                        author: comment.author,
                        likedByMe: comment.likedByMe,
                        likeCount: comment.likeCount,
                        replies: comment.replies,
                      },
                      post,
                      currentUser,
                      user?.userId,
                    ),
                )
              : post,
          ),
        );
      } catch (error) {
        setFeedError(getErrorMessage(error, "Yorum gÃ¼ncellenemedi."));
      } finally {
        setBusyPostId(null);
      }
    },
    [currentUser, user?.userId],
  );

  const handleLoadPostLikes = useCallback(
    async (post: SocialPost) => {
      if (typeof post.id !== "number") return [];

      try {
        const likes = await socialService.getPostLikes(post.id);
        const userProfiles = await loadUserProfiles(
          likes.map((like) => like.userId),
        );

        return mapLikeUsers(
          likes,
          currentUser,
          user?.userId,
          userProfiles,
          cachedUsernames,
        );
      } catch (error) {
        setFeedError(getErrorMessage(error, "Beğenenler yüklenemedi."));
        return [];
      }
    },
    [cachedUsernames, currentUser, user?.userId],
  );

  const handleToggleFollowAuthor = useCallback(
    async (authorUserId: number, followedByMe: boolean) => {
      setFeedError(null);

      try {
        if (followedByMe) {
          await socialService.unfollowUser(authorUserId);
        } else {
          await socialService.followUser({ followingUserId: authorUserId });
        }

        setFollowingUserIds((current) => {
          const next = new Set(current);
          if (followedByMe) {
            next.delete(authorUserId);
          } else {
            next.add(authorUserId);
          }
          return next;
        });

        setPosts((currentPosts) =>
          currentPosts.map((post) =>
            post.authorUserId === authorUserId
              ? { ...post, followedByMe: !followedByMe }
              : post,
          ),
        );
      } catch (error) {
        setFeedError(getErrorMessage(error, "Takip işlemi tamamlanamadı."));
      }
    },
    [],
  );

  const handleSendFriendRequest = useCallback(async (authorUserId: number) => {
    setFeedError(null);

    try {
      const request = await socialService.sendFriendRequest({
        receiverUserId: authorUserId,
      });
      setPendingFriendRequests((current) => {
        const next = new Map(current);
        next.set(authorUserId, request.id);
        return next;
      });
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.authorUserId === authorUserId
            ? {
                ...post,
                friendStatus: "pending",
                pendingFriendRequestId: request.id,
              }
            : post,
        ),
      );
    } catch (error) {
      setFeedError(getErrorMessage(error, "Arkadaşlık isteği gönderilemedi."));
    }
  }, []);

  const handleCancelFriendRequest = useCallback(
    async (requestId: number, authorUserId: number) => {
      setFeedError(null);

      try {
        await socialService.cancelFriendRequest(requestId);
        setPendingFriendRequests((current) => {
          const next = new Map(current);
          next.delete(authorUserId);
          return next;
        });
        setPosts((currentPosts) =>
          currentPosts.map((post) =>
            post.authorUserId === authorUserId
              ? {
                  ...post,
                  friendStatus: "none",
                  pendingFriendRequestId: undefined,
                }
              : post,
          ),
        );
      } catch (error) {
        setFeedError(
          getErrorMessage(error, "Arkadaşlık isteği iptal edilemedi."),
        );
      }
    },
    [],
  );

  const handleStartChat = useCallback(
    async (post: SocialPost) => {
      if (typeof post.authorUserId !== "number") return;

      setFeedError(null);

      try {
        cacheUserIdentity(post.authorUserId, post.author.username);

        const room = await socialService.findOrCreateDirectChatRoom({
          targetUserId: post.authorUserId,
          targetUsername: post.author.username,
        });
        openChat(room.id);
      } catch (error) {
        setFeedError(getErrorMessage(error, "Sohbet başlatılamadı."));
      }
    },
    [openChat],
  );

  const handleBlockAuthor = useCallback(async (authorUserId: number) => {
    setFeedError(null);

    try {
      await socialService.blockUser({ blockedUserId: authorUserId });
      setPosts((currentPosts) =>
        currentPosts.filter((post) => post.authorUserId !== authorUserId),
      );
    } catch (error) {
      setFeedError(getErrorMessage(error, "Engelleme işlemi tamamlanamadı."));
    }
  }, []);

  const handleSharePost = useCallback(async (post: SocialPost) => {
    const shareText = post.content.slice(0, 180);
    const shareUrl =
      typeof post.id === "number"
        ? `${window.location.origin}${SOCIAL_ROUTES.postDetail(post.id)}`
        : window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "LobbyTwoZero gönderisi",
          text: shareText,
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setFeedError("Gönderi bağlantısı panoya kopyalandı.");
    } catch {
      setFeedError("Paylaşım tamamlanamadı.");
    }
  }, []);

  const handleToggleSave = useCallback(
    (postId: number | string) => {
      const normalizedPostId = String(postId);
      const nextSavedPostIds = new Set(savedPostIds);

      if (nextSavedPostIds.has(normalizedPostId)) {
        nextSavedPostIds.delete(normalizedPostId);
      } else {
        nextSavedPostIds.add(normalizedPostId);
      }

      writeSavedPostIds(savedPostStorageKey, nextSavedPostIds);
      setSavedPostIds(nextSavedPostIds);
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? { ...post, savedByMe: nextSavedPostIds.has(normalizedPostId) }
            : post,
        ),
      );
    },
    [savedPostIds, savedPostStorageKey],
  );

  const cardHandlers = {
    onAddComment: handleAddComment,
    onAddReply: handleAddReply,
    onBlockAuthor: handleBlockAuthor,
    onDeleteComment: handleDeleteComment,
    onDeletePost: handleDeletePost,
    onLoadComments: handleLoadComments,
    onLoadPostLikes: handleLoadPostLikes,
    onOpenProfile: (username: string) =>
      navigate(ROUTES.profile.replace(":username", username)),
    onSendFriendRequest: handleSendFriendRequest,
    onCancelFriendRequest: handleCancelFriendRequest,
    onShare: handleSharePost,
    onStartChat: handleStartChat,
    onToggleCommentLike: handleToggleCommentLike,
    onToggleSave: handleToggleSave,
    onToggleLike: handleToggleLike,
    onToggleFollowAuthor: handleToggleFollowAuthor,
    onUpdateComment: handleUpdateComment,
    onUpdatePost: handleUpdatePost,
  };

  return {
    posts,
    setPosts,
    busyPostId,
    feedError,
    setFeedError,
    currentUser,
    cardHandlers,
  };
}
