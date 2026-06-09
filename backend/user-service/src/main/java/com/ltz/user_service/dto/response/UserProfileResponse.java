package com.ltz.user_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileResponse {
    private String userId;
    private String username;
    private String email;
    private String displayName;
    private String bio;
    private String avatarUrl;
    private String coverUrl;
    private String gamerType;
    private String favoriteCategories;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
