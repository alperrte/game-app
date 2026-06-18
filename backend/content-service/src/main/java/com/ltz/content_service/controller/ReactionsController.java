package com.ltz.content_service.controller;

import com.ltz.content_service.model.dto.ReactionRequest;
import com.ltz.content_service.security.JwtUserPrincipal;
import com.ltz.content_service.service.ReactionsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/content/reactions")
@RequiredArgsConstructor
public class ReactionsController {

    private final ReactionsService reactionsService;

    @PostMapping
    public ResponseEntity<Map<String, String>> reactToContent(
            @Valid @RequestBody ReactionRequest request,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        reactionsService.reactToContent(
                principal.userId(),
                request.getContentId(),
                request.getContentType(),
                request.getReactionType()
        );
        return ResponseEntity.ok(Map.of("message", "Reaction recorded successfully"));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, String>> removeReaction(
            @RequestParam Long contentId,
            @RequestParam String contentType,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        reactionsService.removeReaction(
                principal.userId(),
                contentId,
                contentType
        );
        return ResponseEntity.ok(Map.of("message", "Reaction removed successfully"));
    }
}
