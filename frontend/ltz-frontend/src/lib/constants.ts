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
 * User-service endpoint path'leri (Gateway üzerinden).
 */
export const USER_API_ENDPOINTS = {
  profile: (userId: string) => `/api/users/profile/${userId}`,
  profileByUsername: (username: string) => `/api/users/profile/username/${username}`,
  me: "/api/users/me",
  setupProfile: "/api/users/profile/setup",
  updateProfile: "/api/users/profile",
  privacy: "/api/users/privacy",
  connectedAccounts: "/api/users/connected-accounts",
  disconnectAccount: (id: number | string) => `/api/users/connected-accounts/${id}`,
  upload: "/api/users/profile/upload",
  auditLogs: "/api/users/audit-logs",
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
  user: "ltz_user",
} as const;

/*
 * Kullanıcı rolleri.
 */
export const ROLES = {
  user: "USER",
  admin: "ADMIN",
} as const;

/*
 * Social-service endpoint path'leri (Gateway üzerinden).
 */
export const SOCIAL_API_ENDPOINTS = {
  users: {
    friends: (userId: number | string) => `/api/social/users/${userId}/friends`,
    followers: (userId: number | string) => `/api/social/users/${userId}/followers`,
    following: (userId: number | string) => `/api/social/users/${userId}/following`,
    posts: (userId: number | string) => `/api/social/users/${userId}/posts`,
  },
  follows: "/api/social/follows",
  friendRequests: "/api/social/friend-requests",
  posts: "/api/social/posts",
} as const;