package com.ltz.content_service.service.client.dto;

public record SpeedrunRecordStat(
        String gameTitle,
        String category,
        String runner,
        String time,
        String videoUrl
) {
}
