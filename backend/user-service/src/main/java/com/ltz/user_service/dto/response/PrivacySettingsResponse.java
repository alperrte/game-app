package com.ltz.user_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrivacySettingsResponse {
    private String userId;
    private String profileVisibility;
    private String gameLibraryVisibility;
    private String hardwareVisibility;
    private String friendListVisibility;
    private String followerListVisibility;
    private String lastSeenVisibility;
}
