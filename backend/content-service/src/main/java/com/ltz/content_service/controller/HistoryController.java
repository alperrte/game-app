package com.ltz.content_service.controller;

import com.ltz.content_service.dto.GamingHistoryRequest;
import com.ltz.content_service.dto.GamingHistoryResponse;
import com.ltz.content_service.service.HistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/content/history")
@RequiredArgsConstructor
public class HistoryController {

    private final HistoryService historyService;

    @GetMapping("/today")
    public ResponseEntity<List<GamingHistoryResponse>> getTodayHistory() {
        return ResponseEntity.ok(historyService.getTodayHistory());
    }

    @GetMapping("/date")
    public ResponseEntity<List<GamingHistoryResponse>> getHistoryByDate(
            @RequestParam int month,
            @RequestParam int day
    ) {
        return ResponseEntity.ok(historyService.getHistoryByDate(month, day));
    }

    @PostMapping("/admin")
    public ResponseEntity<GamingHistoryResponse> createHistoryEvent(@Valid @RequestBody GamingHistoryRequest request) {
        return ResponseEntity.ok(historyService.createHistoryEvent(request));
    }

    @PutMapping("/admin/{id}")
    public ResponseEntity<GamingHistoryResponse> updateHistoryEvent(
            @PathVariable Long id,
            @Valid @RequestBody GamingHistoryRequest request
    ) {
        return ResponseEntity.ok(historyService.updateHistoryEvent(id, request));
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Void> deleteHistoryEvent(@PathVariable Long id) {
        historyService.deleteHistoryEvent(id);
        return ResponseEntity.noContent().build();
    }
}
