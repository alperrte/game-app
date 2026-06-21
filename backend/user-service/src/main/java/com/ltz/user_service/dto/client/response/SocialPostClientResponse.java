package com.ltz.user_service.dto.client.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SocialPostClientResponse {
    private Long id;
    private Long userId;
    private String content;
    private String imageUrl;
    private String mediaType;
    private String visibility;
    private boolean isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int likeCount;
    private int commentCount;
    private Boolean likedByCurrentUser;
}
