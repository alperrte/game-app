package com.ltz.content_service.repository;

import com.ltz.content_service.model.entity.NewsArticle;
import com.ltz.content_service.model.enums.NewsCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NewsArticleRepository extends JpaRepository<NewsArticle, Long> {
    Page<NewsArticle> findByCategory(NewsCategory category, Pageable pageable);
    boolean existsByContentUrl(String contentUrl);

    @org.springframework.transaction.annotation.Transactional
    void deleteByCreatedAtBefore(java.time.LocalDateTime dateTime);
}
