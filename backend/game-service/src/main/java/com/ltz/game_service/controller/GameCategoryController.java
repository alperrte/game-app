package com.ltz.game_service.controller;

import com.ltz.game_service.dto.request.GameCategoryRequest;
import com.ltz.game_service.dto.response.GameCategoryResponse;
import com.ltz.game_service.entity.enums.GameSource;
import com.ltz.game_service.service.GameCategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/games/categories")
public class GameCategoryController {

    private final GameCategoryService gameCategoryService;

    public GameCategoryController(GameCategoryService gameCategoryService) {
        this.gameCategoryService = gameCategoryService;
    }

    @GetMapping
    public ResponseEntity<List<GameCategoryResponse>> getAllCategories(
            @RequestParam(required = false) GameSource source
    ) {
        if (source != null) {
            return ResponseEntity.ok(gameCategoryService.getCategoriesBySource(source));
        }

        return ResponseEntity.ok(gameCategoryService.getAllCategories());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GameCategoryResponse> getCategoryById(@PathVariable Long id) {
        return ResponseEntity.ok(gameCategoryService.getCategoryById(id));
    }

    @PostMapping
    public ResponseEntity<GameCategoryResponse> createCategory(
            @Valid @RequestBody GameCategoryRequest request
    ) {
        GameCategoryResponse createdCategory = gameCategoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdCategory);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GameCategoryResponse> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody GameCategoryRequest request
    ) {
        return ResponseEntity.ok(gameCategoryService.updateCategory(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        gameCategoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}