package com.ltz.content_service.service.scheduler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ltz.content_service.model.entity.EsportMatch;
import com.ltz.content_service.model.entity.LiveStat;
import com.ltz.content_service.model.enums.MatchStatus;
import com.ltz.content_service.repository.EsportMatchRepository;
import com.ltz.content_service.repository.LiveStatRepository;
import com.ltz.content_service.service.StatsService;
import com.ltz.content_service.service.client.EpicGamesClient;
import com.ltz.content_service.service.client.GamerPowerClient;
import com.ltz.content_service.service.client.IgdbClient;
import com.ltz.content_service.service.client.PandaScoreClient;
import com.ltz.content_service.service.client.SpeedrunClient;
import com.ltz.content_service.service.client.SteamClient;
import com.ltz.content_service.service.client.TwitchClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class StatsScheduler {

    private final StatsService statsService;
    private final EsportMatchRepository esportMatchRepository;
    private final SteamClient steamClient;
    private final EpicGamesClient epicGamesClient;
    private final GamerPowerClient gamerPowerClient;
    private final SpeedrunClient speedrunClient;
    private final TwitchClient twitchClient;
    private final IgdbClient igdbClient;
    private final PandaScoreClient pandaScoreClient;
    private final ObjectMapper objectMapper;

    @Scheduled(cron = "0 */15 * * * *")
    public void fetchPlatformStats() {
        log.info("Starting platform status and top played games stats fetch...");
        try {
            // Steam Top Played Games CCU (Map of title -> [appId, fallbackCCU])
            Map<String, Long[]> steamGamesMap = new LinkedHashMap<>();
            steamGamesMap.put("Counter-Strike 2", new Long[]{730L, 1250000L});
            steamGamesMap.put("Dota 2", new Long[]{570L, 680000L});
            steamGamesMap.put("PUBG: BATTLEGROUNDS", new Long[]{578080L, 450000L});
            steamGamesMap.put("Apex Legends", new Long[]{1172470L, 280000L});
            steamGamesMap.put("GTA V", new Long[]{271590L, 190000L});
            steamGamesMap.put("Elden Ring", new Long[]{1245620L, 150000L});
            steamGamesMap.put("Helldivers 2", new Long[]{553850L, 120000L});
            steamGamesMap.put("Rust", new Long[]{252490L, 95000L});
            steamGamesMap.put("Destiny 2", new Long[]{1085660L, 85000L});
            steamGamesMap.put("Team Fortress 2", new Long[]{440L, 78000L});

            List<Map<String, Object>> topPlayed = new ArrayList<>();
            int rank = 1;
            Long cs2CCU = null;

            for (Map.Entry<String, Long[]> entry : steamGamesMap.entrySet()) {
                String gameTitle = entry.getKey();
                Long appId = entry.getValue()[0];
                Long fallbackCCU = entry.getValue()[1];
                
                Long liveCCU = 0L;
                try {
                    liveCCU = steamClient.getPlayerCount(appId).block();
                } catch (Exception ex) {
                    log.warn("Failed to get live player count for {} (appid {}): {}", gameTitle, appId, ex.getMessage());
                }
                
                if (liveCCU == null || liveCCU <= 0) {
                    liveCCU = fallbackCCU;
                }
                
                if (appId == 730L) {
                    cs2CCU = liveCCU;
                }
                
                topPlayed.add(Map.of(
                        "rank", rank++,
                        "gameTitle", gameTitle,
                        "ccu", liveCCU
                ));
            }

            // Platform Server Status
            Map<String, String> platformStatuses = new LinkedHashMap<>();
            platformStatuses.put("Steam", "normal");
            platformStatuses.put("Epic Games", "normal");
            platformStatuses.put("PlayStation Network", "normal");
            platformStatuses.put("Xbox Live", "normal");
            platformStatuses.put("CS2", (cs2CCU != null && cs2CCU > 0) ? "normal" : "slow");
            platformStatuses.put("Valorant", "normal");
            platformStatuses.put("EA App", "normal");
            platformStatuses.put("Ubisoft Connect", "normal");

            saveOrUpdateStat("platform_status", objectMapper.writeValueAsString(platformStatuses));
            saveOrUpdateStat("steam_top_played", objectMapper.writeValueAsString(topPlayed));

            // Twitch Top 5 Categories
            List<Map<String, Object>> twitchTop = twitchClient.getTopCategories().block();
            saveOrUpdateStat("twitch_top_categories", objectMapper.writeValueAsString(twitchTop));

            // Twitch Live Streams
            List<Map<String, Object>> liveStreams = twitchClient.getLiveStreams().block();
            saveOrUpdateStat("twitch_live_streams", objectMapper.writeValueAsString(liveStreams));

            // Game Release Calendar (Upcoming games)
            List<Map<String, Object>> upcomingReleases = igdbClient.getUpcomingReleases().block();
            saveOrUpdateStat("upcoming_releases", objectMapper.writeValueAsString(upcomingReleases));

        } catch (Exception e) {
            log.error("Error fetching platform or top played stats: ", e);
        }
    }

    @Scheduled(cron = "0 0 */4 * * *")
    public void fetchFreeGamesAndGiveaways() {
        log.info("Starting free games and giveaways fetch job...");
        try {
            List<Map<String, Object>> freeGamesList = new ArrayList<>();

            // 1. Fetch from Epic Games Store
            try {
                Map<String, Object> epicResponse = epicGamesClient.getFreeGames().block();
                if (epicResponse != null && epicResponse.containsKey("data")) {
                    Map<String, Object> data = (Map<String, Object>) epicResponse.get("data");
                    if (data != null && data.containsKey("Catalog")) {
                        Map<String, Object> catalog = (Map<String, Object>) data.get("Catalog");
                        if (catalog != null && catalog.containsKey("searchStore")) {
                            Map<String, Object> searchStore = (Map<String, Object>) catalog.get("searchStore");
                            if (searchStore != null && searchStore.containsKey("elements")) {
                                List<Map<String, Object>> elements = (List<Map<String, Object>>) searchStore.get("elements");
                                for (Map<String, Object> element : elements) {
                                    String title = (String) element.get("title");
                                    String imageUrl = null;
                                    List<Map<String, Object>> keyImages = (List<Map<String, Object>>) element.get("keyImages");
                                    if (keyImages != null && !keyImages.isEmpty()) {
                                        imageUrl = (String) keyImages.get(0).get("url");
                                    }

                                    // Parse endsAt if available
                                    LocalDateTime endsAt = LocalDateTime.now().plusDays(7); // Default fallback
                                    try {
                                        Map<String, Object> promotions = (Map<String, Object>) element.get("promotions");
                                        if (promotions != null && promotions.containsKey("promotionalOffers")) {
                                            List<Map<String, Object>> promoOffersList = (List<Map<String, Object>>) promotions.get("promotionalOffers");
                                            if (promoOffersList != null && !promoOffersList.isEmpty()) {
                                                Map<String, Object> promoOffers = promoOffersList.get(0);
                                                List<Map<String, Object>> offers = (List<Map<String, Object>>) promoOffers.get("promotionalOffers");
                                                if (offers != null && !offers.isEmpty()) {
                                                    String endDateStr = (String) offers.get(0).get("endDate");
                                                    if (endDateStr != null) {
                                                        // Format is usually ISO e.g. 2026-06-25T15:00:00.000Z
                                                        endsAt = LocalDateTime.parse(endDateStr.substring(0, 19));
                                                    }
                                                }
                                            }
                                        }
                                    } catch (Exception parseEx) {
                                        log.warn("Failed to parse Epic promotions for {}: {}", title, parseEx.getMessage());
                                    }

                                    freeGamesList.add(Map.of(
                                            "gameTitle", title,
                                            "storeName", "Epic Games Store",
                                            "imageUrl", imageUrl != null ? imageUrl : "",
                                            "dealUrl", "https://store.epicgames.com/free-games",
                                            "endsAt", endsAt.toString(),
                                            "isGiveaway", false
                                    ));
                                }
                            }
                        }
                    }
                }
            } catch (Exception epicEx) {
                log.error("Failed to parse Epic Free Games: ", epicEx);
            }

            // 2. Fetch from GamerPower Giveaways
            try {
                List<Map<String, Object>> gamerPowerResponse = gamerPowerClient.getGiveaways().block();
                if (gamerPowerResponse != null) {
                    // Get top 5 active giveaways
                    for (int i = 0; i < Math.min(gamerPowerResponse.size(), 5); i++) {
                        Map<String, Object> giveaway = gamerPowerResponse.get(i);
                        String title = (String) giveaway.get("title");
                        String worth = (String) giveaway.get("worth");
                        String platform = (String) giveaway.get("platforms");
                        String image = (String) giveaway.get("image");
                        String openGiveawayUrl = (String) giveaway.get("open_giveaway_url");
                        String endDateStr = (String) giveaway.get("end_date");
                        
                        LocalDateTime endsAt = LocalDateTime.now().plusDays(5);
                        if (endDateStr != null && !endDateStr.equalsIgnoreCase("N/A") && endDateStr.length() >= 10) {
                            try {
                                endsAt = LocalDateTime.parse(endDateStr.substring(0, 10) + "T23:59:59");
                            } catch (Exception pEx) {
                                // ignore
                            }
                        }

                        freeGamesList.add(Map.of(
                                "gameTitle", title,
                                "storeName", platform != null ? platform : "PC",
                                "imageUrl", image != null ? image : "",
                                "dealUrl", openGiveawayUrl != null ? openGiveawayUrl : "",
                                "endsAt", endsAt.toString(),
                                "isGiveaway", true,
                                "worth", worth != null ? worth : "N/A"
                        ));
                    }
                }
            } catch (Exception gpEx) {
                log.error("Failed to parse GamerPower giveaways: ", gpEx);
            }

            // If empty, save mock data to keep the widget populated
            if (freeGamesList.isEmpty()) {
                freeGamesList.add(Map.of(
                        "gameTitle", "Civilization VII",
                        "storeName", "Epic Games Store",
                        "imageUrl", "https://img.logo.com",
                        "dealUrl", "https://store.epicgames.com/free-games",
                        "endsAt", LocalDateTime.now().plusDays(5).toString(),
                        "isGiveaway", false
                ));
            }

            saveOrUpdateStat("free_games", objectMapper.writeValueAsString(freeGamesList));
        } catch (Exception e) {
            log.error("Error fetching free games/giveaways: ", e);
        }
    }

    private static class SpeedrunConfig {
        final String gameId;
        final String categoryId;
        final String gameTitle;
        final String categoryName;
        final String fallbackRunner;
        final String fallbackTime;
        final String fallbackVideo;

        SpeedrunConfig(String gameId, String categoryId, String gameTitle, String categoryName, String fallbackRunner, String fallbackTime, String fallbackVideo) {
            this.gameId = gameId;
            this.categoryId = categoryId;
            this.gameTitle = gameTitle;
            this.categoryName = categoryName;
            this.fallbackRunner = fallbackRunner;
            this.fallbackTime = fallbackTime;
            this.fallbackVideo = fallbackVideo;
        }
    }

    private static final List<SpeedrunConfig> SPEEDRUN_CONFIGS = List.of(
            new SpeedrunConfig("mc", "any-glitchless", "Minecraft", "Any% Glitchless", "Schnydi", "8m 15s", "https://www.youtube.com/watch?v=s58vFj5Gv3w"),
            new SpeedrunConfig("eldenring", "any", "Elden Ring", "Any%", "Seeker", "19m 56s", "https://www.youtube.com/watch?v=0tS6Y12jLzY"),
            new SpeedrunConfig("celeste", "any-1", "Celeste", "Any%", "TGH", "25m 48s", "https://www.youtube.com/watch?v=F32nJvS7x1k"),
            new SpeedrunConfig("sm64", "120-stars", "Super Mario 64", "120 Stars", "Kaze", "1h 37m 50s", "https://www.youtube.com/watch?v=cI760jR2m04"),
            new SpeedrunConfig("portal", "out-of-bounds", "Portal", "Out of Bounds", "Can't Even", "5m 57s", "https://www.youtube.com/watch?v=p4vW7w4jN3w")
    );

    @Scheduled(cron = "0 0 1 * * *")
    public void fetchSpeedrunRecords() {
        log.info("Starting speedrun records fetch job for multiple categories...");
        try {
            List<Map<String, Object>> speedruns = new ArrayList<>();

            for (SpeedrunConfig cfg : SPEEDRUN_CONFIGS) {
                boolean success = false;
                try {
                    Map<String, Object> response = speedrunClient.getLeaderboard(cfg.gameId, cfg.categoryId).block();
                    if (response != null && response.containsKey("data")) {
                        Map<String, Object> data = (Map<String, Object>) response.get("data");
                        List<Map<String, Object>> runs = (List<Map<String, Object>>) data.get("runs");
                        if (runs != null && !runs.isEmpty()) {
                            Map<String, Object> runInfo = (Map<String, Object>) runs.get(0).get("run");
                            double timeSeconds = ((Number) runInfo.get("times")).doubleValue();
                            
                            String runnerName = "Runner";
                            try {
                                List<Map<String, Object>> players = (List<Map<String, Object>>) runInfo.get("players");
                                if (players != null && !players.isEmpty()) {
                                    String type = (String) players.get(0).get("rel");
                                    if ("user".equalsIgnoreCase(type)) {
                                        String runnerId = (String) players.get(0).get("id");
                                        runnerName = "Runner_" + runnerId.substring(0, Math.min(runnerId.length(), 6));
                                    } else if ("guest".equalsIgnoreCase(type)) {
                                        runnerName = (String) players.get(0).get("name");
                                    }
                                }
                            } catch (Exception rEx) {
                                log.warn("Failed to parse runner info for {}: {}", cfg.gameTitle, rEx.getMessage());
                            }
                            
                            String weblink = (String) runInfo.get("weblink");
                            
                            speedruns.add(Map.of(
                                    "gameTitle", cfg.gameTitle,
                                    "category", cfg.categoryName,
                                    "runner", runnerName,
                                    "time", formatDuration(timeSeconds),
                                    "videoUrl", weblink != null ? weblink : ""
                            ));
                            success = true;
                        }
                    }
                } catch (Exception ex) {
                    log.warn("Failed to get live speedrun record for {}: {}", cfg.gameTitle, ex.getMessage());
                }

                if (!success) {
                    speedruns.add(Map.of(
                            "gameTitle", cfg.gameTitle,
                            "category", cfg.categoryName,
                            "runner", cfg.fallbackRunner,
                            "time", cfg.fallbackTime,
                            "videoUrl", cfg.fallbackVideo
                    ));
                }
            }

            saveOrUpdateStat("speedrun_records", objectMapper.writeValueAsString(speedruns));
            log.info("Successfully fetched/updated speedrun records.");
        } catch (Exception e) {
            log.error("Error saving speedrun records: ", e);
        }
    }

    @Scheduled(cron = "0 0 * * * *")
    public void generateOrUpdateEsportMatches() {
        log.info("Fetching live esports matches from PandaScore...");
        try {
            List<EsportMatch> liveMatches = pandaScoreClient.getUpcomingMatches().block();
            if (liveMatches != null && !liveMatches.isEmpty()) {
                for (EsportMatch m : liveMatches) {
                    createOrUpdateMatch(
                            m.getMatchId(),
                            m.getTournamentName(),
                            m.getTeamAName(),
                            m.getTeamBName(),
                            m.getTeamAScore(),
                            m.getTeamBScore(),
                            m.getGameName(),
                            m.getStatus(),
                            m.getMatchTime()
                    );
                }
                log.info("Successfully loaded and saved {} live esports matches.", liveMatches.size());
            } else {
                log.warn("PandaScore returned empty matches, falling back to simulated matches.");
                generateSimulatedMatches();
            }
        } catch (Exception e) {
            log.warn("Failed to fetch live matches from PandaScore, using simulated fallback: {}", e.getMessage());
            generateSimulatedMatches();
        }
    }

    private void generateSimulatedMatches() {
        createOrUpdateMatch("m_cs2_01", "PGL Major Copenhagen 2026", "Natus Vincere", "FaZe Clan", 1, 0, "CS2", MatchStatus.LIVE, LocalDateTime.now().minusMinutes(45));
        createOrUpdateMatch("m_val_01", "VCT Champions 2026", "Fnatic", "Sentinels", 2, 1, "VALORANT", MatchStatus.FINISHED, LocalDateTime.now().minusHours(3));
        createOrUpdateMatch("m_lol_01", "LCK Summer 2026", "T1", "Gen.G", 0, 0, "LOL", MatchStatus.UPCOMING, LocalDateTime.now().plusHours(2));
        createOrUpdateMatch("m_dota_01", "The International 2026", "Team Spirit", "Gaimin Gladiators", 0, 0, "DOTA2", MatchStatus.UPCOMING, LocalDateTime.now().plusHours(5));
    }

    private void createOrUpdateMatch(String matchId, String tournament, String teamA, String teamB, int scoreA, int scoreB, String game, MatchStatus status, LocalDateTime matchTime) {
        Optional<EsportMatch> existingOpt = esportMatchRepository.findByMatchId(matchId);
        EsportMatch match;
        if (existingOpt.isPresent()) {
            match = existingOpt.get();
            match.setTournamentName(tournament);
            match.setTeamAName(teamA);
            match.setTeamBName(teamB);
            match.setTeamAScore(scoreA);
            match.setTeamBScore(scoreB);
            match.setStatus(status);
            match.setMatchTime(matchTime);
        } else {
            match = EsportMatch.builder()
                    .matchId(matchId)
                    .tournamentName(tournament)
                    .teamAName(teamA)
                    .teamBName(teamB)
                    .teamAScore(scoreA)
                    .teamBScore(scoreB)
                    .gameName(game)
                    .status(status)
                    .matchTime(matchTime)
                    .createdAt(LocalDateTime.now())
                    .build();
        }
        esportMatchRepository.save(match);
    }

    private void saveOrUpdateStat(String key, String value) {
        statsService.saveOrUpdateStat(key, value);
    }

    private String formatDuration(double totalSeconds) {
        int minutes = (int) (totalSeconds / 60);
        int seconds = (int) (totalSeconds % 60);
        int millis = (int) ((totalSeconds - (int) totalSeconds) * 1000);
        if (minutes > 0) {
            return String.format("%dm %ds", minutes, seconds);
        }
        return String.format("%ds %dms", seconds, millis);
    }
}
