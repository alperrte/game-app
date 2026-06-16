package com.ltz.social_service.service;

import com.ltz.social_service.dto.request.ChatRoomCreateRequest;
import com.ltz.social_service.dto.request.DirectChatRoomCreateRequest;
import com.ltz.social_service.dto.request.MessageCreateRequest;
import com.ltz.social_service.dto.response.ChatRoomResponse;
import com.ltz.social_service.dto.response.MessageReactionResponse;
import com.ltz.social_service.dto.response.MessageResponse;
import com.ltz.social_service.entity.ChatRoom;
import com.ltz.social_service.entity.ChatRoomMember;
import com.ltz.social_service.entity.Message;
import com.ltz.social_service.entity.MessageReaction;
import com.ltz.social_service.enums.ChatRoomType;
import com.ltz.social_service.repository.ChatRoomMemberRepository;
import com.ltz.social_service.repository.ChatRoomRepository;
import com.ltz.social_service.repository.MessageReactionRepository;
import com.ltz.social_service.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final MessageRepository messageRepository;
    private final MessageReactionRepository messageReactionRepository;

    public ChatRoomResponse createChatRoom(ChatRoomCreateRequest request) {
        ChatRoom chatRoom = ChatRoom.builder()
                .roomName(request.getRoomName())
                .roomType(request.getRoomType())
                .createdByUserId(request.getCreatedByUserId())
                .build();

        ChatRoom savedChatRoom = chatRoomRepository.save(chatRoom);
        addMember(savedChatRoom.getId(), request.getCreatedByUserId());

        return toChatRoomResponse(savedChatRoom, request.getCreatedByUserId());
    }

    public ChatRoomResponse findOrCreateDirectChatRoom(
            Long currentUserId,
            DirectChatRoomCreateRequest request
    ) {
        Long targetUserId = request.getTargetUserId();

        if (targetUserId.equals(currentUserId)) {
            throw new IllegalStateException("You cannot start a direct chat with yourself");
        }

        return chatRoomMemberRepository
                .findDirectChatRoomIdBetweenUsers(currentUserId, targetUserId)
                .flatMap(chatRoomRepository::findById)
                .map(chatRoom -> {
                    updateDirectRoomNameIfMissing(chatRoom, request.getTargetUsername());
                    unhideChatRoomForUser(chatRoom.getId(), currentUserId);
                    return toChatRoomResponse(chatRoom, currentUserId);
                })
                .orElseGet(() -> createDirectChatRoom(
                        currentUserId,
                        targetUserId,
                        request.getTargetUsername()
                ));
    }

    @Transactional(readOnly = true)
    public ChatRoomResponse getChatRoomById(Long chatRoomId, Long currentUserId) {
        ChatRoom chatRoom = getChatRoomEntity(chatRoomId);
        ensureMember(chatRoomId, currentUserId);

        return toChatRoomResponse(chatRoom, currentUserId);
    }

    @Transactional(readOnly = true)
    public List<ChatRoomResponse> getChatRoomsForUser(Long userId) {
        return chatRoomMemberRepository.findVisibleChatRoomIdsByUserId(userId)
                .stream()
                .map(chatRoomRepository::findById)
                .flatMap(Optional::stream)
                .map(chatRoom -> toChatRoomResponse(chatRoom, userId))
                .sorted(Comparator
                        .comparing(
                                ChatRoomResponse::getLastMessageAt,
                                Comparator.nullsLast(Comparator.reverseOrder())
                        )
                        .thenComparing(
                                ChatRoomResponse::getUpdatedAt,
                                Comparator.nullsLast(Comparator.reverseOrder())
                        )
                        .thenComparing(
                                ChatRoomResponse::getCreatedAt,
                                Comparator.nullsLast(Comparator.reverseOrder())
                        ))
                .toList();
    }

    public MessageResponse sendMessage(MessageCreateRequest request) {
        ensureMember(request.getChatRoomId(), request.getSenderUserId());

        Message.MessageBuilder messageBuilder = Message.builder()
                .chatRoomId(request.getChatRoomId())
                .senderUserId(request.getSenderUserId())
                .content(request.getContent())
                .isRead(false)
                .isDeleted(false);

        if (request.getReplyToMessageId() != null) {
            Message replyTarget = messageRepository.findById(request.getReplyToMessageId())
                    .orElseThrow(() -> new IllegalArgumentException("Reply target message not found"));

            if (!replyTarget.getChatRoomId().equals(request.getChatRoomId())) {
                throw new IllegalStateException("Reply target message must belong to the same chat room");
            }

            if (Boolean.TRUE.equals(replyTarget.getIsDeleted())) {
                throw new IllegalStateException("You cannot reply to a deleted message");
            }

            messageBuilder.replyToMessageId(request.getReplyToMessageId());
        }

        Message savedMessage = messageRepository.save(messageBuilder.build());
        touchChatRoom(request.getChatRoomId());
        unhideChatRoomForAllMembers(request.getChatRoomId());

        return toMessageResponse(savedMessage);
    }

    public List<MessageResponse> getMessagesByChatRoom(Long chatRoomId, Long currentUserId) {
        ensureMember(chatRoomId, currentUserId);

        List<Message> messages = messageRepository
                .findByChatRoomIdAndIsDeletedFalseOrderByCreatedAtAsc(chatRoomId);

        List<MessageResponse> responses = toMessageResponses(messages);

        markMessagesAsRead(chatRoomId, currentUserId);

        return responses;
    }

    public MessageResponse toggleMessageReaction(Long messageId, Long currentUserId, String emoji) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));

        ensureMember(message.getChatRoomId(), currentUserId);

        Optional<MessageReaction> existingReaction = messageReactionRepository
                .findByMessageIdAndUserId(messageId, currentUserId);

        if (existingReaction.isPresent()) {
            MessageReaction reaction = existingReaction.get();

            if (reaction.getEmoji().equals(emoji)) {
                messageReactionRepository.delete(reaction);
            } else {
                reaction.setEmoji(emoji);
                messageReactionRepository.save(reaction);
            }
        } else {
            messageReactionRepository.save(
                    MessageReaction.builder()
                            .messageId(messageId)
                            .userId(currentUserId)
                            .emoji(emoji)
                            .build()
            );
        }

        return toMessageResponse(message);
    }

    public void markMessagesAsRead(Long chatRoomId, Long currentUserId) {
        ensureMember(chatRoomId, currentUserId);
        messageRepository.markMessagesAsReadForUser(
                chatRoomId,
                currentUserId,
                LocalDateTime.now()
        );
    }

    public void hideChatRoom(Long chatRoomId, Long currentUserId) {
        ensureMember(chatRoomId, currentUserId);

        ChatRoomMember member = chatRoomMemberRepository
                .findByChatRoomIdAndUserId(chatRoomId, currentUserId)
                .orElseThrow(() -> new IllegalStateException("You are not a member of this chat room"));

        member.setIsHidden(true);
        member.setHiddenAt(LocalDateTime.now());
        chatRoomMemberRepository.save(member);
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

    private ChatRoomResponse createDirectChatRoom(
            Long currentUserId,
            Long targetUserId,
            String targetUsername
    ) {
        ChatRoom chatRoom = ChatRoom.builder()
                .roomType(ChatRoomType.DIRECT)
                .roomName(resolveDirectRoomName(targetUsername))
                .createdByUserId(currentUserId)
                .build();

        ChatRoom savedChatRoom = chatRoomRepository.save(chatRoom);
        addMember(savedChatRoom.getId(), currentUserId);
        addMember(savedChatRoom.getId(), targetUserId);

        return toChatRoomResponse(savedChatRoom, currentUserId);
    }

    private String resolveDirectRoomName(String targetUsername) {
        if (targetUsername == null || targetUsername.isBlank()) {
            return null;
        }

        return targetUsername.trim();
    }

    private void updateDirectRoomNameIfMissing(ChatRoom chatRoom, String targetUsername) {
        if (chatRoom.getRoomName() != null && !chatRoom.getRoomName().isBlank()) {
            return;
        }

        String resolvedRoomName = resolveDirectRoomName(targetUsername);

        if (resolvedRoomName == null) {
            return;
        }

        chatRoom.setRoomName(resolvedRoomName);
        chatRoomRepository.save(chatRoom);
    }

    private void addMember(Long chatRoomId, Long userId) {
        if (chatRoomMemberRepository.existsByChatRoomIdAndUserId(chatRoomId, userId)) {
            return;
        }

        chatRoomMemberRepository.save(
                ChatRoomMember.builder()
                        .chatRoomId(chatRoomId)
                        .userId(userId)
                        .isHidden(false)
                        .build()
        );
    }

    private void unhideChatRoomForUser(Long chatRoomId, Long userId) {
        chatRoomMemberRepository.findByChatRoomIdAndUserId(chatRoomId, userId)
                .ifPresent(member -> {
                    if (Boolean.TRUE.equals(member.getIsHidden())) {
                        member.setIsHidden(false);
                        member.setHiddenAt(null);
                        chatRoomMemberRepository.save(member);
                    }
                });
    }

    private void unhideChatRoomForAllMembers(Long chatRoomId) {
        chatRoomMemberRepository.findByChatRoomId(chatRoomId)
                .forEach(member -> {
                    if (Boolean.TRUE.equals(member.getIsHidden())) {
                        member.setIsHidden(false);
                        member.setHiddenAt(null);
                        chatRoomMemberRepository.save(member);
                    }
                });
    }

    private void ensureMember(Long chatRoomId, Long userId) {
        if (!chatRoomMemberRepository.existsByChatRoomIdAndUserId(chatRoomId, userId)) {
            throw new IllegalStateException("You are not a member of this chat room");
        }
    }

    private void touchChatRoom(Long chatRoomId) {
        ChatRoom chatRoom = getChatRoomEntity(chatRoomId);
        chatRoomRepository.save(chatRoom);
    }

    private ChatRoom getChatRoomEntity(Long chatRoomId) {
        return chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new IllegalArgumentException("Chat room not found"));
    }

    private ChatRoomResponse toChatRoomResponse(ChatRoom chatRoom, Long currentUserId) {
        Long otherParticipantUserId = null;

        if (chatRoom.getRoomType() == ChatRoomType.DIRECT) {
            otherParticipantUserId = chatRoomMemberRepository.findByChatRoomId(chatRoom.getId())
                    .stream()
                    .map(ChatRoomMember::getUserId)
                    .filter(userId -> !userId.equals(currentUserId))
                    .findFirst()
                    .orElse(null);
        }

        Message lastMessage = messageRepository
                .findFirstByChatRoomIdAndIsDeletedFalseOrderByCreatedAtDesc(chatRoom.getId())
                .orElse(null);

        long unreadCount = messageRepository
                .countByChatRoomIdAndSenderUserIdNotAndIsReadFalseAndIsDeletedFalse(
                        chatRoom.getId(),
                        currentUserId
                );

        return ChatRoomResponse.builder()
                .id(chatRoom.getId())
                .roomName(chatRoom.getRoomName())
                .roomType(chatRoom.getRoomType())
                .createdByUserId(chatRoom.getCreatedByUserId())
                .createdAt(chatRoom.getCreatedAt())
                .updatedAt(chatRoom.getUpdatedAt())
                .otherParticipantUserId(otherParticipantUserId)
                .lastMessageContent(lastMessage == null ? null : lastMessage.getContent())
                .lastMessageAt(lastMessage == null ? null : lastMessage.getCreatedAt())
                .unreadCount(unreadCount)
                .build();
    }

    private List<MessageResponse> toMessageResponses(List<Message> messages) {
        if (messages.isEmpty()) {
            return List.of();
        }

        List<Long> messageIds = messages.stream().map(Message::getId).toList();
        Map<Long, List<MessageReaction>> reactionsByMessageId = messageReactionRepository
                .findByMessageIdIn(messageIds)
                .stream()
                .collect(Collectors.groupingBy(MessageReaction::getMessageId));

        Set<Long> replyMessageIds = messages.stream()
                .map(Message::getReplyToMessageId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, Message> replyMessagesById = messageRepository.findAllById(replyMessageIds)
                .stream()
                .collect(Collectors.toMap(Message::getId, Function.identity()));

        return messages.stream()
                .map(message -> toMessageResponse(
                        message,
                        reactionsByMessageId.getOrDefault(message.getId(), List.of()),
                        replyMessagesById
                ))
                .toList();
    }

    private MessageResponse toMessageResponse(Message message) {
        List<MessageReaction> reactions = messageReactionRepository.findByMessageIdIn(List.of(message.getId()));
        Map<Long, Message> replyMessagesById = message.getReplyToMessageId() == null
                ? Map.of()
                : messageRepository.findAllById(List.of(message.getReplyToMessageId()))
                .stream()
                .collect(Collectors.toMap(Message::getId, Function.identity()));

        return toMessageResponse(message, reactions, replyMessagesById);
    }

    private MessageResponse toMessageResponse(
            Message message,
            List<MessageReaction> reactions,
            Map<Long, Message> replyMessagesById
    ) {
        Message replyTarget = message.getReplyToMessageId() == null
                ? null
                : replyMessagesById.get(message.getReplyToMessageId());

        return MessageResponse.builder()
                .id(message.getId())
                .chatRoomId(message.getChatRoomId())
                .senderUserId(message.getSenderUserId())
                .content(message.getContent())
                .isRead(message.getIsRead())
                .readAt(message.getReadAt())
                .isDeleted(message.getIsDeleted())
                .replyToMessageId(message.getReplyToMessageId())
                .replyToSenderUserId(replyTarget == null ? null : replyTarget.getSenderUserId())
                .replyToContent(replyTarget == null
                        ? null
                        : Boolean.TRUE.equals(replyTarget.getIsDeleted())
                        ? "Mesaj silindi"
                        : replyTarget.getContent())
                .reactions(reactions.stream()
                        .map(reaction -> MessageReactionResponse.builder()
                                .emoji(reaction.getEmoji())
                                .userId(reaction.getUserId())
                                .build())
                        .toList())
                .createdAt(message.getCreatedAt())
                .updatedAt(message.getUpdatedAt())
                .build();
    }
}
