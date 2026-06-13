package com.ltz.game_service.controller;

import com.ltz.game_service.dto.request.GamePlatformRequest;
import com.ltz.game_service.dto.response.GamePlatformResponse;
import com.ltz.game_service.service.GamePlatformService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/games/platforms")
public class GamePlatformController {

    private final GamePlatformService gamePlatformService;

    public GamePlatformController(GamePlatformService gamePlatformService) {
        this.gamePlatformService = gamePlatformService;
    }

    @GetMapping
    public ResponseEntity<List<GamePlatformResponse>> getAllPlatforms() {
        return ResponseEntity.ok(gamePlatformService.getAllPlatforms());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GamePlatformResponse> getPlatformById(@PathVariable Long id) {
        return ResponseEntity.ok(gamePlatformService.getPlatformById(id));
    }

    @PostMapping
    public ResponseEntity<GamePlatformResponse> createPlatform(
            @Valid @RequestBody GamePlatformRequest request
    ) {
        GamePlatformResponse createdPlatform = gamePlatformService.createPlatform(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPlatform);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GamePlatformResponse> updatePlatform(
            @PathVariable Long id,
            @Valid @RequestBody GamePlatformRequest request
    ) {
        return ResponseEntity.ok(gamePlatformService.updatePlatform(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlatform(@PathVariable Long id) {
        gamePlatformService.deletePlatform(id);
        return ResponseEntity.noContent().build();
    }
}