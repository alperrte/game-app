package com.ltz.content_service.service;

import com.ltz.content_service.entity.NewsArticle;
import com.ltz.content_service.enums.NewsCategory;
import com.ltz.content_service.repository.NewsArticleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

/**
 * Reaksiyon zenginleştirmesinden önceki temel makale sorgusunu cache'ler.
 * Kullanıcıya özgü veriyi (reactions/userReaction) hiç görmediği için tüm kullanıcılar
 * arasında güvenle paylaşılabilir. Ayrı bean: @Cacheable self-invocation ile atlanmasın diye.
 */
@Service
@RequiredArgsConstructor
public class NewsQueryCache {

    private final NewsArticleRepository newsArticleRepository;

    @Cacheable(value = "news", key = "(#category != null ? #category.name() : 'ALL') + '-' + " +
            "(#source != null ? #source : 'ALL') + '-' + #pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<NewsArticle> search(NewsCategory category, String source, Pageable pageable) {
        return newsArticleRepository.search(category, source, pageable);
    }
}
