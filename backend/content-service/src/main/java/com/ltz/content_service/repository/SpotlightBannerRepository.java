package com.ltz.content_service.repository;

import com.ltz.content_service.model.entity.SpotlightBanner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SpotlightBannerRepository extends JpaRepository<SpotlightBanner, Long> {
    List<SpotlightBanner> findByIsActiveTrueOrderByDisplayOrderAsc();
}
