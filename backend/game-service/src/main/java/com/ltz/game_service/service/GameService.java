package com.ltz.game_service.service;

import com.ltz.game_service.dto.request.GameRequest;
import com.ltz.game_service.dto.response.GameResponse;
import com.ltz.game_service.entity.Game;
import com.ltz.game_service.entity.GameCategory;
import com.ltz.game_service.enums.GameSource;
import com.ltz.game_service.repository.GameCategoryRepository;
import com.ltz.game_service.repository.GameRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class GameService {

    private final GameRepository gameRepository;
    private final GameCategoryRepository gameCategoryRepository;

    public GameService(
            GameRepository gameRepository,
            GameCategoryRepository gameCategoryRepository
    ) {
        this.gameRepository = gameRepository;
        this.gameCategoryRepository = gameCategoryRepository;
    }

    public List<GameResponse> getAllGames() {
        return gameRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public GameResponse getGameById(Long id) {
        Game game = gameRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Oyun bulunamadı. ID: " + id));

        return mapToResponse(game);
    }

    public GameResponse createGame(GameRequest request) {
        Game game = new Game();

        setGameFields(game, request);

        Game savedGame = gameRepository.save(game);

        return mapToResponse(savedGame);
    }

    public GameResponse updateGame(Long id, GameRequest request) {
        Game game = gameRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Güncellenecek oyun bulunamadı. ID: " + id));

        setGameFields(game, request);

        Game updatedGame = gameRepository.save(game);

        return mapToResponse(updatedGame);
    }

    public void deleteGame(Long id) {
        if (!gameRepository.existsById(id)) {
            throw new RuntimeException("Silinecek oyun bulunamadı. ID: " + id);
        }

        gameRepository.deleteById(id);
    }

    public List<GameResponse> filterGames(
            GameSource source,
            Long categoryId,
            String title,
            String genre,
            String platform,
            Boolean earlyAccess,
            Boolean onSale,
            Boolean turkishLanguageSupport
    ) {
        Specification<Game> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (source != null) {
                predicates.add(criteriaBuilder.equal(root.get("source"), source));
            }

            if (categoryId != null) {
                predicates.add(criteriaBuilder.equal(root.get("category").get("id"), categoryId));
            }

            if (title != null && !title.isBlank()) {
                predicates.add(
                        criteriaBuilder.like(
                                criteriaBuilder.lower(root.get("title")),
                                "%" + title.toLowerCase() + "%"
                        )
                );
            }

            if (genre != null && !genre.isBlank()) {
                predicates.add(
                        criteriaBuilder.like(
                                criteriaBuilder.lower(root.get("genre")),
                                "%" + genre.toLowerCase() + "%"
                        )
                );
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

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return gameRepository.findAll(specification)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<GameResponse> getPopularGames() {
        return gameRepository.findTop10ByOrderByPopularityScoreDesc()
                .stream()
                .map(this::mapToResponse)
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
        game.setPublisher(request.getPublisher());
        game.setMinimumSystemRequirements(request.getMinimumSystemRequirements());
        game.setRecommendedSystemRequirements(request.getRecommendedSystemRequirements());
        game.setSupportedLanguages(request.getSupportedLanguages());
        game.setCoverImageUrl(request.getCoverImageUrl());
        game.setEarlyAccess(falseIfNull(request.getEarlyAccess()));
        game.setOnSale(falseIfNull(request.getOnSale()));
        game.setTurkishLanguageSupport(falseIfNull(request.getTurkishLanguageSupport()));
        game.setPopularityScore(integerZeroIfNull(request.getPopularityScore()));
    }

    private GameCategory getCategoryOrNull(Long categoryId) {
        if (categoryId == null) {
            return null;
        }

        return gameCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Kategori bulunamadı. ID: " + categoryId));
    }

    private Boolean falseIfNull(Boolean value) {
        return value != null ? value : false;
    }

    private Integer integerZeroIfNull(Integer value) {
        return value != null ? value : 0;
    }

    private GameResponse mapToResponse(Game game) {
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
                game.getPublisher(),
                game.getMinimumSystemRequirements(),
                game.getRecommendedSystemRequirements(),
                game.getSupportedLanguages(),
                game.getCoverImageUrl(),
                game.getEarlyAccess(),
                game.getOnSale(),
                game.getTurkishLanguageSupport(),
                game.getPopularityScore(),
                game.getCreatedAt(),
                game.getUpdatedAt()
        );
    }
}