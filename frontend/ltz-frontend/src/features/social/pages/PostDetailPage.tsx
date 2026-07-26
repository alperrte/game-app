import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { SOCIAL_ROUTES } from "../../../lib/constants";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { useToast } from "../../../components/ui/toastContext";
import { socialService } from "../services/socialService";
import { SocialPostFeedList } from "../components/SocialPostFeedList";
import type { SocialPostResponse } from "../types/social.types";

export default function PostDetailPage() {
  const { postId: postIdParam } = useParams<{ postId: string }>();
  const postId = Number(postIdParam);
  const { showToast } = useToast();

  const [post, setPost] = useState<SocialPostResponse | null>(null);
  const [loading, setLoading] = useState(() => Number.isFinite(postId));
  const [notFound, setNotFound] = useState(() => !Number.isFinite(postId));

  useEffect(() => {
    if (!Number.isFinite(postId)) {
      return;
    }

    let active = true;
    void Promise.resolve().then(async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const loaded = await socialService.getPostById(postId);
        if (!active) return;
        setPost(loaded);
      } catch (error) {
        if (active) {
          showToast(getErrorMessage(error, "Gönderi yüklenemedi."), "error");
          setNotFound(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [postId, showToast]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center px-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </main>
    );
  }

  if (notFound || !post) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-8 text-center">
        <p className="text-lg text-zinc-300">Gönderi bulunamadı veya görüntüleme yetkin yok.</p>
        <Link
          className="inline-flex rounded-xl bg-violet-600 px-5 py-2 font-bold text-white"
          to={SOCIAL_ROUTES.feed}
        >
          Ana akışa dön
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 transition hover:text-white"
        to={SOCIAL_ROUTES.feed}
      >
        <ArrowLeft className="h-4 w-4" /> Ana akışa dön
      </Link>

      <SocialPostFeedList backendPosts={[post]} />
    </main>
  );
}
