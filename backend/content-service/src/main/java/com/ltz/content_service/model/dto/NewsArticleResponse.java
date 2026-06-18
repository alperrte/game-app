package com.ltz.content_service.model.dto;

import com.ltz.content_service.model.enums.NewsCategory;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
public class NewsArticleResponse {
    private Long id;
    private String title;
    private String summary;
    private String contentUrl;
    private String imageUrl;
    private String sourceName;
    private NewsCategory category;
    private LocalDateTime createdAt;
    private Map<String, Long> reactions;
    private String userReaction;
}
