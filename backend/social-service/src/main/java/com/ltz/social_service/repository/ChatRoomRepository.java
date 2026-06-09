package com.ltz.social_service.repository;

import com.ltz.social_service.entity.ChatRoom;
import com.ltz.social_service.enums.ChatRoomType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    List<ChatRoom> findByCreatedByUserId(Long createdByUserId);

    List<ChatRoom> findByRoomType(ChatRoomType roomType);
}