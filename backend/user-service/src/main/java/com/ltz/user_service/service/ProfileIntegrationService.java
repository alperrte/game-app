package com.ltz.user_service.service;

import com.ltz.user_service.client.ReviewServiceClient;
import com.ltz.user_service.client.SocialServiceClient;
import com.ltz.user_service.dto.client.response.ReviewClientResponse;
import com.ltz.user_service.dto.client.response.SocialClientResponse;
import com.ltz.user_service.dto.client.response.SocialPostClientResponse;
import com.ltz.user_service.dto.response.ProfileRelationshipResponse;
import com.ltz.user_service.dto.response.ProfileSocialConnectionsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProfileIntegrationService {

    private final ReviewServiceClient reviewServiceClient;
    private final SocialServiceClient socialServiceClient;

    public List<ReviewClientResponse> getReviews(Long userId) {
        return reviewServiceClient.getReviewsByUserId(userId);
    }

    public List<SocialPostClientResponse> getPosts(Long userId) {
        return socialServiceClient.getPostsByUserId(userId);
    }

    public ProfileSocialConnectionsResponse getSocialConnections(Long userId) {
        return ProfileSocialConnectionsResponse.builder()
                .followers(socialServiceClient.getFollowersByUserId(userId))
                .following(socialServiceClient.getFollowingByUserId(userId))
                .friends(socialServiceClient.getFriendsByUserId(userId))
                .build();
    }

    public ProfileRelationshipResponse getRelationship(Long viewerUserId, Long targetUserId) {
        List<SocialClientResponse> following = socialServiceClient.getFollowingByUserId(viewerUserId);
        List<SocialClientResponse> friends = socialServiceClient.getFriendsByUserId(viewerUserId);
        List<SocialClientResponse> incoming = socialServiceClient.getIncomingFriendRequests(viewerUserId);
        List<SocialClientResponse> outgoing = socialServiceClient.getOutgoingFriendRequests(viewerUserId);
        List<SocialClientResponse> blocked = socialServiceClient.getBlockedUsers(viewerUserId);

        return ProfileRelationshipResponse.builder()
                .following(following.stream().anyMatch(item -> targetUserId.equals(item.getFollowingUserId())))
                .friend(friends.stream().anyMatch(item -> targetUserId.equals(item.getFriendUserId())))
                .incomingRequestFromTarget(incoming.stream()
                        .anyMatch(item -> targetUserId.equals(item.getSenderUserId())))
                .outgoingRequestToTarget(outgoing.stream()
                        .anyMatch(item -> targetUserId.equals(item.getReceiverUserId())))
                .blockedByMe(blocked.stream().anyMatch(item -> targetUserId.equals(item.getBlockedUserId())))
                .build();
    }
}
