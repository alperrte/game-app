package com.ltz.social_service.controller;

import com.ltz.social_service.dto.request.ChatRoomCreateRequest;
import com.ltz.social_service.dto.request.MessageCreateRequest;
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

    @GetMapping("/chat-rooms/{chatRoomId}")
    public ChatRoomResponse getChatRoomById(@PathVariable Long chatRoomId) {
        return chatService.getChatRoomById(chatRoomId);
    }

    @GetMapping("/users/{userId}/chat-rooms")
    public List<ChatRoomResponse> getChatRoomsCreatedByUser(@PathVariable Long userId) {
        return chatService.getChatRoomsCreatedByUser(userId);
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
    public List<MessageResponse> getMessagesByChatRoom(@PathVariable Long chatRoomId) {
        return chatService.getMessagesByChatRoom(chatRoomId);
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
