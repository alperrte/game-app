package com.ltz.social_service.entity;

import com.ltz.social_service.enums.MediaAssetType;
import com.ltz.social_service.enums.MessageType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "chat_room_id", nullable = false)
    private Long chatRoomId;

    @Column(name = "sender_user_id", nullable = false)
    private Long senderUserId;

    @Column(nullable = false, length = 1000)
    private String content;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted;

    @Column(name = "reply_to_message_id")
    private Long replyToMessageId;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false, length = 20)
    private MessageType messageType;

    @Column(name = "media_url", length = 1000)
    private String mediaUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", length = 20)
    private MediaAssetType mediaType;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();

        if (this.isRead == null) {
            this.isRead = false;
        }

        if (this.isDeleted == null) {
            this.isDeleted = false;
        }
        if (this.messageType == null) {
            this.messageType = MessageType.TEXT;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
