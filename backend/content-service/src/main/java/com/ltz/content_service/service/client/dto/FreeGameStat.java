package com.ltz.content_service.service.client.dto;

public record FreeGameStat(
        String gameTitle,
        String storeName,
        String imageUrl,
        String dealUrl,
        String endsAt,
        boolean isGiveaway,
        String worth
) {
}
