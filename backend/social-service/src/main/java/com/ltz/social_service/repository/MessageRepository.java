package com.ltz.social_service.repository;

import com.ltz.social_service.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByChatRoomIdAndIsDeletedFalseOrderByCreatedAtAsc(Long chatRoomId);

    List<Message> findBySenderUserId(Long senderUserId);

    long countByChatRoomIdAndIsReadFalseAndIsDeletedFalse(Long chatRoomId);
}