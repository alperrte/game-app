package com.ltz.content_service.service.client.dto;

import java.util.List;

public record UpcomingReleaseStat(
        String gameTitle,
        String releaseDate,
        List<String> platforms,
        String imageUrl,
        String description
) {
}
