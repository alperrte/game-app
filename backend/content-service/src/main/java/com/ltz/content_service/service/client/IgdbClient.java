package com.ltz.content_service.service.client;

import com.ltz.content_service.service.client.dto.UpcomingReleaseStat;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class IgdbClient {

    private final WebClient webClient;
    private final TwitchClient twitchClient;

    @Value("${twitch.client-id:}")
    private String clientId;

    @SuppressWarnings("unchecked")
    public Mono<List<UpcomingReleaseStat>> getUpcomingReleases() {
        long currentTimestamp = Instant.now().getEpochSecond();
        String bodyQuery = String.format(
                "fields name, first_release_date, platforms.name, cover.url, summary; " +
                "where first_release_date >= %d & cover != null; " +
                "sort first_release_date asc; " +
                "limit 30;", currentTimestamp
        );

        return twitchClient.getAccessToken()
                .flatMap(token -> webClient.post()
                        .uri("https://api.igdb.com/v4/games")
                        .header("Client-ID", clientId)
                        .header("Authorization", "Bearer " + token)
                        .header("Content-Type", "text/plain")
                        .bodyValue(bodyQuery)
                        .retrieve()
                        .bodyToMono(List.class)
                        .map(responseList -> {
                            List<UpcomingReleaseStat> upcoming = new ArrayList<>();
                            for (Object obj : responseList) {
                                Map<String, Object> game = (Map<String, Object>) obj;
                                String name = (String) game.get("name");
                                String description = (String) game.get("summary");
                                if (description == null || description.isBlank()) {
                                    description = name + " is an upcoming game scheduled for release.";
                                }

                                String releaseDateStr = "";
                                if (game.containsKey("first_release_date")) {
                                    Number timestampNum = (Number) game.get("first_release_date");
                                    if (timestampNum != null) {
                                        LocalDate date = Instant.ofEpochSecond(timestampNum.longValue())
                                                .atZone(ZoneId.systemDefault())
                                                .toLocalDate();
                                        releaseDateStr = date.format(DateTimeFormatter.ISO_LOCAL_DATE);
                                    }
                                }

                                String coverUrl = "";
                                if (game.containsKey("cover")) {
                                    Map<String, Object> cover = (Map<String, Object>) game.get("cover");
                                    if (cover != null && cover.containsKey("url")) {
                                        String url = (String) cover.get("url");
                                        if (url != null) {
                                            coverUrl = url.replace("t_thumb", "t_720p");
                                            if (coverUrl.startsWith("//")) {
                                                coverUrl = "https:" + coverUrl;
                                            }
                                        }
                                    }
                                }

                                List<String> platformNames = new ArrayList<>();
                                if (game.containsKey("platforms")) {
                                    List<Map<String, Object>> platforms = (List<Map<String, Object>>) game.get("platforms");
                                    if (platforms != null) {
                                        for (Map<String, Object> platform : platforms) {
                                            String pName = (String) platform.get("name");
                                            if (pName != null) {
                                                if (pName.contains("PC (Microsoft Windows)")) {
                                                    platformNames.add("PC");
                                                } else if (pName.contains("PlayStation 5")) {
                                                    platformNames.add("PS5");
                                                } else if (pName.contains("Xbox Series X/S")) {
                                                    platformNames.add("Xbox Series X/S");
                                                } else if (pName.contains("Nintendo Switch")) {
                                                    platformNames.add("Nintendo Switch");
                                                } else {
                                                    platformNames.add(pName);
                                                }
                                            }
                                        }
                                    }
                                }
                                if (platformNames.isEmpty()) {
                                    platformNames.addAll(List.of("PC", "PS5", "Xbox Series X/S"));
                                }

                                upcoming.add(new UpcomingReleaseStat(
                                        name,
                                        releaseDateStr,
                                        platformNames,
                                        coverUrl,
                                        description
                                ));
                            }
                            return upcoming;
                        }))
                .onErrorResume(e -> {
                    log.warn("IGDB API upcoming releases fetch failed, returning mock fallback: {}", e.getMessage());
                    return Mono.just(getMockUpcomingReleases());
                });
    }

    private List<UpcomingReleaseStat> getMockUpcomingReleases() {
        List<UpcomingReleaseStat> upcomingReleases = new ArrayList<>();
        upcomingReleases.add(new UpcomingReleaseStat(
                "Grand Theft Auto VI",
                "2026-10-25",
                List.of("PS5", "Xbox Series X/S"),
                "https://cdn.cloudflare.steamstatic.com/steam/apps/271590/header.jpg",
                "Grand Theft Auto serisinin en yeni ve en çok beklenen açık dünya aksiyon oyunu."
        ));
        upcomingReleases.add(new UpcomingReleaseStat(
                "Monster Hunter Wilds",
                "2026-02-28",
                List.of("PC", "PS5", "Xbox Series X/S"),
                "https://cdn.cloudflare.steamstatic.com/steam/apps/2246340/header.jpg",
                "Capcom'un efsanevi canavar avlama serisinin yeni nesil grafiklerle buluşan oyunu."
        ));
        upcomingReleases.add(new UpcomingReleaseStat(
                "Death Stranding 2: On The Beach",
                "2026-06-15",
                List.of("PS5"),
                "https://cdn.cloudflare.steamstatic.com/steam/apps/1850570/header.jpg",
                "Hideo Kojima imzalı ödüllü başyapıtın gizemli hikayesini devam ettiren macera."
        ));
        upcomingReleases.add(new UpcomingReleaseStat(
                "Metroid Prime 4: Beyond",
                "2026-08-20",
                List.of("Nintendo Switch"),
                "https://cdn.cloudflare.steamstatic.com/steam/apps/412020/header.jpg",
                "Samus Aran'in galaksiyi korumak için çıktığı birinci şahıs macera ve aksiyon."
        ));
        upcomingReleases.add(new UpcomingReleaseStat(
                "The Witcher 4: Polaris",
                "2026-12-10",
                List.of("PC", "PS5", "Xbox Series X/S"),
                "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/header.jpg",
                "Yeni bir Witcher efsanesinin kapılarını aralayan Unreal Engine 5 tabanlı RPG."
        ));
        return upcomingReleases;
    }
}
