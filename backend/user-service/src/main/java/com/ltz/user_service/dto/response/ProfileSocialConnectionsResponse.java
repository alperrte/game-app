package com.ltz.user_service.dto.response;

import com.ltz.user_service.dto.client.response.SocialClientResponse;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ProfileSocialConnectionsResponse {
    private List<SocialClientResponse> followers;
    private List<SocialClientResponse> following;
    private List<SocialClientResponse> friends;
}
