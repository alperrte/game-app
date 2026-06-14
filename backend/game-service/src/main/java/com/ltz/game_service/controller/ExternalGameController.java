package com.ltz.game_service.controller;

import com.ltz.game_service.dto.response.external.ExternalGameDetailResponse;
import com.ltz.game_service.dto.response.external.ExternalGameSearchResponse;
import com.ltz.game_service.enums.GameSource;
import com.ltz.game_service.service.ExternalGameService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/games/external")
public class ExternalGameController {

    private final ExternalGameService externalGameService;

    public ExternalGameController(ExternalGameService externalGameService) {
        this.externalGameService = externalGameService;
    }

    @GetMapping("/search")
    public List<ExternalGameSearchResponse> searchGames(
            @RequestParam GameSource source,
            @RequestParam String query
    ) {
        return externalGameService.search(source, query);
    }

    @GetMapping("/detail")
    public ExternalGameDetailResponse getGameDetail(
            @RequestParam GameSource source,
            @RequestParam String externalId
    ) {
        return externalGameService.getDetail(source, externalId);
    }
}