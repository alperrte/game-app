package com.ltz.content_service.repository;

import com.ltz.content_service.entity.NewsArticle;
import com.ltz.content_service.enums.NewsCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NewsArticleRepository extends JpaRepository<NewsArticle, Long> {
    Page<NewsArticle> findByCategory(NewsCategory category, Pageable pageable);

    boolean existsByContentUrl(String contentUrl);

    @org.springframework.transaction.annotation.Transactional
    void deleteByCreatedAtBefore(java.time.LocalDateTime dateTime);

    @Query("SELECT n FROM NewsArticle n WHERE " +
            "(:category IS NULL OR n.category = :category) AND " +
            "(:sourceName IS NULL OR n.sourceName = :sourceName) " +
            "ORDER BY COALESCE(n.publishedAt, n.createdAt) DESC")
    Page<NewsArticle> search(
            @Param("category") NewsCategory category,
            @Param("sourceName") String sourceName,
            Pageable pageable);

    @Query("SELECT DISTINCT n.sourceName FROM NewsArticle n ORDER BY n.sourceName")
    List<String> findDistinctSourceNames();
}
