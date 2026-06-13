package com.ltz.game_service.controller;

import com.ltz.game_service.dto.request.DeveloperRequest;
import com.ltz.game_service.dto.response.DeveloperResponse;
import com.ltz.game_service.service.DeveloperService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/games/developers")
public class DeveloperController {

    private final DeveloperService developerService;

    public DeveloperController(DeveloperService developerService) {
        this.developerService = developerService;
    }

    @GetMapping
    public ResponseEntity<List<DeveloperResponse>> getAllDevelopers() {
        return ResponseEntity.ok(developerService.getAllDevelopers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeveloperResponse> getDeveloperById(@PathVariable Long id) {
        return ResponseEntity.ok(developerService.getDeveloperById(id));
    }

    @PostMapping
    public ResponseEntity<DeveloperResponse> createDeveloper(
            @Valid @RequestBody DeveloperRequest request
    ) {
        DeveloperResponse createdDeveloper = developerService.createDeveloper(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdDeveloper);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DeveloperResponse> updateDeveloper(
            @PathVariable Long id,
            @Valid @RequestBody DeveloperRequest request
    ) {
        return ResponseEntity.ok(developerService.updateDeveloper(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDeveloper(@PathVariable Long id) {
        developerService.deleteDeveloper(id);
        return ResponseEntity.noContent().build();
    }
}