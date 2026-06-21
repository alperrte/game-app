package com.ltz.content_service.controller;

import com.ltz.content_service.model.dto.SpotlightBannerRequest;
import com.ltz.content_service.exception.ResourceNotFoundException;
import com.ltz.content_service.model.entity.SpotlightBanner;
import com.ltz.content_service.repository.SpotlightBannerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/content")
@RequiredArgsConstructor
@Slf4j
public class AdminCmsController {

    private final SpotlightBannerRepository spotlightBannerRepository;

    @GetMapping("/spotlight")
    public ResponseEntity<List<SpotlightBanner>> getActiveBanners() {
        List<SpotlightBanner> banners = spotlightBannerRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
        return ResponseEntity.ok(banners);
    }

    @PostMapping("/admin/spotlight")
    public ResponseEntity<SpotlightBanner> createBanner(@RequestBody SpotlightBannerRequest bannerRequest) {
        log.info("Creating spotlight banner: {}", bannerRequest.getTitle());
        SpotlightBanner banner = SpotlightBanner.builder()
                .title(bannerRequest.getTitle())
                .subtitle(bannerRequest.getSubtitle())
                .imageUrl(bannerRequest.getImageUrl())
                .targetUrl(bannerRequest.getTargetUrl())
                .displayOrder(bannerRequest.getDisplayOrder())
                .isActive(bannerRequest.isActive())
                .build();
        SpotlightBanner created = spotlightBannerRepository.save(banner);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/admin/spotlight/{id}")
    public ResponseEntity<SpotlightBanner> updateBanner(
            @PathVariable Long id,
            @RequestBody SpotlightBannerRequest bannerDetails
    ) {
        SpotlightBanner banner = spotlightBannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Spotlight banner not found with id: " + id));

        banner.setTitle(bannerDetails.getTitle());
        banner.setSubtitle(bannerDetails.getSubtitle());
        banner.setImageUrl(bannerDetails.getImageUrl());
        banner.setTargetUrl(bannerDetails.getTargetUrl());
        banner.setDisplayOrder(bannerDetails.getDisplayOrder());
        banner.setActive(bannerDetails.isActive());

        log.info("Updating spotlight banner id: {}", id);
        SpotlightBanner updated = spotlightBannerRepository.save(banner);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/admin/spotlight/{id}")
    public ResponseEntity<Void> deleteBanner(@PathVariable Long id) {
        SpotlightBanner banner = spotlightBannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Spotlight banner not found with id: " + id));
        spotlightBannerRepository.delete(banner);
        log.info("Deleted spotlight banner id: {}", id);
        return ResponseEntity.noContent().build();
    }
}
