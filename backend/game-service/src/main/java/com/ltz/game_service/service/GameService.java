package com.ltz.game_service.service;

import com.ltz.game_service.dto.request.GameRequest;
import com.ltz.game_service.dto.response.GameResponse;
import com.ltz.game_service.entity.Game;
import com.ltz.game_service.entity.GameCategory;
import com.ltz.game_service.entity.GameStoreAvailability;
import com.ltz.game_service.entity.enums.GameSource;
import com.ltz.game_service.exception.GameCategoryNotFoundException;
import com.ltz.game_service.exception.GameNotFoundException;
import com.ltz.game_service.repository.GameCategoryRepository;
import com.ltz.game_service.repository.GameRepository;
import com.ltz.game_service.repository.GameStoreAvailabilityRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class GameService {

    // Sıralama için dışarıdan gelen anahtarın entity alanına güvenli (whitelist) eşlemesi
    private static final Map<String, String> SORT_FIELDS = Map.of(
            "popularity", "popularityScore",
            "releaseDate", "releaseDate",
            "title", "title",
            "createdAt", "createdAt"
    );

    private static final String DEFAULT_SORT_KEY = "popularity";

    private final GameRepository gameRepository;
    private final GameCategoryRepository gameCategoryRepository;
    private final GameStoreAvailabilityRepository storeAvailabilityRepository;

    public GameService(
            GameRepository gameRepository,
            GameCategoryRepository gameCategoryRepository,
            GameStoreAvailabilityRepository storeAvailabilityRepository
    ) {
        this.gameRepository = gameRepository;
        this.gameCategoryRepository = gameCategoryRepository;
        this.storeAvailabilityRepository = storeAvailabilityRepository;
    }

    public Page<GameResponse> getGames(
            String search,
            GameSource store,
            Long category,
            String platform,
            Boolean earlyAccess,
            Boolean onSale,
            Boolean turkishLanguageSupport,
            boolean includeSystemRequirementOnly,
            String sort,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(page, size, resolveSort(sort));

        Specification<Game> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (!includeSystemRequirementOnly) {
                predicates.add(criteriaBuilder.isFalse(root.get("systemRequirementOnly")));
            }

            if (store != null) {
                predicates.add(criteriaBuilder.equal(root.get("source"), store));
            }

            if (category != null) {
                predicates.add(criteriaBuilder.equal(root.get("category").get("id"), category));
            }

            if (platform != null && !platform.isBlank()) {
                predicates.add(
                        criteriaBuilder.like(
                                criteriaBuilder.lower(root.get("platform")),
                                "%" + platform.toLowerCase() + "%"
                        )
                );
            }

            if (earlyAccess != null) {
                predicates.add(criteriaBuilder.equal(root.get("earlyAccess"), earlyAccess));
            }

            if (onSale != null) {
                predicates.add(criteriaBuilder.equal(root.get("onSale"), onSale));
            }

            if (turkishLanguageSupport != null) {
                predicates.add(criteriaBuilder.equal(root.get("turkishLanguageSupport"), turkishLanguageSupport));
            }

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase() + "%";

                predicates.add(
                        criteriaBuilder.or(
                                criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), pattern),
                                criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), pattern)
                        )
                );
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        Page<Game> games = gameRepository.findAll(specification, pageable);
        Map<Long, String> storeUrls = buildStoreUrlMap(games.getContent());

        return games.map(game -> mapToResponse(game, storeUrls.get(game.getId())));
    }

    private Sort resolveSort(String sort) {
        String sortKey = DEFAULT_SORT_KEY;
        String direction = "desc";

        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            sortKey = parts[0].trim();

            if (parts.length > 1 && !parts[1].isBlank()) {
                direction = parts[1].trim();
            }
        }

        String entityField = SORT_FIELDS.getOrDefault(sortKey, SORT_FIELDS.get(DEFAULT_SORT_KEY));

        Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        return Sort.by(sortDirection, entityField);
    }

    public GameResponse getGameById(Long id) {
        Game game = gameRepository.findById(id)
                .orElseThrow(() -> new GameNotFoundException(id));

        return mapToResponse(game, getStoreUrl(game));
    }

    public GameResponse createGame(GameRequest request) {
        Game game = new Game();

        setGameFields(game, request);

        Game savedGame = gameRepository.save(game);

        return mapToResponse(savedGame, getStoreUrl(savedGame));
    }

    public GameResponse updateGame(Long id, GameRequest request) {
        Game game = gameRepository.findById(id)
                .orElseThrow(() -> new GameNotFoundException(id));

        setGameFields(game, request);

        Game updatedGame = gameRepository.save(game);

        return mapToResponse(updatedGame, getStoreUrl(updatedGame));
    }

    public void deleteGame(Long id) {
        if (!gameRepository.existsById(id)) {
            throw new GameNotFoundException(id);
        }

        gameRepository.deleteById(id);
    }

    public List<GameResponse> getPopularGames() {
        List<Game> games = gameRepository.findTop10BySystemRequirementOnlyFalseOrderByPopularityScoreDesc();
        Map<Long, String> storeUrls = buildStoreUrlMap(games);

        return games.stream()
                .map(game -> mapToResponse(game, storeUrls.get(game.getId())))
                .toList();
    }

    private void setGameFields(Game game, GameRequest request) {
        game.setSource(request.getSource());
        game.setCategory(getCategoryOrNull(request.getCategoryId()));
        game.setTitle(request.getTitle());
        game.setDescription(request.getDescription());
        game.setGenre(request.getGenre());
        game.setPlatform(request.getPlatform());
        game.setReleaseDate(request.getReleaseDate());
        game.setDeveloper(request.getDeveloper());
        game.setMinimumSystemRequirements(request.getMinimumSystemRequirements());
        game.setRecommendedSystemRequirements(request.getRecommendedSystemRequirements());
        game.setSupportedLanguages(request.getSupportedLanguages());
        game.setCoverImageUrl(request.getCoverImageUrl());
        game.setEarlyAccess(falseIfNull(request.getEarlyAccess()));
        game.setOnSale(falseIfNull(request.getOnSale()));
        game.setTurkishLanguageSupport(falseIfNull(request.getTurkishLanguageSupport()));
        game.setPopularityScore(integerZeroIfNull(request.getPopularityScore()));
        game.setSystemRequirementOnly(falseIfNull(request.getSystemRequirementOnly()));
    }

    private GameCategory getCategoryOrNull(Long categoryId) {
        if (categoryId == null) {
            return null;
        }

        return gameCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new GameCategoryNotFoundException(categoryId));
    }

    private Boolean falseIfNull(Boolean value) {
        return value != null ? value : false;
    }

    private Integer integerZeroIfNull(Integer value) {
        return value != null ? value : 0;
    }

    // Bir sayfadaki tüm oyunların mağaza URL'lerini tek sorguda toplar (N+1 önlenir).
    private Map<Long, String> buildStoreUrlMap(List<Game> games) {
        List<Long> gameIds = games.stream()
                .map(Game::getId)
                .filter(id -> id != null)
                .toList();

        if (gameIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, String> storeUrls = new LinkedHashMap<>();

        for (GameStoreAvailability availability : storeAvailabilityRepository.findByGame_IdIn(gameIds)) {
            String storeUrl = availability.getStoreUrl();

            if (storeUrl == null || storeUrl.isBlank() || availability.getGame() == null) {
                continue;
            }

            storeUrls.putIfAbsent(availability.getGame().getId(), storeUrl);
        }

        return storeUrls;
    }

    // Tek bir oyun için mağaza URL'i (kaynak eşleşmesiyle).
    private String getStoreUrl(Game game) {
        if (game.getId() == null || game.getSource() == null) {
            return null;
        }

        return storeAvailabilityRepository.findByGameAndSource(game, game.getSource())
                .map(GameStoreAvailability::getStoreUrl)
                .filter(storeUrl -> !storeUrl.isBlank())
                .orElse(null);
    }

    private GameResponse mapToResponse(Game game, String storeUrl) {
        GameCategory category = game.getCategory();

        return new GameResponse(
                game.getId(),
                game.getSource(),
                category != null ? category.getId() : null,
                category != null ? category.getName() : null,
                game.getTitle(),
                game.getDescription(),
                game.getGenre(),
                game.getPlatform(),
                game.getReleaseDate(),
                game.getDeveloper(),
                game.getMinimumSystemRequirements(),
                game.getRecommendedSystemRequirements(),
                game.getSupportedLanguages(),
                game.getCoverImageUrl(),
                storeUrl,
                game.getEarlyAccess(),
                game.getOnSale(),
                game.getTurkishLanguageSupport(),
                game.getPopularityScore(),
                game.getSystemRequirementOnly(),
                game.getCreatedAt(),
                game.getUpdatedAt()
        );
    }
}