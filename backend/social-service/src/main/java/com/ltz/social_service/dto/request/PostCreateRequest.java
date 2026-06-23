package com.ltz.social_service.dto.request;

import com.ltz.social_service.enums.PostVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PostCreateRequest {

    private Long userId;

    private Long communityId;

    @NotBlank(message = "Post content is required")
    @Size(max = 2000, message = "Post content can be at most 2000 characters")
    private String content;

    @Size(max = 500, message = "Image url can be at most 500 characters")
    private String imageUrl;

    @Size(max = 3, message = "A post can include at most 3 media files")
    private List<@Size(max = 500, message = "Media url can be at most 500 characters") String> mediaUrls;

    private PostVisibility visibility;

    @Valid
    private PostPollCreateRequest poll;
}
