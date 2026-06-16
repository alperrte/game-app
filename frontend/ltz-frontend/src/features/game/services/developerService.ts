import { apiClient } from "../../../lib/axios";
import { GAME_API_ENDPOINTS } from "../../../lib/constants";
import type { Developer, DeveloperRequest } from "../types/developerTypes";

export const developerService = {
  getDevelopers: () =>
    apiClient.get<Developer[]>(GAME_API_ENDPOINTS.developers),
  getDeveloperById: (id: number) =>
    apiClient.get<Developer>(GAME_API_ENDPOINTS.developerById(id)),
  createDeveloper: (request: DeveloperRequest) =>
    apiClient.post<Developer>(GAME_API_ENDPOINTS.developers, request),
  updateDeveloper: (id: number, request: DeveloperRequest) =>
    apiClient.put<Developer>(GAME_API_ENDPOINTS.developerById(id), request),
  deleteDeveloper: (id: number) =>
    apiClient.delete(GAME_API_ENDPOINTS.developerById(id)),
};
