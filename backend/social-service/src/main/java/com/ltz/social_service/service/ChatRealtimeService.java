package com.ltz.social_service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ltz.social_service.entity.ChatRoomMember;
import com.ltz.social_service.repository.ChatRoomMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class ChatRealtimeService {

    private final ObjectMapper objectMapper;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final Map<Long, Set<String>> sessionsByUser = new ConcurrentHashMap<>();

    public void register(Long userId, WebSocketSession session) {
        sessions.put(session.getId(), session);
        sessionsByUser.computeIfAbsent(userId, ignored -> ConcurrentHashMap.newKeySet())
                .add(session.getId());
        sendPayload(session, Map.of(
                "type", "PRESENCE_SNAPSHOT",
                "userIds", sessionsByUser.keySet()
        ));
        broadcastPresence(userId, true);
    }

    public void unregister(Long userId, WebSocketSession session) {
        sessions.remove(session.getId());
        Set<String> userSessions = sessionsByUser.get(userId);
        if (userSessions != null) {
            userSessions.remove(session.getId());
            if (userSessions.isEmpty()) {
                sessionsByUser.remove(userId);
                broadcastPresence(userId, false);
            }
        }
    }

    public boolean isOnline(Long userId) {
        Set<String> userSessions = sessionsByUser.get(userId);
        return userSessions != null && !userSessions.isEmpty();
    }

    public void broadcastRoomEvent(String type, Long roomId, Object payload) {
        broadcastToRoom(roomId, Map.of(
                "type", type,
                "roomId", roomId,
                "payload", payload
        ));
    }

    public void broadcastTyping(Long roomId, Long userId, boolean typing) {
        if (!chatRoomMemberRepository.existsByChatRoomIdAndUserId(roomId, userId)) {
            return;
        }
        broadcastToRoom(roomId, Map.of(
                "type", "TYPING",
                "roomId", roomId,
                "userId", userId,
                "typing", typing
        ));
    }

    private void broadcastPresence(Long userId, boolean online) {
        broadcast(Map.of(
                "type", "PRESENCE",
                "userId", userId,
                "online", online
        ));
    }

    private void broadcastToRoom(Long roomId, Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            chatRoomMemberRepository.findByChatRoomId(roomId)
                    .stream()
                    .map(ChatRoomMember::getUserId)
                    .distinct()
                    .flatMap(memberUserId ->
                            sessionsByUser.getOrDefault(memberUserId, Set.of()).stream())
                    .map(sessions::get)
                    .filter(java.util.Objects::nonNull)
                    .forEach(session -> send(session, json));
        } catch (IOException ignored) {
            // Serialization failure should not break the REST operation.
        }
    }

    private void broadcast(Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            sessions.values().forEach(session -> send(session, json));
        } catch (IOException ignored) {
            // Serialization failure should not break the REST operation.
        }
    }

    private void sendPayload(WebSocketSession session, Object payload) {
        try {
            send(session, objectMapper.writeValueAsString(payload));
        } catch (IOException ignored) {
            // Ignore transient serialization failures.
        }
    }

    private void send(WebSocketSession session, String json) {
        if (!session.isOpen()) return;
        try {
            synchronized (session) {
                session.sendMessage(new TextMessage(json));
            }
        } catch (IOException ignored) {
            // Stale sessions are cleaned up by the close/error callbacks.
        }
    }
}
