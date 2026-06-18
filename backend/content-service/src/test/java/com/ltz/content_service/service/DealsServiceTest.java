package com.ltz.content_service.service;

import com.ltz.content_service.model.dto.DealCompareResponse;
import com.ltz.content_service.model.entity.DealCampaign;
import com.ltz.content_service.model.entity.HistoricalLow;
import com.ltz.content_service.repository.DealCampaignRepository;
import com.ltz.content_service.repository.HistoricalLowRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DealsService Unit Tests")
class DealsServiceTest {

    @Mock
    private DealCampaignRepository dealCampaignRepository;

    @Mock
    private HistoricalLowRepository historicalLowRepository;

    @Mock
    private ReactionsService reactionsService;

    @InjectMocks
    private DealsService dealsService;

    private DealCampaign sampleDeal;
    private Pageable pageable;

    @BeforeEach
    void setUp() {
        sampleDeal = DealCampaign.builder()
                .id(1L)
                .gameTitle("Cyberpunk 2077")
                .storeName("Steam")
                .originalPrice(new BigDecimal("59.99"))
                .discountedPrice(new BigDecimal("29.99"))
                .discountPercent(50)
                .currency("USD")
                .isFree(false)
                .dealUrl("https://store.steampowered.com/app/1091500")
                .build();

        pageable = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "discountPercent"));
    }

    // ─── getActiveDeals ─────────────────────────────────────────────────────

    @Test
    @DisplayName("getActiveDeals() → minDiscount null → findAll çağrılır")
    void getActiveDeals_whenMinDiscountIsNull_shouldReturnAll() {
        Page<DealCampaign> mockPage = new PageImpl<>(List.of(sampleDeal), pageable, 1);
        when(dealCampaignRepository.findAll(pageable)).thenReturn(mockPage);

        Page<DealCampaign> result = dealsService.getActiveDeals(null, pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        verify(dealCampaignRepository).findAll(pageable);
        verify(dealCampaignRepository, never()).findByDiscountPercentGreaterThanEqual(anyInt(), any());
    }

    @Test
    @DisplayName("getActiveDeals() → minDiscount 0 → findAll çağrılır (0 filtre etkisiz)")
    void getActiveDeals_whenMinDiscountIsZero_shouldReturnAll() {
        Page<DealCampaign> mockPage = new PageImpl<>(List.of(sampleDeal), pageable, 1);
        when(dealCampaignRepository.findAll(pageable)).thenReturn(mockPage);

        Page<DealCampaign> result = dealsService.getActiveDeals(0, pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        verify(dealCampaignRepository).findAll(pageable);
    }

    @Test
    @DisplayName("getActiveDeals() → minDiscount 50 → findByDiscountPercent çağrılır")
    void getActiveDeals_whenMinDiscount50_shouldFilterByDiscount() {
        Page<DealCampaign> mockPage = new PageImpl<>(List.of(sampleDeal), pageable, 1);
        when(dealCampaignRepository.findByDiscountPercentGreaterThanEqual(50, pageable)).thenReturn(mockPage);

        Page<DealCampaign> result = dealsService.getActiveDeals(50, pageable);

        assertThat(result.getContent().get(0).getDiscountPercent()).isGreaterThanOrEqualTo(50);
        verify(dealCampaignRepository).findByDiscountPercentGreaterThanEqual(50, pageable);
        verify(dealCampaignRepository, never()).findAll(any(Pageable.class));
    }

    // ─── getFreeGames ────────────────────────────────────────────────────────

    @Test
    @DisplayName("getFreeGames() → ücretsiz oyunlar döner")
    void getFreeGames_shouldReturnOnlyFreeGames() {
        DealCampaign freeDeal = DealCampaign.builder()
                .id(2L)
                .gameTitle("Rocket League")
                .isFree(true)
                .discountedPrice(BigDecimal.ZERO)
                .build();
        when(dealCampaignRepository.findByIsFreeTrue()).thenReturn(List.of(freeDeal));

        List<DealCampaign> result = dealsService.getFreeGames();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).isFree()).isTrue();
        verify(dealCampaignRepository).findByIsFreeTrue();
    }

    @Test
    @DisplayName("getFreeGames() → veri yok → boş liste döner")
    void getFreeGames_whenNoFreeGames_shouldReturnEmptyList() {
        when(dealCampaignRepository.findByIsFreeTrue()).thenReturn(List.of());

        List<DealCampaign> result = dealsService.getFreeGames();

        assertThat(result).isEmpty();
    }

    // ─── searchAndCompareDeals ───────────────────────────────────────────────

    @Test
    @DisplayName("searchAndCompareDeals() → title null → tüm kampanyalar döner")
    void searchAndCompareDeals_whenTitleIsNull_shouldReturnAll() {
        when(dealCampaignRepository.findAll()).thenReturn(List.of(sampleDeal));
        when(historicalLowRepository.findByGameTitleIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(reactionsService.getReactionsSummary(anyLong(), anyString())).thenReturn(Map.of("HYPE", 0L));
        when(reactionsService.getUserReaction(any(), anyLong(), anyString())).thenReturn(null);

        List<DealCompareResponse> result = dealsService.searchAndCompareDeals(null, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getGameTitle()).isEqualTo("Cyberpunk 2077");
    }

    @Test
    @DisplayName("searchAndCompareDeals() → title ile arama → findByGameTitleContaining çağrılır")
    void searchAndCompareDeals_whenTitleProvided_shouldSearch() {
        when(dealCampaignRepository.findByGameTitleContainingIgnoreCase("Cyber")).thenReturn(List.of(sampleDeal));
        when(historicalLowRepository.findByGameTitleIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(reactionsService.getReactionsSummary(anyLong(), anyString())).thenReturn(Map.of());
        when(reactionsService.getUserReaction(any(), anyLong(), anyString())).thenReturn(null);

        List<DealCompareResponse> result = dealsService.searchAndCompareDeals("Cyber", 1L);

        assertThat(result).hasSize(1);
        verify(dealCampaignRepository).findByGameTitleContainingIgnoreCase("Cyber");
    }

    @Test
    @DisplayName("searchAndCompareDeals() → historical low var → response'a eklenir")
    void searchAndCompareDeals_whenHistoricalLowExists_shouldIncludeIt() {
        HistoricalLow historicalLow = HistoricalLow.builder()
                .id(10L)
                .gameTitle("Cyberpunk 2077")
                .lowestPrice(new BigDecimal("9.99"))
                .storeName("GOG")
                .currency("USD")
                .recordedAt(LocalDateTime.now().minusDays(30))
                .build();

        when(dealCampaignRepository.findAll()).thenReturn(List.of(sampleDeal));
        when(historicalLowRepository.findByGameTitleIgnoreCase("Cyberpunk 2077")).thenReturn(Optional.of(historicalLow));
        when(reactionsService.getReactionsSummary(anyLong(), anyString())).thenReturn(Map.of());
        when(reactionsService.getUserReaction(any(), anyLong(), anyString())).thenReturn(null);

        List<DealCompareResponse> result = dealsService.searchAndCompareDeals(null, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getHistoricalLow()).isNotNull();
        assertThat(result.get(0).getHistoricalLow().getLowestPrice()).isEqualByComparingTo("9.99");
        assertThat(result.get(0).getHistoricalLow().getStoreName()).isEqualTo("GOG");
    }
}
