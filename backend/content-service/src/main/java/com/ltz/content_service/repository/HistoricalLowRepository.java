package com.ltz.content_service.repository;

import com.ltz.content_service.model.entity.HistoricalLow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface HistoricalLowRepository extends JpaRepository<HistoricalLow, Long> {
    Optional<HistoricalLow> findByGameTitleIgnoreCase(String gameTitle);
}
