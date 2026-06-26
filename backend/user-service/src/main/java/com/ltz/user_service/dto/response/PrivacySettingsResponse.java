package com.ltz.user_service.dto.response;

import com.ltz.user_service.entity.Visibility;
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
    private Visibility profileVisibility;
    private Visibility gameLibraryVisibility;
    private Visibility hardwareVisibility;
    private Visibility friendListVisibility;
    private Visibility followerListVisibility;
    private Visibility lastSeenVisibility;
}

