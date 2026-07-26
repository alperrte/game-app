package com.ltz.content_service.repository;

import com.ltz.content_service.entity.DealPriceSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DealPriceSnapshotRepository extends JpaRepository<DealPriceSnapshot, Long> {
    List<DealPriceSnapshot> findTop30ByGameTitleIgnoreCaseOrderByRecordedAtDesc(String gameTitle);
}
