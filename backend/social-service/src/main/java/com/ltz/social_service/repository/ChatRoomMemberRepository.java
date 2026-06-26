package com.ltz.social_service.repository;

import com.ltz.social_service.entity.ChatRoomMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.time.LocalDateTime;
import java.util.Optional;

public interface ChatRoomMemberRepository extends JpaRepository<ChatRoomMember, Long> {

    boolean existsByChatRoomIdAndUserId(Long chatRoomId, Long userId);

    Optional<ChatRoomMember> findByChatRoomIdAndUserId(Long chatRoomId, Long userId);

    List<ChatRoomMember> findByChatRoomId(Long chatRoomId);

    List<ChatRoomMember> findByUserId(Long userId);

    void deleteByChatRoomIdAndUserId(Long chatRoomId, Long userId);

    @Query("""
            SELECT member.chatRoomId
            FROM ChatRoomMember member
            WHERE member.userId = :userId
              AND member.isHidden = false
            """)
    List<Long> findVisibleChatRoomIdsByUserId(@Param("userId") Long userId);

    @Query(value = """
            SELECT TOP 1 cr.id
            FROM chat_rooms cr
            INNER JOIN chat_room_members first_member
                ON first_member.chat_room_id = cr.id
               AND first_member.user_id = :firstUserId
            INNER JOIN chat_room_members second_member
                ON second_member.chat_room_id = cr.id
               AND second_member.user_id = :secondUserId
            WHERE cr.room_type = 'DIRECT'
              AND (
                  SELECT COUNT(*)
                  FROM chat_room_members total_members
                  WHERE total_members.chat_room_id = cr.id
              ) = 2
            """, nativeQuery = true)
    Optional<Long> findDirectChatRoomIdBetweenUsers(
            @Param("firstUserId") Long firstUserId,
            @Param("secondUserId") Long secondUserId
    );
}
