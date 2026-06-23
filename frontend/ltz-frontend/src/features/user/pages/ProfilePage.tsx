import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../../store/authStore";
import { useToast } from "../../../components/ui/toastContext";
import { userService } from "../services/userService";
import type { ProfileSectionVisibility, UserProfileResponse } from "../types/user";
import { EditProfileModal } from "../components/EditProfileModal";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { cacheUserIdentity } from "../../../utils/userIdentityCache";
import { ProfileSocialActions } from "../components/ProfileSocialActions";
import { useYouTubeSoundtrack } from "../../../hooks/useYouTubeSoundtrack";
import { getImageUrl, isImageValid } from "../utils/profileImage";
import { formatProfileDate, getYouTubeVideoId } from "../utils/profileHelpers";
import { buildProfileBadges, mergeAssignedBadges } from "../utils/badges";
import { normalizeRole } from "../utils/roleStyles";
import { useProfileIdentities } from "../hooks/useProfileIdentities";
import { STORAGE_KEYS } from "../../../lib/constants";
import { socialService } from "../../social/services/socialService";
import { useChatWidget } from "../../social/context/ChatWidgetContext";
import { socialProfileService, type RelationshipSnapshot } from "../../social/services/socialProfileService";
import { gameService } from "../../game/services/gameService";
import type { Game, GameSystemRequirement } from "../../game/types/gameTypes";
import type {
  ChatRoomResponse,
  SocialComment,
  SocialPost,
  SocialPostUpdateRequest,
  SocialUser,
  PostVisibility,
} from "../../social/types/social.types";
import { toUiPostVisibility } from "../../social/types/social.types";
import { ProfileHero } from "../components/profile/ProfileHero";
import { ProfileStatRibbon, SectionPanel, ProfileSkeleton } from "../components/profile/ProfilePrimitives";
import { ProfileQuickNav, type ProfileNavSection } from "../components/profile/ProfileQuickNav";
import {
  ProfileSettingsPanel,
  type SettingsPanelTab,
} from "../components/profile/ProfileSettingsPanel";
import { useCurrentUserProfile } from "../context/CurrentUserProfileContext";
import { ProfileWallSection } from "../components/profile/ProfileWallSection";
import { ProfileAboutSection } from "../components/profile/ProfileAboutSection";
import { ProfileHardwareSection } from "../components/profile/ProfileHardwareSection";
import { ProfileSocialSidebar } from "../components/profile/ProfileSocialSidebar";
import { ProfileConnectionListModal } from "../components/profile/ProfileConnectionListModal";
import { ProfileDevNote } from "../components/ProfileDevNote";
import type { ProfileIdentity } from "../hooks/useProfileIdentities";
import { ProfileReviewsSection } from "../components/profile/ProfileReviewsSection";
import {
  Lock,
  ChevronLeft,
  Play,
  Pause,
  Music,
  Send,
  X,
} from "lucide-react";

const DEFAULT_VISIBILITY: ProfileSectionVisibility = {
  showHardware: true,
  showFriendList: true,
  showFollowerList: true,
  showLastSeen: true,
  showGameLibrary: true,
};

const formatStatCount = (visible: boolean, count: number) => {
  if (!visible) return "—";
  return `${count}${count >= 200 ? "+" : ""}`;
};

type SocialSummary = {
  followers: number[];
  following: number[];
  friends: number[];
};

type ChatState = {
  open: boolean;
  room: ChatRoomResponse | null;
  messages: Awaited<ReturnType<typeof socialService.getChatRoomMessages>>;
  text: string;
  loading: boolean;
};

const isNotFoundError = (err: unknown) =>
  typeof err === "object" &&
  err !== null &&
  (("status" in err && (err as { status: number }).status === 404) ||
    ("response" in err && (err as { response?: { status?: number } }).response?.status === 404));

const isForbiddenError = (err: unknown) =>
  typeof err === "object" &&
  err !== null &&
  (("status" in err && (err as { status: number }).status === 403) ||
    ("response" in err && (err as { response?: { status?: number } }).response?.status === 403));

export const ProfilePage: React.FC = () => {
  const { openChat: openChatWidget } = useChatWidget();
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const { showToast } = useToast();
  const {
    displayName: loggedInDisplayName,
    avatarUrl: loggedInAvatarUrl,
    refresh: refreshCurrentUserProfile,
    hydrateProfile,
  } = useCurrentUserProfile();

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRestricted, setIsRestricted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsPanelTab>("privacy");
  const [activeNavSection, setActiveNavSection] = useState<ProfileNavSection>("wall");

  const switchNavSection = useCallback((section: ProfileNavSection) => {
    setActiveNavSection(section);
    requestAnimationFrame(() => {
      document.getElementById("profile-main-content")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);
  const [connectionModal, setConnectionModal] = useState<{
    title: string;
    group: Map<number, ProfileIdentity>;
  } | null>(null);
  const [postsRefreshKey, setPostsRefreshKey] = useState(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [relationship, setRelationship] = useState<RelationshipSnapshot | null>(null);
  const [relationshipError, setRelationshipError] = useState<string | null>(null);
  const [socialSummary, setSocialSummary] = useState<SocialSummary>({
    followers: [],
    following: [],
    friends: [],
  });
  const [socialDataLoading, setSocialDataLoading] = useState(false);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [socialIdentityGroups, setSocialIdentityGroups] = useState<{
    followers: Awaited<ReturnType<typeof resolveIdentities>>;
    following: Awaited<ReturnType<typeof resolveIdentities>>;
    friends: Awaited<ReturnType<typeof resolveIdentities>>;
  }>({
    followers: new Map(),
    following: new Map(),
    friends: new Map(),
  });
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [gameRequirements, setGameRequirements] = useState<Map<number, GameSystemRequirement>>(new Map());
  const [relationshipBusyAction, setRelationshipBusyAction] = useState<string | null>(null);
  const [busyPostId, setBusyPostId] = useState<number | string | null>(null);
  const [removingFriendUserId, setRemovingFriendUserId] = useState<number | null>(null);
  const [chatState, setChatState] = useState<ChatState>({
    open: false,
    room: null,
    messages: [],
    text: "",
    loading: false,
  });

  const targetUsername = username || currentUser?.username;
  const currentUsername = currentUser?.username;
  const isOwnProfile =
    isAuthenticated && currentUsername?.toLowerCase() === targetUsername?.toLowerCase();
  const profileUserId = Number(profile?.userId);
  const currentUserId = currentUser?.userId;
  const { resolveIdentities } = useProfileIdentities();

  const savedPostStorageKey = `${STORAGE_KEYS.savedSocialPosts}:${currentUserId ?? "guest"}`;

  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(() => {
    try {
      const key = `${STORAGE_KEYS.savedSocialPosts}:${currentUser?.userId ?? "guest"}`;
      const rawValue = localStorage.getItem(key);
      const parsedValue = rawValue ? JSON.parse(rawValue) : [];
      if (Array.isArray(parsedValue)) {
        return new Set(parsedValue.filter((v) => typeof v === "string"));
      }
    } catch {
      // ignore
    }
    return new Set<string>();
  });
  const savedPostIdsRef = useRef<Set<string>>(savedPostIds);
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      try {
        const rawValue = localStorage.getItem(savedPostStorageKey);
        const parsedValue = rawValue ? JSON.parse(rawValue) : [];
        const nextSet = new Set<string>(
          Array.isArray(parsedValue)
            ? parsedValue.filter((v) => typeof v === "string")
            : []
        );
        setSavedPostIds((prev) => {
          const isSame = prev.size === nextSet.size && Array.from(prev).every((id) => nextSet.has(id));
          if (isSame) return prev;
          return nextSet;
        });
        savedPostIdsRef.current = nextSet;
      } catch {
        setSavedPostIds(new Set<string>());
        savedPostIdsRef.current = new Set<string>();
      }
    });
    return () => {
      active = false;
    };
  }, [savedPostStorageKey]);

  const musicVideoId = profile ? getYouTubeVideoId(profile.profileMusicUrl) : null;
  const {
    isPlaying,
    playerReady,
    isLoading: soundtrackLoading,
    playbackError: soundtrackError,
    togglePlayback,
  } = useYouTubeSoundtrack({
    videoId: musicVideoId,
    suspended: editModalOpen,
  });

  const handleProfileUpdated = (updated: UserProfileResponse) => {
    setProfile(updated);
    void refreshCurrentUserProfile();
  };

  const editModal =
    editModalOpen && profile ? (
      <EditProfileModal
        profile={profile}
        onClose={() => setEditModalOpen(false)}
        onSaveSuccess={handleProfileUpdated}
      />
    ) : null;

  const navigateRef = useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  });

  useEffect(() => {
    if (!targetUsername) return;

    let active = true;

    void Promise.resolve().then(async () => {
      if (!active) return;
      setLoading(true);

      try {
        let data: UserProfileResponse;

        if (isOwnProfile) {
          try {
            data = await userService.getMyProfile();
          } catch (meErr: unknown) {
            if (!isNotFoundError(meErr)) throw meErr;
            data = await userService.setupProfile({
              displayName: currentUsername || "Oyuncu",
              bio: "Hoş geldiniz! Ben bir LobbyTwoZero oyuncusuyum.",
              gamerType: "CASUAL",
              favoriteCategories: "",
            });
            if (active) showToast("Profiliniz başarıyla oluşturuldu!", "success");
          }
        } else {
          data = await userService.getProfileByUsername(targetUsername);
        }

        if (active) {
          setProfile(data);
          setIsRestricted(false);
          if (isOwnProfile) {
            hydrateProfile(data);
          }
        }
      } catch (err: unknown) {
        if (!active) return;
        if (isForbiddenError(err)) {
          setIsRestricted(true);
        } else {
          showToast("Profil bulunamadı veya yüklenirken hata oluştu.", "error");
          navigateRef.current("/games");
        }
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [targetUsername, isOwnProfile, currentUsername, showToast, hydrateProfile]);

  useEffect(() => {
    if (!profile) return;
    document.title = `LobbyTwoZero | ${profile.displayName || profile.username} Profili`;
    return () => {
      document.title = "LobbyTwoZero";
    };
  }, [profile]);

  useEffect(() => {
    if (searchParams.get("settings") === "true") {
      const timer = setTimeout(() => {
        setSettingsOpen(true);
        setSearchParams({}, { replace: true });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    void Promise.resolve().then(async () => {
      if (!currentUserId || isOwnProfile || !Number.isFinite(profileUserId)) {
        if (active) {
          setRelationship(null);
          setRelationshipError(null);
        }
        return;
      }
      setRelationshipBusyAction("snapshot");
      setRelationshipError(null);
      try {
        const data = await socialProfileService.getRelationshipSnapshot(currentUserId, profileUserId);
        if (active) setRelationship(data);
      } catch {
        if (active) {
          setRelationship(null);
          setRelationshipError("Sosyal bağlantı bilgisi yüklenemedi.");
        }
      } finally {
        if (active) setRelationshipBusyAction(null);
      }
    });
    return () => {
      active = false;
    };
  }, [profileUserId, currentUserId, isOwnProfile, profile]);

  const visibility = profile?.sectionVisibility ?? DEFAULT_VISIBILITY;
  const displayRole = isOwnProfile
    ? currentUser?.role
    : profile?.role ?? "USER";

  useEffect(() => {
    if (!profile || !Number.isFinite(profileUserId)) return;
    let active = true;
    void Promise.resolve().then(async () => {
      setSocialDataLoading(true);
      setSocialError(null);
      try {
        const connections = await socialProfileService.getConnections(profileUserId);
        const followers = visibility.showFollowerList ? connections.followers : [];
        const following = visibility.showFollowerList ? connections.following : [];
        const friends = visibility.showFriendList ? connections.friends : [];
        if (!active) return;
        const nextSummary = {
          followers: followers.map((item) => item.followerUserId),
          following: following.map((item) => item.followingUserId),
          friends: friends.map((item) => item.friendUserId),
        };
        setSocialSummary(nextSummary);
        const [followerMap, followingMap, friendMap] = await Promise.all([
          resolveIdentities(nextSummary.followers),
          resolveIdentities(nextSummary.following),
          resolveIdentities(nextSummary.friends),
        ]);
        if (!active) return;
        setSocialIdentityGroups({
          followers: followerMap,
          following: followingMap,
          friends: friendMap,
        });
      } catch {
        if (active) setSocialError("Sosyal liste bilgileri yüklenemedi.");
      } finally {
        if (active) setSocialDataLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [profileUserId, profile, resolveIdentities, visibility.showFollowerList, visibility.showFriendList]);

  useEffect(() => {
    if (!profile || !Number.isFinite(profileUserId)) return;
    let active = true;
    void Promise.resolve().then(async () => {
      setPostsLoading(true);
      setPostsError(null);
      try {
        const [backendPosts, lfp, outgoingRequests] = await Promise.all([
          userService.getUserPosts(profileUserId),
          socialService.getLookingForPlayerPostsByUser(profileUserId),
          currentUserId && !isOwnProfile
            ? socialService.getOutgoingFriendRequests(currentUserId)
            : Promise.resolve([]),
        ]);
        if (!active) return;
        const ids = [
          ...backendPosts.map((item) => item.userId),
          ...lfp.map((item) => item.userId),
        ];
        const identityMap = await resolveIdentities(ids);

        const pendingRequest = outgoingRequests.find((r) => r.receiverUserId === profileUserId);
        const pendingFriendRequestId = pendingRequest?.id;

        const convertedPosts: SocialPost[] = backendPosts.map((item) => {
          const isOwnerPost = item.userId === profileUserId;
          const authorName = isOwnerPost
            ? (profile.displayName?.trim() || profile.username)
            : (identityMap.get(item.userId)?.displayName || `Oyuncu #${item.userId}`);
          const authorUsername = isOwnerPost
            ? profile.username
            : (identityMap.get(item.userId)?.username || `oyuncu-${item.userId}`);
          const authorAvatar = isOwnerPost
            ? profile.avatarUrl
            : identityMap.get(item.userId)?.avatarUrl;

          return {
            id: item.id,
            authorUserId: item.userId,
            author: {
              name: authorName,
              username: authorUsername,
              avatarUrl: authorAvatar ? getImageUrl(authorAvatar) : "",
            },
            createdAt: formatProfileDate(item.createdAt),
            createdAtRaw: item.createdAt,
            visibility: toUiPostVisibility(item.visibility),
            content: item.content,
            media: item.imageUrl
              ? [{ url: getImageUrl(item.imageUrl), alt: "Gönderi görseli", type: item.mediaType === "VIDEO" ? "video" : "image" }]
              : [],
            reactions: {
              likes: item.likeCount,
              comments: item.commentCount,
              shares: 0,
            },
            likedByMe: item.likedByCurrentUser,
            poll: item.poll,
            updatedAt: item.updatedAt,
            followedByMe: isOwnProfile ? false : (relationship?.isFollowing ?? false),
            friendStatus: isOwnProfile
              ? undefined
              : (relationship?.isFriend
                ? "friends"
                : (pendingRequest ? "pending" : "none")),
            pendingFriendRequestId,
            savedByMe: savedPostIdsRef.current.has(String(item.id)),
            rawMediaUrls: item.media?.length
              ? item.media.map((mediaItem) => mediaItem.url)
              : item.imageUrl
                ? [item.imageUrl]
                : [],
            source: "backend",
          };
        });
        const lfpPosts: SocialPost[] = lfp
          .filter((item) => item.status === "OPEN")
          .map((item) => {
            const isOwnerPost = item.userId === profileUserId;
            const authorName = isOwnerPost
              ? (profile.displayName?.trim() || profile.username)
              : (identityMap.get(item.userId)?.displayName || `Oyuncu #${item.userId}`);
            const authorUsername = isOwnerPost
              ? profile.username
              : (identityMap.get(item.userId)?.username || `oyuncu-${item.userId}`);
            const authorAvatar = isOwnerPost
              ? profile.avatarUrl
              : identityMap.get(item.userId)?.avatarUrl;

            const details = [
              `Platform: ${item.platform}`,
              item.preferredRole ? `Rol: ${item.preferredRole}` : null,
              item.playerLevel ? `Seviye: ${item.playerLevel}` : null,
              item.microphoneRequired ? "Mikrofon gerekli" : null,
              item.playTime
                ? `Oyun zamanı: ${new Intl.DateTimeFormat("tr-TR", {
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  month: "long",
                }).format(new Date(item.playTime))}`
                : null,
            ].filter(Boolean);

            return {
              id: `lfp-${item.id}`,
              authorUserId: item.userId,
              author: {
                name: authorName,
                username: authorUsername,
                avatarUrl: authorAvatar ? getImageUrl(authorAvatar) : "",
              },
              createdAt: formatProfileDate(item.createdAt),
              visibility: "public",
              content: [`İlan: ${item.title}`, item.description, details.join(" · ")]
                .filter(Boolean)
                .join("\n"),
              media: [],
              reactions: {
                likes: 0,
                comments: 0,
                shares: 0,
              },
              likedByMe: false,
              followedByMe: isOwnProfile ? false : (relationship?.isFollowing ?? false),
              friendStatus: isOwnProfile
                ? undefined
                : (relationship?.isFriend
                  ? "friends"
                  : (pendingRequest ? "pending" : "none")),
              pendingFriendRequestId,
              savedByMe: savedPostIdsRef.current.has(`lfp-${item.id}`),
              source: "lookingForPlayer",
              lookingForPlayerPostId: item.id,
              lookingForPlayerStatus: item.status,
            };
          });
        if (active) setPosts([...convertedPosts, ...lfpPosts]);
      } catch {
        if (active) setPostsError("Gönderiler yüklenemedi.");
      } finally {
        if (active) setPostsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [profileUserId, profile, resolveIdentities, postsRefreshKey, relationship, isOwnProfile, currentUserId]);

  useEffect(() => {
    if (!profile || !visibility.showGameLibrary) return;
    let active = true;
    void Promise.resolve().then(async () => {
      setGamesLoading(true);
      const category = (profile.favoriteCategories || "").split(",")[0]?.trim();
      try {
        const result = await gameService.filterGames({ genre: category || undefined });
        if (!active) return;
        const top = result.content.slice(0, 8);
        setGames(top);
        const reqEntries = await Promise.all(
          top.map(async (game) => {
            try {
              const req = await gameService.getSystemRequirementByGameId(game.id);
              return [game.id, req] as const;
            } catch {
              return null;
            }
          }),
        );
        if (!active) return;
        const map = new Map<number, GameSystemRequirement>();
        reqEntries.forEach((entry) => {
          if (entry) map.set(entry[0], entry[1]);
        });
        setGameRequirements(map);
      } finally {
        if (active) setGamesLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [profile, visibility.showGameLibrary]);

  const badges = useMemo(
    () =>
      profile
        ? mergeAssignedBadges(
          buildProfileBadges({
            profile,
            followerCount: socialSummary.followers.length,
            friendCount: socialSummary.friends.length,
            isOwnProfile,
          }),
          profile.assignedBadges,
        )
        : [],
    [profile, socialSummary, isOwnProfile],
  );

  const counts = useMemo(
    () => ({
      followers: Math.min(socialSummary.followers.length, 200),
      following: Math.min(socialSummary.following.length, 200),
      friends: Math.min(socialSummary.friends.length, 200),
      posts: Math.min(posts.length, 200),
    }),
    [socialSummary, posts.length],
  );

  const openChat = async () => {
    if (!currentUserId || !profileUserId || !profile || isOwnProfile) return;

    setRelationshipBusyAction("chat");

    try {
      cacheUserIdentity(profileUserId, profile.username);

      const room = await socialService.findOrCreateDirectChatRoom({
        targetUserId: profileUserId,
        targetUsername: profile.username,
      });
      openChatWidget(room.id);
    } catch (error) {
      showToast(getErrorMessage(error, "Sohbet başlatılamadı."), "error");
    } finally {
      setRelationshipBusyAction(null);
    }
  };

  const sendMessage = async () => {
    if (!chatState.room || !chatState.text.trim()) return;
    setChatState((prev) => ({ ...prev, loading: true }));
    try {
      await socialService.sendMessage({
        chatRoomId: chatState.room.id,
        content: chatState.text.trim(),
      });
      const messages = await socialService.getChatRoomMessages(chatState.room.id);
      setChatState((prev) => ({ ...prev, messages, text: "", loading: false }));
    } catch {
      setChatState((prev) => ({ ...prev, loading: false }));
      showToast("Mesaj gönderilemedi.", "error");
    }
  };

  const attachCommentAuthors = async (comments: SocialComment[]) => {
    const identityMap = await resolveIdentities(
      comments.flatMap((comment) =>
        [comment.userId, comment.replyingToUserId].filter(
          (userId): userId is number => typeof userId === "number",
        ),
      ),
    );
    return comments.map((comment) => {
      const isOwnerComment = comment.userId === profileUserId;
      const isMyComment = comment.userId === currentUserId;

      let name = `Oyuncu #${comment.userId}`;
      let username = `oyuncu-${comment.userId}`;
      let avatarUrl = "";

      if (isMyComment) {
        name = loggedInDisplayName || currentUser?.username || "Sen";
        username = currentUser?.username || "sen";
        avatarUrl = loggedInAvatarUrl ? getImageUrl(loggedInAvatarUrl) : "";
      } else if (isOwnerComment && profile) {
        name = profile.displayName?.trim() || profile.username;
        username = profile.username;
        avatarUrl = profile.avatarUrl ? getImageUrl(profile.avatarUrl) : "";
      } else {
        const identity = identityMap.get(comment.userId);
        if (identity) {
          name = identity.displayName;
          username = identity.username;
          avatarUrl = identity.avatarUrl ? getImageUrl(identity.avatarUrl) : "";
        }
      }

      let replyingToName = comment.replyingToName;
      if (comment.replyingToUserId) {
        if (comment.replyingToUserId === currentUserId) {
          replyingToName = loggedInDisplayName || currentUser?.username || "Sen";
        } else if (comment.replyingToUserId === profileUserId && profile) {
          replyingToName = profile.displayName?.trim() || profile.username;
        } else {
          replyingToName = identityMap.get(comment.replyingToUserId)?.displayName || `Oyuncu #${comment.replyingToUserId}`;
        }
      }

      return {
        ...comment,
        author: {
          name,
          username,
          avatarUrl,
        },
        likedByMe: comment.likedByMe ?? comment.likedByCurrentUser ?? false,
        likeCount: comment.likeCount ?? 0,
        replyingToName,
      };
    });
  };

  const handleLoadComments = async (postId: number | string) => {
    if (typeof postId !== "number") return;
    setBusyPostId(postId);
    try {
      const comments = await socialService.getComments(postId);
      const withAuthors = await attachCommentAuthors(comments);

      const repliesByParentId = new Map<number, SocialComment[]>();
      for (const comment of withAuthors) {
        if (!comment.parentCommentId) continue;
        const replies = repliesByParentId.get(comment.parentCommentId) ?? [];
        replies.push(comment);
        repliesByParentId.set(comment.parentCommentId, replies);
      }

      const structured = withAuthors
        .filter((comment) => !comment.parentCommentId)
        .map((comment) => ({
          ...comment,
          replies: repliesByParentId.get(comment.id) ?? [],
        }));

      setPosts((current) =>
        current.map((post) => (post.id === postId ? { ...post, comments: structured } : post)),
      );
    } catch (error) {
      setPostsError(getErrorMessage(error, "Yorumlar yüklenemedi."));
    } finally {
      setBusyPostId(null);
    }
  };

  const handleAddComment = async (postId: number | string, content: string) => {
    if (typeof postId !== "number") return;
    setBusyPostId(postId);
    try {
      const comment = await socialService.addComment(postId, { content });
      const [mappedComment] = await attachCommentAuthors([comment]);
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
              ...post,
              comments: [...(post.comments ?? []), { ...mappedComment, replies: [] }],
              reactions: { ...post.reactions, comments: post.reactions.comments + 1 },
            }
            : post,
        ),
      );
    } catch (error) {
      setPostsError(getErrorMessage(error, "Yorum gönderilemedi."));
    } finally {
      setBusyPostId(null);
    }
  };

  const handleAddReply = async (
    postId: number | string,
    parentCommentId: number,
    content: string,
    replyingToUserId?: number,
  ) => {
    if (typeof postId !== "number") return;
    setBusyPostId(postId);
    try {
      const comment = await socialService.addComment(postId, {
        content,
        parentCommentId,
        replyingToUserId,
      });
      const [mappedComment] = await attachCommentAuthors([comment]);

      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
              ...post,
              comments: (post.comments ?? []).map((parentComment) =>
                parentComment.id === parentCommentId
                  ? {
                    ...parentComment,
                    replies: [...(parentComment.replies ?? []), mappedComment],
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
      setPostsError(getErrorMessage(error, "Yanıt gönderilemedi."));
    } finally {
      setBusyPostId(null);
    }
  };

  const handleToggleCommentLike = async (
    postId: number | string,
    commentId: number,
    parentCommentId: number | null | undefined,
    likedByMe: boolean,
  ) => {
    if (typeof postId !== "number") return;
    try {
      if (likedByMe) {
        await socialService.unlikeComment(commentId);
      } else {
        await socialService.likeComment(commentId);
      }

      const updateCommentInPost = (
        post: SocialPost,
        commentId: number,
        parentCommentId: number | null | undefined,
        updater: (comment: SocialComment) => SocialComment,
      ): SocialPost => {
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
      };

      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? updateCommentInPost(post, commentId, parentCommentId, (comment) => ({
              ...comment,
              likedByMe: !likedByMe,
              likeCount: Math.max(0, (comment.likeCount ?? 0) + (likedByMe ? -1 : 1)),
            }))
            : post,
        ),
      );
    } catch (error) {
      setPostsError(getErrorMessage(error, "Yorum beğenisi güncellenemedi."));
    }
  };

  const handleDeleteComment = async (
    postId: number | string,
    commentId: number,
    parentCommentId?: number | null,
  ) => {
    if (typeof postId !== "number") return;
    setBusyPostId(postId);
    try {
      await socialService.deleteComment(commentId);
      setPosts((current) =>
        current.map((post) => {
          if (post.id !== postId) return post;

          if (parentCommentId) {
            return {
              ...post,
              comments: (post.comments ?? []).map((comment) =>
                comment.id === parentCommentId
                  ? {
                    ...comment,
                    replies: (comment.replies ?? []).filter((reply) => reply.id !== commentId),
                  }
                  : comment,
              ),
              reactions: {
                ...post.reactions,
                comments: Math.max(0, post.reactions.comments - 1),
              },
            };
          }

          const deletedComment = (post.comments ?? []).find((comment) => comment.id === commentId);
          const removedReplyCount = deletedComment?.replies?.length ?? 0;

          return {
            ...post,
            comments: (post.comments ?? []).filter((comment) => comment.id !== commentId),
            reactions: {
              ...post.reactions,
              comments: Math.max(0, post.reactions.comments - 1 - removedReplyCount),
            },
          };
        }),
      );
    } catch (error) {
      setPostsError(getErrorMessage(error, "Yorum silinemedi."));
    } finally {
      setBusyPostId(null);
    }
  };

  const handleToggleLike = async (postId: number | string, likedByMe: boolean) => {
    if (typeof postId !== "number") return;
    setBusyPostId(postId);
    try {
      if (likedByMe) await socialService.unlikePost(postId);
      else await socialService.likePost(postId);
      setPosts((current) =>
        current.map((post) => (post.id === postId ? { ...post, likedByMe: !likedByMe, reactions: { ...post.reactions, likes: Math.max(0, post.reactions.likes + (likedByMe ? -1 : 1)) } } : post)),
      );
    } catch (error) {
      setPostsError(getErrorMessage(error, "Beğeni işlemi tamamlanamadı."));
    } finally {
      setBusyPostId(null);
    }
  };

  const handleLoadPostLikes = async (post: SocialPost): Promise<SocialUser[]> => {
    if (typeof post.id !== "number") return [];
    try {
      const likes = await socialService.getPostLikes(post.id);
      const identityMap = await resolveIdentities(likes.map((like) => like.userId));
      return likes.map((like) => {
        const identity = identityMap.get(like.userId);
        return {
          name: identity?.displayName || `Oyuncu #${like.userId}`,
          username: identity?.username || `oyuncu-${like.userId}`,
          avatarUrl: identity?.avatarUrl ? getImageUrl(identity.avatarUrl) : "",
        };
      });
    } catch {
      return [];
    }
  };

  const handleCreatePost = useCallback(
    async (payload: { content: string; visibility?: PostVisibility }) => {
      await socialService.createPost({
        content: payload.content,
        visibility: payload.visibility ?? "PUBLIC",
      });
      setPostsRefreshKey((value) => value + 1);
      showToast("Duvar gönderin paylaşıldı.", "success");
    },
    [showToast],
  );

  const handleDeletePost = async (postId: number | string) => {
    if (typeof postId !== "number") return;
    setBusyPostId(postId);
    try {
      await socialService.deletePost(postId);
      setPosts((current) => current.filter((post) => post.id !== postId));
      showToast("Gönderi silindi.", "success");
    } catch (error) {
      setPostsError(getErrorMessage(error, "Gönderi silinemedi."));
    } finally {
      setBusyPostId(null);
    }
  };

  const handleUpdatePost = async (
    postId: number | string,
    request: SocialPostUpdateRequest,
  ) => {
    if (typeof postId !== "number") return;
    setBusyPostId(postId);
    try {
      const updatedPost = await socialService.updatePost(postId, request);
      const rawMediaUrls = updatedPost.media?.length
        ? updatedPost.media.map((mediaItem) => mediaItem.url)
        : updatedPost.imageUrl
          ? [updatedPost.imageUrl]
          : [];

      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
              ...post,
              content: updatedPost.content,
              createdAt: formatProfileDate(updatedPost.createdAt),
              createdAtRaw: updatedPost.createdAt,
              media: updatedPost.media?.length
                ? updatedPost.media.map((mediaItem) => ({
                  url: getImageUrl(mediaItem.url),
                  alt: "GÃ¶nderi medyasÄ±",
                  type: mediaItem.mediaType === "VIDEO" ? "video" : "image",
                }))
                : updatedPost.imageUrl
                  ? [{
                    url: getImageUrl(updatedPost.imageUrl),
                    alt: "GÃ¶nderi gÃ¶rseli",
                    type: updatedPost.mediaType === "VIDEO" ? "video" : "image",
                  }]
                  : [],
              rawMediaUrls,
              updatedAt: updatedPost.updatedAt,
              visibility: toUiPostVisibility(updatedPost.visibility),
            }
            : post,
        ),
      );
      showToast("GÃ¶nderi gÃ¼ncellendi.", "success");
    } catch (error) {
      setPostsError(getErrorMessage(error, "GÃ¶nderi gÃ¼ncellenemedi."));
    } finally {
      setBusyPostId(null);
    }
  };

  const handleUpdateComment = async (
    postId: number | string,
    commentId: number,
    content: string,
    parentCommentId?: number | null,
  ) => {
    if (typeof postId !== "number") return;
    setBusyPostId(postId);
    try {
      const updatedComment = await socialService.updateComment(commentId, {
        content,
      });

      const updateCommentInPost = (
        post: SocialPost,
        updater: (comment: SocialComment) => SocialComment,
      ): SocialPost => {
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
      };

      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? updateCommentInPost(post, (comment) => ({
              ...updatedComment,
              author: comment.author,
              likedByMe: comment.likedByMe,
              likeCount: comment.likeCount,
              replies: comment.replies,
            }))
            : post,
        ),
      );
      showToast("Yorum gÃ¼ncellendi.", "success");
    } catch (error) {
      setPostsError(getErrorMessage(error, "Yorum gÃ¼ncellenemedi."));
    } finally {
      setBusyPostId(null);
    }
  };

  const handleCloseLookingForPlayerPost = useCallback(
    async (postId: number) => {
      setBusyPostId(`lfp-${postId}`);
      try {
        await socialService.closeLookingForPlayerPost(postId);
        setPosts((current) =>
          current.filter((post) => post.lookingForPlayerPostId !== postId),
        );
        showToast("İlan kapatıldı.", "success");
      } catch (error) {
        setPostsError(getErrorMessage(error, "İlan kapatılamadı."));
      } finally {
        setBusyPostId(null);
      }
    },
    [showToast],
  );

  const handleCancelLookingForPlayerPost = useCallback(
    async (postId: number) => {
      setBusyPostId(`lfp-${postId}`);
      try {
        await socialService.cancelLookingForPlayerPost(postId);
        setPosts((current) =>
          current.filter((post) => post.lookingForPlayerPostId !== postId),
        );
        showToast("İlan iptal edildi.", "success");
      } catch (error) {
        setPostsError(getErrorMessage(error, "İlan iptal edilemedi."));
      } finally {
        setBusyPostId(null);
      }
    },
    [showToast],
  );

  const handleRemoveFriend = useCallback(
    async (friendUserId: number) => {
      if (!currentUserId) return;
      setRemovingFriendUserId(friendUserId);
      try {
        await socialService.removeFriend(currentUserId, friendUserId);
        setSocialSummary((current) => ({
          ...current,
          friends: current.friends.filter((userId) => userId !== friendUserId),
        }));
        setSocialIdentityGroups((current) => {
          const nextFriends = new Map(current.friends);
          nextFriends.delete(friendUserId);
          return { ...current, friends: nextFriends };
        });
        setConnectionModal((current) => {
          if (!current || current.title !== "Arkadaşlar") return current;
          const nextGroup = new Map(current.group);
          nextGroup.delete(friendUserId);
          return { ...current, group: nextGroup };
        });
        showToast("Arkadaşlık kaldırıldı.", "success");
      } catch (error) {
        showToast(getErrorMessage(error, "Arkadaşlık kaldırılamadı."), "error");
      } finally {
        setRemovingFriendUserId(null);
      }
    },
    [currentUserId, showToast],
  );

  const handleToggleFollowAuthor = async (
    authorUserId: number,
    followedByMe: boolean,
  ) => {
    try {
      if (followedByMe) {
        await socialService.unfollowUser(authorUserId);
      } else {
        await socialService.followUser({ followingUserId: authorUserId });
      }
      setPosts((current) =>
        current.map((post) =>
          post.authorUserId === authorUserId
            ? { ...post, followedByMe: !followedByMe }
            : post,
        ),
      );
      if (authorUserId === profileUserId) {
        setRelationship((prev) => (prev ? { ...prev, isFollowing: !followedByMe } : prev));
      }
      showToast(
        followedByMe ? "Takip bırakıldı." : "Takip edildi.",
        "success",
      );
    } catch (error) {
      setPostsError(getErrorMessage(error, "Takip işlemi tamamlanamadı."));
    }
  };

  const handleSendFriendRequest = async (authorUserId: number) => {
    try {
      const request = await socialService.sendFriendRequest({
        receiverUserId: authorUserId,
      });
      setPosts((current) =>
        current.map((post) =>
          post.authorUserId === authorUserId
            ? { ...post, friendStatus: "pending", pendingFriendRequestId: request.id }
            : post,
        ),
      );
      if (authorUserId === profileUserId) {
        setRelationship((prev) => (prev ? { ...prev, hasOutgoingRequestToTarget: true } : prev));
      }
      showToast("Arkadaşlık isteği gönderildi.", "success");
    } catch (error) {
      setPostsError(getErrorMessage(error, "Arkadaşlık isteği gönderilemedi."));
    }
  };

  const handleCancelFriendRequest = async (
    requestId: number,
    authorUserId: number,
  ) => {
    try {
      await socialService.cancelFriendRequest(requestId);
      setPosts((current) =>
        current.map((post) =>
          post.authorUserId === authorUserId
            ? { ...post, friendStatus: "none", pendingFriendRequestId: undefined }
            : post,
        ),
      );
      if (authorUserId === profileUserId) {
        setRelationship((prev) => (prev ? { ...prev, hasOutgoingRequestToTarget: false } : prev));
      }
      showToast("Arkadaşlık isteği iptal edildi.", "success");
    } catch (error) {
      setPostsError(getErrorMessage(error, "Arkadaşlık isteği iptal edilemedi."));
    }
  };

  const handleStartChat = async (post: SocialPost) => {
    if (typeof post.authorUserId !== "number") return;
    try {
      cacheUserIdentity(post.authorUserId, post.author.username);
      const room = await socialService.findOrCreateDirectChatRoom({
        targetUserId: post.authorUserId,
        targetUsername: post.author.username,
      });
      openChatWidget(room.id);
    } catch (error) {
      setPostsError(getErrorMessage(error, "Sohbet başlatılamadı."));
    }
  };

  const handleBlockAuthor = async (authorUserId: number) => {
    try {
      await socialService.blockUser({ blockedUserId: authorUserId });
      setPosts((current) => current.filter((post) => post.authorUserId !== authorUserId));
      if (authorUserId === profileUserId) {
        setRelationship((prev) => (prev ? { ...prev, isBlockedByMe: true } : prev));
      }
      showToast("Kullanıcı engellendi.", "success");
    } catch (error) {
      setPostsError(getErrorMessage(error, "Engelleme işlemi tamamlanamadı."));
    }
  };

  const handleSharePost = async (post: SocialPost) => {
    const shareText = post.content.slice(0, 180);
    try {
      if (navigator.share) {
        await navigator.share({
          title: "LobbyTwoZero gönderisi",
          text: shareText,
          url: window.location.href,
        });
        return;
      }
      await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      showToast("Gönderi bağlantısı panoya kopyalandı.", "success");
    } catch {
      showToast("Paylaşım tamamlanamadı.", "error");
    }
  };

  const handleToggleSave = (postId: number | string) => {
    const normalizedPostId = String(postId);
    const nextSavedPostIds = new Set(savedPostIds);
    if (nextSavedPostIds.has(normalizedPostId)) {
      nextSavedPostIds.delete(normalizedPostId);
    } else {
      nextSavedPostIds.add(normalizedPostId);
    }

    try {
      localStorage.setItem(savedPostStorageKey, JSON.stringify(Array.from(nextSavedPostIds)));
    } catch (e) {
      console.error(e);
    }
    setSavedPostIds(nextSavedPostIds);

    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, savedByMe: nextSavedPostIds.has(normalizedPostId) }
          : post,
      ),
    );
  };

  const hasHardware = visibility.showHardware;
  const hasHardwareData = Boolean(
    profile?.hardwareCpu || profile?.hardwareGpu || profile?.hardwareRam || profile?.hardwareOs,
  );
  const mainSection: ProfileNavSection =
    activeNavSection === "hardware" && !hasHardware ? "wall" : activeNavSection;

  const checkCompat = (req: GameSystemRequirement | undefined) => {
    if (!profile || !req || !hasHardwareData) return "Yetersiz veri";
    const source = `${profile.hardwareCpu} ${profile.hardwareGpu} ${profile.hardwareRam} ${profile.hardwareOs}`.toLowerCase();
    const minimum = `${req.minimumCpu} ${req.minimumGpu} ${req.minimumRam} ${req.minimumOs}`.toLowerCase();
    return minimum
      .split(" ")
      .filter(Boolean)
      .some((token) => token.length > 3 && source.includes(token))
      ? "Tahmini uyumlu"
      : "Belirsiz";
  };

  if (loading) {
    return (
      <>
        <div className="profile-page mx-auto max-w-[1860px] space-y-6 px-4 py-8">
          <ProfileSkeleton className="h-64 rounded-3xl" />
          <div className="grid grid-cols-4 gap-3">
            <ProfileSkeleton className="h-24" />
            <ProfileSkeleton className="h-24" />
            <ProfileSkeleton className="h-24" />
            <ProfileSkeleton className="h-24" />
          </div>
          <ProfileSkeleton className="h-96" />
        </div>
        {editModal}
      </>
    );
  }

  if (isRestricted) {
    return (
      <div className="relative flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="relative z-10 flex flex-col items-center max-w-md w-full rounded-2xl border border-rose-500/30 bg-zinc-950 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-mono text-lg font-bold tracking-[0.2em] text-rose-500 uppercase">
            ERİŞİM ENGELLENDİ
          </h1>
          <h2 className="mt-2 text-xl font-bold text-white">Bu Profil Gizlidir</h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Bu profil gizlilik ayarları nedeniyle yalnızca profil sahibine açıktır.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-8 flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-white/[0.02] hover:bg-white/[0.05] px-5 py-2.5 text-xs font-semibold text-zinc-300 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Geri Dön
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const categoriesList = profile.favoriteCategories
    ? profile.favoriteCategories.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const lastSeenLabel =
    profile.lastSeenAt && (visibility.showLastSeen || isOwnProfile)
      ? formatProfileDate(profile.lastSeenAt)
      : null;

  const isAdmin = normalizeRole(currentUser?.role) === "ADMIN";

  return (
    <div className="profile-page relative mx-auto max-w-[1860px] space-y-8 px-4 py-8">
      {isImageValid(profile.profileBackgroundUrl) ? (
        <div
          className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${getImageUrl(profile.profileBackgroundUrl)})` }}
        >
          <div className="absolute inset-0 bg-zinc-950/90" />
        </div>
      ) : (
        <>
          <div className="pointer-events-none absolute -left-20 top-20 -z-10 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 top-40 -z-10 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" />
        </>
      )}

      <ProfileHero
        badges={badges}
        isOwnProfile={isOwnProfile}
        lastSeenLabel={lastSeenLabel}
        onEditClick={() => setEditModalOpen(true)}
        onSettingsClick={() => setSettingsOpen(true)}
        profile={profile}
        role={displayRole}
        socialActions={
          !isOwnProfile && relationship ? (
            <ProfileSocialActions
              relationship={relationship}
              busyAction={relationshipBusyAction}
              onToggleFollow={async () => {
                if (!profileUserId || !relationship) return;
                setRelationshipBusyAction("follow");
                try {
                  if (relationship.isFollowing) {
                    await socialService.unfollowUser(profileUserId);
                  } else {
                    await socialService.followUser({ followingUserId: profileUserId });
                  }
                  setRelationship((prev) => (prev ? { ...prev, isFollowing: !prev.isFollowing } : prev));
                } finally {
                  setRelationshipBusyAction(null);
                }
              }}
              onFriendAction={async () => {
                if (!profileUserId || !relationship) return;
                setRelationshipBusyAction("friend");
                try {
                  if (relationship.hasIncomingRequestFromTarget) {
                    const incoming = await socialService.getIncomingFriendRequests(currentUserId as number);
                    const request = incoming.find((item) => item.senderUserId === profileUserId);
                    if (request) await socialService.acceptFriendRequest(request.id);
                    setRelationship((prev) =>
                      prev
                        ? {
                          ...prev,
                          isFriend: true,
                          hasIncomingRequestFromTarget: false,
                          hasOutgoingRequestToTarget: false,
                        }
                        : prev,
                    );
                  } else {
                    await socialService.sendFriendRequest({ receiverUserId: profileUserId });
                    setRelationship((prev) =>
                      prev ? { ...prev, hasOutgoingRequestToTarget: true } : prev,
                    );
                  }
                } finally {
                  setRelationshipBusyAction(null);
                }
              }}
              onRejectFriendRequest={async () => {
                if (!profileUserId || !relationship || !currentUserId) return;
                setRelationshipBusyAction("reject-friend");
                try {
                  const incoming = await socialService.getIncomingFriendRequests(currentUserId);
                  const request = incoming.find((item) => item.senderUserId === profileUserId);
                  if (request) {
                    await socialService.rejectFriendRequest(request.id);
                  }
                  setRelationship((prev) =>
                    prev ? { ...prev, hasIncomingRequestFromTarget: false } : prev,
                  );
                } finally {
                  setRelationshipBusyAction(null);
                }
              }}
              onToggleBlock={async () => {
                if (!profileUserId || !relationship || !currentUserId) return;
                setRelationshipBusyAction("block");
                try {
                  if (relationship.isBlockedByMe) {
                    await socialService.unblockUser(profileUserId);
                    setRelationship((prev) => (prev ? { ...prev, isBlockedByMe: false } : prev));
                  } else {
                    await socialService.blockUser({ blockedUserId: profileUserId });
                    setRelationship((prev) => (prev ? { ...prev, isBlockedByMe: true } : prev));
                  }
                } finally {
                  setRelationshipBusyAction(null);
                }
              }}
              onStartChat={openChat}
            />
          ) : undefined
        }
      />

      <ProfileStatRibbon
        followers={formatStatCount(visibility.showFollowerList, counts.followers)}
        following={formatStatCount(visibility.showFollowerList, counts.following)}
        friends={formatStatCount(visibility.showFriendList, counts.friends)}
        onFollowersClick={
          visibility.showFollowerList
            ? () =>
              setConnectionModal({
                title: "Takipçiler",
                group: socialIdentityGroups.followers,
              })
            : undefined
        }
        onFollowingClick={
          visibility.showFollowerList
            ? () =>
              setConnectionModal({
                title: "Takip Edilenler",
                group: socialIdentityGroups.following,
              })
            : undefined
        }
        onFriendsClick={
          visibility.showFriendList
            ? () =>
              setConnectionModal({
                title: "Arkadaşlar",
                group: socialIdentityGroups.friends,
              })
            : undefined
        }
        onPostsClick={() => switchNavSection("wall")}
        posts={`${counts.posts}${counts.posts >= 200 ? "+" : ""}`}
      />

      <ProfileQuickNav
        activeSection={settingsOpen ? "settings" : activeNavSection}
        onSectionChange={(section) => {
          setSettingsOpen(false);
          switchNavSection(section);
        }}
        showHardware={hasHardware}
      />

      {!isOwnProfile && relationshipError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3">
          <p className="text-sm text-rose-200">{relationshipError}</p>
          <button
            className="rounded-lg border border-rose-500/40 px-3 py-1.5 text-xs font-semibold text-rose-100 hover:bg-rose-500/10"
            disabled={relationshipBusyAction === "snapshot"}
            onClick={() => {
              if (!currentUserId || !Number.isFinite(profileUserId)) return;
              setRelationshipBusyAction("snapshot");
              setRelationshipError(null);
              void socialProfileService
                .getRelationshipSnapshot(currentUserId, profileUserId)
                .then(setRelationship)
                .catch(() => setRelationshipError("Sosyal bağlantı bilgisi yüklenemedi."))
                .finally(() => setRelationshipBusyAction(null));
            }}
            type="button"
          >
            Tekrar dene
          </button>
        </div>
      ) : null}

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.75fr)]">
        <div className="scroll-mt-24" id="profile-main-content">
          {mainSection === "wall" ? (
            <ProfileWallSection
              busyPostId={busyPostId}
              currentUserId={currentUserId}
              currentUserName={currentUsername}
              currentUserAvatarUrl={loggedInAvatarUrl}
              isOwnProfile={isOwnProfile}
              onAddComment={handleAddComment}
              onAddReply={handleAddReply}
              onBlockAuthor={handleBlockAuthor}
              onCreatePost={handleCreatePost}
              onDeleteComment={handleDeleteComment}
              onDeletePost={handleDeletePost}
              onLoadComments={handleLoadComments}
              onLoadPostLikes={handleLoadPostLikes}
              onSendFriendRequest={handleSendFriendRequest}
              onCancelFriendRequest={handleCancelFriendRequest}
              onCloseLookingForPlayerPost={handleCloseLookingForPlayerPost}
              onCancelLookingForPlayerPost={handleCancelLookingForPlayerPost}
              onShare={handleSharePost}
              onStartChat={handleStartChat}
              onToggleCommentLike={handleToggleCommentLike}
              onToggleFollowAuthor={handleToggleFollowAuthor}
              onToggleLike={handleToggleLike}
              onToggleSave={handleToggleSave}
              onUpdateComment={handleUpdateComment}
              onUpdatePost={handleUpdatePost}
              posts={posts}
              postsError={postsError}
              postsLoading={postsLoading}
            />
          ) : null}

          {mainSection === "about" ? (
            <ProfileAboutSection categoriesList={categoriesList} profile={profile} />
          ) : null}

          {mainSection === "hardware" && hasHardware ? (
            <ProfileHardwareSection isOwnProfile={isOwnProfile} profile={profile} />
          ) : null}

          {mainSection === "reviews" && profileUserId ? (
            <ProfileReviewsSection userId={profileUserId} />
          ) : null}

        </div>

        <div className="space-y-8">
          <ProfileSocialSidebar
            onOpenList={(title, group) => setConnectionModal({ title, group })}
            showFollowers={visibility.showFollowerList}
            showFollowing={visibility.showFollowerList}
            showFriends={visibility.showFriendList}
            socialDataLoading={socialDataLoading}
            socialError={socialError}
            socialIdentityGroups={socialIdentityGroups}
          />

          {visibility.showGameLibrary ? (
            <SectionPanel description="Favori kategorilere göre önerilen oyunlar." title="Oyun Önerileri">
              {gamesLoading ? (
                <p className="text-base text-zinc-400">Oyun önerileri yükleniyor...</p>
              ) : games.length > 0 ? (
                <div className="grid gap-3">
                  {games.map((game) => (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4" key={game.id}>
                      <p className="text-base font-semibold text-white">{game.title}</p>
                      <p className="mt-1 text-sm text-zinc-400">{game.genre || "Kategori yok"}</p>
                      <span className="mt-2 inline-flex rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-xs font-bold text-violet-300">
                        {checkCompat(gameRequirements.get(game.id))}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">Önerilecek oyun bulunamadı.</p>
              )}
            </SectionPanel>
          ) : null}
        </div>
      </div>

      <ProfileConnectionListModal
        canRemove={isOwnProfile && connectionModal?.title === "Arkadaşlar"}
        identities={connectionModal?.group ?? new Map()}
        onClose={() => setConnectionModal(null)}
        onRemove={handleRemoveFriend}
        open={Boolean(connectionModal)}
        removingUserId={removingFriendUserId}
        title={connectionModal?.title ?? ""}
      />

      <ProfileSettingsPanel
        activeTab={settingsTab}
        isAdmin={isAdmin}
        onClose={() => setSettingsOpen(false)}
        onTabChange={setSettingsTab}
        open={settingsOpen}
      />

      {editModal}

      {musicVideoId && !editModalOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-2xl border border-violet-500/35 bg-zinc-950 px-4 py-2.5 shadow-lg">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10">
            <Music className={`h-4 w-4 text-violet-400 ${isPlaying ? "opacity-100" : "opacity-60"}`} />
          </div>
          <div className="flex max-w-[140px] flex-col select-none">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              {isOwnProfile ? "Profil Müziği" : `${profile.displayName || profile.username} — Müzik`}
            </span>
            <span className="truncate text-[11px] font-bold text-zinc-200">
              {soundtrackError
                ? "Oynatılamadı"
                : soundtrackLoading
                  ? "Hazırlanıyor..."
                  : isPlaying
                    ? "Çalıyor"
                    : playerReady
                      ? "Duraklatıldı"
                      : "Oynat"}
            </span>
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-white transition-colors hover:bg-violet-500 disabled:opacity-40"
            disabled={soundtrackLoading || soundtrackError}
            onClick={() => void togglePlayback()}
            type="button"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-white" />
            ) : (
              <Play className="h-4 w-4 fill-white ml-0.5" />
            )}
          </button>
        </div>
      )}

      <ProfileDevNote />

      {chatState.open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-800 p-3">
              <p className="text-sm font-bold text-white">Sohbet</p>
              <button
                type="button"
                className="rounded p-1 text-zinc-400 hover:text-white"
                onClick={() => setChatState((prev) => ({ ...prev, open: false }))}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto p-3">
              {chatState.messages.map((message) => (
                <div key={message.id} className="rounded-lg border border-zinc-800 p-2 text-xs text-zinc-200">
                  <p>{message.content}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t border-zinc-800 p-3">
              <input
                value={chatState.text}
                onChange={(event) => setChatState((prev) => ({ ...prev, text: event.target.value }))}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white outline-none"
                placeholder="Mesaj yaz..."
              />
              <button
                type="button"
                disabled={chatState.loading || !chatState.text.trim()}
                onClick={() => void sendMessage()}
                className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
