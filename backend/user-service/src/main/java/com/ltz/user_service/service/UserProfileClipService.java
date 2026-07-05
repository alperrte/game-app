package com.ltz.user_service.service;

import com.ltz.user_service.dto.request.CreateClipRequest;
import com.ltz.user_service.dto.response.UserProfileClipResponse;
import com.ltz.user_service.entity.UserProfileClip;
import com.ltz.user_service.exception.BadRequestException;
import com.ltz.user_service.exception.ResourceNotFoundException;
import com.ltz.user_service.repository.UserProfileClipRepository;
import com.ltz.user_service.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserProfileClipService {

    private final UserProfileClipRepository clipRepository;
    private final UserProfileRepository userProfileRepository;

    @Transactional(readOnly = true)
    public List<UserProfileClipResponse> getClipsByUserId(String userId) {
        return clipRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public UserProfileClipResponse addClip(String userId, CreateClipRequest request) {
        // Fail fast if profile does not exist
        userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found for ID: " + userId));

        // Limit count to 5 clips per user
        long count = clipRepository.countByUserId(userId);
        if (count >= 5) {
            log.warn("User {} exceeded max clip limit", userId);
            throw new BadRequestException("You can showcase a maximum of 5 clips on your profile");
        }

        String videoUrl = request.getVideoUrl().trim();
        String platform = detectPlatform(videoUrl);

        UserProfileClip clip = UserProfileClip.builder()
                .userId(userId)
                .title(request.getTitle().trim())
                .videoUrl(videoUrl)
                .platform(platform)
                .build();

        UserProfileClip saved = clipRepository.save(clip);
        log.info("Saved new clip with ID {} for user {}", saved.getId(), userId);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteClip(Long clipId, String userId) {
        UserProfileClip clip = clipRepository.findById(clipId)
                .orElseThrow(() -> new ResourceNotFoundException("Clip not found with ID: " + clipId));

        if (!clip.getUserId().equals(userId)) {
            log.warn("User {} unauthorized attempt to delete clip {}", userId, clipId);
            throw new BadRequestException("You are not authorized to delete this clip");
        }

        clipRepository.delete(clip);
        log.info("Deleted clip with ID {} for user {}", clipId, userId);
    }

    private String detectPlatform(String url) {
        String lowercaseUrl = url.toLowerCase();
        if (lowercaseUrl.contains("youtube.com") || lowercaseUrl.contains("youtu.be")) {
            return "YOUTUBE";
        } else if (lowercaseUrl.contains("twitch.tv")) {
            return "TWITCH";
        } else {
            throw new BadRequestException("Only YouTube and Twitch URLs are supported");
        }
    }

    private UserProfileClipResponse mapToResponse(UserProfileClip clip) {
        return UserProfileClipResponse.builder()
                .id(clip.getId())
                .userId(clip.getUserId())
                .title(clip.getTitle())
                .videoUrl(clip.getVideoUrl())
                .platform(clip.getPlatform())
                .createdAt(clip.getCreatedAt())
                .build();
    }
}
