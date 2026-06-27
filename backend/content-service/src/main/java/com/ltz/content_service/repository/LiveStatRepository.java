package com.ltz.content_service.repository;

import com.ltz.content_service.model.entity.LiveStat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LiveStatRepository extends JpaRepository<LiveStat, Long> {
    Optional<LiveStat> findByStatKey(String statKey);
}
