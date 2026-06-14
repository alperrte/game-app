export type Game = {
  id: number;
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
  popularityScore: number;
  createdAt: string;
  updatedAt: string;
};

export type GameRequest = {
  title: string;
  description?: string | null;
  genre?: string | null;
  platform?: string | null;
  releaseDate?: string | null;
  developer?: string | null;
  publisher?: string | null;
  minimumSystemRequirements?: string | null;
  recommendedSystemRequirements?: string | null;
  supportedLanguages?: string | null;
  coverImageUrl?: string | null;
  earlyAccess?: boolean;
  onSale?: boolean;
  turkishLanguageSupport?: boolean;
  popularityScore?: number;
};

export type GameFilters = {
  title?: string;
  genre?: string;
  platform?: string;
  earlyAccess?: boolean;
  onSale?: boolean;
  turkishLanguageSupport?: boolean;
};

export type GameSystemRequirement = {
  id: number;
  gameId: number;
  minimumOs: string | null;
  minimumCpu: string | null;
  minimumGpu: string | null;
  minimumRam: string | null;
  minimumStorage: string | null;
  recommendedOs: string | null;
  recommendedCpu: string | null;
  recommendedGpu: string | null;
  recommendedRam: string | null;
  recommendedStorage: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GameSystemRequirementRequest = {
  minimumOs?: string | null;
  minimumCpu?: string | null;
  minimumGpu?: string | null;
  minimumRam?: string | null;
  minimumStorage?: string | null;
  recommendedOs?: string | null;
  recommendedCpu?: string | null;
  recommendedGpu?: string | null;
  recommendedRam?: string | null;
  recommendedStorage?: string | null;
  notes?: string | null;
};

export type GameCategory = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GameCategoryRequest = {
  name: string;
  description?: string | null;
};

export type GamePlatform = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GamePlatformRequest = {
  name: string;
  description?: string | null;
};

export type GameDeveloper = {
  id: number;
  name: string;
  description: string | null;
  websiteUrl: string | null;
  country: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GameDeveloperRequest = {
  name: string;
  description?: string | null;
  websiteUrl?: string | null;
  country?: string | null;
};

export type GamePublisher = {
  id: number;
  name: string;
  description: string | null;
  websiteUrl: string | null;
  country: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GamePublisherRequest = {
  name: string;
  description?: string | null;
  websiteUrl?: string | null;
  country?: string | null;
};
