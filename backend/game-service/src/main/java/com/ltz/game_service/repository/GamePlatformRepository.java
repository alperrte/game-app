package com.ltz.game_service.repository;

import com.ltz.game_service.entity.GamePlatform;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GamePlatformRepository extends JpaRepository<GamePlatform, Long> {

    boolean existsByNameIgnoreCase(String name);
}