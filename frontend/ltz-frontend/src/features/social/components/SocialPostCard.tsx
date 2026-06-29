import {
  Ban,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Earth,
  FastForward,
  Gamepad2,
  Heart,
  Lock,
  Maximize2,
  MessageCircle,
  MessageSquare,
  Minimize2,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Rewind,
  Share2,
  Smile,
  Tag,
  ThumbsUp,
  UserPlus,
  UserRoundPlus,
  UserCheck,
  Users,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

import { formatSocialTime } from "../../../utils/formatSocialTime";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { UserAvatar } from "../../user/components/UserAvatar";
import { useCurrentUserProfile } from "../../user/context/CurrentUserProfileContext";
import {
  DEFAULT_EMOJIS,
  EmojiPickerPopover,
} from "../../../components/ui/EmojiPickerPopover";
import type {
  PostPoll,
  PostVisibility,
  SocialComment,
  SocialPost,
  SocialPostUpdateRequest,
  SocialUser,
} from "../types/social.types";
import { socialService } from "../services/socialService";

interface SocialPostCardProps {
  post: SocialPost;
  currentUserId?: number;
  currentUserName?: string;
  isBusy?: boolean;
  onAddComment: (postId: number | string, content: string) => Promise<void>;
  onAddReply: (
      postId: number | string,
      parentCommentId: number,
      content: string,
      replyingToUserId?: number,
  ) => Promise<void>;
  onBlockAuthor: (authorUserId: number) => Promise<void>;
  onDeleteComment: (
      postId: number | string,
      commentId: number,
      parentCommentId?: number | null,
  ) => Promise<void>;
  onDeletePost: (postId: number | string) => Promise<void>;
  onUpdatePost: (
      postId: number | string,
      request: SocialPostUpdateRequest,
  ) => Promise<void>;
  onUpdateComment: (
      postId: number | string,
      commentId: number,
      content: string,
      parentCommentId?: number | null,
  ) => Promise<void>;
  onToggleFollowAuthor: (
      authorUserId: number,
      followedByMe: boolean,
  ) => Promise<void>;
  onLoadComments: (postId: number | string) => Promise<void>;
  onLoadPostLikes: (post: SocialPost) => Promise<SocialUser[]>;
  onOpenProfile: (username: string) => void;
  onSendFriendRequest: (authorUserId: number) => Promise<void>;
  onCancelFriendRequest: (
      requestId: number,
      authorUserId: number,
  ) => Promise<void>;
  onShare: (post: SocialPost) => Promise<void>;
  onStartChat: (post: SocialPost) => Promise<void>;
  onToggleCommentLike: (
      postId: number | string,
      commentId: number,
      parentCommentId: number | null | undefined,
      likedByMe: boolean,
  ) => Promise<void>;
  onToggleSave: (postId: number | string) => void;
  onToggleLike: (postId: number | string, likedByMe: boolean) => Promise<void>;
  onCloseLookingForPlayerPost?: (postId: number) => Promise<void>;
  onCancelLookingForPlayerPost?: (postId: number) => Promise<void>;
}

interface ParsedPollContent {
  body: string;
  options: string[];
  question: string;
}

interface ParsedGameContent {
  body: string;
  title: string;
}

interface ParsedListingContent {
  description: string;
  details: Array<{
    label: string;
    value: string;
  }>;
  title: string;
}

interface FullscreenVideoElement extends HTMLVideoElement {
  webkitEnterFullscreen?: () => void;
}

function parsePollContent(content: string): ParsedPollContent | null {
  const lines = content.split("\n");
  const firstLine = lines[0]?.trim();

  if (!firstLine?.startsWith("Anket:")) return null;

  const question = firstLine.replace(/^Anket:\s*/, "").trim();
  const options = lines
      .filter((line) => /^\d+\.\s+/.test(line.trim()))
      .map((line) =>
          line
              .trim()
              .replace(/^\d+\.\s+/, "")
              .trim(),
      );
  const body = lines
      .slice(1)
      .filter((line) => !/^\d+\.\s+/.test(line.trim()))
      .join("\n")
      .trim();

  return question && options.length >= 2 ? { body, options, question } : null;
}

function formatPollRemaining(expiresAt: string): string {
  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  if (remainingMs <= 0) return "Anket sona erdi";
  const remainingMinutes = Math.ceil(remainingMs / 60_000);
  if (remainingMinutes < 60) return `${remainingMinutes} dk kaldı`;
  const remainingHours = Math.ceil(remainingMinutes / 60);
  if (remainingHours < 24) return `${remainingHours} sa kaldı`;
  return `${Math.ceil(remainingHours / 24)} gün kaldı`;
}

function parseGameContent(content: string): ParsedGameContent | null {
  const lines = content.split("\n");
  const firstLine = lines[0]?.trim();

  if (!firstLine?.startsWith("Oyun:")) return null;

  const title = firstLine.replace(/^Oyun:\s*/, "").trim();
  const body = lines.slice(1).join("\n").trim();

  return title ? { body, title } : null;
}

function parseListingContent(content: string): ParsedListingContent | null {
  const lines = content.split("\n");
  const firstLine = lines[0]?.trim();

  if (!firstLine?.startsWith("İlan:")) return null;

  const title = firstLine.replace(/^İlan:\s*/, "").trim();
  const detailLine = lines.find((line) => line.includes("Platform:"));
  const details =
      detailLine
          ?.split(" · ")
          .map((part) => {
            const normalizedPart = part.trim();

            if (normalizedPart === "Mikrofon gerekli") {
              return {
                label: "Mikrofon",
                value: "Gerekli",
              };
            }

            const [label, ...valueParts] = part.split(":");
            return {
              label: label?.trim() ?? "",
              value: valueParts.join(":").trim(),
            };
          })
          .filter((detail) => detail.label && detail.value) ?? [];
  const description = lines
      .slice(1)
      .filter((line) => line !== detailLine)
      .join("\n")
      .trim();

  return title ? { description, details, title } : null;
}

function formatVideoTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

const API_VISIBILITY_BY_UI: Record<SocialPost["visibility"], PostVisibility> = {
  public: "PUBLIC",
  followers: "FOLLOWERS_ONLY",
  friends: "FRIENDS",
  private: "PRIVATE",
};

const EDIT_VISIBILITY_OPTIONS: Array<{
  label: string;
  value: SocialPost["visibility"];
}> = [
  { label: "Herkes görebilir", value: "public" },
  { label: "Yalnızca takipçilerim", value: "followers" },
  { label: "Yalnızca arkadaşlarım", value: "friends" },
  { label: "Yalnızca ben", value: "private" },
];

function isEdited(createdAt?: string, updatedAt?: string | null) {
  if (!updatedAt) return false;
  return new Date(updatedAt).getTime() > new Date(createdAt ?? 0).getTime();
}

export function SocialPostCard({
                                 post,
                                 currentUserId,
                                 currentUserName,
                                 isBusy = false,
                                 onAddComment,
                                 onAddReply,
                                 onBlockAuthor,
                                 onDeleteComment,
                                 onDeletePost,
                                 onUpdatePost,
                                 onUpdateComment,
                                 onToggleFollowAuthor,
                                 onLoadComments,
                                 onLoadPostLikes,
                                 onOpenProfile,
                                 onSendFriendRequest,
                                 onCancelFriendRequest,
                                 onShare,
                                 onStartChat,
                                 onToggleCommentLike,
                                 onToggleSave,
                                 onToggleLike,
                                 onCloseLookingForPlayerPost,
                                 onCancelLookingForPlayerPost,
                               }: SocialPostCardProps) {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const { avatarUrl: loggedInUserAvatarUrl } = useCurrentUserProfile();
  const activeMedia = post.media[activeMediaIndex] ?? post.media[0];
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoVolume, setVideoVolume] = useState(1);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [editPostContent, setEditPostContent] = useState(post.content);
  const [editPostVisibility, setEditPostVisibility] =
      useState<SocialPost["visibility"]>(post.visibility);
  const [editPostMediaUrls, setEditPostMediaUrls] = useState(
      (post.rawMediaUrls ?? []).join("\n"),
  );
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentParentId, setEditingCommentParentId] = useState<
      number | null
  >(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [likesOpen, setLikesOpen] = useState(false);
  const [likedUsers, setLikedUsers] = useState<SocialUser[]>([]);
  const [likesLoading, setLikesLoading] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyFormCommentId, setReplyFormCommentId] = useState<number | null>(
      null,
  );
  const [replyFormTargetReplyId, setReplyFormTargetReplyId] = useState<
      number | null
  >(null);
  const [commentEmojiOpen, setCommentEmojiOpen] = useState(false);
  const [replyEmojiOpenForCommentId, setReplyEmojiOpenForCommentId] = useState<
      string | null
  >(null);
  const [replyingToName, setReplyingToName] = useState<string | null>(null);
  const [replyingToUserId, setReplyingToUserId] = useState<number | null>(null);
  const [visibleReplyCommentIds, setVisibleReplyCommentIds] = useState<
      Set<number>
  >(() => new Set());
  const [failedMediaUrls, setFailedMediaUrls] = useState<Set<string>>(
      () => new Set(),
  );
  const [poll, setPoll] = useState<PostPoll | undefined>(post.poll);
  const [pollVoteLoading, setPollVoteLoading] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);

  const canUseAuthorActions =
      typeof post.authorUserId === "number" &&
      currentUserId !== post.authorUserId;
  const canUsePostActions = post.source === "backend" && typeof post.id === "number";
  const isOwnLookingForPlayerPost =
      post.source === "lookingForPlayer" &&
      currentUserId === post.authorUserId &&
      post.lookingForPlayerStatus === "OPEN" &&
      typeof post.lookingForPlayerPostId === "number";
  const pollContent = parsePollContent(post.content);
  const gameContent = pollContent ? null : parseGameContent(post.content);
  const listingContent =
      pollContent || gameContent ? null : parseListingContent(post.content);
  const videoProgressPercent = videoDuration
      ? Math.min(100, Math.max(0, (videoCurrentTime / videoDuration) * 100))
      : 0;
  const videoVolumePercent = (isVideoMuted ? 0 : videoVolume) * 100;

  useEffect(() => {
    setPoll(post.poll);
    setPollError(null);
  }, [post.poll]);

  useEffect(() => {
    setEditPostContent(post.content);
    setEditPostVisibility(post.visibility);
    setEditPostMediaUrls((post.rawMediaUrls ?? []).join("\n"));
  }, [post.content, post.rawMediaUrls, post.visibility]);

  async function handlePollVote(optionId: number) {
    if (
      typeof post.id !== "number" ||
      !poll ||
      poll.closed ||
      poll.selectedOptionId ||
      pollVoteLoading
    ) {
      return;
    }

    setPollVoteLoading(true);
    setPollError(null);
    try {
      setPoll(await socialService.votePoll(post.id, optionId));
    } catch (error) {
      setPollError(getErrorMessage(error, "Oy kullanılamadı."));
    } finally {
      setPollVoteLoading(false);
    }
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      setIsVideoPlaying(false);
      setVideoCurrentTime(0);
      setVideoDuration(0);
    });
  }, [activeMedia?.url]);

  useEffect(() => {
    function syncFullscreenState() {
      setIsVideoFullscreen(document.fullscreenElement === videoContainerRef.current);
    }

    document.addEventListener("fullscreenchange", syncFullscreenState);

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
    };
  }, []);

  function markMediaAsFailed(url: string) {
    setFailedMediaUrls((currentUrls) => {
      const nextUrls = new Set(currentUrls);
      nextUrls.add(url);
      return nextUrls;
    });
  }

  function changeActiveMedia(nextIndex: number) {
    const mediaCount = post.media.length;
    if (mediaCount === 0) return;

    setActiveMediaIndex((nextIndex + mediaCount) % mediaCount);
  }

  function seekVideo(seconds: number) {
    if (!videoRef.current) return;

    videoRef.current.currentTime = Math.max(
        0,
        Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds),
    );
  }

  function setVideoTime(nextTime: number) {
    if (!videoRef.current) return;

    videoRef.current.currentTime = Math.max(
        0,
        Math.min(videoDuration || 0, nextTime),
    );
    setVideoCurrentTime(videoRef.current.currentTime);
  }

  async function toggleVideoPlayback() {
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      await videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  }

  function toggleVideoMute() {
    if (!videoRef.current) return;

    videoRef.current.muted = !videoRef.current.muted;
    setIsVideoMuted(videoRef.current.muted);
  }

  function changeVideoVolume(nextVolume: number) {
    if (!videoRef.current) return;

    const normalizedVolume = Math.max(0, Math.min(1, nextVolume));

    videoRef.current.volume = normalizedVolume;
    videoRef.current.muted = normalizedVolume === 0;
    setVideoVolume(normalizedVolume);
    setIsVideoMuted(videoRef.current.muted);
  }

  async function toggleVideoFullscreen() {
    const videoElement = videoRef.current as FullscreenVideoElement | null;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    if (videoContainerRef.current?.requestFullscreen) {
      await videoContainerRef.current.requestFullscreen();
      return;
    }

    if (videoElement?.webkitEnterFullscreen) {
      videoElement.webkitEnterFullscreen();
    }
  }

  function handleVideoKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (activeMedia?.type !== "video") return;

    if (event.key === "ArrowRight") {
      event.preventDefault();
      seekVideo(5);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      seekVideo(-5);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      changeVideoVolume((isVideoMuted ? 0 : videoVolume) + 0.1);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      changeVideoVolume((isVideoMuted ? 0 : videoVolume) - 0.1);
      return;
    }

    if (event.key === " ") {
      event.preventDefault();
      void toggleVideoPlayback();
    }
  }

  async function handleToggleComments() {
    const nextOpen = !commentsOpen;
    setCommentsOpen(nextOpen);

    if (nextOpen && !post.comments) {
      await onLoadComments(post.id);
    }
  }

  async function handleAddComment() {
    const trimmedComment = commentText.trim();

    if (!trimmedComment || isBusy) return;

    await onAddComment(post.id, trimmedComment);
    setCommentText("");
    setCommentsOpen(true);
  }

  async function handleUpdatePost() {
    const trimmedContent = editPostContent.trim();
    if (!trimmedContent || isBusy) return;

    const mediaUrls = editPostMediaUrls
        .split(/\r?\n|,/)
        .map((url) => url.trim())
        .filter(Boolean);

    await onUpdatePost(post.id, {
      content: trimmedContent,
      imageUrl: mediaUrls[0],
      mediaUrls,
      visibility: API_VISIBILITY_BY_UI[editPostVisibility],
    });
    setEditingPost(false);
  }

  function openCommentEdit(
      comment: SocialComment,
      parentCommentId: number | null = null,
  ) {
    setEditingCommentId(comment.id);
    setEditingCommentParentId(parentCommentId);
    setEditCommentText(comment.content);
  }

  async function submitCommentEdit() {
    if (!editingCommentId || !editCommentText.trim() || isBusy) return;

    await onUpdateComment(
        post.id,
        editingCommentId,
        editCommentText.trim(),
        editingCommentParentId,
    );
    setEditingCommentId(null);
    setEditingCommentParentId(null);
    setEditCommentText("");
  }

  async function handleOpenLikes() {
    setLikesOpen(true);

    if (!likedUsers.length && post.reactions.likes > 0) {
      setLikesLoading(true);
      const users = await onLoadPostLikes(post);
      setLikedUsers(users);
      setLikesLoading(false);
    }
  }

  async function handleToggleCommentLike(
      commentId: number,
      parentCommentId: number | null | undefined,
      likedByMe: boolean,
  ) {
    if (!canUsePostActions || isBusy) return;

    await onToggleCommentLike(post.id, commentId, parentCommentId, likedByMe);
  }

  function toggleReplies(commentId: number) {
    setVisibleReplyCommentIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(commentId)) {
        nextIds.delete(commentId);
      } else {
        nextIds.add(commentId);
      }

      return nextIds;
    });
  }

  function getReplyDraftKey(
      parentCommentId: number,
      targetReplyId?: number | null,
  ) {
    return targetReplyId
        ? `${parentCommentId}:${targetReplyId}`
        : `${parentCommentId}:root`;
  }

  function openReplyForm(
      commentId: number,
      targetName: string,
      targetUserId: number,
      targetReplyId: number | null = null,
  ) {
    setReplyFormCommentId(commentId);
    setReplyFormTargetReplyId(targetReplyId);
    setReplyingToName(targetName);
    setReplyingToUserId(targetUserId);
    setVisibleReplyCommentIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(commentId);
      return nextIds;
    });
  }

  async function submitReply(parentCommentId: number) {
    const draftKey = getReplyDraftKey(parentCommentId, replyFormTargetReplyId);
    const replyContent = replyDrafts[draftKey]?.trim();

    if (!replyContent || !canUsePostActions || isBusy) return;

    await onAddReply(
        post.id,
        parentCommentId,
        replyContent,
        replyingToUserId ?? undefined,
    );
    setReplyDrafts((currentDrafts) => ({ ...currentDrafts, [draftKey]: "" }));
    setVisibleReplyCommentIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(parentCommentId);
      return nextIds;
    });
    setReplyFormCommentId(null);
    setReplyFormTargetReplyId(null);
    setReplyingToName(null);
    setReplyingToUserId(null);
    setReplyEmojiOpenForCommentId(null);
  }

  function addEmojiToReply(parentCommentId: number, emoji: string) {
    const draftKey = getReplyDraftKey(parentCommentId, replyFormTargetReplyId);

    setReplyDrafts((currentDrafts) => ({
      ...currentDrafts,
      [draftKey]: `${currentDrafts[draftKey] ?? ""}${emoji}`,
    }));
  }

  function renderReplyForm(parentCommentId: number, placeholderName: string) {
    const draftKey = getReplyDraftKey(parentCommentId, replyFormTargetReplyId);
    const alignEmojiPickerLeft = replyingToUserId === currentUserId;

    return (
        <div className="mt-3 flex items-center gap-2">
          <UserAvatar
              name={currentUserName ?? "Sen"}
              avatarUrl={currentUserAvatarUrl}
              className="h-8 w-8"
              imageClassName="h-8 w-8 rounded-full border border-white/15 object-cover"
              fallbackClassName="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-violet-700 text-[10px] font-bold text-white"
          />
          <div className="relative flex flex-1 items-center">
            <input
                className="h-9 w-full rounded-full border border-white/10 bg-slate-950/55 px-3 pr-10 text-xs text-white outline-none placeholder:text-zinc-500 focus:border-violet-400/60"
                maxLength={500}
                onChange={(event) => {
                  setReplyDrafts((currentDrafts) => ({
                    ...currentDrafts,
                    [draftKey]: event.target.value,
                  }));
                  setReplyEmojiOpenForCommentId(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void submitReply(parentCommentId);
                  }
                }}
                placeholder={`${
                    replyingToName ?? placeholderName
                } kullanıcısına yanıt yaz...`}
                value={replyDrafts[draftKey] ?? ""}
            />
            <button
                aria-label="Emoji ekle"
                className="absolute right-2 grid h-7 w-7 cursor-pointer place-items-center rounded-full text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
                onClick={() =>
                    setReplyEmojiOpenForCommentId((currentId) =>
                        currentId === draftKey ? null : draftKey,
                    )
                }
                type="button"
            >
              <Smile size={15} />
            </button>
            {replyEmojiOpenForCommentId === draftKey && (
                <EmojiPickerPopover
                    className={
                      alignEmojiPickerLeft
                          ? "absolute bottom-11 left-0 z-[140] grid w-56 grid-cols-6 gap-1 rounded-lg border border-white/10 bg-[#0b1220] p-2 shadow-2xl shadow-black/40"
                          : "absolute bottom-11 right-0 z-[140] grid w-56 grid-cols-6 gap-1 rounded-lg border border-white/10 bg-[#0b1220] p-2 shadow-2xl shadow-black/40"
                    }
                    emojis={DEFAULT_EMOJIS}
                    onClose={() => setReplyEmojiOpenForCommentId(null)}
                    onSelect={(emoji) => addEmojiToReply(parentCommentId, emoji)}
                />
            )}
          </div>
          <button
              className="h-9 cursor-pointer rounded-full bg-violet-700 px-3 text-xs font-bold text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!replyDrafts[draftKey]?.trim() || isBusy}
              onClick={() => void submitReply(parentCommentId)}
              type="button"
          >
            Yanıtla
          </button>
        </div>
    );
  }

  function addEmojiToComment(emoji: string) {
    setCommentText((currentText) => `${currentText}${emoji}`);
  }

  async function runAuthorAction(action: () => Promise<void>) {
    setActionsOpen(false);
    await action();
  }

  function getCommentAuthorName(commentUserId: number) {
    if (commentUserId === currentUserId) {
      return currentUserName ?? "Sen";
    }

    if (commentUserId === post.authorUserId) {
      return post.author.name;
    }

    return `Oyuncu #${commentUserId}`;
  }

  function getCommentAvatar(commentUserId: number) {
    if (commentUserId === currentUserId) {
      return post.authorUserId === currentUserId
          ? post.author.avatarUrl
          : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80";
    }

    if (commentUserId === post.authorUserId) {
      return post.author.avatarUrl;
    }

    return "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80";
  }

  const currentUserAvatarUrl = loggedInUserAvatarUrl;

  function openUserProfile(username?: string) {
    if (!username) return;
    onOpenProfile(username);
  }

  return (
      <article className="rounded-lg border border-white/10 bg-[#0a101c]/88 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl">
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
                className="shrink-0 cursor-pointer rounded-full transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-violet-400/70"
                onClick={() => openUserProfile(post.author.username)}
                type="button"
            >
              <UserAvatar
                  avatarUrl={post.author.avatarUrl}
                  className="h-12 w-12"
                  imageClassName="h-12 w-12 rounded-full border border-fuchsia-300/40 object-cover"
                  name={post.author.name}
              />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                    className="cursor-pointer text-left text-base font-bold text-white transition hover:text-violet-200"
                    onClick={() => openUserProfile(post.author.username)}
                    type="button"
                >
                  {post.author.name}
                </button>
                {post.author.verified && (
                    <span className="grid h-4 w-4 place-items-center rounded-full bg-violet-500 text-[10px] font-black text-white">
                  ✓
                </span>
                )}
                {post.communityName ? (
                    <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-200">
                      {post.communityName}
                    </span>
                ) : null}
                {canUseAuthorActions && (
                    <button
                        className={
                          post.followedByMe
                              ? "ml-1 cursor-pointer rounded-full border border-white/10 px-3 py-1 text-[11px] font-bold text-zinc-300 transition hover:border-violet-300/50 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                              : "ml-1 cursor-pointer rounded-full bg-violet-700 px-3 py-1 text-[11px] font-bold text-white transition hover:-translate-y-0.5 hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
                        }
                        disabled={isBusy}
                        onClick={() =>
                            void onToggleFollowAuthor(
                                post.authorUserId as number,
                                Boolean(post.followedByMe),
                            )
                        }
                        type="button"
                    >
                      {post.followedByMe ? "Takibi bırak" : "Takip et"}
                    </button>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400">
                <span>{post.createdAt}</span>
                <span>·</span>
                {post.communityName ? (
                    <>
                      <Users size={13} />
                      <span>{post.communityName} topluluğu</span>
                    </>
                ) : post.visibility === "private" ? (
                    <>
                      <Lock size={13} />
                      <span>Yalnızca ben</span>
                    </>
                ) : post.visibility === "friends" ? (
                    <>
                      <Users size={13} />
                      <span>Arkadaşlar</span>
                    </>
                ) : post.visibility === "followers" ? (
                    <>
                      <UserPlus size={13} />
                      <span>Takipçiler</span>
                    </>
                ) : (
                    <>
                      <Earth size={13} />
                      <span>Herkese açık</span>
                    </>
                )}
                {post.lookingForPlayerStatus && post.lookingForPlayerStatus !== "OPEN" ? (
                    <>
                      <span>·</span>
                      <span>
                        {post.lookingForPlayerStatus === "CLOSED"
                            ? "İlan kapandı"
                            : "İlan iptal edildi"}
                      </span>
                    </>
                ) : null}
                {isEdited(post.createdAtRaw ?? post.createdAt, post.updatedAt) ? (
                    <>
                      <span>Â·</span>
                      <span>DÃ¼zenlendi</span>
                    </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="relative flex items-center gap-1">
            {isOwnLookingForPlayerPost ? (
                <>
                  <button
                      className="cursor-pointer rounded-md px-3 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/10 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isBusy}
                      onClick={() =>
                          void onCloseLookingForPlayerPost?.(
                              post.lookingForPlayerPostId as number,
                          )
                      }
                      type="button"
                  >
                    İlanı kapat
                  </button>
                  <button
                      className="cursor-pointer rounded-md px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/10 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isBusy}
                      onClick={() =>
                          void onCancelLookingForPlayerPost?.(
                              post.lookingForPlayerPostId as number,
                          )
                      }
                      type="button"
                  >
                    İptal et
                  </button>
                </>
            ) : null}
            {currentUserId === post.authorUserId && canUsePostActions ? (
                <>
                  <button
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isBusy}
                      onClick={() => {
                        setEditPostContent(post.content);
                        setEditPostVisibility(post.visibility);
                        setEditPostMediaUrls((post.rawMediaUrls ?? []).join("\n"));
                        setEditingPost((isEditing) => !isEditing);
                      }}
                      type="button"
                  >
                    <Pencil size={14} />
                    DÃ¼zenle
                  </button>
                  <button
                      className="cursor-pointer rounded-md px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/10 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isBusy}
                      onClick={() => void onDeletePost(post.id)}
                      type="button"
                  >
                    Sil
                  </button>
                </>
            ) : null}
            <button
                aria-expanded={actionsOpen}
                aria-label="Gönderi seçenekleri"
                className="cursor-pointer rounded-md p-2 text-zinc-400 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canUseAuthorActions || isBusy}
                onClick={() => setActionsOpen((currentValue) => !currentValue)}
                type="button"
            >
              <MoreHorizontal size={19} />
            </button>

            {actionsOpen && canUseAuthorActions && (
                <div className="absolute right-0 top-10 z-20 w-52 overflow-hidden rounded-lg border border-white/10 bg-[#0b1220] p-1 shadow-2xl shadow-black/40">
                  <ActionMenuButton
                      icon={<UserPlus size={16} />}
                      label={post.followedByMe ? "Takibi bırak" : "Takip et"}
                      onClick={() =>
                          void runAuthorAction(() =>
                              onToggleFollowAuthor(
                                  post.authorUserId as number,
                                  Boolean(post.followedByMe),
                              ),
                          )
                      }
                  />
                  <ActionMenuButton
                      icon={
                        post.friendStatus === "friends" ? (
                            <UserCheck size={16} />
                        ) : (
                            <UserRoundPlus size={16} />
                        )
                      }
                      label={
                        post.friendStatus === "friends"
                            ? "Arkadaş"
                            : post.friendStatus === "pending"
                                ? "İsteği geri çek"
                                : "Arkadaş ekle"
                      }
                      disabled={post.friendStatus === "friends"}
                      onClick={() =>
                          void runAuthorAction(() => {
                            if (
                                post.friendStatus === "pending" &&
                                post.pendingFriendRequestId
                            ) {
                              return onCancelFriendRequest(
                                  post.pendingFriendRequestId,
                                  post.authorUserId as number,
                              );
                            }

                            if (post.friendStatus !== "none") {
                              return Promise.resolve();
                            }

                            return onSendFriendRequest(post.authorUserId as number);
                          })
                      }
                  />
                  <ActionMenuButton
                      icon={<MessageCircle size={16} />}
                      label="Mesaj başlat"
                      onClick={() => void runAuthorAction(() => onStartChat(post))}
                  />
                  <ActionMenuButton
                      danger
                      icon={<Ban size={16} />}
                      label="Engelle"
                      onClick={() =>
                          void runAuthorAction(() =>
                              onBlockAuthor(post.authorUserId as number),
                          )
                      }
                  />
                </div>
            )}
          </div>
        </header>

        {editingPost ? (
            <section className="mt-4 rounded-lg border border-violet-400/20 bg-violet-500/[0.055] p-4">
              <div className="grid gap-3">
                <textarea
                    className="min-h-28 w-full resize-y rounded-lg border border-white/10 bg-slate-950/55 px-3 py-2 text-sm leading-6 text-white outline-none placeholder:text-zinc-500 focus:border-violet-400/60"
                    maxLength={2000}
                    onChange={(event) => setEditPostContent(event.target.value)}
                    value={editPostContent}
                />
                <div className="grid gap-3 sm:grid-cols-[minmax(0,220px)_1fr]">
                  <select
                      className="h-10 rounded-lg border border-white/10 bg-slate-950/55 px-3 text-sm font-semibold text-white outline-none focus:border-violet-400/60"
                      onChange={(event) =>
                          setEditPostVisibility(
                              event.target.value as SocialPost["visibility"],
                          )
                      }
                      value={editPostVisibility}
                  >
                    {EDIT_VISIBILITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                    ))}
                  </select>
                  <textarea
                      className="min-h-10 resize-y rounded-lg border border-white/10 bg-slate-950/55 px-3 py-2 text-sm leading-5 text-white outline-none placeholder:text-zinc-500 focus:border-violet-400/60"
                      onChange={(event) => setEditPostMediaUrls(event.target.value)}
                      placeholder="Medya URL'leri"
                      value={editPostMediaUrls}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                      className="h-9 cursor-pointer rounded-lg border border-white/10 px-4 text-xs font-bold text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                      onClick={() => setEditingPost(false)}
                      type="button"
                  >
                    VazgeÃ§
                  </button>
                  <button
                      className="h-9 cursor-pointer rounded-lg bg-violet-700 px-4 text-xs font-bold text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!editPostContent.trim() || isBusy}
                      onClick={() => void handleUpdatePost()}
                      type="button"
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            </section>
        ) : null}

        {poll ? (
            <section className="mt-4 rounded-xl border border-violet-400/25 bg-violet-500/[0.055] p-4">
              <h3 className="text-lg font-bold text-white">{poll.question}</h3>
              {post.content && post.content !== poll.question ? (
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-300">
                  {post.content}
                </p>
              ) : null}
              <div className="mt-4 grid gap-2">
                {poll.options.map((option) => {
                  const showResults = Boolean(poll.selectedOptionId) || poll.closed;
                  return (
                    <button
                      className={`relative min-h-12 overflow-hidden rounded-xl border px-4 text-left transition ${
                        option.selectedByCurrentUser
                          ? "border-violet-400 bg-violet-500/15"
                          : "border-white/10 bg-slate-950/40 hover:border-violet-400/50"
                      } disabled:cursor-default`}
                      disabled={
                        pollVoteLoading ||
                        poll.closed ||
                        Boolean(poll.selectedOptionId)
                      }
                      key={option.id}
                      onClick={() => void handlePollVote(option.id)}
                      type="button"
                    >
                      {showResults ? (
                        <span
                          className="absolute inset-y-0 left-0 bg-violet-500/20 transition-all"
                          style={{ width: `${option.percentage}%` }}
                        />
                      ) : null}
                      <span className="relative flex items-center justify-between gap-3 text-sm font-semibold text-zinc-100">
                        <span>
                          {option.selectedByCurrentUser ? "✓ " : ""}
                          {option.text}
                        </span>
                        {showResults ? <span>{option.percentage}%</span> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
                <span>{poll.totalVotes} oy</span>
                <span>{formatPollRemaining(poll.expiresAt)}</span>
              </div>
              {pollError ? (
                <p className="mt-2 text-xs font-semibold text-red-300">{pollError}</p>
              ) : null}
            </section>
        ) : pollContent ? (
            <section className="mt-4 rounded-lg border border-violet-400/20 bg-violet-500/[0.055] p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-200">
                  Eski anket
                </p>
                <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-100">
                  Salt okunur
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                {pollContent.question}
              </h3>
              {pollContent.body && (
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-300">
                    {pollContent.body}
                  </p>
              )}
              <div className="mt-4 grid gap-2">
                {pollContent.options.map((option, index) => (
                      <div
                          className="flex min-h-11 items-center justify-between rounded-lg border border-white/10 bg-slate-950/35 px-4 text-left text-sm font-semibold text-zinc-200"
                          key={`${option}-${index}`}
                      >
                        <span>{option}</span>
                        <span className="text-[11px] font-bold text-zinc-500">
                          {index + 1}
                        </span>
                      </div>
                ))}
              </div>
            </section>
        ) : gameContent ? (
            <section className="mt-4 overflow-hidden rounded-lg border border-violet-300/20 bg-violet-500/[0.07]">
              <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-violet-500/20 text-violet-100">
                  <Gamepad2 size={19} />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-black text-white">
                    {gameContent.title}
                  </h3>
                </div>
              </div>
              {gameContent.body && (
                  <p className="whitespace-pre-line px-4 py-3 text-[15px] leading-7 text-zinc-100">
                    {gameContent.body}
                  </p>
              )}
            </section>
        ) : listingContent ? (
            <section className="mt-4 overflow-hidden rounded-lg border border-emerald-300/20 bg-emerald-500/[0.06]">
              <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-500/20 text-emerald-100">
                  <Tag size={18} />
                </span>
                <div className="min-w-0">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-200">
                    Oyuncu İlanı
                  </span>
                  <h3 className="truncate text-base font-black text-white">
                    {listingContent.title}
                  </h3>
                </div>
              </div>
              {listingContent.description && (
                  <p className="whitespace-pre-line px-4 py-3 text-[15px] leading-7 text-zinc-100">
                    {listingContent.description}
                  </p>
              )}
              {listingContent.details.length > 0 && (
                  <div className="grid border-t border-white/10 sm:grid-cols-2">
                    {listingContent.details.map((detail) => (
                        <div
                            className="border-white/10 px-4 py-3 text-sm odd:border-r"
                            key={`${detail.label}-${detail.value}`}
                        >
                          <span className="block text-[11px] font-black uppercase tracking-wider text-zinc-500">
                            {detail.label}
                          </span>
                          <span className="mt-1 block font-semibold text-zinc-100">
                            {detail.value}
                          </span>
                        </div>
                    ))}
                  </div>
              )}
            </section>
        ) : (
            <p className="mt-4 whitespace-pre-line text-[15px] leading-7 text-zinc-100">
              {post.content}
            </p>
        )}

        {activeMedia && (
            <div className="mt-4">
              <div
                  className="ltz-video-player relative overflow-hidden rounded-lg border border-white/10 bg-black outline-none"
                  onClick={() => videoContainerRef.current?.focus()}
                  onKeyDown={handleVideoKeyboard}
                  ref={videoContainerRef}
                  tabIndex={activeMedia.type === "video" ? 0 : -1}
              >
                {failedMediaUrls.has(activeMedia.url) ? (
                    <div className="grid h-72 w-full place-items-center bg-white/[0.035] text-sm text-zinc-400 sm:h-80 lg:h-[330px]">
                      Medya yüklenemedi.
                    </div>
                ) : activeMedia.type === "video" ? (
                    <>
                      <video
                          className="ltz-video-player__video h-72 w-full bg-black object-contain sm:h-80 lg:h-[330px]"
                          onClick={() => void toggleVideoPlayback()}
                          onError={() => markMediaAsFailed(activeMedia.url)}
                          onLoadedMetadata={(event) => {
                            setVideoDuration(event.currentTarget.duration || 0);
                            setVideoCurrentTime(event.currentTarget.currentTime || 0);
                            setVideoVolume(event.currentTarget.volume);
                            setIsVideoMuted(event.currentTarget.muted);
                          }}
                          onPause={() => setIsVideoPlaying(false)}
                          onPlay={() => setIsVideoPlaying(true)}
                          onTimeUpdate={(event) =>
                              setVideoCurrentTime(event.currentTarget.currentTime)
                          }
                          onVolumeChange={(event) => {
                            setVideoVolume(event.currentTarget.volume);
                            setIsVideoMuted(event.currentTarget.muted);
                          }}
                          ref={videoRef}
                          src={activeMedia.url}
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-3 pb-3 pt-10">
                        <input
                            aria-label="Video süresi"
                            className="ltz-video-range mb-2 h-1 w-full cursor-pointer"
                            max={videoDuration || 0}
                            min={0}
                            onChange={(event) =>
                                setVideoTime(Number(event.currentTarget.value))
                            }
                            step="0.1"
                            style={{
                              background: `linear-gradient(90deg, #f43f5e 0%, #f43f5e ${videoProgressPercent}%, rgba(255,255,255,0.34) ${videoProgressPercent}%, rgba(255,255,255,0.34) 100%)`,
                            }}
                            type="range"
                            value={videoCurrentTime}
                        />
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <button
                                aria-label={isVideoPlaying ? "Videoyu duraklat" : "Videoyu oynat"}
                                className="grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-black/55 text-white transition hover:bg-white/15"
                                onClick={() => void toggleVideoPlayback()}
                                type="button"
                            >
                              {isVideoPlaying ? <Pause size={18} /> : <Play size={18} />}
                            </button>
                            <button
                                aria-label={isVideoMuted ? "Sesi aç" : "Sesi kapat"}
                                className="grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-black/55 text-white transition hover:bg-white/15"
                                onClick={toggleVideoMute}
                                type="button"
                            >
                              {isVideoMuted || videoVolume === 0 ? (
                                  <VolumeX size={18} />
                              ) : (
                                  <Volume2 size={18} />
                              )}
                            </button>
                            <input
                                aria-label="Ses seviyesi"
                                className="ltz-video-range ltz-video-volume-range hidden h-1 w-20 cursor-pointer sm:block"
                                max={1}
                                min={0}
                                onChange={(event) =>
                                    changeVideoVolume(Number(event.currentTarget.value))
                                }
                                step="0.05"
                                style={{
                                  background: `linear-gradient(90deg, #ffffff 0%, #ffffff ${videoVolumePercent}%, rgba(255,255,255,0.28) ${videoVolumePercent}%, rgba(255,255,255,0.28) 100%)`,
                                }}
                                type="range"
                                value={isVideoMuted ? 0 : videoVolume}
                            />
                            <span className="rounded-full bg-black/45 px-2 py-1 text-xs font-bold text-white">
                        {formatVideoTime(videoCurrentTime)} /{" "}
                              {formatVideoTime(videoDuration)}
                      </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                                aria-label="5 saniye geri al"
                                className="grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-black/55 text-white transition hover:bg-white/15"
                                onClick={() => seekVideo(-5)}
                                type="button"
                            >
                              <Rewind size={18} />
                            </button>
                            <button
                                aria-label="5 saniye ileri al"
                                className="grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-black/55 text-white transition hover:bg-white/15"
                                onClick={() => seekVideo(5)}
                                type="button"
                            >
                              <FastForward size={18} />
                            </button>
                            <button
                                aria-label={isVideoFullscreen ? "Tam ekrandan çık" : "Tam ekran"}
                                className="grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-black/55 text-white transition hover:bg-white/15"
                                onClick={() => void toggleVideoFullscreen()}
                                type="button"
                            >
                              {isVideoFullscreen ? (
                                  <Minimize2 size={18} />
                              ) : (
                                  <Maximize2 size={18} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                ) : (
                    <div className="grid w-full place-items-center bg-black">
                      <img
                          src={activeMedia.url}
                          alt={activeMedia.alt}
                          className="max-h-[620px] max-w-full object-contain"
                          onError={() => markMediaAsFailed(activeMedia.url)}
                      />
                    </div>
                )}

                {post.media.length > 1 && (
                    <>
                      <button
                          aria-label="Önceki medya"
                          className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-black/65 text-white transition hover:bg-black"
                          onClick={() => changeActiveMedia(activeMediaIndex - 1)}
                          type="button"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                          aria-label="Sonraki medya"
                          className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-black/65 text-white transition hover:bg-black"
                          onClick={() => changeActiveMedia(activeMediaIndex + 1)}
                          type="button"
                      >
                        <ChevronRight size={20} />
                      </button>
                      <span className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white">
                  {activeMediaIndex + 1}/{post.media.length}
                </span>
                    </>
                )}
              </div>

              {post.media.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {post.media.map((media, index) => (
                        <button
                            aria-label={`Medya ${index + 1}`}
                            className={
                              index === activeMediaIndex
                                  ? "h-16 w-20 shrink-0 cursor-pointer overflow-hidden rounded-md border-2 border-violet-300 bg-black"
                                  : "h-16 w-20 shrink-0 cursor-pointer overflow-hidden rounded-md border border-white/10 bg-black opacity-70 transition hover:opacity-100"
                            }
                            key={`${media.url}-${index}`}
                            onClick={() => changeActiveMedia(index)}
                            type="button"
                        >
                          {media.type === "video" ? (
                              <video className="h-full w-full object-contain" muted src={media.url} />
                          ) : (
                              <img
                                  alt={media.alt}
                                  className="h-full w-full object-contain"
                                  src={media.url}
                              />
                          )}
                        </button>
                    ))}
                  </div>
              )}
            </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 text-sm text-zinc-400">
          <button
              className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-default disabled:hover:bg-transparent"
              disabled={post.reactions.likes <= 0}
              onClick={() => void handleOpenLikes()}
              type="button"
          >
          <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-500 text-white">
            <ThumbsUp size={12} />
          </span>
            <span className="grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-white">
            <Heart size={12} fill="currentColor" />
          </span>
            <span>{post.reactions.likes}</span>
          </button>

          <div className="flex items-center gap-5">
            <button
                className="cursor-pointer rounded-md px-1 py-1 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-default disabled:hover:bg-transparent"
                disabled={!canUsePostActions}
                onClick={() => void handleToggleComments()}
                type="button"
            >
              {post.reactions.comments} Yorum
            </button>
            <span>{post.reactions.shares} Paylaşım</span>
          </div>
        </div>

        <footer className="grid grid-cols-4 gap-2 pt-3 text-sm font-semibold text-zinc-300">
          <button
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md transition hover:-translate-y-0.5 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isBusy || !canUsePostActions}
              onClick={() => void onToggleLike(post.id, Boolean(post.likedByMe))}
              type="button"
          >
            <ThumbsUp
                className={post.likedByMe ? "text-violet-300" : undefined}
                size={18}
            />
            <span className="hidden sm:inline">
            {post.likedByMe ? "Beğenildi" : "Beğen"}
          </span>
          </button>
          <button
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md transition hover:-translate-y-0.5 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canUsePostActions}
              onClick={() => void handleToggleComments()}
              type="button"
          >
            <MessageSquare size={18} />
            <span className="hidden sm:inline">Yorum Yap</span>
          </button>
          <button
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md transition hover:-translate-y-0.5 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => void onShare(post)}
              type="button"
          >
            <Share2 size={18} />
            <span className="hidden sm:inline">Paylaş</span>
          </button>
          <button
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md transition hover:-translate-y-0.5 hover:bg-white/[0.06] hover:text-white"
              onClick={() => onToggleSave(post.id)}
              type="button"
              aria-label={post.savedByMe ? "Kaydedildi" : "Kaydet"}
          >
            <Bookmark
                className={post.savedByMe ? "text-violet-300" : undefined}
                fill={post.savedByMe ? "currentColor" : "none"}
                size={18}
            />
          </button>
        </footer>

        {!commentsOpen && post.reactions.comments > 0 && (
            <button
                className="mt-2 cursor-pointer text-xs font-semibold text-zinc-500 transition hover:text-white"
                disabled={!canUsePostActions}
                onClick={() => void handleToggleComments()}
                type="button"
            >
              Yorumları gör
            </button>
        )}

        {commentsOpen && (
            <section className="mt-4 border-t border-white/10 pt-4">
              {post.reactions.comments > 0 && (
                  <button
                      className="mb-3 cursor-pointer text-xs font-semibold text-zinc-400 transition hover:text-white"
                      onClick={() => void handleToggleComments()}
                      type="button"
                  >
                    {commentsOpen ? "Yorumları gizle" : "Yorumları gör"}
                  </button>
              )}

              <div
                  className={
                    (post.comments?.length ?? 0) > 5
                        ? "max-h-[430px] space-y-3 overflow-y-auto pr-2"
                        : "space-y-3"
                  }
              >
                {post.comments?.length ? (
                    post.comments.map((comment) => (
                        <div
                            className="flex gap-3 rounded-lg border border-white/8 bg-white/[0.025] px-3 py-3"
                            key={comment.id}
                        >
                          <button
                              className="shrink-0 cursor-pointer rounded-full transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-violet-400/70"
                              onClick={() => openUserProfile(comment.author?.username)}
                              type="button"
                          >
                            <UserAvatar
                                name={comment.author?.name ?? getCommentAuthorName(comment.userId)}
                                avatarUrl={comment.author?.avatarUrl ?? getCommentAvatar(comment.userId)}
                                className="h-9 w-9"
                                imageClassName="h-9 w-9 rounded-full border border-white/15 object-cover"
                                fallbackClassName="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-violet-700 text-xs font-bold text-white"
                            />
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                      className="truncate text-left text-xs font-semibold text-violet-200 transition hover:text-violet-100"
                                      onClick={() => openUserProfile(comment.author?.username)}
                                      type="button"
                                  >
                                    {comment.author?.name ??
                                        getCommentAuthorName(comment.userId)}
                                  </button>
                                  <span className="text-[11px] font-medium text-zinc-500">
                            {formatSocialTime(comment.createdAt)}
                          </span>
                                  {isEdited(comment.createdAt, comment.updatedAt) ? (
                                      <span className="text-[11px] font-medium text-zinc-500">
                                        dÃ¼zenlendi
                                      </span>
                                  ) : null}
                                </div>
                                {editingCommentId === comment.id ? (
                                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                      <input
                                          className="h-9 min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950/55 px-3 text-sm text-white outline-none focus:border-violet-400/60"
                                          maxLength={1000}
                                          onChange={(event) =>
                                              setEditCommentText(event.target.value)
                                          }
                                          onKeyDown={(event) => {
                                            if (event.key === "Enter" && !event.shiftKey) {
                                              event.preventDefault();
                                              void submitCommentEdit();
                                            }
                                          }}
                                          value={editCommentText}
                                      />
                                      <div className="flex gap-2">
                                        <button
                                            className="h-9 cursor-pointer rounded-lg bg-violet-700 px-3 text-xs font-bold text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
                                            disabled={!editCommentText.trim() || isBusy}
                                            onClick={() => void submitCommentEdit()}
                                            type="button"
                                        >
                                          Kaydet
                                        </button>
                                        <button
                                            className="h-9 cursor-pointer rounded-lg border border-white/10 px-3 text-xs font-bold text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                                            onClick={() => {
                                              setEditingCommentId(null);
                                              setEditingCommentParentId(null);
                                              setEditCommentText("");
                                            }}
                                            type="button"
                                        >
                                          VazgeÃ§
                                        </button>
                                      </div>
                                    </div>
                                ) : (
                                    <p className="mt-1 text-sm leading-5 text-zinc-200">
                                      {comment.content}
                                    </p>
                                )}
                              </div>
                              <button
                                  aria-label="Yorumu beğen"
                                  className={
                                    comment.likedByMe
                                        ? "grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full text-rose-500 transition hover:bg-white/[0.06]"
                                        : "grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full text-zinc-400 transition hover:bg-white/[0.06] hover:text-rose-300"
                                  }
                                  disabled={!canUsePostActions || isBusy}
                                  onClick={() =>
                                      void handleToggleCommentLike(
                                          comment.id,
                                          null,
                                          Boolean(comment.likedByMe),
                                      )
                                  }
                                  type="button"
                              >
                                <Heart
                                    fill={comment.likedByMe ? "currentColor" : "none"}
                                    size={15}
                                />
                              </button>
                            </div>
                            <div className="mt-2 flex items-center gap-4 text-[11px] font-semibold text-zinc-500">
                              <button
                                  className={
                                    comment.likedByMe
                                        ? "cursor-pointer text-rose-400 transition hover:text-rose-300"
                                        : "cursor-pointer transition hover:text-white"
                                  }
                                  disabled={!canUsePostActions || isBusy}
                                  onClick={() =>
                                      void handleToggleCommentLike(
                                          comment.id,
                                          null,
                                          Boolean(comment.likedByMe),
                                      )
                                  }
                                  type="button"
                              >
                                {comment.likedByMe ? "Beğenildi" : "Beğen"}
                              </button>
                              <span>{comment.likeCount ?? 0} beğeni</span>
                              <button
                                  className="cursor-pointer transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                  disabled={!canUsePostActions || isBusy}
                                  onClick={() =>
                                      openReplyForm(
                                          comment.id,
                                          comment.author?.name ??
                                          getCommentAuthorName(comment.userId),
                                          comment.userId,
                                      )
                                  }
                                  type="button"
                              >
                                Yanıtla
                              </button>
                              {currentUserId === comment.userId && (
                                  <>
                                    <button
                                        className="cursor-pointer transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                        disabled={isBusy}
                                        onClick={() => openCommentEdit(comment)}
                                        type="button"
                                    >
                                      DÃ¼zenle
                                    </button>
                                    <button
                                        className="cursor-pointer transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                        disabled={isBusy}
                                        onClick={() =>
                                            void onDeleteComment(post.id, comment.id)
                                        }
                                        type="button"
                                    >
                                      Sil
                                    </button>
                                  </>
                              )}
                            </div>
                            {replyFormCommentId === comment.id &&
                                replyFormTargetReplyId === null &&
                                renderReplyForm(
                                    comment.id,
                                    comment.author?.name ??
                                    getCommentAuthorName(comment.userId),
                                )}
                            {(comment.replies?.length ?? 0) > 0 && (
                                <button
                                    className="mt-2 cursor-pointer text-[11px] font-semibold text-zinc-500 transition hover:text-white"
                                    onClick={() => toggleReplies(comment.id)}
                                    type="button"
                                >
                                  {visibleReplyCommentIds.has(comment.id)
                                      ? "Yanıtları gizle"
                                      : `${comment.replies?.length ?? 0} yanıtı gör`}
                                </button>
                            )}
                            {visibleReplyCommentIds.has(comment.id) &&
                                (comment.replies ?? []).map((reply) => (
                                    <div
                                        className="mt-3 flex gap-2 border-l border-white/10 pl-3"
                                        key={reply.id}
                                    >
                                      <button
                                          className="shrink-0 cursor-pointer rounded-full transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-violet-400/70"
                                          onClick={() => openUserProfile(reply.author?.username)}
                                          type="button"
                                      >
                                        <UserAvatar
                                            name={reply.author?.name ?? getCommentAuthorName(reply.userId)}
                                            avatarUrl={reply.author?.avatarUrl ?? getCommentAvatar(reply.userId)}
                                            className="h-7 w-7"
                                            imageClassName="h-7 w-7 rounded-full border border-white/15 object-cover"
                                            fallbackClassName="grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-violet-700 text-[10px] font-bold text-white"
                                        />
                                      </button>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <button
                                              className="truncate text-left text-[11px] font-semibold text-violet-200 transition hover:text-violet-100"
                                              onClick={() => openUserProfile(reply.author?.username)}
                                              type="button"
                                          >
                                            {reply.author?.name ??
                                                getCommentAuthorName(reply.userId)}
                                          </button>
                                          <span className="text-[10px] font-medium text-zinc-500">
                                {formatSocialTime(reply.createdAt)}
                              </span>
                                          {isEdited(reply.createdAt, reply.updatedAt) ? (
                                              <span className="text-[10px] font-medium text-zinc-500">
                                                dÃ¼zenlendi
                                              </span>
                                          ) : null}
                                        </div>
                                        {editingCommentId === reply.id ? (
                                            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                              <input
                                                  className="h-8 min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950/55 px-3 text-xs text-white outline-none focus:border-violet-400/60"
                                                  maxLength={1000}
                                                  onChange={(event) =>
                                                      setEditCommentText(event.target.value)
                                                  }
                                                  onKeyDown={(event) => {
                                                    if (event.key === "Enter" && !event.shiftKey) {
                                                      event.preventDefault();
                                                      void submitCommentEdit();
                                                    }
                                                  }}
                                                  value={editCommentText}
                                              />
                                              <div className="flex gap-2">
                                                <button
                                                    className="h-8 cursor-pointer rounded-lg bg-violet-700 px-3 text-[11px] font-bold text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
                                                    disabled={!editCommentText.trim() || isBusy}
                                                    onClick={() => void submitCommentEdit()}
                                                    type="button"
                                                >
                                                  Kaydet
                                                </button>
                                                <button
                                                    className="h-8 cursor-pointer rounded-lg border border-white/10 px-3 text-[11px] font-bold text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                                                    onClick={() => {
                                                      setEditingCommentId(null);
                                                      setEditingCommentParentId(null);
                                                      setEditCommentText("");
                                                    }}
                                                    type="button"
                                                >
                                                  VazgeÃ§
                                                </button>
                                              </div>
                                            </div>
                                        ) : (
                                            <p className="mt-0.5 text-xs leading-5 text-zinc-300">
                                              {reply.replyingToName && (
                                                  <span className="mr-1 font-semibold text-violet-300">
                                  @{reply.replyingToName}
                                </span>
                                              )}
                                              {reply.content}
                                            </p>
                                        )}
                                        <div className="mt-1 flex items-center gap-4 text-[11px] font-semibold text-zinc-500">
                                          <button
                                              className={
                                                reply.likedByMe
                                                    ? "cursor-pointer text-rose-400 transition hover:text-rose-300"
                                                    : "cursor-pointer transition hover:text-white"
                                              }
                                              disabled={!canUsePostActions || isBusy}
                                              onClick={() =>
                                                  void handleToggleCommentLike(
                                                      reply.id,
                                                      comment.id,
                                                      Boolean(reply.likedByMe),
                                                  )
                                              }
                                              type="button"
                                          >
                                            {reply.likedByMe ? "Beğenildi" : "Beğen"}
                                          </button>
                                          <span>{reply.likeCount ?? 0} beğeni</span>
                                          <button
                                              className="cursor-pointer transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                              disabled={!canUsePostActions || isBusy}
                                              onClick={() =>
                                                  openReplyForm(
                                                      comment.id,
                                                      reply.author?.name ??
                                                      getCommentAuthorName(reply.userId),
                                                      reply.userId,
                                                      reply.id,
                                                  )
                                              }
                                              type="button"
                                          >
                                            Yanıtla
                                          </button>
                                          {currentUserId === reply.userId && (
                                              <>
                                                <button
                                                    className="cursor-pointer transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                                    disabled={isBusy}
                                                    onClick={() => openCommentEdit(reply, comment.id)}
                                                    type="button"
                                                >
                                                  DÃ¼zenle
                                                </button>
                                                <button
                                                    className="cursor-pointer transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                                    disabled={isBusy}
                                                    onClick={() =>
                                                        void onDeleteComment(
                                                            post.id,
                                                            reply.id,
                                                            comment.id,
                                                        )
                                                    }
                                                    type="button"
                                                >
                                                  Sil
                                                </button>
                                              </>
                                          )}
                                        </div>
                                        {replyFormCommentId === comment.id &&
                                            replyFormTargetReplyId === reply.id &&
                                            renderReplyForm(
                                                comment.id,
                                                reply.author?.name ??
                                                getCommentAuthorName(reply.userId),
                                            )}
                                      </div>
                                      <button
                                          aria-label="Yanıtı beğen"
                                          className={
                                            reply.likedByMe
                                                ? "grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-full text-rose-500 transition hover:bg-white/[0.06]"
                                                : "grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-full text-zinc-500 transition hover:bg-white/[0.06] hover:text-rose-300"
                                          }
                                          disabled={!canUsePostActions || isBusy}
                                          onClick={() =>
                                              void handleToggleCommentLike(
                                                  reply.id,
                                                  comment.id,
                                                  Boolean(reply.likedByMe),
                                              )
                                          }
                                          type="button"
                                      >
                                        <Heart
                                            fill={reply.likedByMe ? "currentColor" : "none"}
                                            size={13}
                                        />
                                      </button>
                                    </div>
                                ))}
                          </div>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-zinc-500">
                      Henüz yorum yok. İlk yorumu sen yaz.
                    </p>
                )}
              </div>

              <div className="mt-3 flex items-center gap-3">
                <UserAvatar
                    name={currentUserName ?? "Sen"}
                    avatarUrl={currentUserAvatarUrl}
                    className="h-9 w-9"
                    imageClassName="h-9 w-9 rounded-full border border-white/15 object-cover"
                    fallbackClassName="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-violet-700 text-xs font-bold text-white"
                />
                <div className="relative flex flex-1 items-center">
                  <input
                      className="h-10 w-full rounded-full border border-white/10 bg-slate-950/55 px-4 pr-11 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-violet-400/60"
                      maxLength={1000}
                      onChange={(event) => {
                        setCommentText(event.target.value);
                        setCommentEmojiOpen(false);
                      }}
                      placeholder="Yorum yaz..."
                      value={commentText}
                  />
                  <button
                      aria-label="Emoji ekle"
                      className="absolute right-2 grid h-8 w-8 cursor-pointer place-items-center rounded-full text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
                      onClick={() => setCommentEmojiOpen((isOpen) => !isOpen)}
                      type="button"
                  >
                    <Smile size={16} />
                  </button>
                  {commentEmojiOpen && (
                      <EmojiPickerPopover
                          className="absolute bottom-11 right-0 z-[140] grid w-56 grid-cols-6 gap-1 rounded-lg border border-white/10 bg-[#0b1220] p-2 shadow-2xl shadow-black/40"
                          emojis={DEFAULT_EMOJIS}
                          onClose={() => setCommentEmojiOpen(false)}
                          onSelect={addEmojiToComment}
                      />
                  )}
                </div>
                <button
                    className="h-10 cursor-pointer rounded-full bg-violet-700 px-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!commentText.trim() || isBusy}
                    onClick={() => void handleAddComment()}
                    type="button"
                >
                  Gönder
                </button>
              </div>
            </section>
        )}

        {likesOpen && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 backdrop-blur-sm">
              <section className="w-full max-w-md rounded-lg border border-white/10 bg-[#0b1220] shadow-2xl shadow-black/50">
                <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <h3 className="text-sm font-bold text-white">Beğenenler</h3>
                  <button
                      aria-label="Kapat"
                      className="grid h-8 w-8 cursor-pointer place-items-center rounded-full text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
                      onClick={() => setLikesOpen(false)}
                      type="button"
                  >
                    <X size={17} />
                  </button>
                </header>
                <div className="max-h-[420px] space-y-2 overflow-y-auto p-4">
                  {likesLoading ? (
                      <p className="py-6 text-center text-sm text-zinc-400">
                        Beğenenler yükleniyor...
                      </p>
                  ) : likedUsers.length ? (
                      likedUsers.map((likedUser) => (
                          <button
                              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-white/[0.04]"
                              key={`${likedUser.username}-${likedUser.name}`}
                              onClick={() => openUserProfile(likedUser.username)}
                              type="button"
                          >
                            <img
                                alt={likedUser.name}
                                className="h-10 w-10 rounded-full border border-white/15 object-cover"
                                src={likedUser.avatarUrl}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-white">
                                {likedUser.name}
                              </p>
                              <p className="truncate text-xs text-zinc-400">
                                @{likedUser.username}
                              </p>
                            </div>
                          </button>
                      ))
                  ) : (
                      <p className="py-6 text-center text-sm text-zinc-400">
                        Henüz beğeni yok.
                      </p>
                  )}
                </div>
              </section>
            </div>
        )}
      </article>
  );
}

interface ActionMenuButtonProps {
  danger?: boolean;
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}

function ActionMenuButton({
                            danger = false,
                            disabled = false,
                            icon,
                            label,
                            onClick,
                          }: ActionMenuButtonProps) {
  return (
      <button
          className={
            danger
                ? "flex h-10 w-full cursor-pointer items-center gap-2 rounded-md px-3 text-left text-sm font-semibold text-red-200 transition hover:bg-red-500/10 hover:text-red-100 disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent"
                : "flex h-10 w-full cursor-pointer items-center gap-2 rounded-md px-3 text-left text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent"
          }
          disabled={disabled}
          onClick={onClick}
          type="button"
      >
        {icon}
        <span>{label}</span>
      </button>
  );
}
