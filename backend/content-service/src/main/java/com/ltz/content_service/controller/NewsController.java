package com.ltz.content_service.controller;

import com.ltz.content_service.model.dto.NewsArticleResponse;
import com.ltz.content_service.security.JwtUserPrincipal;
import com.ltz.content_service.service.NewsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        Long currentUserId = (principal != null) ? principal.userId() : null;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<NewsArticleResponse> news = newsService.getNews(category, pageable, currentUserId);
        return ResponseEntity.ok(news);
    }

    @GetMapping("/{id}")
    public ResponseEntity<NewsArticleResponse> getNewsById(
            @PathVariable Long id,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        Long currentUserId = (principal != null) ? principal.userId() : null;
        NewsArticleResponse article = newsService.getNewsById(id, currentUserId);
        return ResponseEntity.ok(article);
    }
}
