package com.ltz.content_service.controller;

import com.ltz.content_service.exception.ResourceNotFoundException;
import com.ltz.content_service.model.entity.EsportMatch;
import com.ltz.content_service.model.enums.MatchStatus;
import com.ltz.content_service.service.StatsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("StatsController Integration Tests (Standalone MockMvc)")
class StatsControllerTest {

    private MockMvc mockMvc;

    @Mock
    private StatsService statsService;

    @InjectMocks
    private StatsController statsController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(statsController).build();
    }

    // ─── GET /api/content/stats ──────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/content/stats → 200 OK, tüm statlar map döner")
    void getAllStats_shouldReturn200WithStatsMap() throws Exception {
        Map<String, Object> stats = Map.of(
                "steam_online", 850000,
                "twitch_viewers", 120000
        );
        when(statsService.getAllStats()).thenReturn(stats);

        mockMvc.perform(get("/api/content/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.steam_online").value(850000))
                .andExpect(jsonPath("$.twitch_viewers").value(120000));
    }

    @Test
    @DisplayName("GET /api/content/stats → boş → 200 OK, boş map")
    void getAllStats_whenEmpty_shouldReturn200WithEmptyMap() throws Exception {
        when(statsService.getAllStats()).thenReturn(Map.of());

        mockMvc.perform(get("/api/content/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isMap());
    }

    // ─── GET /api/content/stats/{key} ────────────────────────────────────────

    @Test
    @DisplayName("GET /api/content/stats/steam_online → var olan key → değer döner")
    void getStatByKey_whenFound_shouldReturn200() throws Exception {
        when(statsService.getStatByKey("steam_online")).thenReturn(850000);

        mockMvc.perform(get("/api/content/stats/steam_online"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(850000));
    }

    // Note: /esports is mapped before /{key} in the class, so this ordering matters.
    // We test the {key} path variable in general terms here.
    @Test
    @DisplayName("GET /api/content/stats/nonexistent_key → olmayan key → 404 Not Found")
    void getStatByKey_whenNotFound_shouldThrow() throws Exception {
        when(statsService.getStatByKey("nonexistent_key"))
                .thenThrow(new ResourceNotFoundException("Stat not found: nonexistent_key"));

        // Since ResourceNotFoundException is annotated with @ResponseStatus(HttpStatus.NOT_FOUND),
        // MockMvc resolves it to a 404 Not Found even in standalone setup.
        mockMvc.perform(get("/api/content/stats/nonexistent_key"))
                .andExpect(status().isNotFound());
    }

    // ─── GET /api/content/stats/esports ─────────────────────────────────────

    @Test
    @DisplayName("GET /api/content/stats/esports → tüm maçlar döner")
    void getEsportMatches_shouldReturn200WithMatches() throws Exception {
        EsportMatch match = EsportMatch.builder()
                .id(1L)
                .matchId("match-001")
                .tournamentName("ESL Pro League")
                .gameName("CS2")
                .teamAName("Team Liquid")
                .teamBName("Fnatic")
                .status(MatchStatus.LIVE)
                .matchTime(LocalDateTime.now())
                .build();
        when(statsService.getEsportMatches(isNull())).thenReturn(List.of(match));

        mockMvc.perform(get("/api/content/stats/esports"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].teamAName").value("Team Liquid"))
                .andExpect(jsonPath("$[0].teamBName").value("Fnatic"))
                .andExpect(jsonPath("$[0].status").value("LIVE"));
    }

    @Test
    @DisplayName("GET /api/content/stats/esports?status=LIVE → filtrelenmiş maçlar döner")
    void getEsportMatches_withStatusFilter_shouldReturn200() throws Exception {
        EsportMatch liveMatch = EsportMatch.builder()
                .id(2L)
                .matchId("match-002")
                .tournamentName("BLAST Premier")
                .gameName("CS2")
                .teamAName("NaVi")
                .teamBName("Astralis")
                .status(MatchStatus.LIVE)
                .matchTime(LocalDateTime.now())
                .build();
        when(statsService.getEsportMatches("LIVE")).thenReturn(List.of(liveMatch));

        mockMvc.perform(get("/api/content/stats/esports")
                        .param("status", "LIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("LIVE"));
    }

    @Test
    @DisplayName("GET /api/content/stats/esports → maç yok → boş liste")
    void getEsportMatches_whenEmpty_shouldReturn200WithEmptyList() throws Exception {
        when(statsService.getEsportMatches(isNull())).thenReturn(List.of());

        mockMvc.perform(get("/api/content/stats/esports"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }
}
