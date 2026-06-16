package com.ltz.social_service.service;

import com.ltz.social_service.dto.request.FollowCreateRequest;
import com.ltz.social_service.dto.response.FollowResponse;
import com.ltz.social_service.entity.Follow;
import com.ltz.social_service.repository.FollowRepository;
import com.ltz.social_service.repository.UserBlockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class FollowService {

    private final FollowRepository followRepository;
    private final UserBlockRepository userBlockRepository;

    public FollowResponse followUser(FollowCreateRequest request) {
        Long followerUserId = request.getFollowerUserId();
        Long followingUserId = request.getFollowingUserId();

        validateDifferentUsers(followerUserId, followingUserId);

        var existingFollow = followRepository.findByFollowerUserIdAndFollowingUserId(
                followerUserId,
                followingUserId
        );

        if (existingFollow.isPresent()) {
            return toFollowResponse(existingFollow.get());
        }

        if (isBlockedBetweenUsers(followerUserId, followingUserId)) {
            throw new IllegalStateException("Follow action cannot be completed because one of the users blocked the other");
        }

        Follow follow = Follow.builder()
                .followerUserId(followerUserId)
                .followingUserId(followingUserId)
                .build();

        return toFollowResponse(followRepository.save(follow));
    }

    public void unfollowUser(Long followerUserId, Long followingUserId) {
        validateDifferentUsers(followerUserId, followingUserId);

        if (!followRepository.existsByFollowerUserIdAndFollowingUserId(followerUserId, followingUserId)) {
            return;
        }

        followRepository.deleteByFollowerUserIdAndFollowingUserId(followerUserId, followingUserId);
    }

    @Transactional(readOnly = true)
    public List<FollowResponse> getFollowing(Long userId) {
        return followRepository.findByFollowerUserId(userId)
                .stream()
                .map(this::toFollowResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FollowResponse> getFollowers(Long userId) {
        return followRepository.findByFollowingUserId(userId)
                .stream()
                .map(this::toFollowResponse)
                .toList();
    }

    private boolean isBlockedBetweenUsers(Long firstUserId, Long secondUserId) {
        return userBlockRepository.existsByBlockerUserIdAndBlockedUserId(firstUserId, secondUserId)
                || userBlockRepository.existsByBlockerUserIdAndBlockedUserId(secondUserId, firstUserId);
    }

    private void validateDifferentUsers(Long firstUserId, Long secondUserId) {
        if (firstUserId.equals(secondUserId)) {
            throw new IllegalArgumentException("User cannot perform this action on themselves");
        }
    }

    private FollowResponse toFollowResponse(Follow follow) {
        return FollowResponse.builder()
                .id(follow.getId())
                .followerUserId(follow.getFollowerUserId())
                .followingUserId(follow.getFollowingUserId())
                .createdAt(follow.getCreatedAt())
                .build();
    }
}
