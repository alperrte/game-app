import type { GameSource } from "./externalGame.types";

export type { GameSource } from "./externalGame.types";
export type {
  Developer,
  DeveloperRequest,
  Developer as GameDeveloper,
  DeveloperRequest as GameDeveloperRequest,
} from "./developerTypes";
export type {
  Platform,
  PlatformRequest,
  Platform as GamePlatform,
  PlatformRequest as GamePlatformRequest,
} from "./platformTypes";
export type {
  SystemRequirement,
  SystemRequirementRequest,
  SystemRequirement as GameSystemRequirement,
  SystemRequirementRequest as GameSystemRequirementRequest,
} from "./systemRequirementTypes";

export type Game = {
  id: number;
  source: GameSource;
  categoryId: number | null;
  categoryName: string | null;
  title: string;
  description: string | null;
  genre: string | null;
  platform: string | null;
  releaseDate: string | null;
  developer: string | null;
  minimumSystemRequirements: string | null;
  recommendedSystemRequirements: string | null;
  supportedLanguages: string | null;
  coverImageUrl: string | null;
  storeUrl: string | null;
  earlyAccess: boolean;
  onSale: boolean;
  turkishLanguageSupport: boolean;
  popularityScore: number;
  systemRequirementOnly?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GameRequest = {
  source?: GameSource;
  categoryId?: number | null;
  title: string;
  description?: string | null;
  genre?: string | null;
  platform?: string | null;
  releaseDate?: string | null;
  developer?: string | null;
  minimumSystemRequirements?: string | null;
  recommendedSystemRequirements?: string | null;
  supportedLanguages?: string | null;
  coverImageUrl?: string | null;
  earlyAccess?: boolean;
  onSale?: boolean;
  turkishLanguageSupport?: boolean;
  popularityScore?: number;
  systemRequirementOnly?: boolean;
};

export type GameSortOption =
  | "popularity,desc"
  | "popularity,asc"
  | "releaseDate,desc"
  | "releaseDate,asc"
  | "title,asc"
  | "title,desc"
  | "createdAt,desc"
  | "createdAt,asc";

export type GameFilters = {
  // Yeni /api/games sözleşmesi
  search?: string;
  store?: GameSource;
  category?: number;
  platform?: string;
  sort?: string;
  includeSystemRequirementOnly?: boolean;
  earlyAccess?: boolean;
  onSale?: boolean;
  turkishLanguageSupport?: boolean;
  // Legacy alanlar (review/profil/social feature'ları için geriye uyumluluk;
  // gameService içinde yeni sözleşmeye eşlenir)
  source?: GameSource;
  categoryId?: number;
  title?: string;
  genre?: string;
};

export type PageRequest = {
  page?: number;
  size?: number;
};

export type PageResponse<T> = {
  content: T[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type GameListOptions = GameFilters & PageRequest;

export type GameFilterOptions = GameFilters & PageRequest;

export type GameCategory = {
  id: number;
  source: GameSource;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type GameCategoryRequest = {
  source: GameSource;
  name: string;
  description?: string | null;
};