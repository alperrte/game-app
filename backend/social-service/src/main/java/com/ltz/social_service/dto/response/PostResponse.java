package com.ltz.social_service.dto.response;

import com.ltz.social_service.enums.PostVisibility;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PostResponse {

    private Long id;
    private Long userId;
    private String content;
    private String imageUrl;
    private PostVisibility visibility;
    private Boolean isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long likeCount;
    private Long commentCount;
}