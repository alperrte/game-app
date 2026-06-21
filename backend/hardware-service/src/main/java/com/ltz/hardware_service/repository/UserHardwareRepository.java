package com.ltz.hardware_service.repository;

import com.ltz.hardware_service.entity.UserHardware;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserHardwareRepository extends JpaRepository<UserHardware, Long> {

    Optional<UserHardware> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}