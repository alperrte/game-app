import { apiClient } from "../../../lib/axios";
import { GAME_API_ENDPOINTS } from "../../../lib/constants";
import type {
  SystemRequirement,
  SystemRequirementRequest,
} from "../types/systemRequirementTypes";

export const systemRequirementService = {
  getSystemRequirements: (gameId: number) =>
    apiClient.get<SystemRequirement>(
      GAME_API_ENDPOINTS.gameSystemRequirements(gameId)
    ),
  createSystemRequirements: (
    gameId: number,
    request: SystemRequirementRequest
  ) =>
    apiClient.post<SystemRequirement>(
      GAME_API_ENDPOINTS.gameSystemRequirements(gameId),
      request
    ),
  updateSystemRequirements: (
    gameId: number,
    request: SystemRequirementRequest
  ) =>
    apiClient.put<SystemRequirement>(
      GAME_API_ENDPOINTS.gameSystemRequirements(gameId),
      request
    ),
  deleteSystemRequirements: (gameId: number) =>
    apiClient.delete(GAME_API_ENDPOINTS.gameSystemRequirements(gameId)),
};
