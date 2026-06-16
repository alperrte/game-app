package com.ltz.social_service.service;

import com.ltz.social_service.dto.request.FriendRequestCreateRequest;
import com.ltz.social_service.dto.response.FriendRequestResponse;
import com.ltz.social_service.dto.response.FriendshipResponse;
import com.ltz.social_service.entity.FriendRequest;
import com.ltz.social_service.entity.Friendship;
import com.ltz.social_service.enums.FriendRequestStatus;
import com.ltz.social_service.repository.FriendRequestRepository;
import com.ltz.social_service.repository.FriendshipRepository;
import com.ltz.social_service.repository.UserBlockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class FriendService {

    private final FriendRequestRepository friendRequestRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserBlockRepository userBlockRepository;

    public FriendRequestResponse sendFriendRequest(FriendRequestCreateRequest request) {
        Long senderUserId = request.getSenderUserId();
        Long receiverUserId = request.getReceiverUserId();

        validateDifferentUsers(senderUserId, receiverUserId);

        if (friendshipRepository.existsByUserIdAndFriendUserId(senderUserId, receiverUserId)) {
            throw new IllegalStateException("Users are already friends");
        }

        FriendRequest existingFriendRequest = friendRequestRepository
                .findBySenderUserIdAndReceiverUserId(senderUserId, receiverUserId)
                .orElse(null);

        if (existingFriendRequest != null) {
            if (existingFriendRequest.getStatus() == FriendRequestStatus.PENDING) {
                throw new IllegalStateException("Friend request already exists");
            }

            existingFriendRequest.setStatus(FriendRequestStatus.PENDING);
            return toFriendRequestResponse(friendRequestRepository.save(existingFriendRequest));
        }

        if (friendRequestRepository.existsBySenderUserIdAndReceiverUserIdAndStatus(
                receiverUserId,
                senderUserId,
                FriendRequestStatus.PENDING
        )) {
            throw new IllegalStateException("There is already a reverse friend request");
        }

        if (isBlockedBetweenUsers(senderUserId, receiverUserId)) {
            throw new IllegalStateException("Friend request cannot be sent because one of the users blocked the other");
        }

        FriendRequest friendRequest = FriendRequest.builder()
                .senderUserId(senderUserId)
                .receiverUserId(receiverUserId)
                .status(FriendRequestStatus.PENDING)
                .build();

        FriendRequest savedFriendRequest = friendRequestRepository.save(friendRequest);

        return toFriendRequestResponse(savedFriendRequest);
    }

    public FriendRequestResponse acceptFriendRequest(Long requestId, Long currentUserId) {
        FriendRequest friendRequest = getFriendRequestById(requestId);

        if (!friendRequest.getReceiverUserId().equals(currentUserId)) {
            throw new IllegalStateException("Only the receiver can accept this friend request");
        }

        if (friendRequest.getStatus() != FriendRequestStatus.PENDING) {
            throw new IllegalStateException("Only pending friend requests can be accepted");
        }

        Long senderUserId = friendRequest.getSenderUserId();
        Long receiverUserId = friendRequest.getReceiverUserId();

        if (isBlockedBetweenUsers(senderUserId, receiverUserId)) {
            throw new IllegalStateException("Friend request cannot be accepted because one of the users blocked the other");
        }

        if (!friendshipRepository.existsByUserIdAndFriendUserId(senderUserId, receiverUserId)) {
            friendshipRepository.save(
                    Friendship.builder()
                            .userId(senderUserId)
                            .friendUserId(receiverUserId)
                            .build()
            );
        }

        if (!friendshipRepository.existsByUserIdAndFriendUserId(receiverUserId, senderUserId)) {
            friendshipRepository.save(
                    Friendship.builder()
                            .userId(receiverUserId)
                            .friendUserId(senderUserId)
                            .build()
            );
        }

        friendRequest.setStatus(FriendRequestStatus.ACCEPTED);

        return toFriendRequestResponse(friendRequestRepository.save(friendRequest));
    }

    public FriendRequestResponse rejectFriendRequest(Long requestId, Long currentUserId) {
        FriendRequest friendRequest = getFriendRequestById(requestId);

        if (!friendRequest.getReceiverUserId().equals(currentUserId)) {
            throw new IllegalStateException("Only the receiver can reject this friend request");
        }

        if (friendRequest.getStatus() != FriendRequestStatus.PENDING) {
            throw new IllegalStateException("Only pending friend requests can be rejected");
        }

        friendRequest.setStatus(FriendRequestStatus.REJECTED);

        return toFriendRequestResponse(friendRequestRepository.save(friendRequest));
    }

    public FriendRequestResponse cancelFriendRequest(Long requestId, Long currentUserId) {
        FriendRequest friendRequest = getFriendRequestById(requestId);

        if (!friendRequest.getSenderUserId().equals(currentUserId)) {
            throw new IllegalStateException("Only the sender can cancel this friend request");
        }

        if (friendRequest.getStatus() != FriendRequestStatus.PENDING) {
            throw new IllegalStateException("Only pending friend requests can be cancelled");
        }

        friendRequest.setStatus(FriendRequestStatus.CANCELLED);

        return toFriendRequestResponse(friendRequestRepository.save(friendRequest));
    }

    @Transactional(readOnly = true)
    public List<FriendRequestResponse> getIncomingPendingRequests(Long userId, Long currentUserId) {
        validateSameUser(userId, currentUserId);

        return friendRequestRepository
                .findByReceiverUserIdAndStatus(userId, FriendRequestStatus.PENDING)
                .stream()
                .map(this::toFriendRequestResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FriendRequestResponse> getOutgoingPendingRequests(Long userId, Long currentUserId) {
        validateSameUser(userId, currentUserId);

        return friendRequestRepository
                .findBySenderUserIdAndStatus(userId, FriendRequestStatus.PENDING)
                .stream()
                .map(this::toFriendRequestResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FriendshipResponse> getFriends(Long userId) {
        return friendshipRepository.findByUserId(userId)
                .stream()
                .map(this::toFriendshipResponse)
                .toList();
    }

    public void removeFriend(Long userId, Long friendUserId) {
        validateDifferentUsers(userId, friendUserId);

        if (!friendshipRepository.existsByUserIdAndFriendUserId(userId, friendUserId)) {
            throw new IllegalStateException("Friendship does not exist");
        }

        friendshipRepository.deleteByUserIdAndFriendUserId(userId, friendUserId);
        friendshipRepository.deleteByUserIdAndFriendUserId(friendUserId, userId);
    }

    private FriendRequest getFriendRequestById(Long requestId) {
        return friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Friend request not found"));
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

    private void validateSameUser(Long requestedUserId, Long currentUserId) {
        if (!requestedUserId.equals(currentUserId)) {
            throw new IllegalStateException("User can only access their own friend requests");
        }
    }

    private FriendRequestResponse toFriendRequestResponse(FriendRequest friendRequest) {
        return FriendRequestResponse.builder()
                .id(friendRequest.getId())
                .senderUserId(friendRequest.getSenderUserId())
                .receiverUserId(friendRequest.getReceiverUserId())
                .status(friendRequest.getStatus())
                .createdAt(friendRequest.getCreatedAt())
                .updatedAt(friendRequest.getUpdatedAt())
                .build();
    }

    private FriendshipResponse toFriendshipResponse(Friendship friendship) {
        return FriendshipResponse.builder()
                .id(friendship.getId())
                .userId(friendship.getUserId())
                .friendUserId(friendship.getFriendUserId())
                .createdAt(friendship.getCreatedAt())
                .build();
    }
}
