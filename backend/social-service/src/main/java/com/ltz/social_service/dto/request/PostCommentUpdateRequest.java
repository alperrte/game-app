package com.ltz.social_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PostCommentUpdateRequest {

    @NotBlank(message = "Comment content is required")
    @Size(max = 1000, message = "Comment can be at most 1000 characters")
    private String content;
}
