package com.ltz.content_service.controller;

import com.ltz.content_service.dto.DailyTriviaRequest;
import com.ltz.content_service.dto.DailyTriviaResponse;
import com.ltz.content_service.security.JwtUserPrincipal;
import com.ltz.content_service.service.TriviaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
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

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getUserTriviaStats(
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        Long currentUserId = (principal != null) ? principal.userId() : null;
        return ResponseEntity.ok(triviaService.getUserTriviaStats(currentUserId));
    }

    @GetMapping("/stats/bulk")
    public ResponseEntity<Map<Long, Map<String, Object>>> getBulkTriviaStats(
            @RequestParam List<Long> userIds
    ) {
        List<Long> bounded = userIds.stream().distinct().limit(50).toList();
        return ResponseEntity.ok(triviaService.getBulkTriviaStats(bounded));
    }

    @PostMapping("/admin")
    public ResponseEntity<DailyTriviaResponse> createTrivia(@Valid @RequestBody DailyTriviaRequest triviaRequest) {
        return ResponseEntity.ok(triviaService.createTrivia(triviaRequest));
    }

    @PutMapping("/admin/{id}")
    public ResponseEntity<DailyTriviaResponse> updateTrivia(
            @PathVariable Long id,
            @Valid @RequestBody DailyTriviaRequest triviaRequest
    ) {
        return ResponseEntity.ok(triviaService.updateTrivia(id, triviaRequest));
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Void> deleteTrivia(@PathVariable Long id) {
        triviaService.deleteTrivia(id);
        return ResponseEntity.noContent().build();
    }
}
