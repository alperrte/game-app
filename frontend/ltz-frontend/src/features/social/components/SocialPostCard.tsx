import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Earth,
  FastForward,
  Heart,
  Maximize2,
  MessageCircle,
  MessageSquare,
  Minimize2,
  MoreHorizontal,
  Pause,
  Play,
  Rewind,
  Share2,
  Smile,
  ThumbsUp,
  UserPlus,
  UserRoundPlus,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

import { formatSocialTime } from "../../../utils/formatSocialTime";
import { UserAvatar } from "../../user/components/UserAvatar";
import type { SocialPost, SocialUser } from "../types/social.types";

interface SocialPostCardProps {
  post: SocialPost;
  currentUserId?: number;
  currentUserName?: string;
  isBusy?: boolean;
  onAddComment: (postId: number | string, content: string) => Promise<void>;
  onBlockAuthor: (authorUserId: number) => Promise<void>;
  onDeleteComment: (postId: number | string, commentId: number) => Promise<void>;
  onDeletePost: (postId: number | string) => Promise<void>;
  onToggleFollowAuthor: (
    authorUserId: number,
    followedByMe: boolean,
  ) => Promise<void>;
  onLoadComments: (postId: number | string) => Promise<void>;
  onLoadPostLikes: (post: SocialPost) => Promise<SocialUser[]>;
  onSendFriendRequest: (authorUserId: number) => Promise<void>;
  onShare: (post: SocialPost) => Promise<void>;
  onStartChat: (post: SocialPost) => Promise<void>;
  onToggleLike: (postId: number | string, likedByMe: boolean) => Promise<void>;
}

interface ParsedPollContent {
  body: string;
  options: string[];
  question: string;
}

interface FullscreenVideoElement extends HTMLVideoElement {
  webkitEnterFullscreen?: () => void;
}

const COMMENT_EMOJIS = [
  "😀",
  "😂",
  "😍",
  "🔥",
  "🎮",
  "🏆",
  "👏",
  "😎",
  "😭",
  "😡",
  "❤️",
  "✨",
];

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

function formatVideoTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function SocialPostCard({
  post,
  currentUserId,
  currentUserName,
  isBusy = false,
  onAddComment,
  onBlockAuthor,
  onDeleteComment,
  onDeletePost,
  onToggleFollowAuthor,
  onLoadComments,
  onLoadPostLikes,
  onSendFriendRequest,
  onShare,
  onStartChat,
  onToggleLike,
}: SocialPostCardProps) {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const activeMedia = post.media[activeMediaIndex] ?? post.media[0];
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoVolume, setVideoVolume] = useState(1);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);
  const [prevActiveMediaUrl, setPrevActiveMediaUrl] = useState<string | undefined>(
    activeMedia?.url,
  );

  if (activeMedia?.url !== prevActiveMediaUrl) {
    setPrevActiveMediaUrl(activeMedia?.url);
    setIsVideoPlaying(false);
    setVideoCurrentTime(0);
    setVideoDuration(0);
  }

  const [commentText, setCommentText] = useState("");
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [likesOpen, setLikesOpen] = useState(false);
  const [likedUsers, setLikedUsers] = useState<SocialUser[]>([]);
  const [likesLoading, setLikesLoading] = useState(false);
  const [commentEmojiOpen, setCommentEmojiOpen] = useState(false);
  const [selectedPollOption, setSelectedPollOption] = useState<number | null>(
    null,
  );
  const [failedMediaUrls, setFailedMediaUrls] = useState<Set<string>>(
    () => new Set(),
  );

  const canUseAuthorActions =
    typeof post.authorUserId === "number" &&
    currentUserId !== post.authorUserId;
  const canUsePostActions = post.source === "backend" && typeof post.id === "number";
  const pollContent = parsePollContent(post.content);
  const videoProgressPercent = videoDuration
    ? Math.min(100, Math.max(0, (videoCurrentTime / videoDuration) * 100))
    : 0;
  const videoVolumePercent = (isVideoMuted ? 0 : videoVolume) * 100;


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

  async function handleOpenLikes() {
    setLikesOpen(true);

    if (!likedUsers.length && post.reactions.likes > 0) {
      setLikesLoading(true);
      const users = await onLoadPostLikes(post);
      setLikedUsers(users);
      setLikesLoading(false);
    }
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

  function getCommentAvatar(comment: { author?: SocialUser; userId: number }) {
    if (comment.author?.avatarUrl) {
      return comment.author.avatarUrl;
    }

    if (comment.userId === post.authorUserId) {
      return post.author.avatarUrl;
    }

    return "";
  }

  const currentUserAvatarUrl =
    currentUserId === post.authorUserId ? post.author.avatarUrl : "";

  function renderCommentAvatar(comment: { author?: SocialUser; userId: number }) {
    const avatarUrl = getCommentAvatar(comment);
    const label = comment.author?.name ?? getCommentAuthorName(comment.userId);

    if (avatarUrl) {
      return (
        <img
          alt={label}
          className="h-9 w-9 rounded-full border border-white/15 object-cover"
          src={avatarUrl}
        />
      );
    }

    return (
      <div className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-violet-700 text-xs font-bold text-white">
        {label.slice(0, 1).toUpperCase()}
      </div>
    );
  }

  return (
    <article className="rounded-lg border border-white/10 bg-[#0a101c]/88 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {post.author.avatarUrl ? (
            <img
              src={post.author.avatarUrl}
              alt={post.author.name}
              className="h-12 w-12 rounded-full border border-fuchsia-300/40 object-cover"
            />
          ) : (
            <div className="grid h-12 w-12 place-items-center rounded-full border border-fuchsia-300/40 bg-violet-700 text-sm font-bold text-white">
              {post.author.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 className="text-base font-bold text-white">{post.author.name}</h2>
              {post.author.verified && (
                <span className="grid h-4 w-4 place-items-center rounded-full bg-violet-500 text-[10px] font-black text-white">
                  ✓
                </span>
              )}
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
              <Earth size={13} />
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-1">
          {currentUserId === post.authorUserId && (
            <button
              className="cursor-pointer rounded-md px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/10 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isBusy}
              onClick={() => void onDeletePost(post.id)}
              type="button"
            >
              Sil
            </button>
          )}
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
                icon={<UserRoundPlus size={16} />}
                label="Arkadaş ekle"
                onClick={() =>
                  void runAuthorAction(() =>
                    onSendFriendRequest(post.authorUserId as number),
                  )
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

      {pollContent ? (
        <section className="mt-4 rounded-lg border border-violet-400/20 bg-violet-500/[0.055] p-4">
          <h3 className="text-lg font-bold text-white">
            {pollContent.question}
          </h3>
          {pollContent.body && (
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-300">
              {pollContent.body}
            </p>
          )}
          <div className="mt-4 grid gap-2">
            {pollContent.options.map((option, index) => {
              const selected = selectedPollOption === index;

              return (
                <button
                  className={
                    selected
                      ? "flex min-h-11 cursor-pointer items-center justify-between rounded-lg border border-violet-300/50 bg-violet-600/25 px-4 text-left text-sm font-semibold text-white transition hover:bg-violet-600/30"
                      : "flex min-h-11 cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-slate-950/35 px-4 text-left text-sm font-semibold text-zinc-200 transition hover:border-violet-300/40 hover:bg-white/[0.06] hover:text-white"
                  }
                  key={`${option}-${index}`}
                  onClick={() =>
                    setSelectedPollOption((currentOption) =>
                      currentOption === index ? null : index,
                    )
                  }
                  type="button"
                >
                  <span>{option}</span>
                  {selected && (
                    <span className="rounded-full bg-violet-500 px-2 py-1 text-[11px] text-white">
                      Seçildi
                    </span>
                  )}
                </button>
              );
            })}
          </div>
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

      <footer className="grid grid-cols-3 gap-2 pt-3 text-sm font-semibold text-zinc-300">
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
                  {renderCommentAvatar(comment)}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-xs font-semibold text-violet-200">
                        {comment.author?.name ?? getCommentAuthorName(comment.userId)}
                      </p>
                      <span className="text-[11px] font-medium text-zinc-500">
                        {formatSocialTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-5 text-zinc-200">{comment.content}</p>
                    {currentUserId === comment.userId ? (
                      <button
                        className="mt-2 cursor-pointer text-[11px] font-semibold text-zinc-500 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isBusy}
                        onClick={() => void onDeleteComment(post.id, comment.id)}
                        type="button"
                      >
                        Sil
                      </button>
                    ) : null}
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
            {currentUserAvatarUrl ? (
              <img
                alt={currentUserName ?? "Sen"}
                className="h-9 w-9 rounded-full border border-white/15 object-cover"
                src={currentUserAvatarUrl}
              />
            ) : (
              <div className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-violet-700 text-xs font-bold text-white">
                {(currentUserName ?? "S").slice(0, 1).toUpperCase()}
              </div>
            )}
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
              {commentEmojiOpen && <EmojiPicker onSelect={addEmojiToComment} />}
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
                  <div
                    className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-white/[0.04]"
                    key={`${likedUser.username}-${likedUser.name}`}
                  >
                    <UserAvatar
                      avatarUrl={likedUser.avatarUrl}
                      className="h-10 w-10"
                      imageClassName="h-10 w-10 rounded-full border border-white/15 object-cover"
                      name={likedUser.name}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">
                        {likedUser.name}
                      </p>
                      <p className="truncate text-xs text-zinc-400">
                        @{likedUser.username}
                      </p>
                    </div>
                  </div>
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
  onClick: () => void;
}

function ActionMenuButton({
  danger = false,
  icon,
  label,
  onClick,
}: ActionMenuButtonProps) {
  return (
    <button
      className={
        danger
          ? "flex h-10 w-full cursor-pointer items-center gap-2 rounded-md px-3 text-left text-sm font-semibold text-red-200 transition hover:bg-red-500/10 hover:text-red-100"
          : "flex h-10 w-full cursor-pointer items-center gap-2 rounded-md px-3 text-left text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.06] hover:text-white"
      }
      onClick={onClick}
      type="button"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

function EmojiPicker({ onSelect }: EmojiPickerProps) {
  return (
    <div className="absolute bottom-11 right-0 z-30 grid w-56 grid-cols-6 gap-1 rounded-lg border border-white/10 bg-[#0b1220] p-2 shadow-2xl shadow-black/40">
      {COMMENT_EMOJIS.map((emoji) => (
        <button
          aria-label={`Emoji ${emoji}`}
          className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-lg transition hover:bg-white/[0.08]"
          key={emoji}
          onClick={() => onSelect(emoji)}
          type="button"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
