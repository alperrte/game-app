export const API_BASE_URL =
  import.meta.env.VITE_API_GATEWAY_URL ?? "http://localhost:8080";

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
