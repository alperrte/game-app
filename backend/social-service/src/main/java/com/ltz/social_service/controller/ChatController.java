package com.ltz.social_service.controller;

import com.ltz.social_service.dto.request.ChatRoomCreateRequest;
import com.ltz.social_service.dto.request.DirectChatRoomCreateRequest;
import com.ltz.social_service.dto.request.MessageCreateRequest;
import com.ltz.social_service.dto.request.MessageReactionRequest;
import com.ltz.social_service.dto.response.ChatRoomResponse;
import com.ltz.social_service.dto.response.MessageResponse;
import com.ltz.social_service.security.JwtUserPrincipal;
import com.ltz.social_service.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/chat-rooms")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatRoomResponse createChatRoom(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody ChatRoomCreateRequest request
    ) {
        request.setCreatedByUserId(principal.userId());
        return chatService.createChatRoom(request);
    }

    @PostMapping("/chat-rooms/direct")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatRoomResponse findOrCreateDirectChatRoom(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody DirectChatRoomCreateRequest request
    ) {
        return chatService.findOrCreateDirectChatRoom(principal.userId(), request);
    }

    @GetMapping("/chat-rooms/mine")
    public List<ChatRoomResponse> getMyChatRooms(
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        return chatService.getChatRoomsForUser(principal.userId());
    }

    @GetMapping("/chat-rooms/{chatRoomId}")
    public ChatRoomResponse getChatRoomById(
            @PathVariable Long chatRoomId,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        return chatService.getChatRoomById(chatRoomId, principal.userId());
    }

    @GetMapping("/users/{userId}/chat-rooms")
    public List<ChatRoomResponse> getChatRoomsForUser(
            @PathVariable Long userId,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        if (!principal.userId().equals(userId)) {
            throw new IllegalStateException("You can only list your own chat rooms");
        }

        return chatService.getChatRoomsForUser(userId);
    }

    @PostMapping("/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse sendMessage(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody MessageCreateRequest request
    ) {
        request.setSenderUserId(principal.userId());
        return chatService.sendMessage(request);
    }

    @GetMapping("/chat-rooms/{chatRoomId}/messages")
    public List<MessageResponse> getMessagesByChatRoom(
            @PathVariable Long chatRoomId,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        return chatService.getMessagesByChatRoom(chatRoomId, principal.userId());
    }

    @PostMapping("/chat-rooms/{chatRoomId}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markChatRoomAsRead(
            @PathVariable Long chatRoomId,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        chatService.markMessagesAsRead(chatRoomId, principal.userId());
    }

    @PostMapping("/messages/{messageId}/reactions")
    public MessageResponse toggleMessageReaction(
            @PathVariable Long messageId,
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody MessageReactionRequest request
    ) {
        return chatService.toggleMessageReaction(
                messageId,
                principal.userId(),
                request.getEmoji()
        );
    }

    @PostMapping("/chat-rooms/{chatRoomId}/hide")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void hideChatRoom(
            @PathVariable Long chatRoomId,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        chatService.hideChatRoom(chatRoomId, principal.userId());
    }

    @DeleteMapping("/messages/{messageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMessage(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long messageId
    ) {
        chatService.deleteMessage(messageId, principal.userId());
    }
}
