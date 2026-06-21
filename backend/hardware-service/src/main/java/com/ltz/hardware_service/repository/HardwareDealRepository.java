package com.ltz.hardware_service.repository;

import com.ltz.hardware_service.entity.HardwareDeal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HardwareDealRepository extends JpaRepository<HardwareDeal, Long> {

    List<HardwareDeal> findByActiveTrueOrderByCreatedAtDesc();

    List<HardwareDeal> findByComponent_IdAndActiveTrueOrderByCreatedAtDesc(Long componentId);

    List<HardwareDeal> findByStoreNameIgnoreCaseAndActiveTrueOrderByCreatedAtDesc(String storeName);
}