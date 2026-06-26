package com.ltz.social_service.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ltz.social_service.security.JwtService;
import com.ltz.social_service.service.ChatRealtimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private static final String USER_ID_ATTRIBUTE = "chatUserId";

    private final JwtService jwtService;
    private final ObjectMapper objectMapper;
    private final ChatRealtimeService realtimeService;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String token = session.getUri() == null
                ? null
                : UriComponentsBuilder.fromUri(session.getUri())
                .build()
                .getQueryParams()
                .getFirst("token");

        if (token == null || !jwtService.validateToken(token)) {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Invalid token"));
            return;
        }

        Long userId = jwtService.getUserId(token);
        session.getAttributes().put(USER_ID_ATTRIBUTE, userId);
        realtimeService.register(userId, session);
    }

    @Override
    protected void handleTextMessage(
            WebSocketSession session,
            TextMessage message
    ) throws Exception {
        Long userId = (Long) session.getAttributes().get(USER_ID_ATTRIBUTE);
        if (userId == null) return;

        JsonNode payload = objectMapper.readTree(message.getPayload());
        if ("TYPING".equals(payload.path("type").asText()) && payload.hasNonNull("roomId")) {
            realtimeService.broadcastTyping(
                    payload.get("roomId").asLong(),
                    userId,
                    payload.path("typing").asBoolean()
            );
        }
    }

    @Override
    public void afterConnectionClosed(
            WebSocketSession session,
            CloseStatus status
    ) {
        unregister(session);
    }

    @Override
    public void handleTransportError(
            WebSocketSession session,
            Throwable exception
    ) throws Exception {
        unregister(session);
        if (session.isOpen()) session.close(CloseStatus.SERVER_ERROR);
    }

    private void unregister(WebSocketSession session) {
        Long userId = (Long) session.getAttributes().get(USER_ID_ATTRIBUTE);
        if (userId != null) realtimeService.unregister(userId, session);
    }
}
