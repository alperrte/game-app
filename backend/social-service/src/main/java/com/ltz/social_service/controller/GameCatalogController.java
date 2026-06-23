package com.ltz.social_service.controller;

import com.ltz.social_service.service.GameCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/social/game-catalog")
@RequiredArgsConstructor
public class GameCatalogController {

    private final GameCatalogService gameCatalogService;

    @GetMapping("/games")
    public ResponseEntity<String> getGames(
            @RequestParam Map<String, String> queryParams,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return ResponseEntity
                .ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(gameCatalogService.getGames(queryParams, authorization));
    }

    @GetMapping("/platforms")
    public ResponseEntity<String> getPlatforms(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return ResponseEntity
                .ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(gameCatalogService.getPlatforms(authorization));
    }
}
