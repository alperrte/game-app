package com.ltz.content_service.controller;

import com.ltz.content_service.dto.DealCampaignResponse;
import com.ltz.content_service.dto.DealCompareResponse;
import com.ltz.content_service.security.JwtUserPrincipal;
import com.ltz.content_service.service.DealsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/content/deals")
@RequiredArgsConstructor
public class DealsController {

    private final DealsService dealsService;

    @GetMapping
    public ResponseEntity<Page<DealCampaignResponse>> getActiveDeals(
            @RequestParam(required = false) Integer minDiscount,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        if (size > 100) {
            size = 100;
        } else if (size <= 0) {
            size = 20;
        }
        Long currentUserId = (principal != null) ? principal.userId() : null;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "discountPercent"));
        Page<DealCampaignResponse> deals = dealsService.getActiveDeals(minDiscount, pageable, currentUserId);
        return ResponseEntity.ok(deals);
    }

    @GetMapping("/search")
    public ResponseEntity<List<DealCompareResponse>> searchAndCompareDeals(
            @RequestParam(required = false) String title,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        Long currentUserId = (principal != null) ? principal.userId() : null;
        List<DealCompareResponse> comparisons = dealsService.searchAndCompareDeals(title, currentUserId);
        return ResponseEntity.ok(comparisons);
    }

    @GetMapping("/free-games")
    public ResponseEntity<List<DealCampaignResponse>> getFreeGames(
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        Long currentUserId = (principal != null) ? principal.userId() : null;
        List<DealCampaignResponse> freeGames = dealsService.getFreeGames(currentUserId);
        return ResponseEntity.ok(freeGames);
    }
}
