package com.ltz.content_service.controller;

import com.ltz.content_service.dto.SpotlightBannerRequest;
import com.ltz.content_service.dto.SpotlightBannerResponse;
import com.ltz.content_service.service.SpotlightBannerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/content")
@RequiredArgsConstructor
public class AdminCmsController {

    private final SpotlightBannerService spotlightBannerService;

    @GetMapping("/spotlight")
    public ResponseEntity<List<SpotlightBannerResponse>> getActiveBanners() {
        return ResponseEntity.ok(spotlightBannerService.getActiveBanners());
    }

    @PostMapping("/admin/spotlight")
    public ResponseEntity<SpotlightBannerResponse> createBanner(@Valid @RequestBody SpotlightBannerRequest bannerRequest) {
        return ResponseEntity.ok(spotlightBannerService.createBanner(bannerRequest));
    }

    @PutMapping("/admin/spotlight/{id}")
    public ResponseEntity<SpotlightBannerResponse> updateBanner(
            @PathVariable Long id,
            @Valid @RequestBody SpotlightBannerRequest bannerDetails
    ) {
        return ResponseEntity.ok(spotlightBannerService.updateBanner(id, bannerDetails));
    }

    @DeleteMapping("/admin/spotlight/{id}")
    public ResponseEntity<Void> deleteBanner(@PathVariable Long id) {
        spotlightBannerService.deleteBanner(id);
        return ResponseEntity.noContent().build();
    }
}
