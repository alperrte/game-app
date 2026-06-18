export type ReactionType = "HYPE" | "WORTH_IT" | "MEH" | "TRASH";

export type ReactionContentType = "NEWS" | "CAMPAIGN";

export type ReactionSummary = Record<ReactionType, number>;

export interface ReactionRequestBody {
    contentId: number;
    contentType: ReactionContentType;
    reactionType: ReactionType;
}
