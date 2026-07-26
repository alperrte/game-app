package com.ltz.content_service.service.client.dto;

public record TwitchLiveStreamStat(
        String broadcaster,
        String title,
        String gameName,
        long viewers,
        String thumbnailUrl,
        String streamUrl
) {
}
