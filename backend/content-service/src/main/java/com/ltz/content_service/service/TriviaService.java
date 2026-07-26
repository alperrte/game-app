package com.ltz.content_service.service;

import com.ltz.content_service.service.client.OpenTdbClient;
import com.ltz.content_service.service.client.dto.TriviaQuestion;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ltz.content_service.dto.DailyTriviaRequest;
import com.ltz.content_service.dto.DailyTriviaResponse;
import com.ltz.content_service.exception.ResourceNotFoundException;
import com.ltz.content_service.entity.DailyTrivia;
import com.ltz.content_service.entity.UserTriviaAnswer;
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
    private final OpenTdbClient openTdbClient;
    private final ObjectMapper objectMapper;

    public Map<String, Object> getTodayTrivia(Long currentUserId) {
        LocalDate today = LocalDate.now();
        Optional<DailyTrivia> triviaOpt = dailyTriviaRepository.findByTriviaDate(today);

        DailyTrivia trivia;
        if (triviaOpt.isPresent()) {
            trivia = triviaOpt.get();
        } else {
            TriviaQuestion apiTrivia = null;
            try {
                apiTrivia = openTdbClient.fetchRandomTrivia().block();
            } catch (Exception ex) {
                log.warn("Failed to fetch live trivia from OpenTDB: {}", ex.getMessage());
            }

            if (apiTrivia != null) {
                try {
                    DailyTrivia newTrivia = DailyTrivia.builder()
                            .question(apiTrivia.question())
                            .optionsJson(objectMapper.writeValueAsString(apiTrivia.options()))
                            .correctOptionIndex(apiTrivia.correctOptionIndex())
                            .triviaDate(today)
                            .build();

                    trivia = dailyTriviaRepository.save(newTrivia);
                    log.info("Saved new daily trivia fetched from OpenTDB for date: {}", today);
                } catch (Exception e) {
                    log.warn("Failed to save fetched daily trivia (possibly unique constraint violation): {}", e.getMessage());
                    trivia = dailyTriviaRepository.findByTriviaDate(today)
                            .orElseGet(() -> getFallbackTrivia(today));
                }
            } else {
                trivia = getFallbackTrivia(today);
            }
        }

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

    public Map<String, Object> getUserTriviaStats(Long currentUserId) {
        Map<String, Object> response = new LinkedHashMap<>();

        if (currentUserId == null) {
            response.put("currentStreak", 0);
            response.put("totalAnswered", 0);
            response.put("totalCorrect", 0);
            response.put("history", Collections.emptyList());
            return response;
        }

        List<UserTriviaAnswer> recent = userTriviaAnswerRepository
                .findTop30ByUserIdOrderByTriviaDateDesc(currentUserId);

        Set<LocalDate> answeredDates = new HashSet<>();
        for (UserTriviaAnswer answer : recent) {
            answeredDates.add(answer.getTriviaDate());
        }

        LocalDate cursor = LocalDate.now();
        if (!answeredDates.contains(cursor)) {
            cursor = cursor.minusDays(1);
        }
        int streak = 0;
        while (answeredDates.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }

        List<Map<String, Object>> history = new ArrayList<>();
        for (UserTriviaAnswer answer : recent) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("date", answer.getTriviaDate());
            entry.put("correct", answer.isCorrect());
            history.add(entry);
        }

        response.put("currentStreak", streak);
        response.put("totalAnswered", userTriviaAnswerRepository.countByUserId(currentUserId));
        response.put("totalCorrect", userTriviaAnswerRepository.countByUserIdAndCorrectTrue(currentUserId));
        response.put("history", history);
        return response;
    }

    public Map<Long, Map<String, Object>> getBulkTriviaStats(List<Long> userIds) {
        Map<Long, Map<String, Object>> result = new LinkedHashMap<>();
        for (Long userId : userIds) {
            result.put(userId, getUserTriviaStats(userId));
        }
        return result;
    }

    @Transactional
    public DailyTriviaResponse createTrivia(DailyTriviaRequest request) {
        DailyTrivia trivia = DailyTrivia.builder()
                .question(request.getQuestion())
                .optionsJson(request.getOptionsJson())
                .correctOptionIndex(request.getCorrectOptionIndex())
                .triviaDate(request.getTriviaDate())
                .build();

        log.info("Creating new daily trivia: {}", trivia.getQuestion());
        return mapToResponse(dailyTriviaRepository.save(trivia));
    }

    @Transactional
    public DailyTriviaResponse updateTrivia(Long id, DailyTriviaRequest request) {
        DailyTrivia trivia = dailyTriviaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Daily trivia not found with id: " + id));

        trivia.setQuestion(request.getQuestion());
        trivia.setOptionsJson(request.getOptionsJson());
        trivia.setCorrectOptionIndex(request.getCorrectOptionIndex());
        trivia.setTriviaDate(request.getTriviaDate());

        log.info("Updating daily trivia id: {}", id);
        return mapToResponse(dailyTriviaRepository.save(trivia));
    }

    @Transactional
    public void deleteTrivia(Long id) {
        DailyTrivia trivia = dailyTriviaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Daily trivia not found with id: " + id));
        dailyTriviaRepository.delete(trivia);
        log.info("Deleted daily trivia id: {}", id);
    }

    private DailyTriviaResponse mapToResponse(DailyTrivia trivia) {
        return DailyTriviaResponse.builder()
                .id(trivia.getId())
                .question(trivia.getQuestion())
                .optionsJson(trivia.getOptionsJson())
                .correctOptionIndex(trivia.getCorrectOptionIndex())
                .triviaDate(trivia.getTriviaDate())
                .createdAt(trivia.getCreatedAt())
                .build();
    }

    private DailyTrivia getFallbackTrivia(LocalDate today) {
        List<String> options = Arrays.asList(
                "Half-Life 2",
                "Doom (1993)",
                "Quake",
                "Wolfenstein 3D"
        );
        try {
            DailyTrivia fallback = DailyTrivia.builder()
                    .question("Which game pioneered the first-person shooter genre in 1992?")
                    .optionsJson(objectMapper.writeValueAsString(options))
                    .correctOptionIndex(3)
                    .triviaDate(today)
                    .build();
            return dailyTriviaRepository.save(fallback);
        } catch (Exception e) {
            log.warn("Failed to create fallback trivia (possibly unique constraint violation): {}", e.getMessage());
            return dailyTriviaRepository.findByTriviaDate(today).orElse(null);
        }
    }
}
