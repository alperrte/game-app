export type PlatformStatusMap = Record<string, string>;

export interface SteamTopPlayedItem {
    rank: number;
    gameTitle: string;
    ccu: number;
}

export interface TwitchCategoryItem {
    gameTitle: string;
    viewers: number;
}

export interface TwitchLiveStream {
    broadcaster: string;
    title: string;
    gameName: string;
    viewers: number;
    thumbnailUrl: string;
    streamUrl: string;
}

export interface FreeGameItem {
    gameTitle: string;
    storeName: string;
    imageUrl: string;
    dealUrl: string;
    endsAt: string;
    isGiveaway?: boolean;
    worth?: string;
}

export interface UpcomingRelease {
    gameTitle: string;
    releaseDate: string;
    platforms: string[];
    imageUrl: string;
    description: string;
}

export interface SpeedrunRecord {
    gameTitle: string;
    category: string;
    runner: string;
    time: string;
    videoUrl: string;
}

export interface ContentStatsResponse {
    platform_status?: PlatformStatusMap;
    steam_top_played?: SteamTopPlayedItem[];
    twitch_top_categories?: TwitchCategoryItem[];
    twitch_live_streams?: TwitchLiveStream[];
    upcoming_releases?: UpcomingRelease[];
    free_games?: FreeGameItem[];
    speedrun_records?: SpeedrunRecord[];
}
