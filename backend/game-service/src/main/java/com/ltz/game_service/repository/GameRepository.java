package com.ltz.game_service.repository;

import com.ltz.game_service.entity.Game;
import com.ltz.game_service.entity.enums.GameSource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameRepository extends JpaRepository<Game, Long>, JpaSpecificationExecutor<Game> {

    List<Game> findTop10ByOrderByPopularityScoreDesc();

    List<Game> findTop10BySystemRequirementOnlyFalseOrderByPopularityScoreDesc();

    List<Game> findBySystemRequirementOnlyFalse();

    Page<Game> findBySystemRequirementOnlyFalse(Pageable pageable);

    List<Game> findBySource(GameSource source);

    List<Game> findByCategoryId(Long categoryId);

    List<Game> findBySourceAndCategoryId(GameSource source, Long categoryId);
}