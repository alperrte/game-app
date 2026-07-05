package com.ltz.game_service.service;

import com.ltz.game_service.dto.request.GameCategoryRequest;
import com.ltz.game_service.dto.response.GameCategoryResponse;
import com.ltz.game_service.entity.GameCategory;
import com.ltz.game_service.entity.enums.GameSource;
import com.ltz.game_service.repository.GameCategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GameCategoryService {

    private final GameCategoryRepository gameCategoryRepository;

    public GameCategoryService(GameCategoryRepository gameCategoryRepository) {
        this.gameCategoryRepository = gameCategoryRepository;
    }

    public List<GameCategoryResponse> getAllCategories() {
        return gameCategoryRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<GameCategoryResponse> getCategoriesBySource(GameSource source) {
        return gameCategoryRepository.findBySource(source)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public GameCategoryResponse getCategoryById(Long id) {
        GameCategory category = gameCategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kategori bulunamadı. ID: " + id));

        return mapToResponse(category);
    }

    public GameCategoryResponse createCategory(GameCategoryRequest request) {
        validateCategoryDoesNotExist(request);

        GameCategory category = new GameCategory();
        category.setSource(request.getSource());
        category.setName(request.getName());
        category.setDescription(request.getDescription());

        GameCategory savedCategory = gameCategoryRepository.save(category);

        return mapToResponse(savedCategory);
    }

    public GameCategoryResponse updateCategory(Long id, GameCategoryRequest request) {
        GameCategory category = gameCategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Güncellenecek kategori bulunamadı. ID: " + id));

        category.setSource(request.getSource());
        category.setName(request.getName());
        category.setDescription(request.getDescription());

        GameCategory updatedCategory = gameCategoryRepository.save(category);

        return mapToResponse(updatedCategory);
    }

    public void deleteCategory(Long id) {
        if (!gameCategoryRepository.existsById(id)) {
            throw new RuntimeException("Silinecek kategori bulunamadı. ID: " + id);
        }

        gameCategoryRepository.deleteById(id);
    }

    private void validateCategoryDoesNotExist(GameCategoryRequest request) {
        boolean exists;

        if (request.getSource() != null) {
            exists = gameCategoryRepository.existsBySourceAndNameIgnoreCase(
                    request.getSource(),
                    request.getName()
            );
        } else {
            exists = gameCategoryRepository.existsByNameIgnoreCase(request.getName());
        }

        if (exists) {
            throw new RuntimeException("Bu kategori zaten mevcut: " + request.getName());
        }
    }

    private GameCategoryResponse mapToResponse(GameCategory category) {
        return new GameCategoryResponse(
                category.getId(),
                category.getSource(),
                category.getName(),
                category.getDescription(),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }
}