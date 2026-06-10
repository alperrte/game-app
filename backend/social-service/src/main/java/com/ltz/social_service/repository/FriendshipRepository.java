package com.ltz.social_service.repository;

import com.ltz.social_service.entity.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    boolean existsByUserIdAndFriendUserId(Long userId, Long friendUserId);

    Optional<Friendship> findByUserIdAndFriendUserId(Long userId, Long friendUserId);

    List<Friendship> findByUserId(Long userId);

    void deleteByUserIdAndFriendUserId(Long userId, Long friendUserId);
}