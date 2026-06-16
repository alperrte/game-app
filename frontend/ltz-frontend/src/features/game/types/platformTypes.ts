export type Platform = {
  id: number;
  name: string;
  description: string | null;
  source?: string | null;
  status?: string | null;
  totalGames?: number | null;
  activeUsers?: string | null;
  releaseYear?: number | null;
  developer?: string | null;
  dataSource?: string | null;
  logoUrl?: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type PlatformRequest = {
  name: string;
  description?: string | null;
  source?: string | null;
  status?: string | null;
  totalGames?: number | null;
  activeUsers?: string | null;
  releaseYear?: number | null;
  developer?: string | null;
  dataSource?: string | null;
  logoUrl?: string | null;
};
