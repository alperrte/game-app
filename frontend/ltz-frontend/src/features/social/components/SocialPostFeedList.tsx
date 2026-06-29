import { SocialPostCard } from "./SocialPostCard";
import { useSocialPostFeed } from "../hooks/useSocialPostFeed";
import type { SocialPostResponse } from "../types/social.types";
import { useAuthStore } from "../../../store/authStore";

type SocialPostFeedListProps = {
  backendPosts: SocialPostResponse[];
  isLoading?: boolean;
  emptyMessage?: string;
};

export function SocialPostFeedList({
  backendPosts,
  isLoading = false,
  emptyMessage = "Gösterilecek gönderi yok.",
}: SocialPostFeedListProps) {
  const { user } = useAuthStore();
  const { posts, busyPostId, feedError, currentUser, cardHandlers } =
    useSocialPostFeed({ backendPosts });

  if (isLoading) {
    return <p className="text-sm text-zinc-500">Gönderiler yükleniyor...</p>;
  }

  return (
    <div className="space-y-4">
      {feedError ? (
        <div className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {feedError}
        </div>
      ) : null}

      {posts.length > 0 ? (
        posts.map((post) => (
          <SocialPostCard
            currentUserId={user?.userId}
            currentUserName={currentUser.name}
            isBusy={busyPostId === post.id}
            key={post.id}
            post={post}
            {...cardHandlers}
          />
        ))
      ) : (
        <p className="text-sm text-zinc-500">{emptyMessage}</p>
      )}
    </div>
  );
}
