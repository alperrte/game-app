package com.ltz.content_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ltz.content_service.model.dto.ReactionRequest;
import com.ltz.content_service.model.enums.ReactionType;
import com.ltz.content_service.service.ReactionsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * ReactionsController Standalone MockMvc Tests.
 *
 * NOTE on auth tests: In standalone MockMvc setup, Spring Security filters are NOT applied.
 * Authentication/authorization tests (401/403) should be verified either:
 *   a) Via Postman integration tests (see: docs/LTZ-ContentService-Postman-Collection.json)
 *   b) Or through @SpringBootTest with full context when DB is available.
 *
 * These tests verify the controller's request validation logic only (400 scenarios).
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ReactionsController Tests (Standalone MockMvc - Validation Only)")
class ReactionsControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ReactionsService reactionsService;

    @InjectMocks
    private ReactionsController reactionsController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(reactionsController)
                .build();
    }

    // ─── POST /api/content/reactions — Validation Tests ─────────────────────

    @Test
    @DisplayName("POST /api/content/reactions → geçersiz body (contentId null) → 400")
    void reactToContent_whenContentIdNull_shouldReturn400() throws Exception {
        // Build request with null contentId — @NotNull ihlali
        String badJson = "{\"contentType\":\"NEWS\",\"reactionType\":\"HYPE\"}";

        mockMvc.perform(post("/api/content/reactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/content/reactions → reactionType eksik → 400")
    void reactToContent_whenReactionTypeNull_shouldReturn400() throws Exception {
        String badJson = "{\"contentId\":1,\"contentType\":\"NEWS\"}";

        mockMvc.perform(post("/api/content/reactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/content/reactions → boş JSON body → 400")
    void reactToContent_whenEmptyBody_shouldReturn400() throws Exception {
        mockMvc.perform(post("/api/content/reactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/content/reactions → Content-Type eksik → 415 Unsupported Media Type")
    void reactToContent_whenNoContentType_shouldReturn415() throws Exception {
        ReactionRequest request = new ReactionRequest();
        request.setContentId(1L);
        request.setContentType("NEWS");
        request.setReactionType(ReactionType.HYPE);

        mockMvc.perform(post("/api/content/reactions")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnsupportedMediaType());
    }
}
