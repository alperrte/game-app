export type GameSource = "STEAM" | "EPIC";

export type ExternalGameSearchResponse = {
  source: GameSource;
  externalId: string;
  title: string;
  coverImageUrl: string | null;
};

export type ExternalGamePageResponse = {
  items: ExternalGameSearchResponse[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

export type ExternalGameDetailResponse = {
  source: GameSource;
  externalId: string;
  title: string;
  description: string | null;
  genre: string | null;
  platform: string | null;
  releaseDate: string | null;
  developer: string | null;
  publisher: string | null;
  minimumSystemRequirements: string | null;
  recommendedSystemRequirements: string | null;
  supportedLanguages: string | null;
  coverImageUrl: string | null;
  earlyAccess: boolean;
  onSale: boolean;
  turkishLanguageSupport: boolean;
};

export type ExternalGameCategory = {
  source: GameSource;
  externalId: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  gameCount: number;
  status: string;
  dataSource: string;
};

export type ExternalGameTag = {
  source: GameSource;
  externalId: string;
  name: string;
  description: string | null;
  imageUrl?: string | null;
  gameCount: number | null;
  status: string;
  sourceProvider: string;
};

export type ExternalGamePlatform = {
  source: GameSource;
  name: string;
  description: string;
  status: string;
  totalGames: number;
  activeUsers: string | null;
  releaseYear: number;
  developer: string;
  dataSource: string;
  logoUrl?: string | null;
};
