package com.ltz.game_service.repository;

import com.ltz.game_service.entity.Game;
import com.ltz.game_service.entity.GameReviewSummary;
import com.ltz.game_service.entity.enums.GameSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GameReviewSummaryRepository extends JpaRepository<GameReviewSummary, Long> {

    Optional<GameReviewSummary> findByGameAndSource(Game game, GameSource source);
}
