package com.ltz.game_service.controller;

import com.ltz.game_service.dto.request.GameRequest;
import com.ltz.game_service.dto.response.GameResponse;
import com.ltz.game_service.entity.enums.GameSource;
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
    public ResponseEntity<Page<GameResponse>> getGames(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) GameSource store,
            @RequestParam(required = false) Long category,
            @RequestParam(required = false) String platform,
            @RequestParam(required = false) Boolean earlyAccess,
            @RequestParam(required = false) Boolean onSale,
            @RequestParam(required = false) Boolean turkishLanguageSupport,
            @RequestParam(defaultValue = "false") boolean includeSystemRequirementOnly,
            @RequestParam(defaultValue = "popularity,desc") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(
                gameService.getGames(
                        search,
                        store,
                        category,
                        platform,
                        earlyAccess,
                        onSale,
                        turkishLanguageSupport,
                        includeSystemRequirementOnly,
                        sort,
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