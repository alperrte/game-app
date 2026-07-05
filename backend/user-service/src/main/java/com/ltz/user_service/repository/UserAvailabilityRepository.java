package com.ltz.user_service.repository;

import com.ltz.user_service.entity.UserAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserAvailabilityRepository extends JpaRepository<UserAvailability, Long> {
    List<UserAvailability> findByUserId(String userId);
    void deleteByUserId(String userId);
}
