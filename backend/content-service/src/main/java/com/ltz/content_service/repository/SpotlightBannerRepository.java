package com.ltz.content_service.repository;

import com.ltz.content_service.model.entity.SpotlightBanner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpotlightBannerRepository extends JpaRepository<SpotlightBanner, Long> {
    List<SpotlightBanner> findByIsActiveTrueOrderByDisplayOrderAsc();
}
