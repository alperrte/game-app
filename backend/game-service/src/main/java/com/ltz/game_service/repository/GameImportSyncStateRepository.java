package com.ltz.game_service.repository;

import com.ltz.game_service.entity.GameImportSyncState;
import com.ltz.game_service.entity.enums.GameSource;
import com.ltz.game_service.entity.enums.SyncStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface GameImportSyncStateRepository extends JpaRepository<GameImportSyncState, Long> {

    Optional<GameImportSyncState> findBySourceAndExternalId(GameSource source, String externalId);

    @Query("SELECT s.externalId FROM GameImportSyncState s " +
            "WHERE s.source = :source " +
            "AND s.status IN :statuses " +
            "AND s.lastAttemptAt >= :cutoff")
    List<String> findRecentlyProcessedExternalIds(
            @Param("source") GameSource source,
            @Param("statuses") Collection<SyncStatus> statuses,
            @Param("cutoff") LocalDateTime cutoff
    );
}
