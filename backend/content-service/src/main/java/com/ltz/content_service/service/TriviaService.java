package com.ltz.content_service.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ltz.content_service.exception.ResourceNotFoundException;
import com.ltz.content_service.model.entity.DailyTrivia;
import com.ltz.content_service.model.entity.UserTriviaAnswer;
import com.ltz.content_service.repository.DailyTriviaRepository;
import com.ltz.content_service.repository.UserTriviaAnswerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class TriviaService {

    private final DailyTriviaRepository dailyTriviaRepository;
    private final UserTriviaAnswerRepository userTriviaAnswerRepository;
    private final ObjectMapper objectMapper;

    public Map<String, Object> getTodayTrivia(Long currentUserId) {
        LocalDate today = LocalDate.now();
        Optional<DailyTrivia> triviaOpt = dailyTriviaRepository.findByTriviaDate(today);

        // Fallback default trivia if none exists in DB
        DailyTrivia trivia = triviaOpt.orElseGet(() -> {
            List<String> options = Arrays.asList(
                    "Half-Life 2",
                    "Doom (1993)",
                    "Quake",
                    "Wolfenstein 3D"
            );
            try {
                return DailyTrivia.builder()
                        .question("Which game pioneered the first-person shooter genre in 1992?")
                        .optionsJson(objectMapper.writeValueAsString(options))
                        .correctOptionIndex(3)
                        .triviaDate(today)
                        .build();
            } catch (Exception e) {
                log.error("Failed to create fallback trivia: ", e);
                return null;
            }
        });

        if (trivia == null) {
            throw new ResourceNotFoundException("Daily trivia not available");
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", trivia.getId());
        response.put("question", trivia.getQuestion());
        
        try {
            List<String> options = objectMapper.readValue(trivia.getOptionsJson(), new TypeReference<List<String>>() {});
            response.put("options", options);
        } catch (Exception e) {
            log.error("Failed to parse options JSON for trivia id {}: ", trivia.getId(), e);
            response.put("options", Collections.emptyList());
        }

        response.put("triviaDate", trivia.getTriviaDate());

        boolean hasAnswered = false;
        boolean wasCorrect = false;
        Integer userChoice = null;

        if (currentUserId != null) {
            Optional<UserTriviaAnswer> answerOpt = userTriviaAnswerRepository.findByUserIdAndTriviaDate(currentUserId, today);
            if (answerOpt.isPresent()) {
                hasAnswered = true;
                wasCorrect = answerOpt.get().isCorrect();
            }
        }

        response.put("hasAnswered", hasAnswered);
        if (hasAnswered) {
            response.put("wasCorrect", wasCorrect);
            response.put("correctOptionIndex", trivia.getCorrectOptionIndex());
        }

        return response;
    }

    @Transactional
    public Map<String, Object> submitAnswer(Long currentUserId, int selectedIndex) {
        if (currentUserId == null) {
            throw new IllegalArgumentException("User must be authenticated to submit answer");
        }

        LocalDate today = LocalDate.now();
        
        // Check if user already answered today
        if (userTriviaAnswerRepository.existsByUserIdAndTriviaDate(currentUserId, today)) {
            throw new IllegalArgumentException("You have already answered today's trivia");
        }

        Optional<DailyTrivia> triviaOpt = dailyTriviaRepository.findByTriviaDate(today);
        int correctIndex = 3; // default fallback correct option index
        if (triviaOpt.isPresent()) {
            correctIndex = triviaOpt.get().getCorrectOptionIndex();
        }

        boolean isCorrect = (selectedIndex == correctIndex);

        UserTriviaAnswer answer = UserTriviaAnswer.builder()
                .userId(currentUserId)
                .triviaDate(today)
                .correct(isCorrect)
                .answeredAt(LocalDateTime.now())
                .build();
        userTriviaAnswerRepository.save(answer);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("correct", isCorrect);
        result.put("correctOptionIndex", correctIndex);
        result.put("message", isCorrect ? "Congratulations! Correct answer." : "Wrong answer. Better luck tomorrow!");
        
        return result;
    }

    @Transactional
    public DailyTrivia createTrivia(DailyTrivia trivia) {
        log.info("Creating new daily trivia: {}", trivia.getQuestion());
        return dailyTriviaRepository.save(trivia);
    }

    @Transactional
    public DailyTrivia updateTrivia(Long id, DailyTrivia triviaDetails) {
        DailyTrivia trivia = dailyTriviaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Daily trivia not found with id: " + id));

        trivia.setQuestion(triviaDetails.getQuestion());
        trivia.setOptionsJson(triviaDetails.getOptionsJson());
        trivia.setCorrectOptionIndex(triviaDetails.getCorrectOptionIndex());
        trivia.setTriviaDate(triviaDetails.getTriviaDate());

        log.info("Updating daily trivia id: {}", id);
        return dailyTriviaRepository.save(trivia);
    }

    @Transactional
    public void deleteTrivia(Long id) {
        DailyTrivia trivia = dailyTriviaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Daily trivia not found with id: " + id));
        dailyTriviaRepository.delete(trivia);
        log.info("Deleted daily trivia id: {}", id);
    }
}
