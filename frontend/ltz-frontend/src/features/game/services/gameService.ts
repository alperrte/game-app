import { apiClient } from "../../../lib/axios";
import { GAME_API_ENDPOINTS } from "../../../lib/constants";
import type {
  Game,
  GameCategory,
  GameCategoryRequest,
  GameDeveloper,
  GameDeveloperRequest,
  GameFilterOptions,
  GameListOptions,
  GamePlatform,
  GamePlatformRequest,
  GamePublisher,
  GamePublisherRequest,
  GameRequest,
  GameSystemRequirement,
  GameSystemRequirementRequest,
  GameSource,
  PageResponse,
} from "../types/gameTypes";

export const getGamesByFilter = (filters: GameFilterOptions = {}) =>
    apiClient.get<PageResponse<Game>>(GAME_API_ENDPOINTS.filterGames, filters);

export const createGame = (request: GameRequest) =>
    apiClient.post<Game>(GAME_API_ENDPOINTS.games, request);

export const getGameCategories = (source?: GameSource) =>
    apiClient.get<GameCategory[]>(GAME_API_ENDPOINTS.categories, { source });

export const createGameCategory = (request: GameCategoryRequest) =>
    apiClient.post<GameCategory>(GAME_API_ENDPOINTS.categories, request);

export const gameService = {
  getGames: (options: GameListOptions = {}) =>
      apiClient.get<PageResponse<Game>>(GAME_API_ENDPOINTS.games, options),

  filterGames: getGamesByFilter,

  getPopularGames: () =>
      apiClient.get<Game[]>(GAME_API_ENDPOINTS.popularGames),

  getGameById: (id: number) =>
      apiClient.get<Game>(GAME_API_ENDPOINTS.gameById(id)),

  createGame,

  updateGame: (id: number, request: GameRequest) =>
      apiClient.put<Game>(GAME_API_ENDPOINTS.gameById(id), request),

  deleteGame: (id: number) =>
      apiClient.delete(GAME_API_ENDPOINTS.gameById(id)),

  getSystemRequirementByGameId: (gameId: number) =>
      apiClient.get<GameSystemRequirement>(
          GAME_API_ENDPOINTS.gameSystemRequirements(gameId)
      ),

  createSystemRequirement: (
      gameId: number,
      request: GameSystemRequirementRequest
  ) =>
      apiClient.post<GameSystemRequirement>(
          GAME_API_ENDPOINTS.gameSystemRequirements(gameId),
          request
      ),

  updateSystemRequirement: (
      gameId: number,
      request: GameSystemRequirementRequest
  ) =>
      apiClient.put<GameSystemRequirement>(
          GAME_API_ENDPOINTS.gameSystemRequirements(gameId),
          request
      ),

  deleteSystemRequirement: (gameId: number) =>
      apiClient.delete(GAME_API_ENDPOINTS.gameSystemRequirements(gameId)),

  getCategories: getGameCategories,

  getCategoryById: (id: number) =>
      apiClient.get<GameCategory>(GAME_API_ENDPOINTS.categoryById(id)),

  createCategory: createGameCategory,

  updateCategory: (id: number, request: GameCategoryRequest) =>
      apiClient.put<GameCategory>(GAME_API_ENDPOINTS.categoryById(id), request),

  deleteCategory: (id: number) =>
      apiClient.delete(GAME_API_ENDPOINTS.categoryById(id)),

  getPlatforms: () =>
      apiClient.get<GamePlatform[]>(GAME_API_ENDPOINTS.platforms),

  getPlatformById: (id: number) =>
      apiClient.get<GamePlatform>(GAME_API_ENDPOINTS.platformById(id)),

  createPlatform: (request: GamePlatformRequest) =>
      apiClient.post<GamePlatform>(GAME_API_ENDPOINTS.platforms, request),

  updatePlatform: (id: number, request: GamePlatformRequest) =>
      apiClient.put<GamePlatform>(GAME_API_ENDPOINTS.platformById(id), request),

  deletePlatform: (id: number) =>
      apiClient.delete(GAME_API_ENDPOINTS.platformById(id)),

  getDevelopers: () =>
      apiClient.get<GameDeveloper[]>(GAME_API_ENDPOINTS.developers),

  getDeveloperById: (id: number) =>
      apiClient.get<GameDeveloper>(GAME_API_ENDPOINTS.developerById(id)),

  createDeveloper: (request: GameDeveloperRequest) =>
      apiClient.post<GameDeveloper>(GAME_API_ENDPOINTS.developers, request),

  updateDeveloper: (id: number, request: GameDeveloperRequest) =>
      apiClient.put<GameDeveloper>(
          GAME_API_ENDPOINTS.developerById(id),
          request
      ),

  deleteDeveloper: (id: number) =>
      apiClient.delete(GAME_API_ENDPOINTS.developerById(id)),

  getPublishers: () =>
      apiClient.get<GamePublisher[]>(GAME_API_ENDPOINTS.publishers),

  getPublisherById: (id: number) =>
      apiClient.get<GamePublisher>(GAME_API_ENDPOINTS.publisherById(id)),

  createPublisher: (request: GamePublisherRequest) =>
      apiClient.post<GamePublisher>(GAME_API_ENDPOINTS.publishers, request),

  updatePublisher: (id: number, request: GamePublisherRequest) =>
      apiClient.put<GamePublisher>(
          GAME_API_ENDPOINTS.publisherById(id),
          request
      ),

  deletePublisher: (id: number) =>
      apiClient.delete(GAME_API_ENDPOINTS.publisherById(id)),
};