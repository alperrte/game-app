import type { ReactionSummary } from "./reactions.types";

export type SteamDeckStatus = "VERIFIED" | "PLAYABLE" | "UNSUPPORTED" | string;

export interface DealCampaign {
    id: number;
    gameTitle: string;
    storeName: string;
    dealUrl: string;
    imageUrl?: string | null;
    originalPrice: number;
    discountedPrice: number;
    discountPercent: number;
    currency: string;
    steamDeckStatus?: SteamDeckStatus | null;
    crossPlay: boolean;
    free: boolean;
    endsAt?: string | null;
    metacriticScore?: number | null;
    steamRatingPercent?: number | null;
    lastUpdated: string;
    reactions: ReactionSummary;
    userReaction?: string | null;
}

export interface DealHistoricalLow {
    lowestPrice: number;
    storeName: string;
    currency: string;
    recordedAt: string;
}

export interface DealStoreOffer {
    storeName: string;
    dealUrl: string;
    imageUrl?: string | null;
    originalPrice: number;
    discountedPrice: number;
    discountPercent: number;
    currency: string;
    steamDeckStatus?: SteamDeckStatus | null;
    crossPlay: boolean;
    free: boolean;
    endsAt?: string | null;
}

export interface DealCompareItem {
    campaignId?: number | null;
    gameTitle: string;
    stores: DealStoreOffer[];
    historicalLow?: DealHistoricalLow | null;
    reactions: ReactionSummary;
    userReaction?: string | null;
}
