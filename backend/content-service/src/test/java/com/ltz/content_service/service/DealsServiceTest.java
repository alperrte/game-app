package com.ltz.content_service.service;

import com.ltz.content_service.dto.DealCampaignResponse;
import com.ltz.content_service.dto.DealCompareResponse;
import com.ltz.content_service.entity.DealCampaign;
import com.ltz.content_service.entity.HistoricalLow;
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
    private DealsQueryCache dealsQueryCache;

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
    @DisplayName("getActiveDeals() → minDiscount null → cache'in findAllSortedByDiscount() çağrılır")
    void getActiveDeals_whenMinDiscountIsNull_shouldReturnAll() {
        when(dealsQueryCache.findAllSortedByDiscount()).thenReturn(List.of(sampleDeal));

        Page<DealCampaignResponse> result = dealsService.getActiveDeals(null, pageable, null);

        assertThat(result.getTotalElements()).isEqualTo(1);
        verify(dealsQueryCache).findAllSortedByDiscount();
        verify(dealsQueryCache, never()).findByMinDiscount(anyInt());
    }

    @Test
    @DisplayName("getActiveDeals() → minDiscount 0 → cache'in findAllSortedByDiscount() çağrılır (0 filtre etkisiz)")
    void getActiveDeals_whenMinDiscountIsZero_shouldReturnAll() {
        when(dealsQueryCache.findAllSortedByDiscount()).thenReturn(List.of(sampleDeal));

        Page<DealCampaignResponse> result = dealsService.getActiveDeals(0, pageable, null);

        assertThat(result.getTotalElements()).isEqualTo(1);
        verify(dealsQueryCache).findAllSortedByDiscount();
    }

    @Test
    @DisplayName("getActiveDeals() → minDiscount 50 → cache'in findByMinDiscount() çağrılır")
    void getActiveDeals_whenMinDiscount50_shouldFilterByDiscount() {
        when(dealsQueryCache.findByMinDiscount(50)).thenReturn(List.of(sampleDeal));

        Page<DealCampaignResponse> result = dealsService.getActiveDeals(50, pageable, null);

        assertThat(result.getContent().get(0).getDiscountPercent()).isGreaterThanOrEqualTo(50);
        verify(dealsQueryCache).findByMinDiscount(50);
        verify(dealsQueryCache, never()).findAllSortedByDiscount();
    }

    @Test
    @DisplayName("getActiveDeals() → aynı oyun farklı mağazalarda → tek satıra tekilleştirilir")
    void getActiveDeals_whenSameGameMultipleStores_shouldDeduplicateByGameTitle() {
        DealCampaign steamDeal = DealCampaign.builder()
                .id(1L)
                .gameTitle("Cyberpunk 2077")
                .storeName("Steam")
                .discountPercent(50)
                .discountedPrice(new BigDecimal("29.99"))
                .build();
        DealCampaign gogDeal = DealCampaign.builder()
                .id(2L)
                .gameTitle("Cyberpunk 2077")
                .storeName("GOG")
                .discountPercent(40)
                .discountedPrice(new BigDecimal("35.99"))
                .build();
        // Cache ORDER BY discountPercent DESC ile döner: en yüksek indirim önce.
        when(dealsQueryCache.findAllSortedByDiscount()).thenReturn(List.of(steamDeal, gogDeal));

        Page<DealCampaignResponse> result = dealsService.getActiveDeals(null, pageable, null);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getStoreName()).isEqualTo("Steam");
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
        when(dealsQueryCache.findFreeGames()).thenReturn(List.of(freeDeal));

        List<DealCampaignResponse> result = dealsService.getFreeGames(null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).isFree()).isTrue();
        verify(dealsQueryCache).findFreeGames();
    }

    @Test
    @DisplayName("getFreeGames() → veri yok → boş liste döner")
    void getFreeGames_whenNoFreeGames_shouldReturnEmptyList() {
        when(dealsQueryCache.findFreeGames()).thenReturn(List.of());

        List<DealCampaignResponse> result = dealsService.getFreeGames(null);

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
