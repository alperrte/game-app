package com.ltz.social_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class LookingForPlayerPostCreateRequest {

    @NotNull(message = "User id is required")
    private Long userId;

    @NotNull(message = "Game id is required")
    private Long gameId;

    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title can be at most 150 characters")
    private String title;

    @Size(max = 1000, message = "Description can be at most 1000 characters")
    private String description;

    @NotBlank(message = "Platform is required")
    @Size(max = 50, message = "Platform can be at most 50 characters")
    private String platform;

    @Size(max = 100, message = "Preferred role can be at most 100 characters")
    private String preferredRole;

    @Size(max = 50, message = "Player level can be at most 50 characters")
    private String playerLevel;

    private Boolean microphoneRequired;

    private LocalDateTime playTime;
}