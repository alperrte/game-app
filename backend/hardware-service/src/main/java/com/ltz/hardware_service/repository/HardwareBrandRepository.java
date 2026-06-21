package com.ltz.hardware_service.repository;

import com.ltz.hardware_service.entity.HardwareBrand;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HardwareBrandRepository extends JpaRepository<HardwareBrand, Long> {

    Optional<HardwareBrand> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    List<HardwareBrand> findByActiveTrueOrderByNameAsc();
}