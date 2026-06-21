package com.ltz.user_service.client;

import com.ltz.user_service.dto.client.response.SocialClientResponse;
import com.ltz.user_service.dto.client.response.SocialPostClientResponse;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import org.springframework.beans.factory.annotation.Qualifier;
import java.util.List;

@Component
public class SocialServiceClient {

    private final RestClient socialServiceRestClient;

    public SocialServiceClient(@Qualifier("socialServiceRestClient") RestClient socialServiceRestClient) {
        this.socialServiceRestClient = socialServiceRestClient;
    }

    private String getAuthorizationHeader() {
        try {
            org.springframework.web.context.request.RequestAttributes attribs = org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attribs instanceof org.springframework.web.context.request.ServletRequestAttributes) {
                jakarta.servlet.http.HttpServletRequest request = ((org.springframework.web.context.request.ServletRequestAttributes) attribs).getRequest();
                return request.getHeader("Authorization");
            }
        } catch (Exception e) {
            // Ignore
        }
        return null;
    }

    /*
     * Kullanıcının arkadaşlarını social-service'ten çeker.
     */
    public List<SocialClientResponse> getFriendsByUserId(Long userId) {
        try {
            var spec = socialServiceRestClient.get()
                    .uri("/api/social/users/{userId}/friends", userId);
            String authHeader = getAuthorizationHeader();
            if (authHeader != null) {
                spec = spec.header("Authorization", authHeader);
            }
            return spec.retrieve()
                    .body(new ParameterizedTypeReference<List<SocialClientResponse>>() {
                    });
        } catch (Exception e) {
            return List.of();
        }
    }

    /*
     * Kullanıcının takipçilerini social-service'ten çeker.
     */
    public List<SocialClientResponse> getFollowersByUserId(Long userId) {
        try {
            var spec = socialServiceRestClient.get()
                    .uri("/api/social/users/{userId}/followers", userId);
            String authHeader = getAuthorizationHeader();
            if (authHeader != null) {
                spec = spec.header("Authorization", authHeader);
            }
            return spec.retrieve()
                    .body(new ParameterizedTypeReference<List<SocialClientResponse>>() {
                    });
        } catch (Exception e) {
            return List.of();
        }
    }

    /*
     * Kullanıcının takip ettiklerini social-service'ten çeker.
     */
    public List<SocialClientResponse> getFollowingByUserId(Long userId) {
        try {
            var spec = socialServiceRestClient.get()
                    .uri("/api/social/users/{userId}/following", userId);
            String authHeader = getAuthorizationHeader();
            if (authHeader != null) {
                spec = spec.header("Authorization", authHeader);
            }
            return spec.retrieve()
                    .body(new ParameterizedTypeReference<List<SocialClientResponse>>() {
                    });
        } catch (Exception e) {
            return List.of();
        }
    }

    /*
     * Kullanıcının duvarındaki gönderileri (posts) social-service'ten çeker.
     */
    public List<SocialPostClientResponse> getPostsByUserId(Long userId) {
        try {
            var spec = socialServiceRestClient.get()
                    .uri("/api/social/users/{userId}/posts", userId);
            String authHeader = getAuthorizationHeader();
            if (authHeader != null) {
                spec = spec.header("Authorization", authHeader);
            }
            return spec.retrieve()
                    .body(new ParameterizedTypeReference<List<SocialPostClientResponse>>() {
                    });
        } catch (Exception e) {
            return List.of();
        }
    }
}
