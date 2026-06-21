package com.ltz.content_service.service.client;

import com.ltz.content_service.model.entity.EsportMatch;
import com.ltz.content_service.model.enums.MatchStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class PandaScoreClient {

    private final WebClient webClient;

    @Value("${pandascore.api-key:}")
    private String apiKey;

    public Mono<List<EsportMatch>> getUpcomingMatches() {
        if (apiKey == null || apiKey.isBlank()) {
            return Mono.error(new IllegalStateException("PandaScore API key is not configured"));
        }

        Mono<List<EsportMatch>> runningMono = webClient.get()
                .uri("https://api.pandascore.co/matches/running?per_page=20")
                .header("Authorization", "Bearer " + apiKey)
                .retrieve()
                .bodyToMono(List.class)
                .map(list -> parsePandaScoreMatches(list))
                .onErrorResume(e -> {
                    log.error("PandaScore running matches API request failed: ", e);
                    return Mono.just(Collections.emptyList());
                });

        Mono<List<EsportMatch>> upcomingMono = webClient.get()
                .uri("https://api.pandascore.co/matches/upcoming?per_page=50")
                .header("Authorization", "Bearer " + apiKey)
                .retrieve()
                .bodyToMono(List.class)
                .map(list -> parsePandaScoreMatches(list))
                .onErrorResume(e -> {
                    log.error("PandaScore upcoming matches API request failed: ", e);
                    return Mono.just(Collections.emptyList());
                });

        return Mono.zip(runningMono, upcomingMono)
                .map(tuple -> {
                    List<EsportMatch> combined = new ArrayList<>();
                    combined.addAll(tuple.getT1());
                    combined.addAll(tuple.getT2());
                    return combined;
                });
    }

    @SuppressWarnings("unchecked")
    private List<EsportMatch> parsePandaScoreMatches(List<?> responseList) {
        List<EsportMatch> matches = new ArrayList<>();
        if (responseList == null) {
            return matches;
        }

        for (Object obj : responseList) {
            try {
                Map<String, Object> matchMap = (Map<String, Object>) obj;
                String matchId = String.valueOf(matchMap.get("id"));
                
                Map<String, Object> league = (Map<String, Object>) matchMap.get("league");
                String tournamentName = league != null ? (String) league.get("name") : "Esports Tournament";

                List<Map<String, Object>> opponents = (List<Map<String, Object>>) matchMap.get("opponents");
                String teamAName = "TBD";
                String teamBName = "TBD";
                if (opponents != null && opponents.size() > 0) {
                    Map<String, Object> opA = (Map<String, Object>) opponents.get(0).get("opponent");
                    if (opA != null) teamAName = (String) opA.get("name");
                }
                if (opponents != null && opponents.size() > 1) {
                    Map<String, Object> opB = (Map<String, Object>) opponents.get(1).get("opponent");
                    if (opB != null) teamBName = (String) opB.get("name");
                }

                // Filter out TBD vs TBD matches to prevent cluttering the UI
                if (teamAName.equalsIgnoreCase("TBD") && teamBName.equalsIgnoreCase("TBD")) {
                    continue;
                }

                List<Map<String, Object>> results = (List<Map<String, Object>>) matchMap.get("results");
                int teamAScore = 0;
                int teamBScore = 0;
                if (results != null && results.size() > 0) {
                    Number scoreA = (Number) results.get(0).get("score");
                    if (scoreA != null) teamAScore = scoreA.intValue();
                }
                if (results != null && results.size() > 1) {
                    Number scoreB = (Number) results.get(1).get("score");
                    if (scoreB != null) teamBScore = scoreB.intValue();
                }

                Map<String, Object> videogame = (Map<String, Object>) matchMap.get("videogame");
                String gameName = videogame != null ? (String) videogame.get("name") : "Esports";
                if (gameName.equalsIgnoreCase("Counter-Strike")) {
                    gameName = "CS2";
                }

                String statusStr = (String) matchMap.get("status");
                MatchStatus status = MatchStatus.UPCOMING;
                if ("running".equalsIgnoreCase(statusStr)) {
                    status = MatchStatus.LIVE;
                } else if ("finished".equalsIgnoreCase(statusStr)) {
                    status = MatchStatus.FINISHED;
                }

                String beginAtStr = (String) matchMap.get("begin_at");
                LocalDateTime matchTime = LocalDateTime.now();
                if (beginAtStr != null) {
                    matchTime = OffsetDateTime.parse(beginAtStr)
                            .atZoneSameInstant(ZoneId.systemDefault())
                            .toLocalDateTime();
                }

                EsportMatch match = EsportMatch.builder()
                        .matchId("ps_" + matchId)
                        .tournamentName(tournamentName)
                        .teamAName(teamAName)
                        .teamBName(teamBName)
                        .teamAScore(teamAScore)
                        .teamBScore(teamBScore)
                        .gameName(gameName)
                        .status(status)
                        .matchTime(matchTime)
                        .createdAt(LocalDateTime.now())
                        .build();
                matches.add(match);
            } catch (Exception ex) {
                log.warn("Failed to parse individual PandaScore match details: {}", ex.getMessage());
            }
        }
        return matches;
    }
}
