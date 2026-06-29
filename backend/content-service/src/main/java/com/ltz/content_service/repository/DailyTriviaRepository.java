package com.ltz.content_service.repository;

import com.ltz.content_service.model.entity.DailyTrivia;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;

public interface DailyTriviaRepository extends JpaRepository<DailyTrivia, Long> {
    Optional<DailyTrivia> findByTriviaDate(LocalDate triviaDate);
}
