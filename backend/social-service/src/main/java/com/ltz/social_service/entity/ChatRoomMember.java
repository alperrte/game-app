package com.ltz.social_service.entity;

import com.ltz.social_service.enums.ChatRoomMemberRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "chat_room_members",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_chat_room_members_room_user",
                        columnNames = {"chat_room_id", "user_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRoomMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "chat_room_id", nullable = false)
    private Long chatRoomId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    @Column(name = "is_hidden", nullable = false)
    private Boolean isHidden;

    @Column(name = "hidden_at")
    private LocalDateTime hiddenAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "member_role", nullable = false, length = 20)
    private ChatRoomMemberRole memberRole;

    @PrePersist
    public void prePersist() {
        this.joinedAt = LocalDateTime.now();

        if (this.isHidden == null) {
            this.isHidden = false;
        }
        if (this.memberRole == null) {
            this.memberRole = ChatRoomMemberRole.MEMBER;
        }
    }
}
