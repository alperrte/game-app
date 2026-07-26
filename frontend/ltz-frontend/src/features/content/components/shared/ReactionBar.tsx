import { Flame, Meh, ThumbsDown, Wallet } from "lucide-react";

import { useToast } from "../../../../components/ui/toastContext";
import { cn } from "../../../../utils/cn";
import { getErrorMessage } from "../../../../utils/getErrorMessage";
import {
    contentService,
    type ReactionContentType,
    type ReactionType,
} from "../../services/contentService";
import type { ReactionSummary } from "../../types/reactions.types";
import { normalizeReactions } from "../../utils/reactions";

const reactionConfig: Array<{
    type: ReactionType;
    label: string;
    icon: typeof Flame;
}> = [
    { type: "HYPE", label: "Hype", icon: Flame },
    { type: "WORTH_IT", label: "Değer", icon: Wallet },
    { type: "MEH", label: "Meh", icon: Meh },
    { type: "TRASH", label: "Çöp", icon: ThumbsDown },
];

interface ReactionBarProps {
    contentId: number;
    contentType: ReactionContentType;
    reactions: ReactionSummary;
    userReaction?: string | null;
    onChange?: (next: {
        reactions: ReactionSummary;
        userReaction: string | null;
    }) => void;
}

export function ReactionBar({
    contentId,
    contentType,
    reactions,
    userReaction,
    onChange,
}: ReactionBarProps) {
    const { showToast } = useToast();
    const summary = normalizeReactions(reactions);

    async function handleReaction(type: ReactionType) {
        const previous = {
            reactions: summary,
            userReaction: userReaction ?? null,
        };

        const isSame = userReaction === type;
        const nextSummary = { ...summary };
        let nextUserReaction: string | null = type;

        if (isSame) {
            nextSummary[type] = Math.max(0, nextSummary[type] - 1);
            nextUserReaction = null;
            onChange?.({
                reactions: nextSummary,
                userReaction: nextUserReaction,
            });

            try {
                await contentService.removeReaction(contentId, contentType);
            } catch (removeError) {
                onChange?.(previous);
                showToast(
                    getErrorMessage(removeError, "Reaksiyon kaldırılamadı."),
                    "error",
                );
            }
            return;
        }

        if (userReaction) {
            const prevType = userReaction as ReactionType;
            nextSummary[prevType] = Math.max(0, nextSummary[prevType] - 1);
        }

        nextSummary[type] += 1;
        onChange?.({
            reactions: nextSummary,
            userReaction: nextUserReaction,
        });

        try {
            await contentService.reactToContent({
                contentId,
                contentType,
                reactionType: type,
            });
        } catch (reactError) {
            onChange?.(previous);
            showToast(
                getErrorMessage(reactError, "Reaksiyon gönderilemedi."),
                "error",
            );
        }
    }

    return (
        <div className="flex flex-wrap gap-2">
            {reactionConfig.map(({ type, label, icon: Icon }) => {
                const active = userReaction === type;

                return (
                    <button
                        key={type}
                        type="button"
                        aria-pressed={active}
                        onClick={() => void handleReaction(type)}
                        className={cn(
                            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                            active
                                ? "border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-100 shadow-[0_0_16px_rgba(217,70,239,0.25)]"
                                : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-violet-400/30 hover:text-white",
                        )}
                    >
                        <Icon size={14} />
                        {label}
                        <span>{summary[type]}</span>
                    </button>
                );
            })}
        </div>
    );
}
