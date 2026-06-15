export type SystemRequirement = {
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
  updatedAt: string | null;
};

export type SystemRequirementRequest = {
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
