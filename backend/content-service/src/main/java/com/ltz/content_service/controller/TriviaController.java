package com.ltz.content_service.controller;

import com.ltz.content_service.model.dto.DailyTriviaRequest;
import com.ltz.content_service.model.entity.DailyTrivia;
import com.ltz.content_service.security.JwtUserPrincipal;
import com.ltz.content_service.service.TriviaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/content/trivia")
@RequiredArgsConstructor
public class TriviaController {

    private final TriviaService triviaService;

    @GetMapping("/today")
    public ResponseEntity<Map<String, Object>> getTodayTrivia(
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        Long currentUserId = (principal != null) ? principal.userId() : null;
        Map<String, Object> trivia = triviaService.getTodayTrivia(currentUserId);
        return ResponseEntity.ok(trivia);
    }

    @PostMapping("/submit")
    public ResponseEntity<Map<String, Object>> submitAnswer(
            @RequestParam int selectedIndex,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        Map<String, Object> result = triviaService.submitAnswer(principal.userId(), selectedIndex);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/admin")
    public ResponseEntity<DailyTrivia> createTrivia(@RequestBody DailyTriviaRequest triviaRequest) {
        DailyTrivia trivia = DailyTrivia.builder()
                .question(triviaRequest.getQuestion())
                .optionsJson(triviaRequest.getOptionsJson())
                .correctOptionIndex(triviaRequest.getCorrectOptionIndex())
                .triviaDate(triviaRequest.getTriviaDate())
                .build();
        DailyTrivia created = triviaService.createTrivia(trivia);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/admin/{id}")
    public ResponseEntity<DailyTrivia> updateTrivia(
            @PathVariable Long id,
            @RequestBody DailyTriviaRequest triviaRequest
    ) {
        DailyTrivia trivia = DailyTrivia.builder()
                .question(triviaRequest.getQuestion())
                .optionsJson(triviaRequest.getOptionsJson())
                .correctOptionIndex(triviaRequest.getCorrectOptionIndex())
                .triviaDate(triviaRequest.getTriviaDate())
                .build();
        DailyTrivia updated = triviaService.updateTrivia(id, trivia);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Void> deleteTrivia(@PathVariable Long id) {
        triviaService.deleteTrivia(id);
        return ResponseEntity.noContent().build();
    }
}
