import { useState } from "react";
import { Share2 } from "lucide-react";

import { cn } from "../../../../utils/cn";
import { getErrorMessage } from "../../../../utils/getErrorMessage";
import { useToast } from "../../../../components/ui/toastContext";
import { socialService } from "../../../social/services/socialService";

interface ShareToFeedButtonProps {
    content: string;
    imageUrl?: string | null;
    className?: string;
}

export function ShareToFeedButton({
    content,
    imageUrl,
    className,
}: ShareToFeedButtonProps) {
    const { showToast } = useToast();
    const [sharing, setSharing] = useState(false);

    async function handleShare() {
        if (sharing) return;
        setSharing(true);
        try {
            await socialService.createPost({
                content,
                ...(imageUrl ? { imageUrl } : {}),
            });
            showToast("Akışta paylaşıldı.", "success");
        } catch (shareError) {
            showToast(
                getErrorMessage(shareError, "Paylaşılamadı, tekrar dene."),
                "error",
            );
        } finally {
            setSharing(false);
        }
    }

    return (
        <button
            type="button"
            disabled={sharing}
            aria-label="Akışta paylaş"
            onClick={() => void handleShare()}
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-slate-400 transition hover:border-violet-400/30 hover:text-white disabled:opacity-50",
                className,
            )}
        >
            <Share2 size={13} />
            {sharing ? "Paylaşılıyor..." : "Paylaş"}
        </button>
    );
}
