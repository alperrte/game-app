package com.ltz.content_service.service;

import com.ltz.content_service.exception.ResourceNotFoundException;
import com.ltz.content_service.dto.SpotlightBannerRequest;
import com.ltz.content_service.dto.SpotlightBannerResponse;
import com.ltz.content_service.entity.SpotlightBanner;
import com.ltz.content_service.repository.SpotlightBannerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SpotlightBannerService {

    private final SpotlightBannerRepository spotlightBannerRepository;

    public List<SpotlightBannerResponse> getActiveBanners() {
        return spotlightBannerRepository.findByIsActiveTrueOrderByDisplayOrderAsc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SpotlightBannerResponse createBanner(SpotlightBannerRequest request) {
        SpotlightBanner banner = SpotlightBanner.builder()
                .title(request.getTitle())
                .subtitle(request.getSubtitle())
                .imageUrl(request.getImageUrl())
                .targetUrl(request.getTargetUrl())
                .displayOrder(request.getDisplayOrder())
                .isActive(request.isActive())
                .build();

        log.info("Creating spotlight banner: {}", request.getTitle());
        return mapToResponse(spotlightBannerRepository.save(banner));
    }

    @Transactional
    public SpotlightBannerResponse updateBanner(Long id, SpotlightBannerRequest request) {
        SpotlightBanner banner = spotlightBannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Spotlight banner not found with id: " + id));

        banner.setTitle(request.getTitle());
        banner.setSubtitle(request.getSubtitle());
        banner.setImageUrl(request.getImageUrl());
        banner.setTargetUrl(request.getTargetUrl());
        banner.setDisplayOrder(request.getDisplayOrder());
        banner.setActive(request.isActive());

        log.info("Updating spotlight banner id: {}", id);
        return mapToResponse(spotlightBannerRepository.save(banner));
    }

    @Transactional
    public void deleteBanner(Long id) {
        SpotlightBanner banner = spotlightBannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Spotlight banner not found with id: " + id));
        spotlightBannerRepository.delete(banner);
        log.info("Deleted spotlight banner id: {}", id);
    }

    private SpotlightBannerResponse mapToResponse(SpotlightBanner banner) {
        return SpotlightBannerResponse.builder()
                .id(banner.getId())
                .title(banner.getTitle())
                .subtitle(banner.getSubtitle())
                .imageUrl(banner.getImageUrl())
                .targetUrl(banner.getTargetUrl())
                .displayOrder(banner.getDisplayOrder())
                .active(banner.isActive())
                .build();
    }
}
