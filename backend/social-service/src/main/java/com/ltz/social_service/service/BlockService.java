package com.ltz.social_service.service;

import com.ltz.social_service.dto.request.BlockUserRequest;
import com.ltz.social_service.dto.response.UserBlockResponse;
import com.ltz.social_service.entity.UserBlock;
import com.ltz.social_service.repository.FollowRepository;
import com.ltz.social_service.repository.FriendshipRepository;
import com.ltz.social_service.repository.UserBlockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BlockService {

    private final UserBlockRepository userBlockRepository;
    private final FriendshipRepository friendshipRepository;
    private final FollowRepository followRepository;

    public UserBlockResponse blockUser(BlockUserRequest request) {
        Long blockerUserId = request.getBlockerUserId();
        Long blockedUserId = request.getBlockedUserId();

        validateDifferentUsers(blockerUserId, blockedUserId);

        if (userBlockRepository.existsByBlockerUserIdAndBlockedUserId(blockerUserId, blockedUserId)) {
            throw new IllegalStateException("User is already blocked");
        }

        friendshipRepository.deleteByUserIdAndFriendUserId(blockerUserId, blockedUserId);
        friendshipRepository.deleteByUserIdAndFriendUserId(blockedUserId, blockerUserId);

        if (followRepository.existsByFollowerUserIdAndFollowingUserId(blockerUserId, blockedUserId)) {
            followRepository.deleteByFollowerUserIdAndFollowingUserId(blockerUserId, blockedUserId);
        }

        if (followRepository.existsByFollowerUserIdAndFollowingUserId(blockedUserId, blockerUserId)) {
            followRepository.deleteByFollowerUserIdAndFollowingUserId(blockedUserId, blockerUserId);
        }

        UserBlock userBlock = UserBlock.builder()
                .blockerUserId(blockerUserId)
                .blockedUserId(blockedUserId)
                .build();

        return toUserBlockResponse(userBlockRepository.save(userBlock));
    }

    public void unblockUser(Long blockerUserId, Long blockedUserId) {
        validateDifferentUsers(blockerUserId, blockedUserId);

        if (!userBlockRepository.existsByBlockerUserIdAndBlockedUserId(blockerUserId, blockedUserId)) {
            throw new IllegalStateException("Block relation does not exist");
        }

        userBlockRepository.deleteByBlockerUserIdAndBlockedUserId(blockerUserId, blockedUserId);
    }

    @Transactional(readOnly = true)
    public List<UserBlockResponse> getBlockedUsers(Long blockerUserId) {
        return userBlockRepository.findByBlockerUserId(blockerUserId)
                .stream()
                .map(this::toUserBlockResponse)
                .toList();
    }

    private void validateDifferentUsers(Long firstUserId, Long secondUserId) {
        if (firstUserId.equals(secondUserId)) {
            throw new IllegalArgumentException("User cannot perform this action on themselves");
        }
    }

    private UserBlockResponse toUserBlockResponse(UserBlock userBlock) {
        return UserBlockResponse.builder()
                .id(userBlock.getId())
                .blockerUserId(userBlock.getBlockerUserId())
                .blockedUserId(userBlock.getBlockedUserId())
                .createdAt(userBlock.getCreatedAt())
                .build();
    }
}