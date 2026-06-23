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
    private static final String FILE_MEDIA_PREFIX = "/api/social/media/files/";
    private static final Set<MediaAssetStatus> ACTIVE_STORAGE_STATUSES = Set.of(
            MediaAssetStatus.PENDING,
            MediaAssetStatus.ATTACHED
    );

    private final MediaAssetRepository mediaAssetRepository;

    @Value("${app.media.upload-dir:uploads/social-images}")
    private String imageUploadDir;

    @Value("${app.media.video-upload-dir:uploads/social-videos}")
    private String videoUploadDir;

    @Value("${app.media.file-upload-dir:uploads/social-files}")
    private String fileUploadDir;

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
        if (!isManagedMediaUrl(mediaUrl)) {
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

    public void replacePostMedia(List<String> mediaUrls, Long ownerUserId, Long postId) {
        List<String> nextUrls = mediaUrls == null
                ? List.of()
                : mediaUrls.stream()
                .filter(mediaUrl -> mediaUrl != null && !mediaUrl.isBlank())
                .distinct()
                .toList();

        List<MediaAsset> currentMedia = findAttachedMediaByPostId(postId);
        for (MediaAsset mediaAsset : currentMedia) {
            if (!nextUrls.contains(mediaAsset.getUrl())) {
                deleteMediaByUrl(mediaAsset.getUrl());
            }
        }

        attachMediaToPost(nextUrls, ownerUserId, postId);
    }

    public void attachMediaToCommunity(String mediaUrl, Long ownerUserId, Long communityId) {
        attachMedia(mediaUrl, ownerUserId, mediaAsset -> mediaAsset.setCommunityId(communityId), true);
    }

    public void attachMediaToCommunityEvent(String mediaUrl, Long ownerUserId, Long eventId) {
        attachMedia(mediaUrl, ownerUserId, mediaAsset -> mediaAsset.setCommunityEventId(eventId), true);
    }

    public void attachMediaToMessage(String mediaUrl, Long ownerUserId, Long messageId) {
        attachMedia(mediaUrl, ownerUserId, mediaAsset -> mediaAsset.setMessageId(messageId), false);
    }

    public void attachMediaToChatRoom(String mediaUrl, Long ownerUserId, Long chatRoomId) {
        attachMedia(mediaUrl, ownerUserId, mediaAsset -> mediaAsset.setChatRoomId(chatRoomId), true);
    }

    private void attachMedia(
            String mediaUrl,
            Long ownerUserId,
            java.util.function.Consumer<MediaAsset> attachment,
            boolean imageOnly
    ) {
        if (mediaUrl == null || mediaUrl.isBlank()) {
            return;
        }
        if (!isManagedMediaUrl(mediaUrl)) {
            return;
        }

        MediaAsset mediaAsset = mediaAssetRepository.findByUrl(mediaUrl)
                .orElseThrow(() -> new IllegalArgumentException("Eklenen medya bulunamadı."));

        if (!mediaAsset.getOwnerUserId().equals(ownerUserId)) {
            throw new IllegalStateException("Sadece kendi yüklediğin medyayı kullanabilirsin.");
        }
        if (imageOnly && !MediaAssetType.IMAGE.equals(mediaAsset.getMediaType())) {
            throw new IllegalStateException("Kapak görseli olarak yalnızca resim kullanılabilir.");
        }
        if (MediaAssetStatus.DELETED.equals(mediaAsset.getStatus())) {
            throw new IllegalStateException("Silinmiş medya kullanılamaz.");
        }
        if (MediaAssetStatus.ATTACHED.equals(mediaAsset.getStatus())
                && (mediaAsset.getPostId() != null
                || mediaAsset.getCommunityId() != null
                || mediaAsset.getCommunityEventId() != null
                || mediaAsset.getMessageId() != null
                || mediaAsset.getChatRoomId() != null)) {
            throw new IllegalStateException("Bu medya zaten başka bir içerikte kullanılıyor.");
        }

        attachment.accept(mediaAsset);
        mediaAsset.setStatus(MediaAssetStatus.ATTACHED);
        mediaAsset.setAttachedAt(LocalDateTime.now());
        mediaAssetRepository.save(mediaAsset);
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

    public void deleteMediaByCommunityEventId(Long eventId) {
        List<MediaAsset> mediaAssets = mediaAssetRepository
                .findByCommunityEventId(eventId);

        for (MediaAsset mediaAsset : mediaAssets) {
            mediaAsset.setCommunityEventId(null);
            if (!MediaAssetStatus.DELETED.equals(mediaAsset.getStatus())) {
                mediaAsset.setStatus(MediaAssetStatus.DELETED);
                mediaAsset.setDeletedAt(LocalDateTime.now());
                deletePhysicalMediaByUrl(mediaAsset.getUrl());
            }
            mediaAssetRepository.save(mediaAsset);
        }
    }

    public void deleteMediaByCommunityId(Long communityId) {
        List<MediaAsset> mediaAssets = mediaAssetRepository.findByCommunityId(communityId);

        for (MediaAsset mediaAsset : mediaAssets) {
            mediaAsset.setCommunityId(null);
            if (!MediaAssetStatus.DELETED.equals(mediaAsset.getStatus())) {
                mediaAsset.setStatus(MediaAssetStatus.DELETED);
                mediaAsset.setDeletedAt(LocalDateTime.now());
                deletePhysicalMediaByUrl(mediaAsset.getUrl());
            }
            mediaAssetRepository.save(mediaAsset);
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
            return;
        }
        if (mediaUrl.startsWith(FILE_MEDIA_PREFIX)) {
            deleteFile(fileUploadDir, mediaUrl.substring(FILE_MEDIA_PREFIX.length()));
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

    private boolean isManagedMediaUrl(String mediaUrl) {
        return mediaUrl.startsWith(IMAGE_MEDIA_PREFIX)
                || mediaUrl.startsWith(VIDEO_MEDIA_PREFIX)
                || mediaUrl.startsWith(FILE_MEDIA_PREFIX);
    }
}
