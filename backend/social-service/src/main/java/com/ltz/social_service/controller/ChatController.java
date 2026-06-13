package com.ltz.social_service.controller;

import com.ltz.social_service.dto.request.ChatRoomCreateRequest;
import com.ltz.social_service.dto.request.MessageCreateRequest;
import com.ltz.social_service.dto.response.ChatRoomResponse;
import com.ltz.social_service.dto.response.MessageResponse;
import com.ltz.social_service.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/chat-rooms")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatRoomResponse createChatRoom(
            @Valid @RequestBody ChatRoomCreateRequest request
    ) {
        return chatService.createChatRoom(request);
    }

    @GetMapping("/chat-rooms/{chatRoomId}")
    public ChatRoomResponse getChatRoomById(
            @PathVariable Long chatRoomId
    ) {
        return chatService.getChatRoomById(chatRoomId);
    }

    @GetMapping("/users/{userId}/chat-rooms")
    public List<ChatRoomResponse> getChatRoomsCreatedByUser(
            @PathVariable Long userId
    ) {
        return chatService.getChatRoomsCreatedByUser(userId);
    }

    @PostMapping("/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse sendMessage(
            @Valid @RequestBody MessageCreateRequest request
    ) {
        return chatService.sendMessage(request);
    }

    @GetMapping("/chat-rooms/{chatRoomId}/messages")
    public List<MessageResponse> getMessagesByChatRoom(
            @PathVariable Long chatRoomId
    ) {
        return chatService.getMessagesByChatRoom(chatRoomId);
    }

    @DeleteMapping("/messages/{messageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMessage(
            @PathVariable Long messageId
    ) {
        chatService.deleteMessage(messageId);
    }
}