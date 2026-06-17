import { useState } from "react";
import { Loader2, Send } from "lucide-react";

import type { SocialPost, SocialUser } from "../../../social/types/social.types";
import { SocialPostCard } from "../../../social/components/SocialPostCard";
import { SectionPanel, ProfileSkeleton } from "./ProfilePrimitives";
import { UserAvatar } from "../UserAvatar";

type ProfileWallSectionProps = {
  posts: SocialPost[];
  postsLoading: boolean;
  postsError: string | null;
  isOwnProfile: boolean;
  currentUserId?: number;
  currentUserName?: string;
  currentUserAvatarUrl?: string | null;
  busyPostId: number | string | null;
  onCreatePost: (content: string) => Promise<void>;
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
  onToggleFollowAuthor: (authorUserId: number, followedByMe: boolean) => Promise<void>;
  onLoadComments: (postId: number | string) => Promise<void>;
  onLoadPostLikes: (post: SocialPost) => Promise<SocialUser[]>;
  onSendFriendRequest: (authorUserId: number) => Promise<void>;
  onCancelFriendRequest: (requestId: number, authorUserId: number) => Promise<void>;
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
};

export function ProfileWallSection({
  posts,
  postsLoading,
  postsError,
  isOwnProfile,
  currentUserId,
  currentUserName,
  currentUserAvatarUrl,
  busyPostId,
  onCreatePost,
  onAddComment,
  onAddReply,
  onBlockAuthor,
  onDeleteComment,
  onDeletePost,
  onToggleFollowAuthor,
  onLoadComments,
  onLoadPostLikes,
  onSendFriendRequest,
  onCancelFriendRequest,
  onShare,
  onStartChat,
  onToggleCommentLike,
  onToggleSave,
  onToggleLike,
}: ProfileWallSectionProps) {
  const [composerText, setComposerText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = composerText.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onCreatePost(trimmed);
      setComposerText("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SectionPanel
      description="Bu oyuncunun duvar gönderileri ve paylaşımları."
      id="profile-wall"
      title="Duvar"
    >
      {isOwnProfile ? (
        <div className="mb-5 rounded-xl border border-white/10 bg-[#0a101c]/88 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl">
          <div className="flex items-start gap-4">
            <UserAvatar
              avatarUrl={currentUserAvatarUrl}
              className="h-12 w-12 border border-white/20"
              name={currentUserName ?? "Sen"}
            />
            <div className="flex-1 border-l border-white/10 pl-4">
              <textarea
                className="min-h-20 w-full resize-none rounded-md border border-transparent bg-transparent px-3 py-2 text-sm leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-500 hover:bg-white/[0.03] focus:border-violet-400/40 focus:bg-white/[0.04]"
                maxLength={2000}
                onChange={(event) => setComposerText(event.target.value)}
                placeholder="Duvarına bir şey yaz..."
                value={composerText}
              />
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                <p className="text-xs text-zinc-500">Gönderiler herkese açık akışta da görünebilir.</p>
                <button
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-violet-500 disabled:opacity-50 disabled:hover:translate-y-0"
                  disabled={submitting || !composerText.trim()}
                  onClick={() => void handleSubmit()}
                  type="button"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Paylaş
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {postsError ? <p className="mb-3 text-sm text-rose-300">{postsError}</p> : null}

      {postsLoading ? (
        <div className="space-y-4">
          <ProfileSkeleton className="h-32" />
          <ProfileSkeleton className="h-32" />
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <SocialPostCard
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              isBusy={busyPostId === post.id}
              key={String(post.id)}
              onAddComment={onAddComment}
              onAddReply={onAddReply}
              onBlockAuthor={onBlockAuthor}
              onDeleteComment={onDeleteComment}
              onDeletePost={onDeletePost}
              onLoadComments={onLoadComments}
              onLoadPostLikes={onLoadPostLikes}
              onOpenProfile={(username) => {
                window.location.href = `/profile/${username}`;
              }}
              onSendFriendRequest={onSendFriendRequest}
              onCancelFriendRequest={onCancelFriendRequest}
              onShare={onShare}
              onStartChat={onStartChat}
              onToggleFollowAuthor={onToggleFollowAuthor}
              onToggleCommentLike={onToggleCommentLike}
              onToggleSave={onToggleSave}
              onToggleLike={onToggleLike}
              post={post}
            />
          ))}
        </div>
      ) : (
        <p className="text-base text-zinc-500">
          {isOwnProfile
            ? "Henüz duvar gönderin yok — ilk mesajını paylaş."
            : "Henüz duvar gönderisi yok."}
        </p>
      )}
    </SectionPanel>
  );
}

