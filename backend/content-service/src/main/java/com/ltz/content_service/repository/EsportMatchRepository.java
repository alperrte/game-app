package com.ltz.content_service.repository;

import com.ltz.content_service.entity.EsportMatch;
import com.ltz.content_service.enums.MatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EsportMatchRepository extends JpaRepository<EsportMatch, Long> {
    Optional<EsportMatch> findByMatchId(String matchId);

    List<EsportMatch> findByStatusOrderByMatchTimeAsc(MatchStatus status);
}
