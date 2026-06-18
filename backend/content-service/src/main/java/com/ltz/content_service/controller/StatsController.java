package com.ltz.content_service.controller;

import com.ltz.content_service.model.entity.EsportMatch;
import com.ltz.content_service.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/content/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllStats() {
        Map<String, Object> stats = statsService.getAllStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/{key}")
    public ResponseEntity<Object> getStatByKey(@PathVariable String key) {
        Object stat = statsService.getStatByKey(key);
        return ResponseEntity.ok(stat);
    }

    @GetMapping("/esports")
    public ResponseEntity<List<EsportMatch>> getEsportMatches(
            @RequestParam(required = false) String status
    ) {
        List<EsportMatch> matches = statsService.getEsportMatches(status);
        return ResponseEntity.ok(matches);
    }
}
