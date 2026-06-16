package com.ltz.social_service.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PostCommentResponse {

    private Long id;
    private Long postId;
    private Long userId;
    private Long parentCommentId;
    private Long replyingToUserId;
    private String content;
    private Boolean isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long likeCount;
    private Boolean likedByCurrentUser;
}