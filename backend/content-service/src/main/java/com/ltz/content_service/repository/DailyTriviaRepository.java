package com.ltz.content_service.repository;

import com.ltz.content_service.model.entity.DailyTrivia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface DailyTriviaRepository extends JpaRepository<DailyTrivia, Long> {
    Optional<DailyTrivia> findByTriviaDate(LocalDate triviaDate);
}
