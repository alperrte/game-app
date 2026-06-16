package com.ltz.social_service.service;

import com.ltz.social_service.dto.request.ChatRoomCreateRequest;
import com.ltz.social_service.dto.request.MessageCreateRequest;
import com.ltz.social_service.dto.response.ChatRoomResponse;
import com.ltz.social_service.dto.response.MessageResponse;
import com.ltz.social_service.entity.ChatRoom;
import com.ltz.social_service.entity.Message;
import com.ltz.social_service.repository.ChatRoomRepository;
import com.ltz.social_service.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final MessageRepository messageRepository;

    public ChatRoomResponse createChatRoom(ChatRoomCreateRequest request) {
        ChatRoom chatRoom = ChatRoom.builder()
                .roomName(request.getRoomName())
                .roomType(request.getRoomType())
                .createdByUserId(request.getCreatedByUserId())
                .build();

        return toChatRoomResponse(chatRoomRepository.save(chatRoom));
    }

    @Transactional(readOnly = true)
    public ChatRoomResponse getChatRoomById(Long chatRoomId) {
        ChatRoom chatRoom = getChatRoomEntity(chatRoomId);
        return toChatRoomResponse(chatRoom);
    }

    @Transactional(readOnly = true)
    public List<ChatRoomResponse> getChatRoomsCreatedByUser(Long userId) {
        return chatRoomRepository.findByCreatedByUserId(userId)
                .stream()
                .map(this::toChatRoomResponse)
                .toList();
    }

    public MessageResponse sendMessage(MessageCreateRequest request) {
        if (!chatRoomRepository.existsById(request.getChatRoomId())) {
            throw new IllegalArgumentException("Chat room not found");
        }

        Message message = Message.builder()
                .chatRoomId(request.getChatRoomId())
                .senderUserId(request.getSenderUserId())
                .content(request.getContent())
                .isRead(false)
                .isDeleted(false)
                .build();

        return toMessageResponse(messageRepository.save(message));
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getMessagesByChatRoom(Long chatRoomId) {
        if (!chatRoomRepository.existsById(chatRoomId)) {
            throw new IllegalArgumentException("Chat room not found");
        }

        return messageRepository.findByChatRoomIdAndIsDeletedFalseOrderByCreatedAtAsc(chatRoomId)
                .stream()
                .map(this::toMessageResponse)
                .toList();
    }

    public void deleteMessage(Long messageId, Long currentUserId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));

        if (!message.getSenderUserId().equals(currentUserId)) {
            throw new IllegalStateException("Only the sender can delete this message");
        }

        message.setIsDeleted(true);
        messageRepository.save(message);
    }

    private ChatRoom getChatRoomEntity(Long chatRoomId) {
        return chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new IllegalArgumentException("Chat room not found"));
    }

    private ChatRoomResponse toChatRoomResponse(ChatRoom chatRoom) {
        return ChatRoomResponse.builder()
                .id(chatRoom.getId())
                .roomName(chatRoom.getRoomName())
                .roomType(chatRoom.getRoomType())
                .createdByUserId(chatRoom.getCreatedByUserId())
                .createdAt(chatRoom.getCreatedAt())
                .updatedAt(chatRoom.getUpdatedAt())
                .build();
    }

    private MessageResponse toMessageResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .chatRoomId(message.getChatRoomId())
                .senderUserId(message.getSenderUserId())
                .content(message.getContent())
                .isRead(message.getIsRead())
                .isDeleted(message.getIsDeleted())
                .createdAt(message.getCreatedAt())
                .updatedAt(message.getUpdatedAt())
                .build();
    }
}
