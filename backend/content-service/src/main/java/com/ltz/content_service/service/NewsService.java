package com.ltz.content_service.service;

import com.ltz.content_service.exception.ResourceNotFoundException;
import com.ltz.content_service.model.dto.NewsArticleResponse;
import com.ltz.content_service.model.entity.NewsArticle;
import com.ltz.content_service.model.enums.NewsCategory;
import com.ltz.content_service.repository.NewsArticleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NewsService {

    private final NewsArticleRepository newsArticleRepository;
    private final ReactionsService reactionsService;

    public Page<NewsArticleResponse> getNews(String category, Pageable pageable, Long currentUserId) {
        Page<NewsArticle> articles;
        if (category != null && !category.isBlank()) {
            try {
                NewsCategory newsCategory = NewsCategory.valueOf(category.toUpperCase());
                articles = newsArticleRepository.findByCategory(newsCategory, pageable);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid news category requested: {}, falling back to all", category);
                articles = newsArticleRepository.findAll(pageable);
            }
        } else {
            articles = newsArticleRepository.findAll(pageable);
        }

        return articles.map(article -> mapToResponse(article, currentUserId));
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
                .createdAt(article.getCreatedAt())
                .reactions(reactionsService.getReactionsSummary(article.getId(), "NEWS"))
                .userReaction(reactionsService.getUserReaction(currentUserId, article.getId(), "NEWS"))
                .build();
    }
}
