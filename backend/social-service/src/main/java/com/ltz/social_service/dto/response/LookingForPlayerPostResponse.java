package com.ltz.social_service.dto.response;

import com.ltz.social_service.enums.LookingForPlayerStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class LookingForPlayerPostResponse {

    private Long id;
    private Long userId;
    private Long gameId;
    private String title;
    private String description;
    private String platform;
    private String preferredRole;
    private String playerLevel;
    private Boolean microphoneRequired;
    private LocalDateTime playTime;
    private LookingForPlayerStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}