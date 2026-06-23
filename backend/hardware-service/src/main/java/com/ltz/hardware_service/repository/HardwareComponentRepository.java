package com.ltz.hardware_service.repository;

import com.ltz.hardware_service.entity.HardwareComponent;
import com.ltz.hardware_service.entity.enums.ComponentCategory;
import com.ltz.hardware_service.entity.enums.ComponentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HardwareComponentRepository extends JpaRepository<HardwareComponent, Long> {

    List<HardwareComponent> findByActiveTrueOrderByModelNameAsc();

    List<HardwareComponent> findByComponentTypeAndActiveTrueOrderByModelNameAsc(
            ComponentType componentType
    );

    List<HardwareComponent> findByCategoryAndActiveTrueOrderByModelNameAsc(
            ComponentCategory category
    );

    List<HardwareComponent> findByComponentTypeAndCategoryAndActiveTrueOrderByModelNameAsc(
            ComponentType componentType,
            ComponentCategory category
    );

    List<HardwareComponent> findByBrand_IdAndActiveTrueOrderByModelNameAsc(Long brandId);

    @Query("""
            SELECT component
            FROM HardwareComponent component
            LEFT JOIN component.brand brand
            WHERE component.active = true
              AND (:componentType IS NULL OR component.componentType = :componentType)
              AND (:category IS NULL OR component.category = :category)
              AND (
                    :query IS NULL
                    OR LOWER(component.modelName) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(component.normalizedName) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(component.aliases) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(brand.name) LIKE LOWER(CONCAT('%', :query, '%'))
              )
            ORDER BY component.modelName ASC
            """)
    List<HardwareComponent> searchComponents(
            @Param("componentType") ComponentType componentType,
            @Param("category") ComponentCategory category,
            @Param("query") String query
    );
}