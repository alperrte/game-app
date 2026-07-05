package com.ltz.game_service.repository;

import com.ltz.game_service.entity.GameCategory;
import com.ltz.game_service.entity.enums.GameSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameCategoryRepository extends JpaRepository<GameCategory, Long> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsBySourceAndNameIgnoreCase(GameSource source, String name);

    List<GameCategory> findBySource(GameSource source);
}