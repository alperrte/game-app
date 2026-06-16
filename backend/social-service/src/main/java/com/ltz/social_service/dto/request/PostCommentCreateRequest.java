package com.ltz.social_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PostCommentCreateRequest {

    private Long postId;

    private Long userId;

    @NotBlank(message = "Comment content is required")
    @Size(max = 1000, message = "Comment content can be at most 1000 characters")
    private String content;

    private Long parentCommentId;

    private Long replyingToUserId;
}
