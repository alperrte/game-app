package com.ltz.content_service.controller;

import com.ltz.content_service.model.dto.DealCompareResponse;
import com.ltz.content_service.model.entity.DealCampaign;
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
    public ResponseEntity<Page<DealCampaign>> getActiveDeals(
            @RequestParam(required = false) Integer minDiscount,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        if (size > 100) {
            size = 100;
        } else if (size <= 0) {
            size = 20;
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "discountPercent"));
        Page<DealCampaign> deals = dealsService.getActiveDeals(minDiscount, pageable);
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
    public ResponseEntity<List<DealCampaign>> getFreeGames() {
        List<DealCampaign> freeGames = dealsService.getFreeGames();
        return ResponseEntity.ok(freeGames);
    }
}
