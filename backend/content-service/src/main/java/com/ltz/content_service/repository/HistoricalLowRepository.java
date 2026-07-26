package com.ltz.content_service.repository;

import com.ltz.content_service.entity.HistoricalLow;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface HistoricalLowRepository extends JpaRepository<HistoricalLow, Long> {
    Optional<HistoricalLow> findByGameTitleIgnoreCase(String gameTitle);
}
