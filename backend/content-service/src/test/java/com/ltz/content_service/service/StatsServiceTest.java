package com.ltz.content_service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ltz.content_service.exception.ResourceNotFoundException;
import com.ltz.content_service.model.entity.EsportMatch;
import com.ltz.content_service.model.entity.LiveStat;
import com.ltz.content_service.model.enums.MatchStatus;
import com.ltz.content_service.repository.EsportMatchRepository;
import com.ltz.content_service.repository.LiveStatRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("StatsService Unit Tests")
class StatsServiceTest {

    @Mock
    private LiveStatRepository liveStatRepository;

    @Mock
    private EsportMatchRepository esportMatchRepository;

    @InjectMocks
    private StatsService statsService;

    // ObjectMapper gerçek instance ile kullanılır (JSON parse için)
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() throws Exception {
        // Mockito injection sonrası ObjectMapper'ı set et
        var field = StatsService.class.getDeclaredField("objectMapper");
        field.setAccessible(true);
        field.set(statsService, objectMapper);
    }

    // ─── getAllStats ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("getAllStats() → kayıtlı statlar → map olarak döner")
    void getAllStats_shouldReturnParsedStatsMap() {
        LiveStat steamStat = LiveStat.builder()
                .statKey("steam_online")
                .statValue("850000")
                .isReliable(true)
                .updatedAt(LocalDateTime.now())
                .build();
        LiveStat twitchStat = LiveStat.builder()
                .statKey("twitch_viewers")
                .statValue("\"120000\"")
                .isReliable(true)
                .updatedAt(LocalDateTime.now())
                .build();

        when(liveStatRepository.findAll()).thenReturn(List.of(steamStat, twitchStat));

        Map<String, Object> result = statsService.getAllStats();

        assertThat(result).containsKey("steam_online");
        assertThat(result).containsKey("twitch_viewers");
        assertThat(result.get("steam_online")).isEqualTo(850000);
    }

    @Test
    @DisplayName("getAllStats() → istatistik yok → boş map döner")
    void getAllStats_whenNoStats_shouldReturnEmptyMap() {
        when(liveStatRepository.findAll()).thenReturn(List.of());

        Map<String, Object> result = statsService.getAllStats();

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getAllStats() → geçersiz JSON değeri → ham string olarak döner")
    void getAllStats_whenInvalidJson_shouldReturnRawString() {
        LiveStat badStat = LiveStat.builder()
                .statKey("bad_stat")
                .statValue("{not valid json!!!")
                .isReliable(false)
                .updatedAt(LocalDateTime.now())
                .build();

        when(liveStatRepository.findAll()).thenReturn(List.of(badStat));

        Map<String, Object> result = statsService.getAllStats();

        assertThat(result).containsKey("bad_stat");
        assertThat(result.get("bad_stat")).isEqualTo("{not valid json!!!");
    }

    // ─── getStatByKey ────────────────────────────────────────────────────────

    @Test
    @DisplayName("getStatByKey() → var olan key → değer döner")
    void getStatByKey_whenFound_shouldReturnParsedValue() {
        LiveStat stat = LiveStat.builder()
                .statKey("steam_online")
                .statValue("1200000")
                .isReliable(true)
                .updatedAt(LocalDateTime.now())
                .build();
        when(liveStatRepository.findByStatKey("steam_online")).thenReturn(Optional.of(stat));

        Object result = statsService.getStatByKey("steam_online");

        assertThat(result).isEqualTo(1200000);
    }

    @Test
    @DisplayName("getStatByKey() → olmayan key → ResourceNotFoundException fırlatılır")
    void getStatByKey_whenNotFound_shouldThrowException() {
        when(liveStatRepository.findByStatKey("nonexistent_key")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> statsService.getStatByKey("nonexistent_key"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("nonexistent_key");
    }

    // ─── saveOrUpdateStat ────────────────────────────────────────────────────

    @Test
    @DisplayName("saveOrUpdateStat() → yeni key → yeni LiveStat oluşturulur")
    void saveOrUpdateStat_whenNewKey_shouldCreateNewStat() {
        when(liveStatRepository.findByStatKey("new_key")).thenReturn(Optional.empty());
        when(liveStatRepository.save(any(LiveStat.class))).thenAnswer(invocation -> invocation.getArgument(0));

        statsService.saveOrUpdateStat("new_key", "\"test_value\"");

        verify(liveStatRepository).save(argThat(stat ->
                stat.getStatKey().equals("new_key") &&
                stat.getStatValue().equals("\"test_value\"") &&
                stat.isReliable()
        ));
    }

    @Test
    @DisplayName("saveOrUpdateStat() → var olan key → güncelleme yapılır")
    void saveOrUpdateStat_whenExistingKey_shouldUpdateExistingStat() {
        LiveStat existingStat = LiveStat.builder()
                .statKey("steam_online")
                .statValue("900000")
                .isReliable(true)
                .updatedAt(LocalDateTime.now().minusMinutes(5))
                .build();

        when(liveStatRepository.findByStatKey("steam_online")).thenReturn(Optional.of(existingStat));
        when(liveStatRepository.save(any(LiveStat.class))).thenAnswer(invocation -> invocation.getArgument(0));

        statsService.saveOrUpdateStat("steam_online", "1000000");

        verify(liveStatRepository).save(argThat(stat ->
                stat.getStatValue().equals("1000000")
        ));
    }

    // ─── getEsportMatches ────────────────────────────────────────────────────

    @Test
    @DisplayName("getEsportMatches() → status null → tüm maçlar döner")
    void getEsportMatches_whenStatusIsNull_shouldReturnAll() {
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
        when(esportMatchRepository.findAll()).thenReturn(List.of(match));

        List<EsportMatch> result = statsService.getEsportMatches(null);

        assertThat(result).hasSize(1);
        verify(esportMatchRepository).findAll();
    }

    @Test
    @DisplayName("getEsportMatches() → status LIVE → filtrelenmiş maçlar döner")
    void getEsportMatches_whenStatusIsLive_shouldFilterByStatus() {
        EsportMatch liveMatch = EsportMatch.builder()
                .id(1L)
                .matchId("match-002")
                .tournamentName("BLAST Premier")
                .gameName("CS2")
                .teamAName("NaVi")
                .teamBName("Astralis")
                .status(MatchStatus.LIVE)
                .matchTime(LocalDateTime.now())
                .build();
        when(esportMatchRepository.findByStatusOrderByMatchTimeAsc(MatchStatus.LIVE))
                .thenReturn(List.of(liveMatch));

        List<EsportMatch> result = statsService.getEsportMatches("LIVE");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo(MatchStatus.LIVE);
        verify(esportMatchRepository).findByStatusOrderByMatchTimeAsc(MatchStatus.LIVE);
    }

    @Test
    @DisplayName("getEsportMatches() → geçersiz status → fallback tüm maçlar döner")
    void getEsportMatches_whenInvalidStatus_shouldReturnAll() {
        EsportMatch match = EsportMatch.builder()
                .id(1L)
                .matchId("match-003")
                .tournamentName("IEM Katowice")
                .gameName("CS2")
                .teamAName("FaZe")
                .teamBName("G2")
                .status(MatchStatus.UPCOMING)
                .matchTime(LocalDateTime.now().plusHours(2))
                .build();
        when(esportMatchRepository.findAll()).thenReturn(List.of(match));

        List<EsportMatch> result = statsService.getEsportMatches("GECERSIZ_STATUS");

        assertThat(result).hasSize(1);
        verify(esportMatchRepository).findAll();
        verify(esportMatchRepository, never()).findByStatusOrderByMatchTimeAsc(any());
    }
}
