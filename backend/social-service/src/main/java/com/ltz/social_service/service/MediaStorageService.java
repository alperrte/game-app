package com.ltz.social_service.service;

import com.ltz.social_service.entity.MediaAsset;
import com.ltz.social_service.enums.MediaAssetStatus;
import com.ltz.social_service.enums.MediaAssetType;
import com.ltz.social_service.repository.MediaAssetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class MediaStorageService {

    private static final String IMAGE_MEDIA_PREFIX = "/api/social/media/images/";
    private static final String VIDEO_MEDIA_PREFIX = "/api/social/media/videos/";
    private static final Set<MediaAssetStatus> ACTIVE_STORAGE_STATUSES = Set.of(
            MediaAssetStatus.PENDING,
            MediaAssetStatus.ATTACHED
    );

    private final MediaAssetRepository mediaAssetRepository;

    @Value("${app.media.upload-dir:uploads/social-images}")
    private String imageUploadDir;

    @Value("${app.media.video-upload-dir:uploads/social-videos}")
    private String videoUploadDir;

    @Value("${app.media.max-user-storage-bytes:524288000}")
    private long maxUserStorageBytes;

    @Value("${app.media.daily-upload-limit:20}")
    private long dailyUploadLimit;

    public void ensureUploadAllowed(Long ownerUserId, long nextUploadSizeBytes) {
        long usedBytes = mediaAssetRepository.sumSizeBytesByOwnerAndStatuses(
                ownerUserId,
                ACTIVE_STORAGE_STATUSES
        );

        if (usedBytes + nextUploadSizeBytes > maxUserStorageBytes) {
            throw new IllegalStateException("Medya kotan dolu. En fazla " + formatMegabytes(maxUserStorageBytes) + " medya saklayabilirsin.");
        }

        long uploadsToday = mediaAssetRepository.countByOwnerUserIdAndCreatedAtAfterAndStatusNot(
                ownerUserId,
                LocalDateTime.now().minusHours(24),
                MediaAssetStatus.DELETED
        );

        if (uploadsToday >= dailyUploadLimit) {
            throw new IllegalStateException("Günlük medya yükleme limitine ulaştın. Lütfen daha sonra tekrar dene.");
        }
    }

    public MediaAsset createPendingMedia(
            Long ownerUserId,
            MediaAssetType mediaType,
            String url,
            String fileName,
            String contentType,
            long sizeBytes
    ) {
        MediaAsset mediaAsset = MediaAsset.builder()
                .ownerUserId(ownerUserId)
                .mediaType(mediaType)
                .status(MediaAssetStatus.PENDING)
                .url(url)
                .fileName(fileName)
                .contentType(contentType)
                .sizeBytes(sizeBytes)
                .build();

        return mediaAssetRepository.save(mediaAsset);
    }

    public void attachMediaToPost(String mediaUrl, Long ownerUserId, Long postId) {
        if (mediaUrl == null || mediaUrl.isBlank()) {
            return;
        }

        MediaAsset mediaAsset = mediaAssetRepository.findByUrl(mediaUrl)
                .orElseThrow(() -> new IllegalArgumentException("Gönderiye eklenen medya bulunamadı."));

        if (!mediaAsset.getOwnerUserId().equals(ownerUserId)) {
            throw new IllegalStateException("Sadece kendi yüklediğin medyayı gönderiye ekleyebilirsin.");
        }

        if (MediaAssetStatus.DELETED.equals(mediaAsset.getStatus())) {
            throw new IllegalStateException("Silinmiş medya gönderiye eklenemez.");
        }

        if (
                MediaAssetStatus.ATTACHED.equals(mediaAsset.getStatus())
                        && mediaAsset.getPostId() != null
                        && !mediaAsset.getPostId().equals(postId)
        ) {
            throw new IllegalStateException("Bu medya zaten başka bir gönderiye eklenmiş.");
        }

        mediaAsset.setPostId(postId);
        mediaAsset.setStatus(MediaAssetStatus.ATTACHED);
        mediaAsset.setAttachedAt(LocalDateTime.now());
        mediaAssetRepository.save(mediaAsset);
    }

    public void attachMediaToPost(List<String> mediaUrls, Long ownerUserId, Long postId) {
        if (mediaUrls == null || mediaUrls.isEmpty()) {
            return;
        }

        for (String mediaUrl : mediaUrls) {
            attachMediaToPost(mediaUrl, ownerUserId, postId);
        }
    }

    @Transactional(readOnly = true)
    public Optional<MediaAssetType> findMediaTypeByUrl(String mediaUrl) {
        if (mediaUrl == null || mediaUrl.isBlank()) {
            return Optional.empty();
        }

        return mediaAssetRepository.findByUrl(mediaUrl).map(MediaAsset::getMediaType);
    }

    @Transactional(readOnly = true)
    public List<MediaAsset> findAttachedMediaByPostId(Long postId) {
        return mediaAssetRepository.findByPostIdAndStatusOrderByIdAsc(
                postId,
                MediaAssetStatus.ATTACHED
        );
    }

    public void deleteMediaByUrl(String mediaUrl) {
        if (mediaUrl == null || mediaUrl.isBlank()) {
            return;
        }

        mediaAssetRepository.findByUrl(mediaUrl).ifPresent((mediaAsset) -> {
            mediaAsset.setStatus(MediaAssetStatus.DELETED);
            mediaAsset.setDeletedAt(LocalDateTime.now());
            mediaAssetRepository.save(mediaAsset);
        });

        deletePhysicalMediaByUrl(mediaUrl);
    }

    public void deleteMediaByPostId(Long postId) {
        List<MediaAsset> mediaAssets = findAttachedMediaByPostId(postId);

        for (MediaAsset mediaAsset : mediaAssets) {
            deleteMediaByUrl(mediaAsset.getUrl());
        }
    }

    public void deletePhysicalMediaByUrl(String mediaUrl) {
        if (mediaUrl == null || mediaUrl.isBlank()) {
            return;
        }

        if (mediaUrl.startsWith(IMAGE_MEDIA_PREFIX)) {
            deleteFile(imageUploadDir, mediaUrl.substring(IMAGE_MEDIA_PREFIX.length()));
            return;
        }

        if (mediaUrl.startsWith(VIDEO_MEDIA_PREFIX)) {
            deleteFile(videoUploadDir, mediaUrl.substring(VIDEO_MEDIA_PREFIX.length()));
        }
    }

    public int cleanupPendingMedia(Duration maxPendingAge) {
        LocalDateTime cutoff = LocalDateTime.now().minus(maxPendingAge);
        List<MediaAsset> expiredAssets = mediaAssetRepository.findByStatusAndCreatedAtBefore(
                MediaAssetStatus.PENDING,
                cutoff
        );

        for (MediaAsset mediaAsset : expiredAssets) {
            mediaAsset.setStatus(MediaAssetStatus.DELETED);
            mediaAsset.setDeletedAt(LocalDateTime.now());
            mediaAssetRepository.save(mediaAsset);
            deletePhysicalMediaByUrl(mediaAsset.getUrl());
        }

        return expiredAssets.size();
    }

    private void deleteFile(String uploadDir, String rawFileName) {
        String fileName = StringUtils.getFilename(rawFileName);

        if (fileName == null || fileName.isBlank()) {
            return;
        }

        Path uploadPath = Path.of(uploadDir).toAbsolutePath().normalize();
        Path filePath = uploadPath.resolve(fileName).normalize();

        if (!filePath.startsWith(uploadPath)) {
            log.warn("Skipped media cleanup outside upload directory: {}", rawFileName);
            return;
        }

        try {
            Files.deleteIfExists(filePath);
        } catch (IOException exception) {
            log.warn("Could not delete media file: {}", filePath, exception);
        }
    }

    private String formatMegabytes(long bytes) {
        long megabytes = bytes / 1024 / 1024;
        return megabytes + " MB";
    }
}
