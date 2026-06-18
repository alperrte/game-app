import type { ReactionSummary } from "../types/reactions.types";

export const EMPTY_REACTIONS: ReactionSummary = {
    HYPE: 0,
    WORTH_IT: 0,
    MEH: 0,
    TRASH: 0,
};

export function normalizeReactions(
    raw?: Partial<ReactionSummary> | null,
): ReactionSummary {
    return {
        HYPE: raw?.HYPE ?? 0,
        WORTH_IT: raw?.WORTH_IT ?? 0,
        MEH: raw?.MEH ?? 0,
        TRASH: raw?.TRASH ?? 0,
    };
}
