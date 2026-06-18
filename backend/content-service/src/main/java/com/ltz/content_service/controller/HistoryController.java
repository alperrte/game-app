package com.ltz.content_service.controller;

import com.ltz.content_service.model.entity.GamingHistory;
import com.ltz.content_service.service.HistoryService;
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
    public ResponseEntity<List<GamingHistory>> getTodayHistory() {
        List<GamingHistory> history = historyService.getTodayHistory();
        return ResponseEntity.ok(history);
    }

    @GetMapping("/date")
    public ResponseEntity<List<GamingHistory>> getHistoryByDate(
            @RequestParam int month,
            @RequestParam int day
    ) {
        List<GamingHistory> history = historyService.getHistoryByDate(month, day);
        return ResponseEntity.ok(history);
    }

    @PostMapping("/admin")
    public ResponseEntity<GamingHistory> createHistoryEvent(@RequestBody GamingHistory event) {
        GamingHistory created = historyService.createHistoryEvent(event);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/admin/{id}")
    public ResponseEntity<GamingHistory> updateHistoryEvent(
            @PathVariable Long id,
            @RequestBody GamingHistory event
    ) {
        GamingHistory updated = historyService.updateHistoryEvent(id, event);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Void> deleteHistoryEvent(@PathVariable Long id) {
        historyService.deleteHistoryEvent(id);
        return ResponseEntity.noContent().build();
    }
}
