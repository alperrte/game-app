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
import java.util.concurrent.CompletableFuture;

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
        CompletableFuture<List<SocialClientResponse>> followersFuture = CompletableFuture.supplyAsync(
                () -> socialServiceClient.getFollowersByUserId(userId));
        CompletableFuture<List<SocialClientResponse>> followingFuture = CompletableFuture.supplyAsync(
                () -> socialServiceClient.getFollowingByUserId(userId));
        CompletableFuture<List<SocialClientResponse>> friendsFuture = CompletableFuture.supplyAsync(
                () -> socialServiceClient.getFriendsByUserId(userId));

        try {
            CompletableFuture.allOf(followersFuture, followingFuture, friendsFuture).join();
            return ProfileSocialConnectionsResponse.builder()
                    .followers(followersFuture.get())
                    .following(followingFuture.get())
                    .friends(friendsFuture.get())
                    .build();
        } catch (Exception e) {
            return ProfileSocialConnectionsResponse.builder()
                    .followers(List.of())
                    .following(List.of())
                    .friends(List.of())
                    .build();
        }
    }

    public ProfileRelationshipResponse getRelationship(Long viewerUserId, Long targetUserId) {
        CompletableFuture<List<SocialClientResponse>> followingFuture = CompletableFuture.supplyAsync(
                () -> socialServiceClient.getFollowingByUserId(viewerUserId));
        CompletableFuture<List<SocialClientResponse>> friendsFuture = CompletableFuture.supplyAsync(
                () -> socialServiceClient.getFriendsByUserId(viewerUserId));
        CompletableFuture<List<SocialClientResponse>> incomingFuture = CompletableFuture.supplyAsync(
                () -> socialServiceClient.getIncomingFriendRequests(viewerUserId));
        CompletableFuture<List<SocialClientResponse>> outgoingFuture = CompletableFuture.supplyAsync(
                () -> socialServiceClient.getOutgoingFriendRequests(viewerUserId));
        CompletableFuture<List<SocialClientResponse>> blockedFuture = CompletableFuture.supplyAsync(
                () -> socialServiceClient.getBlockedUsers(viewerUserId));

        try {
            CompletableFuture.allOf(followingFuture, friendsFuture, incomingFuture, outgoingFuture, blockedFuture).join();
            
            List<SocialClientResponse> following = followingFuture.get();
            List<SocialClientResponse> friends = friendsFuture.get();
            List<SocialClientResponse> incoming = incomingFuture.get();
            List<SocialClientResponse> outgoing = outgoingFuture.get();
            List<SocialClientResponse> blocked = blockedFuture.get();

            return ProfileRelationshipResponse.builder()
                    .following(following.stream().anyMatch(item -> targetUserId.equals(item.getFollowingUserId())))
                    .friend(friends.stream().anyMatch(item -> targetUserId.equals(item.getFriendUserId())))
                    .incomingRequestFromTarget(incoming.stream()
                            .anyMatch(item -> targetUserId.equals(item.getSenderUserId())))
                    .outgoingRequestToTarget(outgoing.stream()
                            .anyMatch(item -> targetUserId.equals(item.getReceiverUserId())))
                    .blockedByMe(blocked.stream().anyMatch(item -> targetUserId.equals(item.getBlockedUserId())))
                    .build();
        } catch (Exception e) {
            return ProfileRelationshipResponse.builder()
                    .following(false)
                    .friend(false)
                    .incomingRequestFromTarget(false)
                    .outgoingRequestToTarget(false)
                    .blockedByMe(false)
                    .build();
        }
    }
}
