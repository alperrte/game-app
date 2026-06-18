import type { ReactionSummary } from "./reactions.types";

export type NewsCategory = "GLOBAL" | "HARDWARE" | "PATCH_NOTES";

export interface NewsArticle {
    id: number;
    title: string;
    summary?: string | null;
    contentUrl: string;
    imageUrl?: string | null;
    sourceName: string;
    category: NewsCategory;
    createdAt: string;
    reactions: ReactionSummary;
    userReaction?: string | null;
}
