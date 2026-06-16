export type Developer = {
  id: number;
  name: string;
  description: string | null;
  websiteUrl: string | null;
  logoUrl?: string | null;
  country: string | null;
  foundedDate?: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type DeveloperRequest = {
  name: string;
  description?: string | null;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  country?: string | null;
  foundedDate?: string | null;
};
