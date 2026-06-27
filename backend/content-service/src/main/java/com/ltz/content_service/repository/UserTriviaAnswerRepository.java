package com.ltz.content_service.repository;

import com.ltz.content_service.model.entity.UserTriviaAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;

public interface UserTriviaAnswerRepository extends JpaRepository<UserTriviaAnswer, Long> {
    Optional<UserTriviaAnswer> findByUserIdAndTriviaDate(Long userId, LocalDate triviaDate);

    boolean existsByUserIdAndTriviaDate(Long userId, LocalDate triviaDate);
}
