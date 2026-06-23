package com.ltz.social_service.repository;

import com.ltz.social_service.entity.Community;
import com.ltz.social_service.enums.CommunityVisibility;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityRepository extends JpaRepository<Community, Long> {
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    Page<Community> findByVisibility(CommunityVisibility visibility, Pageable pageable);
    Page<Community> findByVisibilityAndNameContainingIgnoreCase(
            CommunityVisibility visibility,
            String name,
            Pageable pageable);
}
