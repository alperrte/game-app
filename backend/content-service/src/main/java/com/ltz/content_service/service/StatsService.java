package com.ltz.content_service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ltz.content_service.dto.EsportMatchResponse;
import com.ltz.content_service.exception.ResourceNotFoundException;
import com.ltz.content_service.entity.EsportMatch;
import com.ltz.content_service.entity.LiveStat;
import com.ltz.content_service.enums.MatchStatus;
import com.ltz.content_service.repository.EsportMatchRepository;
import com.ltz.content_service.repository.LiveStatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatsService {

    private final LiveStatRepository liveStatRepository;
    private final EsportMatchRepository esportMatchRepository;
    private final ObjectMapper objectMapper;

    @Cacheable(value = "stats")
    public Map<String, Object> getAllStats() {
        List<LiveStat> statsList = liveStatRepository.findAll();
        Map<String, Object> allStats = new HashMap<>();

        for (LiveStat stat : statsList) {
            try {
                Object parsedVal = objectMapper.readValue(stat.getStatValue(), Object.class);
                allStats.put(stat.getStatKey(), parsedVal);
            } catch (Exception e) {
                log.error("Failed to parse stat value for key {}: ", stat.getStatKey(), e);
                allStats.put(stat.getStatKey(), stat.getStatValue());
            }
        }
        return allStats;
    }

    @Cacheable(value = "stats", key = "#key")
    public Object getStatByKey(String key) {
        LiveStat stat = liveStatRepository.findByStatKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Stat not found with key: " + key));
        try {
            return objectMapper.readValue(stat.getStatValue(), Object.class);
        } catch (Exception e) {
            log.error("Failed to parse stat value for key {}: ", key, e);
            return stat.getStatValue();
        }
    }

    @Transactional
    @CacheEvict(value = "stats", allEntries = true)
    public void saveOrUpdateStat(String key, String value) {
        Optional<LiveStat> statOpt = liveStatRepository.findByStatKey(key);
        LiveStat stat;
        if (statOpt.isPresent()) {
            stat = statOpt.get();
            stat.setStatValue(value);
            stat.setReliable(true);
            stat.setUpdatedAt(java.time.LocalDateTime.now());
        } else {
            stat = LiveStat.builder()
                    .statKey(key)
                    .statValue(value)
                    .isReliable(true)
                    .updatedAt(java.time.LocalDateTime.now())
                    .build();
        }
        liveStatRepository.save(stat);
        log.info("Saved/updated live stat (and evicted cache) for key: {}", key);
    }

    public List<EsportMatchResponse> getEsportMatches(String status) {
        List<EsportMatch> matches;
        if (status != null && !status.isBlank()) {
            try {
                MatchStatus matchStatus = MatchStatus.valueOf(status.toUpperCase());
                matches = esportMatchRepository.findByStatusOrderByMatchTimeAsc(matchStatus);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid match status requested: {}, returning all", status);
                matches = esportMatchRepository.findAll();
            }
        } else {
            matches = esportMatchRepository.findAll();
        }
        return matches.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private EsportMatchResponse mapToResponse(EsportMatch match) {
        return EsportMatchResponse.builder()
                .id(match.getId())
                .matchId(match.getMatchId())
                .tournamentName(match.getTournamentName())
                .teamAName(match.getTeamAName())
                .teamBName(match.getTeamBName())
                .teamAScore(match.getTeamAScore())
                .teamBScore(match.getTeamBScore())
                .gameName(match.getGameName())
                .status(match.getStatus())
                .matchTime(match.getMatchTime())
                .isSimulated(match.isSimulated())
                .build();
    }
}
