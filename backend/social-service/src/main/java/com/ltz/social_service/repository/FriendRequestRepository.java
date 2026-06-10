package com.ltz.social_service.repository;

import com.ltz.social_service.entity.FriendRequest;
import com.ltz.social_service.enums.FriendRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {

    boolean existsBySenderUserIdAndReceiverUserId(Long senderUserId, Long receiverUserId);

    Optional<FriendRequest> findBySenderUserIdAndReceiverUserId(Long senderUserId, Long receiverUserId);

    boolean existsBySenderUserIdAndReceiverUserIdAndStatus(
            Long senderUserId,
            Long receiverUserId,
            FriendRequestStatus status
    );

    List<FriendRequest> findByReceiverUserIdAndStatus(Long receiverUserId, FriendRequestStatus status);

    List<FriendRequest> findBySenderUserIdAndStatus(Long senderUserId, FriendRequestStatus status);
}
