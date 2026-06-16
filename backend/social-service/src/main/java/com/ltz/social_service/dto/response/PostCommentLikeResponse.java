package com.ltz.social_service.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PostCommentLikeResponse {

    private Long id;
    private Long commentId;
    private Long userId;
    private LocalDateTime createdAt;
}
