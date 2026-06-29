package com.ltz.user_service.dto.request;

import com.ltz.user_service.entity.Visibility;
import lombok.Data;

@Data
public class PrivacySettingsRequest {

    private Visibility profileVisibility;

    private Visibility gameLibraryVisibility;

    private Visibility hardwareVisibility;

    private Visibility friendListVisibility;

    private Visibility followerListVisibility;

    private Visibility lastSeenVisibility;
}

