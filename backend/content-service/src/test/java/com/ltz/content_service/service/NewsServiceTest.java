package com.ltz.content_service.service;

import com.ltz.content_service.exception.ResourceNotFoundException;
import com.ltz.content_service.model.dto.NewsArticleResponse;
import com.ltz.content_service.model.entity.NewsArticle;
import com.ltz.content_service.model.enums.NewsCategory;
import com.ltz.content_service.repository.NewsArticleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NewsService Unit Tests")
class NewsServiceTest {

    @Mock
    private NewsArticleRepository newsArticleRepository;

    @Mock
    private ReactionsService reactionsService;

    @InjectMocks
    private NewsService newsService;

    private NewsArticle sampleArticle;
    private Pageable pageable;

    @BeforeEach
    void setUp() {
        sampleArticle = NewsArticle.builder()
                .id(1L)
                .title("Test Haber Başlığı")
                .summary("Test özet içeriği")
                .contentUrl("https://example.com/test")
                .imageUrl("https://example.com/img.jpg")
                .sourceName("TestSource")
                .category(NewsCategory.GLOBAL)
                .createdAt(LocalDateTime.now())
                .build();

        pageable = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    // ─── getNews: Kategori Yok ──────────────────────────────────────────────

    @Test
    @DisplayName("getNews() → kategori null → findAll çağrılır")
    void getNews_whenCategoryIsNull_shouldReturnAllNews() {
        Page<NewsArticle> mockPage = new PageImpl<>(List.of(sampleArticle), pageable, 1);
        when(newsArticleRepository.findAll(pageable)).thenReturn(mockPage);
        when(reactionsService.getReactionsSummary(anyLong(), anyString())).thenReturn(Map.of("HYPE", 0L));
        when(reactionsService.getUserReaction(any(), anyLong(), anyString())).thenReturn(null);

        Page<NewsArticleResponse> result = newsService.getNews(null, pageable, null);

        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo("Test Haber Başlığı");
        verify(newsArticleRepository).findAll(pageable);
        verify(newsArticleRepository, never()).findByCategory(any(), any());
    }

    @Test
    @DisplayName("getNews() → kategori boş string → findAll çağrılır")
    void getNews_whenCategoryIsBlank_shouldReturnAllNews() {
        Page<NewsArticle> mockPage = new PageImpl<>(List.of(sampleArticle), pageable, 1);
        when(newsArticleRepository.findAll(pageable)).thenReturn(mockPage);
        when(reactionsService.getReactionsSummary(anyLong(), anyString())).thenReturn(Map.of());
        when(reactionsService.getUserReaction(any(), anyLong(), anyString())).thenReturn(null);

        Page<NewsArticleResponse> result = newsService.getNews("  ", pageable, null);

        assertThat(result.getTotalElements()).isEqualTo(1);
        verify(newsArticleRepository).findAll(pageable);
    }

    // ─── getNews: Geçerli Kategori ──────────────────────────────────────────

    @Test
    @DisplayName("getNews() → geçerli kategori GLOBAL → findByCategory çağrılır")
    void getNews_whenValidCategory_shouldFilterByCategory() {
        Page<NewsArticle> mockPage = new PageImpl<>(List.of(sampleArticle), pageable, 1);
        when(newsArticleRepository.findByCategory(NewsCategory.GLOBAL, pageable)).thenReturn(mockPage);
        when(reactionsService.getReactionsSummary(anyLong(), anyString())).thenReturn(Map.of());
        when(reactionsService.getUserReaction(any(), anyLong(), anyString())).thenReturn(null);

        Page<NewsArticleResponse> result = newsService.getNews("GLOBAL", pageable, 42L);

        assertThat(result.getContent()).hasSize(1);
        verify(newsArticleRepository).findByCategory(NewsCategory.GLOBAL, pageable);
        verify(newsArticleRepository, never()).findAll(any(Pageable.class));
    }

    @Test
    @DisplayName("getNews() → geçersiz kategori → fallback findAll çağrılır")
    void getNews_whenInvalidCategory_shouldFallbackToAll() {
        Page<NewsArticle> mockPage = new PageImpl<>(List.of(sampleArticle), pageable, 1);
        when(newsArticleRepository.findAll(pageable)).thenReturn(mockPage);
        when(reactionsService.getReactionsSummary(anyLong(), anyString())).thenReturn(Map.of());
        when(reactionsService.getUserReaction(any(), anyLong(), anyString())).thenReturn(null);

        Page<NewsArticleResponse> result = newsService.getNews("INVALID_CATEGORY", pageable, null);

        assertThat(result.getTotalElements()).isEqualTo(1);
        verify(newsArticleRepository).findAll(pageable);
        verify(newsArticleRepository, never()).findByCategory(any(), any());
    }

    // ─── getNewsById ────────────────────────────────────────────────────────

    @Test
    @DisplayName("getNewsById() → var olan ID → haber döner")
    void getNewsById_whenFound_shouldReturnArticle() {
        when(newsArticleRepository.findById(1L)).thenReturn(Optional.of(sampleArticle));
        when(reactionsService.getReactionsSummary(anyLong(), anyString())).thenReturn(Map.of("HYPE", 5L));
        when(reactionsService.getUserReaction(anyLong(), anyLong(), anyString())).thenReturn("HYPE");

        NewsArticleResponse result = newsService.getNewsById(1L, 99L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getTitle()).isEqualTo("Test Haber Başlığı");
        assertThat(result.getUserReaction()).isEqualTo("HYPE");
    }

    @Test
    @DisplayName("getNewsById() → olmayan ID → ResourceNotFoundException fırlatılır")
    void getNewsById_whenNotFound_shouldThrowResourceNotFoundException() {
        when(newsArticleRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> newsService.getNewsById(999L, null))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("999");
    }

    @Test
    @DisplayName("getNewsById() → anonim kullanıcı → userReaction null döner")
    void getNewsById_whenAnonymousUser_shouldReturnNullUserReaction() {
        when(newsArticleRepository.findById(1L)).thenReturn(Optional.of(sampleArticle));
        when(reactionsService.getReactionsSummary(anyLong(), anyString())).thenReturn(Map.of());
        when(reactionsService.getUserReaction(isNull(), anyLong(), anyString())).thenReturn(null);

        NewsArticleResponse result = newsService.getNewsById(1L, null);

        assertThat(result.getUserReaction()).isNull();
    }
}
