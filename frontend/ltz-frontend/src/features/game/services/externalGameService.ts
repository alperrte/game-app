import { apiClient } from "../../../lib/axios";
import { GAME_API_ENDPOINTS } from "../../../lib/constants";
import type {
  ExternalGameCategory,
  ExternalGameDetailResponse,
  ExternalGamePlatform,
  ExternalGameSearchResponse,
  GameSource,
} from "../types/externalGame.types";

export function searchExternalGames(
  source: GameSource,
  query: string
): Promise<ExternalGameSearchResponse[]> {
  return apiClient.get<ExternalGameSearchResponse[]>(
    GAME_API_ENDPOINTS.externalGameSearch,
    { source, query }
  );
}

export function getExternalGameDetail(
  source: GameSource,
  externalId: string
): Promise<ExternalGameDetailResponse> {
  return apiClient.get<ExternalGameDetailResponse>(
    GAME_API_ENDPOINTS.externalGameDetail,
    { source, externalId }
  );
}

export function getExternalGameCategories(
  source: GameSource,
  query?: string
): Promise<ExternalGameCategory[]> {
  return apiClient.get<ExternalGameCategory[]>(
    GAME_API_ENDPOINTS.externalGameCategories,
    { source, query }
  );
}

export function getExternalGamePlatforms(): Promise<ExternalGamePlatform[]> {
  return apiClient.get<ExternalGamePlatform[]>(
    GAME_API_ENDPOINTS.externalGamePlatforms
  );
}
