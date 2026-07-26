package com.ltz.content_service.service;

import com.ltz.content_service.exception.ResourceNotFoundException;
import com.ltz.content_service.dto.NewsArticleResponse;
import com.ltz.content_service.entity.NewsArticle;
import com.ltz.content_service.enums.NewsCategory;
import com.ltz.content_service.repository.NewsArticleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NewsService {

    private final NewsArticleRepository newsArticleRepository;
    private final NewsQueryCache newsQueryCache;
    private final ReactionsService reactionsService;

    public Page<NewsArticleResponse> getNews(String category, String source, Pageable pageable, Long currentUserId) {
        NewsCategory newsCategory = null;
        if (category != null && !category.isBlank()) {
            try {
                newsCategory = NewsCategory.valueOf(category.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid news category requested: {}, ignoring filter", category);
            }
        }

        String sourceName = (source != null && !source.isBlank()) ? source : null;

        Page<NewsArticle> articles = newsQueryCache.search(newsCategory, sourceName, pageable);
        return articles.map(article -> mapToResponse(article, currentUserId));
    }

    public List<String> getAvailableSources() {
        return newsArticleRepository.findDistinctSourceNames();
    }

    public NewsArticleResponse getNewsById(Long id, Long currentUserId) {
        NewsArticle article = newsArticleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("News article not found with id: " + id));
        return mapToResponse(article, currentUserId);
    }

    private NewsArticleResponse mapToResponse(NewsArticle article, Long currentUserId) {
        return NewsArticleResponse.builder()
                .id(article.getId())
                .title(article.getTitle())
                .summary(article.getSummary())
                .contentUrl(article.getContentUrl())
                .imageUrl(article.getImageUrl())
                .sourceName(article.getSourceName())
                .category(article.getCategory())
                // response "createdAt" gösterir gerçek yayın tarihini (RSS pubDate), ingestion zamanını değil
                .createdAt(article.getPublishedAt() != null ? article.getPublishedAt() : article.getCreatedAt())
                .reactions(reactionsService.getReactionsSummary(article.getId(), "NEWS"))
                .userReaction(reactionsService.getUserReaction(currentUserId, article.getId(), "NEWS"))
                .build();
    }
}
