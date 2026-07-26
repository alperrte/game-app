package com.ltz.content_service.controller;

import com.ltz.content_service.dto.NewsArticleResponse;
import com.ltz.content_service.security.JwtUserPrincipal;
import com.ltz.content_service.service.NewsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/content/news")
@RequiredArgsConstructor
public class NewsController {

    private final NewsService newsService;

    @GetMapping
    public ResponseEntity<Page<NewsArticleResponse>> getNews(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String source,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal JwtUserPrincipal principal) {
        Long currentUserId = (principal != null) ? principal.userId() : null;
        if (size > 100) {
            size = 100;
        } else if (size <= 0) {
            size = 20;
        }
        // Sıralama repository sorgusunun kendi ORDER BY'ında (gerçek yayın tarihi); Pageable'a Sort eklenmez.
        Pageable pageable = PageRequest.of(page, size);
        Page<NewsArticleResponse> news = newsService.getNews(category, source, pageable, currentUserId);
        return ResponseEntity.ok(news);
    }

    @GetMapping("/sources")
    public ResponseEntity<List<String>> getSources() {
        return ResponseEntity.ok(newsService.getAvailableSources());
    }

    @GetMapping("/{id}")
    public ResponseEntity<NewsArticleResponse> getNewsById(
            @PathVariable Long id,
            @AuthenticationPrincipal JwtUserPrincipal principal) {
        Long currentUserId = (principal != null) ? principal.userId() : null;
        NewsArticleResponse article = newsService.getNewsById(id, currentUserId);
        return ResponseEntity.ok(article);
    }
}
