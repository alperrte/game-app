package com.ltz.content_service.controller;

import com.ltz.content_service.dto.NewsArticleResponse;
import com.ltz.content_service.enums.NewsCategory;
import com.ltz.content_service.service.NewsService;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NewsController Integration Tests (Standalone MockMvc)")
@SuppressWarnings("unchecked")
class NewsControllerTest {

    private MockMvc mockMvc;

    @Mock
    private NewsService newsService;

    @InjectMocks
    private NewsController newsController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(newsController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
    }

    private NewsArticleResponse buildSampleResponse(Long id, String title) {
        return NewsArticleResponse.builder()
                .id(id)
                .title(title)
                .summary("Test özet " + id)
                .contentUrl("https://example.com/" + id)
                .imageUrl("https://example.com/img" + id + ".jpg")
                .sourceName("TestSource")
                .category(NewsCategory.GLOBAL)
                .createdAt(LocalDateTime.now())
                .reactions(Map.of("HYPE", 0L, "WORTH_IT", 0L, "MEH", 0L, "TRASH", 0L))
                .userReaction(null)
                .build();
    }

    // ─── GET /api/content/news ───────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/content/news → 200 OK, paginated response döner")
    void getNews_shouldReturn200WithPaginatedContent() throws Exception {
        Page<NewsArticleResponse> samplePage = new PageImpl<>(
                List.of(buildSampleResponse(1L, "Haber Başlığı 1")),
                PageRequest.of(0, 20), 1
        );
        when(newsService.getNews(isNull(), isNull(), org.mockito.ArgumentMatchers.<Pageable>any(), isNull()))
                .thenReturn(samplePage);

        mockMvc.perform(get("/api/content/news"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title").value("Haber Başlığı 1"))
                .andExpect(jsonPath("$.content[0].reactions").exists())
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("GET /api/content/news?page=0&size=5 → sayfalama parametreleri kabul edilir")
    void getNews_withPageParams_shouldReturn200() throws Exception {
        Page<NewsArticleResponse> samplePage = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);
        when(newsService.getNews(isNull(), isNull(), org.mockito.ArgumentMatchers.<Pageable>any(), isNull()))
                .thenReturn(samplePage);

        mockMvc.perform(get("/api/content/news")
                        .param("page", "0")
                        .param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @DisplayName("GET /api/content/news?category=GLOBAL → kategori filtresi çalışır")
    void getNews_withCategoryParam_shouldReturn200() throws Exception {
        Page<NewsArticleResponse> samplePage = new PageImpl<>(
                List.of(buildSampleResponse(2L, "Global Haberi")),
                PageRequest.of(0, 20), 1
        );
        when(newsService.getNews(eq("GLOBAL"), isNull(), org.mockito.ArgumentMatchers.<Pageable>any(), isNull()))
                .thenReturn(samplePage);

        mockMvc.perform(get("/api/content/news")
                        .param("category", "GLOBAL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].category").value("GLOBAL"));
    }

    @Test
    @DisplayName("GET /api/content/news → boş sayfa → 200 OK, boş content")
    void getNews_whenEmpty_shouldReturn200WithEmptyContent() throws Exception {
        Page<NewsArticleResponse> emptyPage = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);
        when(newsService.getNews(isNull(), isNull(), org.mockito.ArgumentMatchers.<Pageable>any(), isNull()))
                .thenReturn(emptyPage);

        mockMvc.perform(get("/api/content/news"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    // ─── GET /api/content/news/{id} ─────────────────────────────────────────

    @Test
    @DisplayName("GET /api/content/news/1 → var olan ID → 200 OK, haber döner")
    void getNewsById_whenFound_shouldReturn200() throws Exception {
        when(newsService.getNewsById(eq(1L), isNull()))
                .thenReturn(buildSampleResponse(1L, "Detay Haberi"));

        mockMvc.perform(get("/api/content/news/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Detay Haberi"))
                .andExpect(jsonPath("$.reactions").isMap());
    }
}
