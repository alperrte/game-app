package com.ltz.hardware_service.repository;

import com.ltz.hardware_service.entity.HardwareReview;
import com.ltz.hardware_service.entity.enums.HardwareReviewType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HardwareReviewRepository extends JpaRepository<HardwareReview, Long> {

    List<HardwareReview> findByComponent_IdOrderByCreatedAtDesc(Long componentId);

    List<HardwareReview> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<HardwareReview> findByReviewTypeOrderByCreatedAtDesc(HardwareReviewType reviewType);

    List<HardwareReview> findByComponent_IdAndReviewTypeOrderByCreatedAtDesc(
            Long componentId,
            HardwareReviewType reviewType
    );
}