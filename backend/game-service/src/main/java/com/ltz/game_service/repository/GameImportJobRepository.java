package com.ltz.game_service.repository;

import com.ltz.game_service.entity.GameImportJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameImportJobRepository extends JpaRepository<GameImportJob, Long> {

    List<GameImportJob> findTop20ByOrderByStartedAtDesc();
}
