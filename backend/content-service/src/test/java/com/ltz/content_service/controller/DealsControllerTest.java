package com.ltz.content_service.controller;

import com.ltz.content_service.model.dto.DealCompareResponse;
import com.ltz.content_service.model.entity.DealCampaign;
import com.ltz.content_service.service.DealsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DealsController Integration Tests (Standalone MockMvc)")
@SuppressWarnings("unchecked")
class DealsControllerTest {

    private MockMvc mockMvc;

    @Mock
    private DealsService dealsService;

    @InjectMocks
    private DealsController dealsController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(dealsController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
    }

    private DealCampaign buildSampleDeal(Long id, String gameTitle, int discount) {
        return DealCampaign.builder()
                .id(id)
                .gameTitle(gameTitle)
                .storeName("Steam")
                .originalPrice(new BigDecimal("59.99"))
                .discountedPrice(new BigDecimal("59.99").multiply(BigDecimal.valueOf(1.0 - discount / 100.0)))
                .discountPercent(discount)
                .currency("USD")
                .isFree(false)
                .dealUrl("https://store.steampowered.com/app/" + id)
                .build();
    }

    // ─── GET /api/content/deals ──────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/content/deals → 200 OK, paginated deals döner")
    void getActiveDeals_shouldReturn200WithPaginatedDeals() throws Exception {
        Page<DealCampaign> page = new PageImpl<>(
                List.of(buildSampleDeal(1L, "Cyberpunk 2077", 50)),
                PageRequest.of(0, 20), 1
        );
        when(dealsService.getActiveDeals(isNull(), org.mockito.ArgumentMatchers.<Pageable>any()))
                .thenReturn(page);

        mockMvc.perform(get("/api/content/deals"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].gameTitle").value("Cyberpunk 2077"))
                .andExpect(jsonPath("$.content[0].discountPercent").value(50))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("GET /api/content/deals?minDiscount=75 → yüksek indirim filtresi çalışır")
    void getActiveDeals_withMinDiscount_shouldReturnFilteredDeals() throws Exception {
        Page<DealCampaign> page = new PageImpl<>(
                List.of(buildSampleDeal(2L, "Witcher 3", 80)),
                PageRequest.of(0, 20), 1
        );
        when(dealsService.getActiveDeals(eq(75), org.mockito.ArgumentMatchers.<Pageable>any()))
                .thenReturn(page);

        mockMvc.perform(get("/api/content/deals")
                        .param("minDiscount", "75"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].discountPercent").value(greaterThanOrEqualTo(75)));
    }

    // ─── GET /api/content/deals/search ──────────────────────────────────────

    @Test
    @DisplayName("GET /api/content/deals/search → karşılaştırma listesi döner")
    void searchDeals_shouldReturn200WithComparisons() throws Exception {
        DealCompareResponse compareResponse = DealCompareResponse.builder()
                .gameTitle("Cyberpunk 2077")
                .stores(List.of(
                        DealCompareResponse.StoreDealDTO.builder()
                                .storeName("Steam")
                                .discountedPrice(new BigDecimal("29.99"))
                                .discountPercent(50)
                                .build()
                ))
                .reactions(Map.of("HYPE", 0L))
                .build();

        when(dealsService.searchAndCompareDeals(isNull(), isNull())).thenReturn(List.of(compareResponse));

        mockMvc.perform(get("/api/content/deals/search"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].gameTitle").value("Cyberpunk 2077"))
                .andExpect(jsonPath("$[0].stores", hasSize(1)));
    }

    // ─── GET /api/content/deals/free-games ──────────────────────────────────

    @Test
    @DisplayName("GET /api/content/deals/free-games → ücretsiz oyunlar döner")
    void getFreeGames_shouldReturn200WithFreeGames() throws Exception {
        DealCampaign freeGame = DealCampaign.builder()
                .id(10L)
                .gameTitle("Rocket League")
                .isFree(true)
                .discountedPrice(BigDecimal.ZERO)
                .storeName("Epic Games")
                .discountPercent(100)
                .originalPrice(BigDecimal.ZERO)
                .dealUrl("https://epicgames.com/rocketleague")
                .build();
        when(dealsService.getFreeGames()).thenReturn(List.of(freeGame));

        mockMvc.perform(get("/api/content/deals/free-games"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].gameTitle").value("Rocket League"))
                .andExpect(jsonPath("$[0].free").value(true));
    }
}
