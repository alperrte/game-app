package com.ltz.game_service.repository;

import com.ltz.game_service.entity.GameSystemRequirement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GameSystemRequirementRepository extends JpaRepository<GameSystemRequirement, Long> {

    Optional<GameSystemRequirement> findByGameId(Long gameId);

    boolean existsByGameId(Long gameId);
}