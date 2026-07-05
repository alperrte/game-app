package com.ltz.game_service.repository;

import com.ltz.game_service.entity.ExternalGameId;
import com.ltz.game_service.entity.enums.GameSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExternalGameIdRepository extends JpaRepository<ExternalGameId, Long> {

    Optional<ExternalGameId> findBySourceAndExternalId(GameSource source, String externalId);
}
