import { apiClient } from "../../../lib/axios";
import { GAME_API_ENDPOINTS } from "../../../lib/constants";
import type { Publisher, PublisherRequest } from "../types/publisherTypes";

export const publisherService = {
  getPublishers: () =>
    apiClient.get<Publisher[]>(GAME_API_ENDPOINTS.publishers),
  getPublisherById: (id: number) =>
    apiClient.get<Publisher>(GAME_API_ENDPOINTS.publisherById(id)),
  createPublisher: (request: PublisherRequest) =>
    apiClient.post<Publisher>(GAME_API_ENDPOINTS.publishers, request),
  updatePublisher: (id: number, request: PublisherRequest) =>
    apiClient.put<Publisher>(GAME_API_ENDPOINTS.publisherById(id), request),
  deletePublisher: (id: number) =>
    apiClient.delete(GAME_API_ENDPOINTS.publisherById(id)),
};
