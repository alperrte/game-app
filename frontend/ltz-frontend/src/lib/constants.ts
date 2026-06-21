export const APP_NAME = "LobbyTwoZero";
export const APP_SHORT_NAME = "LTZ";

/*
 * API Gateway base URL.
 * Frontend tüm isteklerini bu adres üzerinden gönderir.
 * Değer .env içindeki VITE_API_BASE_URL'den gelir.
 */
export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:7070";

/*
 * Sosyal medya bağlantıları.
 * Discord sunucu davet linki .env'den (VITE_DISCORD_INVITE_URL) gelir.
 */
export const SOCIAL_LINKS = {
    discord:
        import.meta.env.VITE_DISCORD_INVITE_URL ??
        "https://discord.gg/aFc7HRBpfh",
    instagram: "#",
    x: "#",
    youtube: "#",
} as const;

/*
 * Auth-service endpoint path'leri (Gateway üzerinden).
 */
export const AUTH_ENDPOINTS = {
    login: "/api/auth/login",
    register: "/api/auth/register",
    refreshToken: "/api/auth/refresh-token",
    logout: "/api/auth/logout",
    validateToken: "/api/auth/validate-token",
} as const;

/*
 * Uygulama route adresleri.
 */
export const ROUTES = {
    login: "/login",
    register: "/register",
    oauthCallback: "/oauth/callback",
    home: "/",
    profile: "/profile/:username",
} as const;

/*
 * Social-service frontend route adresleri.
 */
export const SOCIAL_ROUTES = {
    feed: ROUTES.home,
    explore: "/explore",
    communities: "/communities",
    events: "/events",
    messages: "/messages",
    chatRoom: (roomId: number | string) => `/messages/${roomId}`,
} as const;

/*
 * Social-service endpoint path'leri (Gateway üzerinden).
 */
export const SOCIAL_API_ENDPOINTS = {
    imageUploads: "/api/social/media/images",
    videoUploads: "/api/social/media/videos",

    publicPosts: "/api/social/posts/public",
    posts: "/api/social/posts",
    userPosts: (userId: number | string) =>
        `/api/social/users/${userId}/posts`,
    postById: (id: number | string) => `/api/social/posts/${id}`,
    postLikes: (postId: number | string) =>
        `/api/social/posts/${postId}/likes`,
    postComments: (postId: number | string) =>
        `/api/social/posts/${postId}/comments`,

    commentById: (commentId: number | string) =>
        `/api/social/comments/${commentId}`,
    commentLikes: (commentId: number | string) =>
        `/api/social/comments/${commentId}/likes`,

    friendRequests: "/api/social/friend-requests",
    acceptFriendRequest: (requestId: number | string) =>
        `/api/social/friend-requests/${requestId}/accept`,
    rejectFriendRequest: (requestId: number | string) =>
        `/api/social/friend-requests/${requestId}/reject`,
    cancelFriendRequest: (requestId: number | string) =>
        `/api/social/friend-requests/${requestId}/cancel`,
    incomingFriendRequests: (userId: number | string) =>
        `/api/social/users/${userId}/friend-requests/incoming`,
    outgoingFriendRequests: (userId: number | string) =>
        `/api/social/users/${userId}/friend-requests/outgoing`,

    friends: (userId: number | string) =>
        `/api/social/users/${userId}/friends`,
    friendById: (userId: number | string, friendUserId: number | string) =>
        `/api/social/users/${userId}/friends/${friendUserId}`,

    follows: "/api/social/follows",
    following: (userId: number | string) =>
        `/api/social/users/${userId}/following`,
    followers: (userId: number | string) =>
        `/api/social/users/${userId}/followers`,

    blocks: "/api/social/blocks",
    blockedUsers: (userId: number | string) =>
        `/api/social/users/${userId}/blocks`,

    chatRooms: "/api/social/chat-rooms",
    directChatRooms: "/api/social/chat-rooms/direct",
    myChatRooms: "/api/social/chat-rooms/mine",
    chatRoomById: (chatRoomId: number | string) =>
        `/api/social/chat-rooms/${chatRoomId}`,
    userChatRooms: (userId: number | string) =>
        `/api/social/users/${userId}/chat-rooms`,

    messages: "/api/social/messages",
    messageById: (messageId: number | string) =>
        `/api/social/messages/${messageId}`,
    messageReactions: (messageId: number | string) =>
        `/api/social/messages/${messageId}/reactions`,
    chatRoomMessages: (chatRoomId: number | string) =>
        `/api/social/chat-rooms/${chatRoomId}/messages`,
    markChatRoomRead: (chatRoomId: number | string) =>
        `/api/social/chat-rooms/${chatRoomId}/read`,
    hideChatRoom: (chatRoomId: number | string) =>
        `/api/social/chat-rooms/${chatRoomId}/hide`,

    lookingForPlayer: "/api/social/looking-for-player",
    openLookingForPlayer: "/api/social/looking-for-player/open",
    userLookingForPlayer: (userId: number | string) =>
        `/api/social/users/${userId}/looking-for-player`,
    gameOpenLookingForPlayer: (gameId: number | string) =>
        `/api/social/games/${gameId}/looking-for-player/open`,
    closeLookingForPlayer: (postId: number | string) =>
        `/api/social/looking-for-player/${postId}/close`,
    cancelLookingForPlayer: (postId: number | string) =>
        `/api/social/looking-for-player/${postId}/cancel`,

    gameCatalogGames: "/api/social/game-catalog/games",
    gameCatalogPlatforms: "/api/social/game-catalog/platforms",
} as const;

/*
 * User-service endpoint path'leri (Gateway üzerinden).
 */
export const USER_API_ENDPOINTS = {
    profile: (userId: string) => `/api/users/profile/${userId}`,
    userReviews: (userId: number | string) => `/api/users/profile/${userId}/reviews`,

    // Backward-compatible alias used by existing services.
    profileById: (userId: number | string) => `/api/users/profile/${userId}`,

    profileByUsername: (username: string) =>
        `/api/users/profile/username/${username}`,

    me: "/api/users/me",
    setupProfile: "/api/users/profile/setup",
    updateProfile: "/api/users/profile",
    privacy: "/api/users/privacy",

    connectedAccounts: "/api/users/connected-accounts",
    disconnectAccount: (id: number | string) =>
        `/api/users/connected-accounts/${id}`,

    upload: "/api/users/profile/upload",
    auditLogs: "/api/users/audit-logs",
    batch: "/api/users/profiles/batch",

    adminBadgeCatalog: "/api/users/admin/badges/catalog",
    adminUserBadges: (userId: string) => `/api/users/admin/${userId}/badges`,
    adminUserBadge: (userId: string, badgeKey: string) =>
        `/api/users/admin/${userId}/badges/${badgeKey}`,
} as const;

/*
 * Game-service frontend route adresleri.
 */
export const GAME_ROUTES = {
    games: "/games",
    popularGames: "/games/popular",
    gameDetail: (id: number | string) => `/games/${id}`,
    createGame: "/games/create",
    editGame: (id: number | string) => `/games/${id}/edit`,
    gameSystemRequirements: (id: number | string) =>
        `/games/${id}/system-requirements`,
    systemRequirements: "/games/system-requirements",
    categories: "/games/categories",
    platforms: "/games/platforms",
    developers: "/games/developers",
    publishers: "/games/publishers",
    externalGameDetail: (source: string, externalId: string) =>
        `/games/external/${source}/${externalId}`,
} as const;

/*
 * Game-service endpoint path'leri (Gateway üzerinden).
 */
export const GAME_API_ENDPOINTS = {
    games: "/api/games",
    filterGames: "/api/games/filter",
    popularGames: "/api/games/popular",
    gameById: (id: number | string) => `/api/games/${id}`,
    gameSystemRequirements: (gameId: number | string) =>
        `/api/games/${gameId}/system-requirements`,

    categories: "/api/games/categories",
    categoryById: (id: number | string) => `/api/games/categories/${id}`,

    platforms: "/api/games/platforms",
    platformById: (id: number | string) => `/api/games/platforms/${id}`,

    developers: "/api/games/developers",
    developerById: (id: number | string) => `/api/games/developers/${id}`,

    publishers: "/api/games/publishers",
    publisherById: (id: number | string) => `/api/games/publishers/${id}`,

    externalGameSearch: "/api/games/external/search",
    externalApps: "/api/games/external/apps",
    externalGameDetail: "/api/games/external/detail",
    externalGameCategories: "/api/games/external/categories",
    externalGameTags: "/api/games/external/tags",
    externalGamePlatforms: "/api/games/external/platforms",
} as const;

/*
 * Review-service endpoint path'leri (Gateway üzerinden).
 */
export const REVIEW_API_ENDPOINTS = {
    reviews: "/api/reviews",

    reviewById: (id: number | string) => `/api/reviews/${id}`,

    gameReviews: (gameId: number | string) =>
        `/api/reviews/game/${gameId}`,

    externalGameReviews: (
        gameSource: string,
        externalGameId: number | string,
    ) => `/api/reviews/external/${gameSource}/${externalGameId}`,

    userReviews: (userId: number | string) =>
        `/api/reviews/user/${userId}`,

    averageRating: (gameId: number | string) =>
        `/api/reviews/game/${gameId}/average-rating`,

    externalAverageRating: (
        gameSource: string,
        externalGameId: number | string,
    ) => `/api/reviews/external/${gameSource}/${externalGameId}/average-rating`,

    topReviews: (gameId: number | string) =>
        `/api/reviews/game/${gameId}/top`,

    externalTopReviews: (
        gameSource: string,
        externalGameId: number | string,
    ) => `/api/reviews/external/${gameSource}/${externalGameId}/top`,

    likeReview: (reviewId: number | string) =>
        `/api/reviews/${reviewId}/like`,

    reportReview: (reviewId: number | string) =>
        `/api/reviews/${reviewId}/report`,
} as const;

/*
 * Content-service frontend route adresleri.
 */
export const CONTENT_ROUTES = {
    hub: "/content",
    deals: "/content/deals",
    news: "/content/news",
    esports: "/content/esports",
    free: "/content/free",
    trivia: "/content/trivia",
    history: "/content/history",
} as const;

export const CONTENT_NAV_TABS = [
    { label: "Ana Panel", href: CONTENT_ROUTES.hub, end: true },
    { label: "İndirimler", href: CONTENT_ROUTES.deals, end: false },
    { label: "Haberler", href: CONTENT_ROUTES.news, end: false },
    { label: "Espor", href: CONTENT_ROUTES.esports, end: false },
    { label: "Ücretsiz", href: CONTENT_ROUTES.free, end: false },
    { label: "Trivia", href: CONTENT_ROUTES.trivia, end: false },
    { label: "Tarih", href: CONTENT_ROUTES.history, end: false },
] as const;

/*
 * Content-service endpoint path'leri (Gateway üzerinden).
 */
export const CONTENT_API_ENDPOINTS = {
    stats: "/api/content/stats",
    statByKey: (key: string) => `/api/content/stats/${key}`,
    esports: "/api/content/stats/esports",
    news: "/api/content/news",
    newsById: (id: number | string) => `/api/content/news/${id}`,
    deals: "/api/content/deals",
    dealsSearch: "/api/content/deals/search",
    freeGames: "/api/content/deals/free-games",
    historyToday: "/api/content/history/today",
    historyByDate: "/api/content/history/date",
    triviaToday: "/api/content/trivia/today",
    triviaSubmit: "/api/content/trivia/submit",
    reactions: "/api/content/reactions",
    spotlight: "/api/content/spotlight",
} as const;

/*
 * Form doğrulama kuralları (backend RegisterRequest ile uyumlu).
 */
export const VALIDATION = {
    passwordMin: 6,
    passwordMax: 100,
    usernameMin: 3,
    usernameMax: 100,
    emailMax: 150,
} as const;

/*
 * localStorage key değerleri.
 */
export const STORAGE_KEYS = {
    accessToken: "ltz_access_token",
    refreshToken: "ltz_refresh_token",
    savedSocialPosts: "ltz_saved_social_posts",
    user: "ltz_user",
    userIdentityCache: "ltz_user_identity_cache",
    profileReadyUserId: "ltz_profile_ready_user_id",
} as const;

/*
 * Kullanıcı rolleri.
 */
export const ROLES = {
    user: "USER",
    admin: "ADMIN",
} as const;