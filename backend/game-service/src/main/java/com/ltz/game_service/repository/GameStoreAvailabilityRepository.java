package com.ltz.game_service.repository;

import com.ltz.game_service.entity.Game;
import com.ltz.game_service.entity.GameStoreAvailability;
import com.ltz.game_service.entity.enums.GameSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface GameStoreAvailabilityRepository extends JpaRepository<GameStoreAvailability, Long> {

    Optional<GameStoreAvailability> findByGameAndSource(Game game, GameSource source);

    List<GameStoreAvailability> findByGame_IdIn(Collection<Long> gameIds);
}
