export type Publisher = {
  id: number;
  name: string;
  description: string | null;
  websiteUrl: string | null;
  country: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type PublisherRequest = {
  name: string;
  description?: string | null;
  websiteUrl?: string | null;
  country?: string | null;
};
