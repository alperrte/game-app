package com.ltz.user_service.dto.request;

import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class PrivacySettingsRequest {

    @Pattern(regexp = "PUBLIC|FRIENDS_ONLY|PRIVATE", message = "Visibility must be PUBLIC, FRIENDS_ONLY, or PRIVATE")
    private String profileVisibility;

    @Pattern(regexp = "PUBLIC|FRIENDS_ONLY|PRIVATE", message = "Visibility must be PUBLIC, FRIENDS_ONLY, or PRIVATE")
    private String gameLibraryVisibility;

    @Pattern(regexp = "PUBLIC|FRIENDS_ONLY|PRIVATE", message = "Visibility must be PUBLIC, FRIENDS_ONLY, or PRIVATE")
    private String hardwareVisibility;

    @Pattern(regexp = "PUBLIC|FRIENDS_ONLY|PRIVATE", message = "Visibility must be PUBLIC, FRIENDS_ONLY, or PRIVATE")
    private String friendListVisibility;

    @Pattern(regexp = "PUBLIC|FRIENDS_ONLY|PRIVATE", message = "Visibility must be PUBLIC, FRIENDS_ONLY, or PRIVATE")
    private String followerListVisibility;

    @Pattern(regexp = "PUBLIC|FRIENDS_ONLY|PRIVATE", message = "Visibility must be PUBLIC, FRIENDS_ONLY, or PRIVATE")
    private String lastSeenVisibility;
}
