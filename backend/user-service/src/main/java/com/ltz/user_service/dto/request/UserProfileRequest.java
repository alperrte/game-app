package com.ltz.user_service.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserProfileRequest {

    @Size(max = 100, message = "Display name cannot exceed 100 characters")
    private String displayName;

    @Size(max = 1000, message = "Bio cannot exceed 1000 characters")
    private String bio;

    private String avatarUrl;

    private String coverUrl;

    @Size(max = 50, message = "Gamer type cannot exceed 50 characters")
    private String gamerType;

    private String favoriteCategories;

    @Size(max = 255, message = "Profile theme URL cannot exceed 255 characters")
    private String profileThemeUrl;

    @Size(max = 255, message = "Profile background URL cannot exceed 255 characters")
    private String profileBackgroundUrl;

    @Size(max = 255, message = "Profile music URL cannot exceed 255 characters")
    private String profileMusicUrl;

    @Size(max = 100, message = "Hardware CPU cannot exceed 100 characters")
    private String hardwareCpu;

    @Size(max = 100, message = "Hardware GPU cannot exceed 100 characters")
    private String hardwareGpu;

    @Size(max = 100, message = "Hardware RAM cannot exceed 100 characters")
    private String hardwareRam;

    @Size(max = 100, message = "Hardware OS cannot exceed 100 characters")
    private String hardwareOs;
}
