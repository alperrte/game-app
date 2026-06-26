import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { formatSocialTime } from "../../../utils/formatSocialTime";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { cacheUserIdentity } from "../../../utils/userIdentityCache";
import { useAuthStore } from "../../../store/authStore";
import { useCurrentUserProfile } from "../../user/context/CurrentUserProfileContext";
import { ROUTES, SOCIAL_ROUTES, STORAGE_KEYS } from "../../../lib/constants";
import type { Game, GamePlatform } from "../../game/types/gameTypes";
import { userService } from "../../user/services/userService";
import type { UserProfileResponse } from "../../user/types/user";
import { getImageUrl, isImageValid } from "../../user/utils/profileImage";
import { SocialComposer } from "../components/SocialComposer";
import { SocialFeedTabs } from "../components/SocialFeedTabs";
import { SocialPostCard } from "../components/SocialPostCard";
import { SocialRightPanel } from "../components/SocialRightPanel";
import { socialService } from "../services/socialService";
import { toUiPostVisibility } from "../types/social.types";
import { communityService } from "../../community/services/communityService";
import { useChatWidget } from "../context/ChatWidgetContext";
import type {
  Community,
  CommunityEvent,
} from "../../community/types/community.types";
import type {
  ComposerSubmitPayload,
  FollowResponse,
  LookingForPlayerCreateRequest,
  LookingForPlayerPostResponse,
  OnlineFriend,
  SocialComment,
  SocialFeedTab,
  SocialPostLikeResponse,
  SocialPostResponse,
  SocialPost,
  SocialPostUpdateRequest,
  SocialUser,
} from "../types/social.types";

const FEED_PAGE_SIZE = 20;

function formatPostDate(dateValue: string): string {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Az önce";
  }

  const diffInMinutes = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 60000),
  );

  if (diffInMinutes < 1) return "Az önce";
  if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} saat önce`;

  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

void formatPostDate;

function resolveMediaUrl(imageUrl: string): string {
  return getImageUrl(imageUrl.trim());
}

function resolveProfileAvatar(avatarUrl?: string | null): string {
  if (!avatarUrl?.trim()) return "";
  return isImageValid(avatarUrl) ? getImageUrl(avatarUrl) : "";
}

function resolveAuthor(
  authorUserId: number,
  currentUser: SocialUser,
  currentUserId?: number,
  userProfiles = new Map<number, UserProfileResponse>(),
  cachedUsernames = new Map<number, string>(),
): SocialUser {
  if (currentUserId === authorUserId) {
    return currentUser;
  }

  const profile = userProfiles.get(authorUserId);

  if (profile) {
    const displayName = profile.displayName?.trim() || profile.username;

    return {
      name: displayName,
      username: profile.username,
      userId: authorUserId,
      avatarUrl: resolveProfileAvatar(profile.avatarUrl),
      verified: false,
    };
  }

  const cachedUsername = cachedUsernames.get(authorUserId);

  if (cachedUsername) {
    return {
      name: cachedUsername,
      username: cachedUsername,
      userId: authorUserId,
      avatarUrl: "",
      verified: false,
    };
  }

  return {
    name: `Oyuncu #${authorUserId}`,
    username: `oyuncu-${authorUserId}`,
    userId: authorUserId,
    avatarUrl: "",
    verified: false,
  };
}

function mapCommentAuthor(
  comment: SocialComment,
  post: SocialPost,
  currentUser: SocialUser,
  currentUserId?: number,
  userProfiles = new Map<number, UserProfileResponse>(),
  cachedUsernames = new Map<number, string>(),
): SocialComment {
  const author =
    typeof currentUserId === "number" && comment.userId === currentUserId
      ? { ...currentUser, userId: comment.userId }
      : comment.userId === post.authorUserId
        ? { ...post.author, userId: comment.userId }
        : resolveAuthor(
          comment.userId,
          currentUser,
          currentUserId,
          userProfiles,
          cachedUsernames,
        );

  let replyingToName = comment.replyingToName;

  if (comment.replyingToUserId) {
    if (
      typeof currentUserId === "number" &&
      comment.replyingToUserId === currentUserId
    ) {
      replyingToName = currentUser.name;
    } else if (comment.replyingToUserId === post.authorUserId) {
      replyingToName = post.author.name;
    } else {
      replyingToName = resolveAuthor(
        comment.replyingToUserId,
        currentUser,
        currentUserId,
        userProfiles,
        cachedUsernames,
      ).name;
    }
  }

  return {
    ...comment,
    author,
    likedByMe: comment.likedByMe ?? comment.likedByCurrentUser ?? false,
    likeCount: comment.likeCount ?? 0,
    replyingToName,
  };
}

function structurePostComments(
  comments: SocialComment[],
  post: SocialPost,
  currentUser: SocialUser,
  currentUserId?: number,
  userProfiles = new Map<number, UserProfileResponse>(),
  cachedUsernames = new Map<number, string>(),
): SocialComment[] {
  const mappedComments = comments
    .filter((comment) => !comment.isDeleted)
    .map((comment) =>
      mapCommentAuthor(
        comment,
        post,
        currentUser,
        currentUserId,
        userProfiles,
        cachedUsernames,
      ),
    );

  const repliesByParentId = new Map<number, SocialComment[]>();

  for (const comment of mappedComments) {
    if (!comment.parentCommentId) continue;

    const replies = repliesByParentId.get(comment.parentCommentId) ?? [];
    replies.push(comment);
    repliesByParentId.set(comment.parentCommentId, replies);
  }

  return mappedComments
    .filter((comment) => !comment.parentCommentId)
    .map((comment) => ({
      ...comment,
      replies: repliesByParentId.get(comment.id) ?? [],
    }));
}

function updateCommentInPost(
  post: SocialPost,
  commentId: number,
  parentCommentId: number | null | undefined,
  updater: (comment: SocialComment) => SocialComment,
): SocialPost {
  if (!parentCommentId) {
    return {
      ...post,
      comments: (post.comments ?? []).map((comment) =>
        comment.id === commentId ? updater(comment) : comment,
      ),
    };
  }

  return {
    ...post,
    comments: (post.comments ?? []).map((comment) =>
      comment.id === parentCommentId
        ? {
          ...comment,
          replies: (comment.replies ?? []).map((reply) =>
            reply.id === commentId ? updater(reply) : reply,
          ),
        }
        : comment,
    ),
  };
}

function mapLikeUsers(
  likes: SocialPostLikeResponse[],
  currentUser: SocialUser,
  currentUserId?: number,
  userProfiles = new Map<number, UserProfileResponse>(),
  cachedUsernames = new Map<number, string>(),
): SocialUser[] {
  return likes.map((like) =>
    resolveAuthor(
      like.userId,
      currentUser,
      currentUserId,
      userProfiles,
      cachedUsernames,
    ),
  );
}

function mapBackendPostToSocialPost(
  post: SocialPostResponse,
  currentUser: SocialUser,
  currentUserId?: number,
  followingUserIds = new Set<number>(),
  savedPostIds = new Set<string>(),
  userProfiles = new Map<number, UserProfileResponse>(),
  cachedUsernames = new Map<number, string>(),
  friendUserIds = new Set<number>(),
  pendingFriendRequests = new Map<number, number>(),
): SocialPost {
  const isCurrentUserPost = currentUserId === post.userId;
  const mediaType =
    post.mediaType === "VIDEO" || post.imageUrl?.includes("/videos/")
      ? ("video" as const)
      : ("image" as const);
  const mediaItems = post.media?.length
    ? post.media.map((media) => ({
      url: resolveMediaUrl(media.url),
      alt: media.mediaType === "VIDEO" ? "Gönderi videosu" : "Gönderi görseli",
      type: media.mediaType === "VIDEO" ? ("video" as const) : ("image" as const),
    }))
    : post.imageUrl?.trim()
      ? [
        {
          url: resolveMediaUrl(post.imageUrl),
          alt: mediaType === "video" ? "Gönderi videosu" : "Gönderi görseli",
          type: mediaType,
        },
      ]
      : [];
  const rawMediaUrls = post.media?.length
    ? post.media.map((media) => media.url)
    : post.imageUrl?.trim()
      ? [post.imageUrl]
      : [];

  return {
    id: post.id,
    authorUserId: post.userId,
    author: resolveAuthor(
      post.userId,
      currentUser,
      currentUserId,
      userProfiles,
      cachedUsernames,
    ),
    createdAt: formatSocialTime(post.createdAt),
    createdAtRaw: post.createdAt,
    updatedAt: post.updatedAt,
    visibility: toUiPostVisibility(post.visibility),
    content: post.content,
    media: mediaItems,
    rawMediaUrls,
    reactions: {
      likes: post.likeCount,
      comments: post.commentCount,
      shares: 0,
    },
    likedByMe: Boolean(post.likedByCurrentUser),
    poll: post.poll,
    followedByMe:
      typeof currentUserId === "number" &&
      !isCurrentUserPost &&
      followingUserIds.has(post.userId),
    friendStatus: isCurrentUserPost
      ? undefined
      : friendUserIds.has(post.userId)
        ? "friends"
        : pendingFriendRequests.has(post.userId)
          ? "pending"
          : "none",
    pendingFriendRequestId: pendingFriendRequests.get(post.userId),
    savedByMe: savedPostIds.has(String(post.id)),
    communityId: post.communityId ?? undefined,
    communityName: post.communityName ?? undefined,
    source: "backend",
  };
}

function mapLookingForPlayerToSocialPost(
  post: LookingForPlayerPostResponse,
  currentUser: SocialUser,
  currentUserId?: number,
  savedPostIds = new Set<string>(),
  userProfiles = new Map<number, UserProfileResponse>(),
  cachedUsernames = new Map<number, string>(),
): SocialPost {
  const details = [
    `Platform: ${post.platform}`,
    post.preferredRole ? `Rol: ${post.preferredRole}` : null,
    post.playerLevel ? `Seviye: ${post.playerLevel}` : null,
    post.microphoneRequired ? "Mikrofon gerekli" : null,
    post.playTime
      ? `Oyun zamanı: ${new Intl.DateTimeFormat("tr-TR", {
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        month: "long",
      }).format(new Date(post.playTime))}`
      : null,
  ].filter(Boolean);

  return {
    id: `looking-for-player-${post.id}`,
    authorUserId: post.userId,
    author: resolveAuthor(
      post.userId,
      currentUser,
      currentUserId,
      userProfiles,
      cachedUsernames,
    ),
    createdAt: formatSocialTime(post.createdAt),
    visibility: "public",
    content: [`İlan: ${post.title}`, post.description, details.join(" · ")]
      .filter(Boolean)
      .join("\n"),
    media: [],
    reactions: {
      likes: 0,
      comments: 0,
      shares: 0,
    },
    likedByMe: false,
    savedByMe: savedPostIds.has(`looking-for-player-${post.id}`),
    source: "lookingForPlayer",
    lookingForPlayerPostId: post.id,
    lookingForPlayerStatus: post.status,
  };
}

function getEmptyFeedMessage(activeTab: SocialFeedTab): string {
  switch (activeTab) {
    case "following":
      return "Takip ettiğin kullanıcıların henüz gönderisi yok.";
    case "popular":
      return "Popüler gönderi bulunamadı.";
    case "news":
      return "Oyun haberi bulunamadı.";
    case "market":
      return "Açık oyuncu aranıyor ilanı yok.";
    case "communities":
      return "Seçilen toplulukta henüz gönderi yok.";
    case "saved":
      return "Henüz kaydedilen gönderin yok.";
    default:
      return "Henüz gönderi yok. İlk gönderiyi sen paylaş.";
  }
}

async function loadUserProfiles(
  userIds: Array<number | undefined>,
): Promise<Map<number, UserProfileResponse>> {
  const uniqueUserIds = Array.from(
    new Set(
      userIds.filter(
        (userId): userId is number => typeof userId === "number",
      ),
    ),
  );

  if (uniqueUserIds.length === 0) {
    return new Map();
  }

  try {
    const profiles = await userService.getProfilesBatch(
      uniqueUserIds.map(String),
    );
    const profileMap = new Map<number, UserProfileResponse>();

    profiles.forEach((profile) => {
      const numericId = Number(profile.userId);

      if (Number.isFinite(numericId)) {
        profileMap.set(numericId, profile);
      }
    });

    return profileMap;
  } catch (error) {
    console.error("Batch profiles load failed:", error);
    return new Map();
  }
}

function getSavedPostStorageKey(userId?: number): string {
  return `${STORAGE_KEYS.savedSocialPosts}:${userId ?? "guest"}`;
}

function readSavedPostIds(storageKey: string): Set<string> {
  try {
    const rawValue = localStorage.getItem(storageKey);
    const parsedValue: unknown = rawValue ? JSON.parse(rawValue) : [];

    return Array.isArray(parsedValue)
      ? new Set(
        parsedValue.filter(
          (value): value is string => typeof value === "string",
        ),
      )
      : new Set<string>();
  } catch {
    return new Set<string>();
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

function isGameNewsPost(post: SocialPost): boolean {
  return post.content.trim().toLocaleLowerCase("tr").startsWith("oyun:");
}

function normalizeList<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const response = value as {
    content?: unknown;
    data?: unknown;
    items?: unknown;
    results?: unknown;
  };

  for (const candidate of [
    response.content,
    response.data,
    response.items,
    response.results,
  ]) {
    if (Array.isArray(candidate)) {
      return candidate as T[];
    }
  }

  return [];
}

export default function SocialFeedPage() {
  const { openChat } = useChatWidget();
  const { user } = useAuthStore();
  const { displayName, avatarUrl } = useCurrentUserProfile();
  const navigate = useNavigate();
  const savedPostStorageKey = useMemo(
    () => getSavedPostStorageKey(user?.userId),
    [user?.userId],
  );
  const [activeTab, setActiveTab] = useState<SocialFeedTab>("all");
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [feedPage, setFeedPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [busyPostId, setBusyPostId] = useState<number | string | null>(null);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [platforms, setPlatforms] = useState<GamePlatform[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CommunityEvent[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState("");
  const [onlineFriendProfiles, setOnlineFriendProfiles] = useState<OnlineFriend[]>([]);
  const [savedPostState, setSavedPostState] = useState(() => ({
    ids: readSavedPostIds(savedPostStorageKey),
    storageKey: savedPostStorageKey,
  }));
  const cachedUsernames = useMemo(
    () => {
      const cache = readUserIdentityCache();

      if (user?.userId && user.username) {
        cache.set(user.userId, user.username);
      }

      return cache;
    },
    [user],
  );
  const savedPostIds = useMemo(
    () =>
      savedPostState.storageKey === savedPostStorageKey
        ? savedPostState.ids
        : readSavedPostIds(savedPostStorageKey),
    [savedPostState, savedPostStorageKey],
  );
  const savedPostIdsRef = useRef(savedPostIds);

  const currentUser = useMemo<SocialUser>(
    () => ({
      name: displayName || user?.username || "Oyuncu",
      username: user?.username ?? "oyuncu",
      userId: user?.userId,
      avatarUrl: resolveProfileAvatar(avatarUrl),
      verified: false,
      status: "online",
    }),
    [avatarUrl, displayName, user?.userId, user?.username],
  );

  useEffect(() => {
    savedPostIdsRef.current = savedPostIds;
  }, [savedPostIds]);

  useEffect(() => {
    let isMounted = true;

    async function loadGames() {
      try {
        const [loadedGames, loadedPlatforms] = await Promise.all([
          socialService.getComposerGames(),
          socialService.getComposerPlatforms(),
        ]);

        if (isMounted) {
          setGames(normalizeList<Game>(loadedGames));
          setPlatforms(normalizeList<GamePlatform>(loadedPlatforms));
        }
      } catch {
        if (isMounted) {
          setGames([]);
          setPlatforms([]);
        }
      }
    }

    void loadGames();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      communityService.getMyCommunities(),
      communityService.getUpcomingEvents(0, 3),
    ])
      .then(([loadedCommunities, loadedEvents]) => {
        if (!isMounted) return;

        setCommunities(loadedCommunities);
        setUpcomingEvents(loadedEvents);
      })
      .catch(() => {
        if (!isMounted) return;

        setCommunities([]);
        setUpcomingEvents([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadFriends() {
      if (!user?.userId) {
        setOnlineFriendProfiles([]);
        return;
      }

      try {
        const friendships = await socialService.getFriends(user.userId);
        const friendUserIds = friendships.map((friendship) =>
          friendship.userId === user.userId
            ? friendship.friendUserId
            : friendship.userId,
        );
        const userProfiles = await loadUserProfiles(friendUserIds);

        if (!isMounted) return;

        const nextFriends = friendUserIds.reduce<OnlineFriend[]>(
          (friends, friendUserId) => {
            const profile = userProfiles.get(friendUserId);

            if (!profile) return friends;

            friends.push({
              id: String(friendUserId),
              name: profile.displayName?.trim() || profile.username,
              username: profile.username,
              userId: friendUserId,
              statusText: "Arkadaş",
              avatarUrl: resolveProfileAvatar(profile.avatarUrl),
              status: "online",
            });

            return friends;
          },
          [],
        );

        setOnlineFriendProfiles(nextFriends);
      } catch {
        if (isMounted) {
          setOnlineFriendProfiles([]);
        }
      }
    }

    void loadFriends();

    return () => {
      isMounted = false;
    };
  }, [user?.userId]);

  useEffect(() => {
    let isMounted = true;

    async function loadPosts() {
      if (feedPage === 0) {
        setIsLoadingPosts(true);
      } else {
        setIsLoadingMorePosts(true);
      }
      setFeedError(null);

      try {
        const currentSavedPostIds = savedPostIdsRef.current;

        if (activeTab === "market") {
          const lookingForPlayerPosts =
            await socialService.getOpenLookingForPlayerPosts({
              page: feedPage,
              size: FEED_PAGE_SIZE,
            });
          const userProfiles = await loadUserProfiles(
            lookingForPlayerPosts.map((post) => post.userId),
          );

          if (!isMounted) return;

          const mappedPosts = lookingForPlayerPosts.map((post) =>
              mapLookingForPlayerToSocialPost(
                post,
                currentUser,
                user?.userId,
                currentSavedPostIds,
                userProfiles,
                cachedUsernames,
              ),
            );
          setPosts((current) =>
            feedPage === 0
              ? mappedPosts
              : [
                  ...current,
                  ...mappedPosts.filter(
                    (post) => !current.some((item) => item.id === post.id),
                  ),
                ],
          );
          setHasMorePosts(lookingForPlayerPosts.length === FEED_PAGE_SIZE);
          return;
        }

        const [backendPosts, following, lookingForPlayerPosts, friendships, outgoingFriendRequests] =
          await Promise.all([
            activeTab === "communities"
              ? socialService.getCommunityPosts(
                  selectedCommunityId ? Number(selectedCommunityId) : undefined,
                  { page: feedPage, size: FEED_PAGE_SIZE },
                )
              : socialService.getPublicPosts({
                  page: feedPage,
                  size: FEED_PAGE_SIZE,
                }),
            user?.userId
              ? socialService.getFollowing(user.userId)
              : Promise.resolve<FollowResponse[]>([]),
            activeTab === "saved"
              ? socialService.getOpenLookingForPlayerPosts({
                  page: feedPage,
                  size: FEED_PAGE_SIZE,
                })
              : Promise.resolve<LookingForPlayerPostResponse[]>([]),
            user?.userId
              ? socialService.getFriends(user.userId)
              : Promise.resolve([]),
            user?.userId
              ? socialService.getOutgoingFriendRequests(user.userId)
              : Promise.resolve([]),
          ]);
        const followingUserIds = new Set(
          following.map((follow) => follow.followingUserId),
        );
        const friendUserIds = new Set(
          friendships.map((friendship) =>
            friendship.userId === user?.userId
              ? friendship.friendUserId
              : friendship.userId,
          ),
        );
        const pendingFriendRequests = new Map(
          outgoingFriendRequests.map((request) => [
            request.receiverUserId,
            request.id,
          ]),
        );
        const userProfiles = await loadUserProfiles([
          ...backendPosts.map((post) => post.userId),
          ...lookingForPlayerPosts.map((post) => post.userId),
        ]);

        if (!isMounted) return;

        let nextPosts = backendPosts.map((post) =>
          mapBackendPostToSocialPost(
            post,
            currentUser,
            user?.userId,
            followingUserIds,
            currentSavedPostIds,
            userProfiles,
            cachedUsernames,
            friendUserIds,
            pendingFriendRequests,
          ),
        );

        if (activeTab === "following" && user?.userId) {
          nextPosts = nextPosts.filter(
            (post) =>
              typeof post.authorUserId === "number" &&
              followingUserIds.has(post.authorUserId),
          );
        }

        if (activeTab === "popular") {
          nextPosts = [...nextPosts].sort((firstPost, secondPost) => {
            const firstScore =
              firstPost.reactions.likes * 2 + firstPost.reactions.comments;
            const secondScore =
              secondPost.reactions.likes * 2 + secondPost.reactions.comments;

            return secondScore - firstScore;
          });
        }

        if (activeTab === "news") {
          nextPosts = nextPosts.filter(isGameNewsPost);
        }

        if (activeTab === "saved") {
          const savedLookingForPlayerPosts = lookingForPlayerPosts
            .map((post) =>
              mapLookingForPlayerToSocialPost(
                post,
                currentUser,
                user?.userId,
                currentSavedPostIds,
                userProfiles,
                cachedUsernames,
              ),
            )
            .filter((post) => currentSavedPostIds.has(String(post.id)));

          nextPosts = [
            ...nextPosts.filter((post) =>
              currentSavedPostIds.has(String(post.id)),
            ),
            ...savedLookingForPlayerPosts,
          ];
        }

        setPosts((current) =>
          feedPage === 0
            ? nextPosts
            : [
                ...current,
                ...nextPosts.filter(
                  (post) => !current.some((item) => item.id === post.id),
                ),
              ],
        );
        setHasMorePosts(backendPosts.length === FEED_PAGE_SIZE);
      } catch (error) {
        if (!isMounted) return;

        setFeedError(
          getErrorMessage(
            error,
            "Akış yüklenemedi.",
          ),
        );
        if (feedPage === 0) {
          setPosts([]);
        }
        setHasMorePosts(false);
      } finally {
        if (isMounted) {
          setIsLoadingPosts(false);
          setIsLoadingMorePosts(false);
        }
      }
    }

    void loadPosts();

    return () => {
      isMounted = false;
    };
  }, [
    activeTab,
    selectedCommunityId,
    feedPage,
    cachedUsernames,
    currentUser,
    user?.userId,
  ]);

  async function handleCreatePost(payload: ComposerSubmitPayload) {
    setIsSubmittingPost(true);
    setFeedError(null);
    setUploadProgress(payload.mediaFiles?.length ? 0 : null);

    try {
      const mediaFiles = payload.mediaFiles ?? [];
      const uploadResponses = [];

      for (let index = 0; index < mediaFiles.length; index += 1) {
        const media = mediaFiles[index];
        const uploadResponse =
          media.type === "video"
            ? await socialService.uploadVideo(media.file, (event) => {
              if (event.total) {
                const fileProgress = event.loaded / event.total;
                setUploadProgress(
                  Math.round(((index + fileProgress) / mediaFiles.length) * 100),
                );
              }
            })
            : await socialService.uploadImage(media.file, (event) => {
              if (event.total) {
                const fileProgress = event.loaded / event.total;
                setUploadProgress(
                  Math.round(((index + fileProgress) / mediaFiles.length) * 100),
                );
              }
            });

        uploadResponses.push(uploadResponse);
      }

      const createdPost = await socialService.createPost({
        content: payload.content,
        communityId: payload.communityId,
        imageUrl: uploadResponses[0]?.imageUrl,
        mediaUrls: uploadResponses.map((response) => response.imageUrl),
        visibility: payload.visibility ?? "PUBLIC",
        poll: payload.poll,
      });
      const mappedPost = mapBackendPostToSocialPost(
        createdPost,
        currentUser,
        user?.userId,
      );

      setFeedPage(0);
      setActiveTab(
        payload.communityId
          ? "communities"
          : isGameNewsPost(mappedPost)
            ? "news"
            : "all",
      );
      if (payload.communityId) {
        setSelectedCommunityId(String(payload.communityId));
      }
      setPosts((currentPosts) => [
        mappedPost,
        ...currentPosts.filter((post) => post.id !== mappedPost.id),
      ]);
    } catch (error) {
      setFeedError(getErrorMessage(error, "Gönderi paylaşılamadı."));
    } finally {
      setIsSubmittingPost(false);
      setUploadProgress(null);
    }
  }

  async function handleCreateLookingForPlayer(
    request: LookingForPlayerCreateRequest,
  ) {
    setIsSubmittingPost(true);
    setFeedError(null);

    try {
      const createdPost =
        await socialService.createLookingForPlayerPost(request);

      setFeedPage(0);
      setActiveTab("market");
      setPosts((currentPosts) => [
        mapLookingForPlayerToSocialPost(createdPost, currentUser, user?.userId),
        ...currentPosts.filter((post) => post.source === "lookingForPlayer"),
      ]);
    } catch (error) {
      setFeedError(getErrorMessage(error, "İlan oluşturulamadı."));
    } finally {
      setIsSubmittingPost(false);
    }
  }

  async function handleToggleLike(postId: number | string, likedByMe: boolean) {
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
  }

  async function handleLoadComments(postId: number | string) {
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
  }

  async function handleAddComment(postId: number | string, content: string) {
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
  }

  async function handleAddReply(
    postId: number | string,
    parentCommentId: number,
    content: string,
    replyingToUserId?: number,
  ) {
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
  }

  async function handleToggleCommentLike(
    postId: number | string,
    commentId: number,
    parentCommentId: number | null | undefined,
    likedByMe: boolean,
  ) {
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
            ? updateCommentInPost(post, commentId, parentCommentId, (comment) => ({
              ...comment,
              likedByMe: !likedByMe,
              likeCount: Math.max(
                0,
                (comment.likeCount ?? 0) + (likedByMe ? -1 : 1),
              ),
            }))
            : post,
        ),
      );
    } catch (error) {
      setFeedError(getErrorMessage(error, "Yorum beğenisi güncellenemedi."));
    }
  }

  async function handleDeleteComment(
    postId: number | string,
    commentId: number,
    parentCommentId?: number | null,
  ) {
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
  }

  async function handleUpdatePost(
    postId: number | string,
    request: SocialPostUpdateRequest,
  ) {
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
  }

  async function handleUpdateComment(
    postId: number | string,
    commentId: number,
    content: string,
    parentCommentId?: number | null,
  ) {
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
            ? updateCommentInPost(post, commentId, parentCommentId, (comment) =>
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
  }

  async function handleDeletePost(postId: number | string) {
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
  }

  async function handleCloseLookingForPlayerPost(postId: number) {
    setBusyPostId(`looking-for-player-${postId}`);
    setFeedError(null);

    try {
      await socialService.closeLookingForPlayerPost(postId);
      setPosts((currentPosts) =>
        currentPosts.filter((post) => post.lookingForPlayerPostId !== postId),
      );
    } catch (error) {
      setFeedError(getErrorMessage(error, "İlan kapatılamadı."));
    } finally {
      setBusyPostId(null);
    }
  }

  async function handleCancelLookingForPlayerPost(postId: number) {
    setBusyPostId(`looking-for-player-${postId}`);
    setFeedError(null);

    try {
      await socialService.cancelLookingForPlayerPost(postId);
      setPosts((currentPosts) =>
        currentPosts.filter((post) => post.lookingForPlayerPostId !== postId),
      );
    } catch (error) {
      setFeedError(getErrorMessage(error, "İlan iptal edilemedi."));
    } finally {
      setBusyPostId(null);
    }
  }

  async function handleLoadPostLikes(post: SocialPost): Promise<SocialUser[]> {
    if (typeof post.id !== "number") return [];

    try {
      const likes = await socialService.getPostLikes(post.id);
      const userProfiles = await loadUserProfiles(likes.map((like) => like.userId));

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
  }

  async function handleToggleFollowAuthor(
    authorUserId: number,
    followedByMe: boolean,
  ) {
    setFeedError(null);

    try {
      if (followedByMe) {
        await socialService.unfollowUser(authorUserId);
      } else {
        await socialService.followUser({ followingUserId: authorUserId });
      }

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.authorUserId === authorUserId
            ? { ...post, followedByMe: !followedByMe }
            : post,
        ),
      );
      setFeedError(
        followedByMe
          ? "Kullanıcı takibi bırakıldı."
          : "Kullanıcı takip edildi.",
      );
    } catch (error) {
      setFeedError(getErrorMessage(error, "Takip işlemi tamamlanamadı."));
    }
  }

  async function handleSendFriendRequest(authorUserId: number) {
    setFeedError(null);

    try {
      const request = await socialService.sendFriendRequest({
        receiverUserId: authorUserId,
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
      setFeedError("Arkadaşlık isteği gönderildi.");
    } catch (error) {
      setFeedError(
        getErrorMessage(error, "Arkadaşlık isteği gönderilemedi."),
      );
    }
  }

  async function handleCancelFriendRequest(
    requestId: number,
    authorUserId: number,
  ) {
    setFeedError(null);

    try {
      await socialService.cancelFriendRequest(requestId);
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
      setFeedError("Arkadaşlık isteği iptal edildi.");
    } catch (error) {
      setFeedError(
        getErrorMessage(error, "Arkadaşlık isteği iptal edilemedi."),
      );
    }
  }

  async function handleStartChat(post: SocialPost) {
    if (typeof post.authorUserId !== "number") return;

    setFeedError(null);

    try {
      cacheUserIdentity(post.authorUserId, post.author.username);

      const room = await socialService.findOrCreateDirectChatRoom({
        targetUserId: post.authorUserId,
        targetUsername: post.author.username,
      });
      openChat(room.id);
      setFeedError("Sohbet başlatıldı.");
    } catch (error) {
      setFeedError(getErrorMessage(error, "Sohbet başlatılamadı."));
    }
  }

  async function handleBlockAuthor(authorUserId: number) {
    setFeedError(null);

    try {
      await socialService.blockUser({ blockedUserId: authorUserId });
      setPosts((currentPosts) =>
        currentPosts.filter((post) => post.authorUserId !== authorUserId),
      );
      setFeedError("Kullanıcı engellendi.");
    } catch (error) {
      setFeedError(getErrorMessage(error, "Engelleme işlemi tamamlanamadı."));
    }
  }

  async function handleSharePost(post: SocialPost) {
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
  }

  function handleToggleSave(postId: number | string) {
    const normalizedPostId = String(postId);
    const nextSavedPostIds = new Set(savedPostIds);

    if (nextSavedPostIds.has(normalizedPostId)) {
      nextSavedPostIds.delete(normalizedPostId);
    } else {
      nextSavedPostIds.add(normalizedPostId);
    }

    writeSavedPostIds(savedPostStorageKey, nextSavedPostIds);
    setSavedPostState({
      ids: nextSavedPostIds,
      storageKey: savedPostStorageKey,
    });
    setPosts((currentPosts) =>
      currentPosts
        .map((post) =>
          post.id === postId
            ? { ...post, savedByMe: nextSavedPostIds.has(normalizedPostId) }
            : post,
        )
        .filter((post) =>
          activeTab === "saved" ? nextSavedPostIds.has(String(post.id)) : true,
        ),
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_28%),#050914] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1860px] gap-8 xl:grid-cols-[minmax(0,1fr)_590px]">
        <main className="space-y-5">
          <SocialComposer
            communities={communities}
            games={games}
            platforms={platforms}
            isSubmitting={isSubmittingPost}
            onCreateLookingForPlayer={handleCreateLookingForPlayer}
            onSubmit={handleCreatePost}
            uploadProgress={uploadProgress}
            user={currentUser}
          />
          <SocialFeedTabs
            activeTab={activeTab}
            onTabChange={(tab) => {
              setFeedPage(0);
              setHasMorePosts(false);
              setActiveTab(tab);
            }}
          />
          {activeTab === "communities" ? (
            <select
              className="w-full rounded-xl border border-violet-500/25 bg-[#0a101c] px-4 py-3 text-sm text-zinc-200 outline-none focus:border-violet-400/60"
              onChange={(event) => {
                setFeedPage(0);
                setHasMorePosts(false);
                setSelectedCommunityId(event.target.value);
              }}
              value={selectedCommunityId}
            >
              <option value="">Tüm topluluklarım</option>
              {communities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
          ) : null}

          {feedError && (
            <div className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {feedError}
            </div>
          )}

          <div className="space-y-5">
            {isLoadingPosts ? (
              <div className="rounded-lg border border-white/10 bg-[#0a101c]/88 px-5 py-8 text-center text-sm text-zinc-400">
                Akış yükleniyor...
              </div>
            ) : posts.length > 0 ? (
              posts.map((post) => (
                <SocialPostCard
                  currentUserId={user?.userId}
                  currentUserName={currentUser.name}
                  isBusy={busyPostId === post.id}
                  key={post.id}
                  onAddComment={handleAddComment}
                  onAddReply={handleAddReply}
                  onBlockAuthor={handleBlockAuthor}
                  onDeleteComment={handleDeleteComment}
                  onDeletePost={handleDeletePost}
                  onLoadComments={handleLoadComments}
                  onLoadPostLikes={handleLoadPostLikes}
                  onOpenProfile={(username) =>
                    navigate(ROUTES.profile.replace(":username", username))
                  }
                  onSendFriendRequest={handleSendFriendRequest}
                  onCancelFriendRequest={handleCancelFriendRequest}
                  onCloseLookingForPlayerPost={handleCloseLookingForPlayerPost}
                  onCancelLookingForPlayerPost={handleCancelLookingForPlayerPost}
                  onShare={handleSharePost}
                  onStartChat={handleStartChat}
                  onToggleCommentLike={handleToggleCommentLike}
                  onToggleFollowAuthor={handleToggleFollowAuthor}
                  onToggleSave={handleToggleSave}
                  onToggleLike={handleToggleLike}
                  onUpdateComment={handleUpdateComment}
                  onUpdatePost={handleUpdatePost}
                  post={post}
                />
              ))
            ) : (
              <div className="rounded-lg border border-white/10 bg-[#0a101c]/88 px-5 py-8 text-center text-sm text-zinc-400">
                {getEmptyFeedMessage(activeTab)}
              </div>
            )}
          </div>
          {!isLoadingPosts && posts.length > 0 && hasMorePosts ? (
            <div className="text-center">
              <button
                className="rounded-xl border border-violet-500/40 px-6 py-3 font-bold text-violet-200 disabled:opacity-50"
                disabled={isLoadingMorePosts}
                onClick={() => setFeedPage((current) => current + 1)}
                type="button"
              >
                {isLoadingMorePosts ? "Yükleniyor..." : "Daha fazla gönderi yükle"}
              </button>
            </div>
          ) : null}
        </main>

        <div className="hidden xl:block">
          <SocialRightPanel
            communities={communities}
            events={upcomingEvents}
            friends={onlineFriendProfiles}
            onCommunityClick={() => navigate(SOCIAL_ROUTES.communities)}
            onEventClick={() => navigate(SOCIAL_ROUTES.events)}
            onFriendProfileClick={(username) =>
              navigate(ROUTES.profile.replace(":username", username))
            }
          />
        </div>
      </div>
    </div>
  );
}
