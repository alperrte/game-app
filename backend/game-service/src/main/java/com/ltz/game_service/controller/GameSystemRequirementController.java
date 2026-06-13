package com.ltz.game_service.controller;

import com.ltz.game_service.dto.request.GameSystemRequirementRequest;
import com.ltz.game_service.dto.response.GameSystemRequirementResponse;
import com.ltz.game_service.service.GameSystemRequirementService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/games/{gameId}/system-requirements")
public class GameSystemRequirementController {

    private final GameSystemRequirementService gameSystemRequirementService;

    public GameSystemRequirementController(GameSystemRequirementService gameSystemRequirementService) {
        this.gameSystemRequirementService = gameSystemRequirementService;
    }

    @GetMapping
    public ResponseEntity<GameSystemRequirementResponse> getSystemRequirementByGameId(
            @PathVariable Long gameId
    ) {
        return ResponseEntity.ok(
                gameSystemRequirementService.getSystemRequirementByGameId(gameId)
        );
    }

    @PostMapping
    public ResponseEntity<GameSystemRequirementResponse> createSystemRequirement(
            @PathVariable Long gameId,
            @Valid @RequestBody GameSystemRequirementRequest request
    ) {
        GameSystemRequirementResponse createdSystemRequirement =
                gameSystemRequirementService.createSystemRequirement(gameId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(createdSystemRequirement);
    }

    @PutMapping
    public ResponseEntity<GameSystemRequirementResponse> updateSystemRequirement(
            @PathVariable Long gameId,
            @Valid @RequestBody GameSystemRequirementRequest request
    ) {
        return ResponseEntity.ok(
                gameSystemRequirementService.updateSystemRequirement(gameId, request)
        );
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteSystemRequirement(
            @PathVariable Long gameId
    ) {
        gameSystemRequirementService.deleteSystemRequirement(gameId);
        return ResponseEntity.noContent().build();
    }
}