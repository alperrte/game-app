package com.ltz.game_service.service;

import com.ltz.game_service.dto.response.external.ExternalGameSearchResponse;
import com.ltz.game_service.entity.GameImportJob;
import com.ltz.game_service.entity.GameImportLog;
import com.ltz.game_service.entity.enums.GameSource;
import com.ltz.game_service.entity.enums.ImportLogLevel;
import com.ltz.game_service.entity.enums.ImportStatus;
import com.ltz.game_service.entity.enums.ImportTriggerType;
import com.ltz.game_service.entity.enums.SyncStatus;
import com.ltz.game_service.exception.UnsupportedGameSourceException;
import com.ltz.game_service.provider.ExternalGameImportData;
import com.ltz.game_service.provider.ExternalGameProvider;
import com.ltz.game_service.repository.GameImportJobRepository;
import com.ltz.game_service.repository.GameImportLogRepository;
import com.ltz.game_service.repository.GameImportSyncStateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Steam (ve ileride Epic) için artımlı (progressive) import orkestrasyonu.
 * Her çalışmada sınırlı bir batch işlenir; yavaş dış API çağrıları burada,
 * kısa DB işlemleri {@link GameImportPersister} içinde yapılır.
 */
@Service
public class GameImportService {

    private static final Logger log = LoggerFactory.getLogger(GameImportService.class);

    private final Map<GameSource, ExternalGameProvider> providers;
    private final GameImportPersister persister;
    private final GameImportJobRepository jobRepository;
    private final GameImportLogRepository logRepository;
    private final GameImportSyncStateRepository syncStateRepository;

    @Value("${steam.import.enabled:false}")
    private boolean steamImportEnabled;

    @Value("${steam.import.batch-size:150}")
    private int batchSize;

    @Value("${steam.import.refresh-ttl-days:7}")
    private int refreshTtlDays;

    @Value("${steam.import.request-delay-ms:1200}")
    private long requestDelayMs;

    public GameImportService(
            List<ExternalGameProvider> providerList,
            GameImportPersister persister,
            GameImportJobRepository jobRepository,
            GameImportLogRepository logRepository,
            GameImportSyncStateRepository syncStateRepository
    ) {
        this.providers = providerList.stream()
                .collect(Collectors.toMap(ExternalGameProvider::getSource, provider -> provider));
        this.persister = persister;
        this.jobRepository = jobRepository;
        this.logRepository = logRepository;
        this.syncStateRepository = syncStateRepository;
    }

    /**
     * Zamanlanmış Steam import. steam.import.enabled=false ise (varsayılan) çalışmaz.
     */
    @Scheduled(cron = "${steam.import.cron:0 0 3 * * *}")
    public void scheduledSteamImport() {
        if (!steamImportEnabled) {
            return;
        }

        log.info("Zamanlanmış Steam import başlatılıyor.");
        importGames(GameSource.STEAM, ImportTriggerType.SCHEDULED);
    }

    /**
     * Manuel tetikleme için asenkron sarmalayıcı. HTTP isteğini bloklamadan import başlatır.
     */
    @Async
    public void importGamesAsync(GameSource source, ImportTriggerType triggerType) {
        importGames(source, triggerType);
    }

    public GameImportJob importGames(GameSource source, ImportTriggerType triggerType) {
        GameImportJob job = new GameImportJob();
        job.setSource(source);
        job.setStatus(ImportStatus.RUNNING);
        job.setTriggerType(triggerType);
        job.setStartedAt(LocalDateTime.now());
        job = jobRepository.save(job);

        int found = 0;
        int added = 0;
        int updated = 0;
        int skipped = 0;
        int failed = 0;

        try {
            ExternalGameProvider provider = providers.get(source);

            if (provider == null) {
                throw new UnsupportedGameSourceException(source);
            }

            List<ExternalGameSearchResponse> candidates = provider.getImportCandidates();
            LocalDateTime cutoff = LocalDateTime.now().minusDays(refreshTtlDays);

            Set<String> recentlyProcessed = new HashSet<>(
                    syncStateRepository.findRecentlyProcessedExternalIds(
                            source,
                            List.of(SyncStatus.IMPORTED, SyncStatus.SKIPPED),
                            cutoff
                    )
            );

            List<ExternalGameSearchResponse> batch = new ArrayList<>();

            for (ExternalGameSearchResponse candidate : candidates) {
                if (batch.size() >= batchSize) {
                    break;
                }

                String externalId = candidate.getExternalId();

                if (externalId == null || externalId.isBlank() || recentlyProcessed.contains(externalId)) {
                    continue;
                }

                batch.add(candidate);
            }

            found = batch.size();

            writeLog(job.getId(), ImportLogLevel.INFO, null,
                    "Aday sayısı: " + candidates.size() + ", bu çalışmada işlenecek: " + found);

            for (ExternalGameSearchResponse candidate : batch) {
                String externalId = candidate.getExternalId();

                try {
                    ExternalGameImportData data = provider.fetchImportData(externalId);

                    if (data == null) {
                        persister.markSyncState(source, externalId, SyncStatus.SKIPPED, null,
                                "Veri yok veya uygunsuz içerik");
                        skipped++;
                        continue;
                    }

                    if (data.getAppType() != null && !"game".equalsIgnoreCase(data.getAppType())) {
                        persister.markSyncState(source, externalId, SyncStatus.SKIPPED, data.getAppType(),
                                "Oyun değil: " + data.getAppType());
                        skipped++;
                        continue;
                    }

                    boolean isNew = persister.persistGame(source, externalId, candidate, data);
                    persister.markSyncState(source, externalId, SyncStatus.IMPORTED, data.getAppType(), null);

                    if (isNew) {
                        added++;
                    } else {
                        updated++;
                    }
                } catch (Exception itemException) {
                    String message = itemException.getMessage();
                    persister.markSyncState(source, externalId, SyncStatus.FAILED, null, message);
                    writeLog(job.getId(), ImportLogLevel.ERROR, externalId, message);
                    failed++;
                }

                sleepBetweenRequests();
            }

            job.setStatus(resolveStatus(added, updated, failed));
            job.setMessage("Import tamamlandı.");
        } catch (Exception exception) {
            job.setStatus(ImportStatus.FAILED);
            job.setMessage(exception.getMessage());
            writeLog(job.getId(), ImportLogLevel.ERROR, null, exception.getMessage());
            log.error("Import job başarısız: source={}", source, exception);
        } finally {
            job.setFoundCount(found);
            job.setAddedCount(added);
            job.setUpdatedCount(updated);
            job.setSkippedCount(skipped);
            job.setFailedCount(failed);
            job.setFinishedAt(LocalDateTime.now());
            job = jobRepository.save(job);
        }

        return job;
    }

    private ImportStatus resolveStatus(int added, int updated, int failed) {
        boolean anySuccess = (added + updated) > 0;

        if (failed > 0) {
            return anySuccess ? ImportStatus.PARTIAL : ImportStatus.FAILED;
        }

        return ImportStatus.SUCCESS;
    }

    private void sleepBetweenRequests() {
        if (requestDelayMs <= 0) {
            return;
        }

        try {
            Thread.sleep(requestDelayMs);
        } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
        }
    }

    private void writeLog(Long jobId, ImportLogLevel level, String externalId, String message) {
        try {
            String safeMessage = message == null
                    ? null
                    : (message.length() > 2000 ? message.substring(0, 2000) : message);

            logRepository.save(new GameImportLog(jobId, level, externalId, safeMessage));
        } catch (Exception logException) {
            log.warn("Import log yazılamadı: {}", logException.getMessage());
        }
    }
}
