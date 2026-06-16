import { useState } from "react";
import { Loader2, Send } from "lucide-react";

import type { SocialPost, SocialUser } from "../../../social/types/social.types";
import { SocialPostCard } from "../../../social/components/SocialPostCard";
import { SectionPanel, ProfileSkeleton } from "./ProfilePrimitives";

type ProfileWallSectionProps = {
  posts: SocialPost[];
  postsLoading: boolean;
  postsError: string | null;
  isOwnProfile: boolean;
  currentUserId?: number;
  currentUserName?: string;
  busyPostId: number | string | null;
  onCreatePost: (content: string) => Promise<void>;
  onAddComment: (postId: number | string, content: string) => Promise<void>;
  onDeleteComment: (postId: number | string, commentId: number) => Promise<void>;
  onLoadComments: (postId: number | string) => Promise<void>;
  onToggleLike: (postId: number | string, likedByMe: boolean) => Promise<void>;
  onLoadPostLikes: (post: SocialPost) => Promise<SocialUser[]>;
};

export function ProfileWallSection({
  posts,
  postsLoading,
  postsError,
  isOwnProfile,
  currentUserId,
  currentUserName,
  busyPostId,
  onCreatePost,
  onAddComment,
  onDeleteComment,
  onLoadComments,
  onToggleLike,
  onLoadPostLikes,
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
        <div className="mb-5 rounded-xl border border-violet-500/20 bg-zinc-950/50 p-4">
          <textarea
            className="min-h-20 w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-base text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-violet-500/40"
            maxLength={2000}
            onChange={(event) => setComposerText(event.target.value)}
            placeholder="Duvarına bir şey yaz..."
            value={composerText}
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-zinc-500">Gönderiler herkese açık akışta da görünebilir.</p>
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-50"
              disabled={submitting || !composerText.trim()}
              onClick={() => void handleSubmit()}
              type="button"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Paylaş
            </button>
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
              onBlockAuthor={async () => {}}
              onDeleteComment={onDeleteComment}
              onDeletePost={async () => {}}
              onLoadComments={onLoadComments}
              onLoadPostLikes={onLoadPostLikes}
              onSendFriendRequest={async () => {}}
              onShare={async () => {}}
              onStartChat={async () => {}}
              onToggleFollowAuthor={async () => {}}
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
