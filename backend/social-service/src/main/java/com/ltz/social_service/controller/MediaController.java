package com.ltz.social_service.controller;

import com.ltz.social_service.dto.response.MediaUploadResponse;
import com.ltz.social_service.enums.MediaAssetType;
import com.ltz.social_service.security.JwtUserPrincipal;
import com.ltz.social_service.service.MediaStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpRange;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/social/media")
@RequiredArgsConstructor
public class MediaController {

    private static final Set<String> ALLOWED_IMAGE_CONTENT_TYPES = Set.of(
            MediaType.IMAGE_JPEG_VALUE,
            MediaType.IMAGE_PNG_VALUE,
            "image/webp",
            MediaType.IMAGE_GIF_VALUE
    );

    private static final Set<String> ALLOWED_VIDEO_CONTENT_TYPES = Set.of(
            "video/mp4",
            "video/webm",
            "video/ogg"
    );

    private final MediaStorageService mediaStorageService;

    @Value("${app.media.upload-dir:uploads/social-images}")
    private String imageUploadDir;

    @Value("${app.media.video-upload-dir:uploads/social-videos}")
    private String videoUploadDir;

    @Value("${app.media.max-image-size-bytes:10485760}")
    private long maxImageSizeBytes;

    @Value("${app.media.max-video-size-bytes:52428800}")
    private long maxVideoSizeBytes;

    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public MediaUploadResponse uploadImage(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestPart("file") MultipartFile file
    ) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Görsel dosyası boş olamaz.");
        }

        if (file.getSize() > maxImageSizeBytes) {
            throw new IllegalArgumentException("Görsel dosyası çok büyük. En fazla " + formatMegabytes(maxImageSizeBytes) + " yükleyebilirsin.");
        }

        String contentType = file.getContentType();

        if (contentType == null || !ALLOWED_IMAGE_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Sadece JPG, PNG, WEBP veya GIF görseller yüklenebilir.");
        }

        mediaStorageService.ensureUploadAllowed(principal.userId(), file.getSize());
        String fileName = storeFile(file, imageUploadDir, contentType);
        String mediaUrl = "/api/social/media/images/" + fileName;

        try {
            mediaStorageService.createPendingMedia(
                    principal.userId(),
                    MediaAssetType.IMAGE,
                    mediaUrl,
                    fileName,
                    contentType,
                    file.getSize()
            );
        } catch (RuntimeException exception) {
            mediaStorageService.deletePhysicalMediaByUrl(mediaUrl);
            throw exception;
        }

        return MediaUploadResponse.builder()
                .imageUrl(mediaUrl)
                .fileName(fileName)
                .contentType(contentType)
                .mediaType(MediaAssetType.IMAGE.name())
                .size(file.getSize())
                .build();
    }

    @PostMapping(value = "/videos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public MediaUploadResponse uploadVideo(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestPart("file") MultipartFile file
    ) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Video dosyası boş olamaz.");
        }

        if (file.getSize() > maxVideoSizeBytes) {
            throw new IllegalArgumentException("Video dosyası çok büyük. En fazla " + formatMegabytes(maxVideoSizeBytes) + " yükleyebilirsin.");
        }

        String contentType = file.getContentType();

        if (contentType == null || !ALLOWED_VIDEO_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Sadece MP4, WEBM veya OGG videolar yüklenebilir.");
        }

        mediaStorageService.ensureUploadAllowed(principal.userId(), file.getSize());
        String fileName = storeFile(file, videoUploadDir, contentType);
        String mediaUrl = "/api/social/media/videos/" + fileName;

        try {
            mediaStorageService.createPendingMedia(
                    principal.userId(),
                    MediaAssetType.VIDEO,
                    mediaUrl,
                    fileName,
                    contentType,
                    file.getSize()
            );
        } catch (RuntimeException exception) {
            mediaStorageService.deletePhysicalMediaByUrl(mediaUrl);
            throw exception;
        }

        return MediaUploadResponse.builder()
                .imageUrl(mediaUrl)
                .fileName(fileName)
                .contentType(contentType)
                .mediaType(MediaAssetType.VIDEO.name())
                .size(file.getSize())
                .build();
    }

    @GetMapping("/images/{fileName:.+}")
    public ResponseEntity<Resource> getImage(@PathVariable String fileName) throws MalformedURLException {
        return getMedia(imageUploadDir, fileName);
    }

    @GetMapping("/videos/{fileName:.+}")
    public ResponseEntity<?> getVideo(
            @PathVariable String fileName,
            @RequestHeader HttpHeaders headers
    ) throws IOException {
        Path uploadPath = Path.of(videoUploadDir).toAbsolutePath().normalize();
        Path filePath = uploadPath.resolve(fileName).normalize();

        if (!filePath.startsWith(uploadPath) || !Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new UrlResource(filePath.toUri());
        MediaType mediaType = detectMediaType(filePath);

        if (!headers.getRange().isEmpty()) {
            HttpRange range = headers.getRange().get(0);
            long contentLength = resource.contentLength();
            long start = range.getRangeStart(contentLength);
            long end = Math.min(range.getRangeEnd(contentLength), start + 1024 * 1024 - 1);
            long rangeLength = end - start + 1;
            byte[] body = readPartialVideoBytes(filePath, start, rangeLength);

            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                    .contentType(mediaType)
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .header(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + contentLength)
                    .contentLength(rangeLength)
                    .body(body);
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(resource.contentLength())
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000")
                .body(resource);
    }

    private static String storeFile(MultipartFile file, String uploadDir, String contentType) throws IOException {
        Path uploadPath = Path.of(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadPath);

        String extension = getExtension(file.getOriginalFilename(), contentType);
        String fileName = UUID.randomUUID() + extension;
        Path target = uploadPath.resolve(fileName).normalize();

        if (!target.startsWith(uploadPath)) {
            throw new IllegalArgumentException("Geçersiz dosya yolu.");
        }

        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        return fileName;
    }

    private ResponseEntity<Resource> getMedia(String uploadDir, String fileName) throws MalformedURLException {
        Path uploadPath = Path.of(uploadDir).toAbsolutePath().normalize();
        Path filePath = uploadPath.resolve(fileName).normalize();

        if (!filePath.startsWith(uploadPath) || !Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new UrlResource(filePath.toUri());
        MediaType mediaType = detectMediaType(filePath);

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000")
                .body(resource);
    }

    private static byte[] readPartialVideoBytes(
            Path filePath,
            long start,
            long length
    ) throws IOException {
        byte[] bytes = new byte[(int) length];

        try (RandomAccessFile file = new RandomAccessFile(filePath.toFile(), "r")) {
            file.seek(start);
            int readBytes = file.read(bytes);

            if (readBytes == bytes.length) {
                return bytes;
            }

            if (readBytes <= 0) {
                return new byte[0];
            }

            byte[] trimmedBytes = new byte[readBytes];
            System.arraycopy(bytes, 0, trimmedBytes, 0, readBytes);
            return trimmedBytes;
        }
    }

    private static String getExtension(String originalFileName, String contentType) {
        if (contentType.startsWith("video/")) {
            return switch (contentType) {
                case "video/mp4" -> ".mp4";
                case "video/webm" -> ".webm";
                case "video/ogg" -> ".ogg";
                default -> ".bin";
            };
        }

        String extension = StringUtils.getFilenameExtension(originalFileName);

        if (extension != null && !extension.isBlank()) {
            return "." + extension.toLowerCase(Locale.ROOT);
        }

        return switch (contentType) {
            case MediaType.IMAGE_JPEG_VALUE -> ".jpg";
            case MediaType.IMAGE_PNG_VALUE -> ".png";
            case "image/webp" -> ".webp";
            case MediaType.IMAGE_GIF_VALUE -> ".gif";
            default -> ".bin";
        };
    }

    private static String formatMegabytes(long bytes) {
        long megabytes = bytes / 1024 / 1024;
        return megabytes + " MB";
    }

    private static MediaType detectMediaType(Path filePath) {
        try {
            String contentType = Files.probeContentType(filePath);

            if (contentType != null) {
                return MediaType.parseMediaType(contentType);
            }
        } catch (IOException ignored) {
            // Fall through to binary stream for unknown media metadata.
        }

        return MediaType.APPLICATION_OCTET_STREAM;
    }
}
