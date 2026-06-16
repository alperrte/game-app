import { apiClient } from "../../../lib/axios";
import { GAME_API_ENDPOINTS } from "../../../lib/constants";
import type { Platform, PlatformRequest } from "../types/platformTypes";

export const platformService = {
  getPlatforms: () => apiClient.get<Platform[]>(GAME_API_ENDPOINTS.platforms),
  getPlatformById: (id: number) =>
    apiClient.get<Platform>(GAME_API_ENDPOINTS.platformById(id)),
  createPlatform: (request: PlatformRequest) =>
    apiClient.post<Platform>(GAME_API_ENDPOINTS.platforms, request),
  updatePlatform: (id: number, request: PlatformRequest) =>
    apiClient.put<Platform>(GAME_API_ENDPOINTS.platformById(id), request),
  deletePlatform: (id: number) =>
    apiClient.delete(GAME_API_ENDPOINTS.platformById(id)),
};
