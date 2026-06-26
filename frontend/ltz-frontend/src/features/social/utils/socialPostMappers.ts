import { formatSocialTime } from "../../../utils/formatSocialTime";
import { getImageUrl, isImageValid } from "../../user/utils/profileImage";
import { userService } from "../../user/services/userService";
import type { UserProfileResponse } from "../../user/types/user";
import type {
  SocialComment,
  SocialPost,
  SocialPostLikeResponse,
  SocialPostResponse,
  SocialUser,
} from "../types/social.types";
import { toUiPostVisibility } from "../types/social.types";

export function resolveMediaUrl(imageUrl: string): string {
  return getImageUrl(imageUrl.trim());
}

function resolveProfileAvatar(avatarUrl?: string | null): string {
  if (!avatarUrl?.trim()) return "";
  return isImageValid(avatarUrl) ? getImageUrl(avatarUrl) : "";
}

export function resolveAuthor(
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

export function mapCommentAuthor(
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

export function structurePostComments(
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

export function updateCommentInPost(
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

export function mapLikeUsers(
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

export function mapBackendPostToSocialPost(
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
        alt:
          media.mediaType === "VIDEO" ? "Gönderi videosu" : "Gönderi görseli",
        type:
          media.mediaType === "VIDEO" ? ("video" as const) : ("image" as const),
      }))
    : post.imageUrl?.trim()
      ? [
          {
            url: resolveMediaUrl(post.imageUrl),
            alt:
              mediaType === "video" ? "Gönderi videosu" : "Gönderi görseli",
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

export async function loadUserProfiles(
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
