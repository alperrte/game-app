package com.ltz.social_service.repository;

import com.ltz.social_service.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByChatRoomIdAndIsDeletedFalseOrderByCreatedAtAsc(Long chatRoomId);
    Page<Message> findByChatRoomIdAndIsDeletedFalse(Long chatRoomId, Pageable pageable);

    Page<Message> findByChatRoomIdAndIsDeletedFalseAndContentContainingIgnoreCase(
            Long chatRoomId,
            String content,
            Pageable pageable
    );

    List<Message> findBySenderUserId(Long senderUserId);

    long countByChatRoomIdAndIsReadFalseAndIsDeletedFalse(Long chatRoomId);

    long countByChatRoomIdAndSenderUserIdNotAndIsReadFalseAndIsDeletedFalse(
            Long chatRoomId,
            Long senderUserId
    );

    Optional<Message> findFirstByChatRoomIdAndIsDeletedFalseOrderByCreatedAtDesc(Long chatRoomId);

    @Modifying
    @Query("""
            UPDATE Message message
            SET message.isRead = true,
                message.readAt = :readAt
            WHERE message.chatRoomId = :chatRoomId
              AND message.senderUserId <> :userId
              AND message.isDeleted = false
              AND message.isRead = false
            """)
    void markMessagesAsReadForUser(
            @Param("chatRoomId") Long chatRoomId,
            @Param("userId") Long userId,
            @Param("readAt") LocalDateTime readAt
    );
}
