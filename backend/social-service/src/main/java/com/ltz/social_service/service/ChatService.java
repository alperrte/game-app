package com.ltz.social_service.service;

import com.ltz.social_service.dto.request.ChatRoomCreateRequest;
import com.ltz.social_service.dto.request.ChatRoomUpdateRequest;
import com.ltz.social_service.dto.request.DirectChatRoomCreateRequest;
import com.ltz.social_service.dto.request.MessageCreateRequest;
import com.ltz.social_service.dto.response.ChatRoomResponse;
import com.ltz.social_service.dto.response.ChatRoomMemberResponse;
import com.ltz.social_service.dto.response.MessageReactionResponse;
import com.ltz.social_service.dto.response.MessageResponse;
import com.ltz.social_service.entity.ChatRoom;
import com.ltz.social_service.entity.ChatRoomMember;
import com.ltz.social_service.entity.Message;
import com.ltz.social_service.entity.MessageReaction;
import com.ltz.social_service.enums.ChatRoomType;
import com.ltz.social_service.enums.ChatRoomMemberRole;
import com.ltz.social_service.enums.MediaAssetType;
import com.ltz.social_service.enums.MessageType;
import com.ltz.social_service.repository.ChatRoomMemberRepository;
import com.ltz.social_service.repository.ChatRoomRepository;
import com.ltz.social_service.repository.MessageReactionRepository;
import com.ltz.social_service.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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
    private final MediaStorageService mediaStorageService;
    private final ChatRealtimeService realtimeService;

    public ChatRoomResponse createChatRoom(ChatRoomCreateRequest request) {
        if (request.getRoomType() == ChatRoomType.DIRECT) {
            throw new IllegalArgumentException("Direct chat rooms must be created with the direct chat endpoint");
        }
        if (request.getRoomName() == null || request.getRoomName().isBlank()) {
            throw new IllegalArgumentException("Group name is required");
        }

        ChatRoom chatRoom = ChatRoom.builder()
                .roomName(request.getRoomName().trim())
                .roomType(request.getRoomType())
                .createdByUserId(request.getCreatedByUserId())
                .build();

        ChatRoom savedChatRoom = chatRoomRepository.save(chatRoom);
        addMember(savedChatRoom.getId(), request.getCreatedByUserId(), ChatRoomMemberRole.OWNER);
        Optional.ofNullable(request.getParticipantUserIds())
                .orElse(List.of())
                .stream()
                .filter(Objects::nonNull)
                .filter(userId -> !userId.equals(request.getCreatedByUserId()))
                .distinct()
                .forEach(userId -> addMember(savedChatRoom.getId(), userId));

        createSystemMessage(
                savedChatRoom.getId(),
                request.getCreatedByUserId(),
                "Grup oluşturuldu."
        );

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

    public ChatRoomResponse updateChatRoom(
            Long chatRoomId,
            Long currentUserId,
            ChatRoomUpdateRequest request
    ) {
        ChatRoom chatRoom = getChatRoomEntity(chatRoomId);
        ensureGroupManager(chatRoom, currentUserId);

        if (request.getRoomName() != null) {
            if (request.getRoomName().isBlank()) {
                throw new IllegalArgumentException("Group name cannot be blank");
            }
            String previousName = chatRoom.getRoomName();
            chatRoom.setRoomName(request.getRoomName().trim());
            if (!Objects.equals(previousName, chatRoom.getRoomName())) {
                createSystemMessage(chatRoomId, currentUserId, "Grup adı değiştirildi.");
            }
        }

        if (request.getImageUrl() != null) {
            String imageUrl = request.getImageUrl();
            String previousImageUrl = chatRoom.getImageUrl();
            chatRoom.setImageUrl(imageUrl.isBlank() ? null : imageUrl.trim());
            if (!imageUrl.isBlank()) {
                mediaStorageService.attachMediaToChatRoom(
                        imageUrl,
                        currentUserId,
                        chatRoomId
                );
            }
            if (!Objects.equals(previousImageUrl, chatRoom.getImageUrl())) {
                createSystemMessage(
                        chatRoomId,
                        currentUserId,
                        chatRoom.getImageUrl() == null
                                ? "Grup fotoğrafı kaldırıldı."
                                : "Grup fotoğrafı güncellendi."
                );
            }
        }

        ChatRoomResponse response = toChatRoomResponse(
                chatRoomRepository.save(chatRoom),
                currentUserId
        );
        realtimeService.broadcastRoomEvent("ROOM_UPDATED", chatRoomId, response);
        return response;
    }

    @Transactional(readOnly = true)
    public List<ChatRoomMemberResponse> getChatRoomMembers(
            Long chatRoomId,
            Long currentUserId
    ) {
        ChatRoom chatRoom = getChatRoomEntity(chatRoomId);
        ensureGroupRoom(chatRoom);
        ensureMember(chatRoomId, currentUserId);

        return chatRoomMemberRepository.findByChatRoomId(chatRoomId)
                .stream()
                .sorted(Comparator.comparing(ChatRoomMember::getJoinedAt))
                .map(member -> toChatRoomMemberResponse(chatRoom, member))
                .toList();
    }

    public ChatRoomMemberResponse addChatRoomMember(
            Long chatRoomId,
            Long currentUserId,
            Long memberUserId
    ) {
        ChatRoom chatRoom = getChatRoomEntity(chatRoomId);
        ensureGroupManager(chatRoom, currentUserId);

        if (chatRoomMemberRepository.existsByChatRoomIdAndUserId(chatRoomId, memberUserId)) {
            throw new IllegalStateException("User is already a member of this group");
        }

        addMember(chatRoomId, memberUserId);
        ChatRoomMember member = chatRoomMemberRepository
                .findByChatRoomIdAndUserId(chatRoomId, memberUserId)
                .orElseThrow(() -> new IllegalStateException("Group member could not be added"));
        createSystemMessage(chatRoomId, currentUserId, "Kullanıcı #" + memberUserId + " gruba eklendi.");

        return toChatRoomMemberResponse(chatRoom, member);
    }

    public void removeChatRoomMember(
            Long chatRoomId,
            Long currentUserId,
            Long memberUserId
    ) {
        ChatRoom chatRoom = getChatRoomEntity(chatRoomId);
        ChatRoomMember actor = ensureGroupManager(chatRoom, currentUserId);
        ChatRoomMember target = chatRoomMemberRepository
                .findByChatRoomIdAndUserId(chatRoomId, memberUserId)
                .orElseThrow(() -> new IllegalArgumentException("Group member not found"));

        if (target.getMemberRole() == ChatRoomMemberRole.OWNER) {
            throw new IllegalStateException("The group creator cannot be removed");
        }
        if (actor.getMemberRole() == ChatRoomMemberRole.ADMIN
                && target.getMemberRole() != ChatRoomMemberRole.MEMBER) {
            throw new IllegalStateException("Admins can only remove regular members");
        }

        chatRoomMemberRepository.deleteByChatRoomIdAndUserId(chatRoomId, memberUserId);
        createSystemMessage(chatRoomId, currentUserId, "Kullanıcı #" + memberUserId + " gruptan çıkarıldı.");
    }

    public ChatRoomMemberResponse updateMemberRole(
            Long chatRoomId,
            Long currentUserId,
            Long memberUserId,
            ChatRoomMemberRole role
    ) {
        ChatRoom chatRoom = getChatRoomEntity(chatRoomId);
        ensureGroupOwner(chatRoom, currentUserId);
        if (role == ChatRoomMemberRole.OWNER) {
            throw new IllegalArgumentException("Use ownership transfer to assign the owner role");
        }

        ChatRoomMember member = chatRoomMemberRepository
                .findByChatRoomIdAndUserId(chatRoomId, memberUserId)
                .orElseThrow(() -> new IllegalArgumentException("Group member not found"));
        if (member.getMemberRole() == ChatRoomMemberRole.OWNER) {
            throw new IllegalStateException("The owner role cannot be changed directly");
        }

        member.setMemberRole(role);
        ChatRoomMember saved = chatRoomMemberRepository.save(member);
        createSystemMessage(
                chatRoomId,
                currentUserId,
                "Kullanıcı #" + memberUserId + " rolü " + role.name() + " olarak güncellendi."
        );
        ChatRoomMemberResponse response = toChatRoomMemberResponse(chatRoom, saved);
        realtimeService.broadcastRoomEvent("MEMBERS_UPDATED", chatRoomId, response);
        return response;
    }

    public ChatRoomResponse transferOwnership(
            Long chatRoomId,
            Long currentUserId,
            Long newOwnerUserId
    ) {
        ChatRoom chatRoom = getChatRoomEntity(chatRoomId);
        ChatRoomMember currentOwner = ensureGroupOwner(chatRoom, currentUserId);
        ChatRoomMember newOwner = chatRoomMemberRepository
                .findByChatRoomIdAndUserId(chatRoomId, newOwnerUserId)
                .orElseThrow(() -> new IllegalArgumentException("New owner must be a group member"));
        if (newOwnerUserId.equals(currentUserId)) {
            throw new IllegalArgumentException("You already own this group");
        }

        currentOwner.setMemberRole(ChatRoomMemberRole.ADMIN);
        newOwner.setMemberRole(ChatRoomMemberRole.OWNER);
        chatRoomMemberRepository.save(currentOwner);
        chatRoomMemberRepository.save(newOwner);
        chatRoom.setCreatedByUserId(newOwnerUserId);
        ChatRoom savedRoom = chatRoomRepository.save(chatRoom);
        createSystemMessage(chatRoomId, currentUserId, "Grup sahipliği kullanıcı #" + newOwnerUserId + " hesabına devredildi.");
        ChatRoomResponse response = toChatRoomResponse(savedRoom, currentUserId);
        realtimeService.broadcastRoomEvent("ROOM_UPDATED", chatRoomId, response);
        return response;
    }

    public void leaveGroup(Long chatRoomId, Long currentUserId) {
        ChatRoom chatRoom = getChatRoomEntity(chatRoomId);
        ensureGroupRoom(chatRoom);
        ChatRoomMember member = chatRoomMemberRepository
                .findByChatRoomIdAndUserId(chatRoomId, currentUserId)
                .orElseThrow(() -> new IllegalStateException("You are not a member of this group"));
        if (member.getMemberRole() == ChatRoomMemberRole.OWNER) {
            throw new IllegalStateException("Transfer ownership before leaving the group");
        }

        chatRoomMemberRepository.delete(member);
        createSystemMessage(chatRoomId, currentUserId, "Kullanıcı #" + currentUserId + " gruptan ayrıldı.");
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
        String content = request.getContent() == null ? "" : request.getContent().trim();
        String mediaUrl = request.getMediaUrl() == null ? null : request.getMediaUrl().trim();
        if (content.isBlank() && (mediaUrl == null || mediaUrl.isBlank())) {
            throw new IllegalArgumentException("Message content or media is required");
        }

        MediaAssetType mediaType = mediaStorageService.findMediaTypeByUrl(mediaUrl)
                .orElse(null);
        MessageType messageType = mediaType == null
                ? MessageType.TEXT
                : mediaType == MediaAssetType.VIDEO
                ? MessageType.VIDEO
                : mediaType == MediaAssetType.FILE
                ? MessageType.FILE
                : MessageType.IMAGE;

        Message.MessageBuilder messageBuilder = Message.builder()
                .chatRoomId(request.getChatRoomId())
                .senderUserId(request.getSenderUserId())
                .content(content.isBlank()
                        ? switch (messageType) {
                            case VIDEO -> "Video";
                            case FILE -> "Dosya";
                            case IMAGE -> "Görsel";
                            default -> content;
                        }
                        : content)
                .isRead(false)
                .isDeleted(false)
                .messageType(messageType)
                .mediaUrl(mediaUrl)
                .mediaType(mediaType);

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
        if (mediaUrl != null && !mediaUrl.isBlank()) {
            mediaStorageService.attachMediaToMessage(
                    mediaUrl,
                    request.getSenderUserId(),
                    savedMessage.getId()
            );
        }
        touchChatRoom(request.getChatRoomId());
        unhideChatRoomForAllMembers(request.getChatRoomId());

        MessageResponse response = toMessageResponse(savedMessage);
        realtimeService.broadcastRoomEvent("MESSAGE_CREATED", request.getChatRoomId(), response);
        return response;
    }

    public List<MessageResponse> getMessagesByChatRoom(
            Long chatRoomId,
            Long currentUserId,
            int page,
            int size
    ) {
        ensureMember(chatRoomId, currentUserId);

        List<Message> messages = messageRepository
                .findByChatRoomIdAndIsDeletedFalse(
                        chatRoomId,
                        PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .getContent()
                .stream()
                .sorted(Comparator.comparing(Message::getCreatedAt))
                .toList();

        List<MessageResponse> responses = toMessageResponses(messages);

        markMessagesAsRead(chatRoomId, currentUserId);

        return responses;
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> searchMessages(
            Long chatRoomId,
            Long currentUserId,
            String query,
            int page,
            int size
    ) {
        ensureMember(chatRoomId, currentUserId);
        if (query == null || query.isBlank()) {
            return List.of();
        }

        List<Message> messages = messageRepository
                .findByChatRoomIdAndIsDeletedFalseAndContentContainingIgnoreCase(
                        chatRoomId,
                        query.trim(),
                        PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .getContent();

        return toMessageResponses(messages);
    }

    public ChatRoomResponse pinMessage(Long chatRoomId, Long messageId, Long currentUserId) {
        ChatRoom chatRoom = getChatRoomEntity(chatRoomId);
        ensureCanManagePins(chatRoom, currentUserId);

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        if (!message.getChatRoomId().equals(chatRoomId)) {
            throw new IllegalStateException("Pinned message must belong to this chat room");
        }
        if (Boolean.TRUE.equals(message.getIsDeleted())) {
            throw new IllegalStateException("Deleted messages cannot be pinned");
        }
        if (message.getMessageType() == MessageType.SYSTEM) {
            throw new IllegalStateException("System messages cannot be pinned");
        }

        chatRoom.setPinnedMessageId(messageId);
        ChatRoomResponse response = toChatRoomResponse(
                chatRoomRepository.save(chatRoom),
                currentUserId
        );
        realtimeService.broadcastRoomEvent("ROOM_UPDATED", chatRoomId, response);
        return response;
    }

    public ChatRoomResponse unpinMessage(Long chatRoomId, Long currentUserId) {
        ChatRoom chatRoom = getChatRoomEntity(chatRoomId);
        ensureCanManagePins(chatRoom, currentUserId);
        chatRoom.setPinnedMessageId(null);

        ChatRoomResponse response = toChatRoomResponse(
                chatRoomRepository.save(chatRoom),
                currentUserId
        );
        realtimeService.broadcastRoomEvent("ROOM_UPDATED", chatRoomId, response);
        return response;
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

        MessageResponse response = toMessageResponse(message);
        realtimeService.broadcastRoomEvent("MESSAGE_UPDATED", message.getChatRoomId(), response);
        return response;
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
        ChatRoom chatRoom = getChatRoomEntity(message.getChatRoomId());
        if (messageId.equals(chatRoom.getPinnedMessageId())) {
            chatRoom.setPinnedMessageId(null);
            ChatRoomResponse response = toChatRoomResponse(
                    chatRoomRepository.save(chatRoom),
                    currentUserId
            );
            realtimeService.broadcastRoomEvent("ROOM_UPDATED", message.getChatRoomId(), response);
        }
        realtimeService.broadcastRoomEvent("MESSAGE_DELETED", message.getChatRoomId(), messageId);
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
        addMember(chatRoomId, userId, ChatRoomMemberRole.MEMBER);
    }

    private void addMember(
            Long chatRoomId,
            Long userId,
            ChatRoomMemberRole role
    ) {
        if (chatRoomMemberRepository.existsByChatRoomIdAndUserId(chatRoomId, userId)) {
            return;
        }

        chatRoomMemberRepository.save(
                ChatRoomMember.builder()
                        .chatRoomId(chatRoomId)
                        .userId(userId)
                        .isHidden(false)
                        .memberRole(role)
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

    private void ensureGroupRoom(ChatRoom chatRoom) {
        if (chatRoom.getRoomType() != ChatRoomType.GROUP) {
            throw new IllegalStateException("This operation is only available for group chats");
        }
    }

    private ChatRoomMember ensureGroupManager(ChatRoom chatRoom, Long currentUserId) {
        ensureGroupRoom(chatRoom);
        ChatRoomMember member = chatRoomMemberRepository
                .findByChatRoomIdAndUserId(chatRoom.getId(), currentUserId)
                .orElseThrow(() -> new IllegalStateException("You are not a member of this group"));
        if (member.getMemberRole() != ChatRoomMemberRole.OWNER
                && member.getMemberRole() != ChatRoomMemberRole.ADMIN) {
            throw new IllegalStateException("Only group managers can perform this action");
        }
        return member;
    }

    private ChatRoomMember ensureGroupOwner(ChatRoom chatRoom, Long currentUserId) {
        ChatRoomMember member = ensureGroupManager(chatRoom, currentUserId);
        if (member.getMemberRole() != ChatRoomMemberRole.OWNER) {
            throw new IllegalStateException("Only the group owner can perform this action");
        }
        return member;
    }

    private void ensureCanManagePins(ChatRoom chatRoom, Long currentUserId) {
        ensureMember(chatRoom.getId(), currentUserId);
    }

    private ChatRoomMemberResponse toChatRoomMemberResponse(
            ChatRoom chatRoom,
            ChatRoomMember member
    ) {
        return ChatRoomMemberResponse.builder()
                .userId(member.getUserId())
                .creator(chatRoom.getCreatedByUserId().equals(member.getUserId()))
                .role(member.getMemberRole())
                .joinedAt(member.getJoinedAt())
                .build();
    }

    private void createSystemMessage(
            Long chatRoomId,
            Long actorUserId,
            String content
    ) {
        Message saved = messageRepository.save(
                Message.builder()
                        .chatRoomId(chatRoomId)
                        .senderUserId(actorUserId)
                        .content(content)
                        .messageType(MessageType.SYSTEM)
                        .isRead(false)
                        .isDeleted(false)
                        .build()
        );
        touchChatRoom(chatRoomId);
        realtimeService.broadcastRoomEvent(
                "MESSAGE_CREATED",
                chatRoomId,
                toMessageResponse(saved)
        );
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
                .imageUrl(chatRoom.getImageUrl())
                .roomType(chatRoom.getRoomType())
                .createdByUserId(chatRoom.getCreatedByUserId())
                .createdAt(chatRoom.getCreatedAt())
                .updatedAt(chatRoom.getUpdatedAt())
                .otherParticipantUserId(otherParticipantUserId)
                .lastMessageContent(lastMessage == null ? null : lastMessage.getContent())
                .lastMessageAt(lastMessage == null ? null : lastMessage.getCreatedAt())
                .unreadCount(unreadCount)
                .pinnedMessageId(chatRoom.getPinnedMessageId())
                .pinnedMessage(chatRoom.getPinnedMessageId() == null
                        ? null
                        : messageRepository.findById(chatRoom.getPinnedMessageId())
                        .filter(message -> !Boolean.TRUE.equals(message.getIsDeleted()))
                        .map(this::toMessageResponse)
                        .orElse(null))
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
                .messageType(message.getMessageType())
                .mediaUrl(message.getMediaUrl())
                .mediaType(message.getMediaType())
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
