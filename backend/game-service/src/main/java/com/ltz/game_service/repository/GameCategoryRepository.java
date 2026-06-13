package com.ltz.game_service.repository;

import com.ltz.game_service.entity.GameCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GameCategoryRepository extends JpaRepository<GameCategory, Long> {

    boolean existsByNameIgnoreCase(String name);
}