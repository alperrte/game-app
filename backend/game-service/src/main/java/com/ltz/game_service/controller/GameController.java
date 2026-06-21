package com.ltz.game_service.controller;

import com.ltz.game_service.dto.request.GameRequest;
import com.ltz.game_service.dto.response.GameResponse;
import com.ltz.game_service.enums.GameSource;
import com.ltz.game_service.service.GameService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/games")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @GetMapping
    public ResponseEntity<Page<GameResponse>> getAllGames(
            @RequestParam(defaultValue = "false") boolean includeSystemRequirementOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(gameService.getAllGames(includeSystemRequirementOnly, page, size));
    }

    @GetMapping("/filter")
    public ResponseEntity<Page<GameResponse>> filterGames(
            @RequestParam(required = false) GameSource source,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String platform,
            @RequestParam(required = false) Boolean earlyAccess,
            @RequestParam(required = false) Boolean onSale,
            @RequestParam(required = false) Boolean turkishLanguageSupport,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(
                gameService.filterGames(
                        source,
                        categoryId,
                        title,
                        genre,
                        platform,
                        earlyAccess,
                        onSale,
                        turkishLanguageSupport,
                        page,
                        size
                )
        );
    }

    @GetMapping("/popular")
    public ResponseEntity<List<GameResponse>> getPopularGames() {
        return ResponseEntity.ok(gameService.getPopularGames());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GameResponse> getGameById(@PathVariable Long id) {
        return ResponseEntity.ok(gameService.getGameById(id));
    }

    @PostMapping
    public ResponseEntity<GameResponse> createGame(@Valid @RequestBody GameRequest request) {
        GameResponse createdGame = gameService.createGame(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdGame);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GameResponse> updateGame(
            @PathVariable Long id,
            @Valid @RequestBody GameRequest request
    ) {
        return ResponseEntity.ok(gameService.updateGame(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGame(@PathVariable Long id) {
        gameService.deleteGame(id);
        return ResponseEntity.noContent().build();
    }
}