package com.ltz.game_service.service;

import com.ltz.game_service.dto.response.external.ExternalGameDetailResponse;
import com.ltz.game_service.dto.response.external.ExternalGameSearchResponse;
import com.ltz.game_service.entity.ExternalGameId;
import com.ltz.game_service.entity.Game;
import com.ltz.game_service.entity.GameImportSyncState;
import com.ltz.game_service.entity.GameStoreAvailability;
import com.ltz.game_service.entity.enums.GameSource;
import com.ltz.game_service.entity.enums.SyncStatus;
import com.ltz.game_service.provider.ExternalGameImportData;
import com.ltz.game_service.repository.ExternalGameIdRepository;
import com.ltz.game_service.repository.GameImportSyncStateRepository;
import com.ltz.game_service.repository.GameRepository;
import com.ltz.game_service.repository.GameStoreAvailabilityRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Import sırasındaki kısa, işlem-bazlı (transactional) DB yazımlarını yönetir.
 * Yavaş dış API çağrıları {@link GameImportService} içinde kalır; burada sadece
 * tek oyunun upsert'ü ve senkron durumu güncellenir.
 */
@Component
public class GameImportPersister {

    private static final Pattern RELEASE_DATE_PATTERN =
            Pattern.compile("(\\d{1,2})\\s+([\\p{L}]+)\\.?,?\\s+(\\d{4})");

    // Steam'in (l=turkish) ve İngilizce ay kısaltma/isimlerini ay numarasına eşler.
    private static final Map<String, Integer> MONTHS = Map.ofEntries(
            Map.entry("oca", 1), Map.entry("ock", 1), Map.entry("jan", 1),
            Map.entry("sub", 2), Map.entry("feb", 2),
            Map.entry("mar", 3),
            Map.entry("nis", 4), Map.entry("apr", 4),
            Map.entry("may", 5),
            Map.entry("haz", 6), Map.entry("jun", 6),
            Map.entry("tem", 7), Map.entry("jul", 7),
            Map.entry("agu", 8), Map.entry("aug", 8),
            Map.entry("eyl", 9), Map.entry("sep", 9),
            Map.entry("eki", 10), Map.entry("oct", 10),
            Map.entry("kas", 11), Map.entry("nov", 11),
            Map.entry("ara", 12), Map.entry("dec", 12)
    );

    private final GameRepository gameRepository;
    private final ExternalGameIdRepository externalGameIdRepository;
    private final GameStoreAvailabilityRepository storeAvailabilityRepository;
    private final GameImportSyncStateRepository syncStateRepository;

    public GameImportPersister(
            GameRepository gameRepository,
            ExternalGameIdRepository externalGameIdRepository,
            GameStoreAvailabilityRepository storeAvailabilityRepository,
            GameImportSyncStateRepository syncStateRepository
    ) {
        this.gameRepository = gameRepository;
        this.externalGameIdRepository = externalGameIdRepository;
        this.storeAvailabilityRepository = storeAvailabilityRepository;
        this.syncStateRepository = syncStateRepository;
    }

    /**
     * Oyunu external id eşleştirmesine göre ekler veya günceller (upsert).
     * @return yeni eklendiyse true, mevcut güncellendiyse false
     */
    @Transactional
    public boolean persistGame(
            GameSource source,
            String externalId,
            ExternalGameSearchResponse candidate,
            ExternalGameImportData importData
    ) {
        ExternalGameDetailResponse detail = importData.getDetail();

        Optional<ExternalGameId> existingMapping =
                externalGameIdRepository.findBySourceAndExternalId(source, externalId);

        Game game = existingMapping.map(ExternalGameId::getGame).orElseGet(Game::new);
        boolean isNew = existingMapping.isEmpty();

        String title = detail.getTitle() != null && !detail.getTitle().isBlank()
                ? detail.getTitle()
                : candidate.getTitle();

        String coverImageUrl = detail.getCoverImageUrl() != null && !detail.getCoverImageUrl().isBlank()
                ? detail.getCoverImageUrl()
                : candidate.getCoverImageUrl();

        game.setSource(source);
        game.setTitle(truncate(title, 150));
        game.setDescription(truncate(detail.getDescription(), 3000));
        game.setGenre(truncate(detail.getGenre(), 100));
        game.setPlatform(truncate(detail.getPlatform(), 100));
        game.setReleaseDate(parseReleaseDate(detail.getReleaseDate()));
        game.setDeveloper(truncate(detail.getDeveloper(), 150));
        game.setMinimumSystemRequirements(truncate(detail.getMinimumSystemRequirements(), 2000));
        game.setRecommendedSystemRequirements(truncate(detail.getRecommendedSystemRequirements(), 2000));
        game.setSupportedLanguages(truncate(detail.getSupportedLanguages(), 500));
        game.setCoverImageUrl(truncate(coverImageUrl, 500));
        game.setTurkishLanguageSupport(Boolean.TRUE.equals(detail.getTurkishLanguageSupport()));
        game.setOnSale(Boolean.TRUE.equals(detail.getOnSale()));

        game = gameRepository.save(game);

        ExternalGameId mapping = existingMapping.orElseGet(ExternalGameId::new);
        mapping.setGame(game);
        mapping.setSource(source);
        mapping.setExternalId(externalId);
        mapping.setLastSyncedAt(LocalDateTime.now());
        externalGameIdRepository.save(mapping);

        GameStoreAvailability availability = storeAvailabilityRepository
                .findByGameAndSource(game, source)
                .orElseGet(GameStoreAvailability::new);

        availability.setGame(game);
        availability.setSource(source);
        availability.setStoreStatus("ACTIVE");
        availability.setIsFree(importData.isFree());
        availability.setPriceFinal(importData.getPriceFinal());
        availability.setPriceInitial(importData.getPriceInitial());
        availability.setCurrency(importData.getCurrency());
        availability.setDiscountPercent(importData.getDiscountPercent());
        availability.setRegion("TR");
        availability.setStoreUrl(importData.getStoreUrl());
        availability.setLastCheckedAt(LocalDateTime.now());
        storeAvailabilityRepository.save(availability);

        return isNew;
    }

    @Transactional
    public void markSyncState(
            GameSource source,
            String externalId,
            SyncStatus status,
            String appType,
            String message
    ) {
        GameImportSyncState state = syncStateRepository
                .findBySourceAndExternalId(source, externalId)
                .orElseGet(GameImportSyncState::new);

        state.setSource(source);
        state.setExternalId(externalId);
        state.setStatus(status);

        if (appType != null) {
            state.setAppType(truncate(appType, 50));
        }

        state.setAttempts(state.getAttempts() == null ? 1 : state.getAttempts() + 1);
        state.setLastAttemptAt(LocalDateTime.now());

        if (status == SyncStatus.IMPORTED) {
            state.setLastSyncedAt(LocalDateTime.now());
        }

        state.setMessage(truncate(message, 1000));
        syncStateRepository.save(state);
    }

    private LocalDate parseReleaseDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String cleaned = value.trim();

        // ISO formatı (yyyy-MM-dd)
        try {
            return LocalDate.parse(cleaned, DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (Exception ignored) {
            // Diğer formatlar denenecek.
        }

        // "10 Eki 2023", "10 Oct, 2023", "10 Ekim 2023" gibi formatlar
        Matcher matcher = RELEASE_DATE_PATTERN.matcher(cleaned);

        if (matcher.find()) {
            try {
                int day = Integer.parseInt(matcher.group(1));
                String monthToken = normalizeMonth(matcher.group(2));
                int year = Integer.parseInt(matcher.group(3));

                Integer month = resolveMonth(monthToken);

                if (month != null && day >= 1) {
                    int maxDay = LocalDate.of(year, month, 1).lengthOfMonth();
                    return LocalDate.of(year, month, Math.min(day, maxDay));
                }
            } catch (Exception ignored) {
                return null;
            }
        }

        return null;
    }

    private Integer resolveMonth(String monthToken) {
        if (monthToken.length() >= 3) {
            Integer byPrefix = MONTHS.get(monthToken.substring(0, 3));
            if (byPrefix != null) {
                return byPrefix;
            }
        }

        return MONTHS.get(monthToken);
    }

    private String normalizeMonth(String value) {
        return java.text.Normalizer.normalize(value.toLowerCase(Locale.ROOT), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace("ı", "i")
                .replaceAll("[^a-z]", "");
    }

    private String truncate(String value, int maxLength) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();

        if (trimmed.isEmpty()) {
            return null;
        }

        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength);
    }
}
