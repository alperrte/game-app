package com.ltz.user_service.client;

import com.ltz.user_service.dto.client.response.SocialClientResponse;
import com.ltz.user_service.dto.client.response.SocialPostClientResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

@Component
public class SocialServiceClient {

    private final RestClient socialServiceRestClient;

    public SocialServiceClient(@Qualifier("socialServiceRestClient") RestClient socialServiceRestClient) {
        this.socialServiceRestClient = socialServiceRestClient;
    }

    public List<SocialClientResponse> getFriendsByUserId(Long userId) {
        return getList("/api/social/users/{userId}/friends", userId);
    }

    public List<SocialClientResponse> getFollowersByUserId(Long userId) {
        return getList("/api/social/users/{userId}/followers", userId);
    }

    public List<SocialClientResponse> getFollowingByUserId(Long userId) {
        return getList("/api/social/users/{userId}/following", userId);
    }

    public List<SocialClientResponse> getIncomingFriendRequests(Long userId) {
        return getList("/api/social/users/{userId}/friend-requests/incoming", userId);
    }

    public List<SocialClientResponse> getOutgoingFriendRequests(Long userId) {
        return getList("/api/social/users/{userId}/friend-requests/outgoing", userId);
    }

    public List<SocialClientResponse> getBlockedUsers(Long userId) {
        return getList("/api/social/users/{userId}/blocks", userId);
    }

    public List<SocialPostClientResponse> getPostsByUserId(Long userId) {
        List<SocialPostClientResponse> response = socialServiceRestClient.get()
                .uri("/api/social/users/{userId}/posts", userId)
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});
        return response == null ? List.of() : response;
    }

    private List<SocialClientResponse> getList(String uri, Long userId) {
        List<SocialClientResponse> response = socialServiceRestClient.get()
                .uri(uri, userId)
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});
        return response == null ? List.of() : response;
    }
}
