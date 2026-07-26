package com.ltz.game_service.repository;

import com.ltz.game_service.entity.GameImportLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameImportLogRepository extends JpaRepository<GameImportLog, Long> {

    List<GameImportLog> findByJobIdOrderByCreatedAtAsc(Long jobId);
}
