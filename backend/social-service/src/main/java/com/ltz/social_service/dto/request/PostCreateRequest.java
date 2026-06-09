package com.ltz.social_service.dto.request;

import com.ltz.social_service.enums.PostVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PostCreateRequest {

    @NotNull(message = "User id is required")
    private Long userId;

    @NotBlank(message = "Post content is required")
    @Size(max = 2000, message = "Post content can be at most 2000 characters")
    private String content;

    @Size(max = 500, message = "Image url can be at most 500 characters")
    private String imageUrl;

    private PostVisibility visibility;
}