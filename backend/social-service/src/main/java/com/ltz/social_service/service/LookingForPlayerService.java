package com.ltz.social_service.service;

import com.ltz.social_service.dto.request.LookingForPlayerPostCreateRequest;
import com.ltz.social_service.dto.response.LookingForPlayerPostResponse;
import com.ltz.social_service.entity.LookingForPlayerPost;
import com.ltz.social_service.enums.LookingForPlayerStatus;
import com.ltz.social_service.repository.LookingForPlayerPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class LookingForPlayerService {

    private final LookingForPlayerPostRepository lookingForPlayerPostRepository;

    public LookingForPlayerPostResponse createPost(LookingForPlayerPostCreateRequest request) {
        LookingForPlayerPost post = LookingForPlayerPost.builder()
                .userId(request.getUserId())
                .gameId(request.getGameId())
                .title(request.getTitle())
                .description(request.getDescription())
                .platform(request.getPlatform())
                .preferredRole(request.getPreferredRole())
                .playerLevel(request.getPlayerLevel())
                .microphoneRequired(request.getMicrophoneRequired() != null && request.getMicrophoneRequired())
                .playTime(request.getPlayTime())
                .status(LookingForPlayerStatus.OPEN)
                .build();

        return toResponse(lookingForPlayerPostRepository.save(post));
    }

    @Transactional(readOnly = true)
    public List<LookingForPlayerPostResponse> getOpenPosts() {
        return lookingForPlayerPostRepository.findByStatusOrderByCreatedAtDesc(LookingForPlayerStatus.OPEN)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LookingForPlayerPostResponse> getPostsByUser(Long userId) {
        return lookingForPlayerPostRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LookingForPlayerPostResponse> getOpenPostsByGame(Long gameId) {
        return lookingForPlayerPostRepository
                .findByGameIdAndStatusOrderByCreatedAtDesc(gameId, LookingForPlayerStatus.OPEN)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public LookingForPlayerPostResponse closePost(Long postId, Long currentUserId) {
        LookingForPlayerPost post = getPostEntity(postId);
        validateOwner(post, currentUserId);
        post.setStatus(LookingForPlayerStatus.CLOSED);

        return toResponse(lookingForPlayerPostRepository.save(post));
    }

    public LookingForPlayerPostResponse cancelPost(Long postId, Long currentUserId) {
        LookingForPlayerPost post = getPostEntity(postId);
        validateOwner(post, currentUserId);
        post.setStatus(LookingForPlayerStatus.CANCELLED);

        return toResponse(lookingForPlayerPostRepository.save(post));
    }

    private LookingForPlayerPost getPostEntity(Long postId) {
        return lookingForPlayerPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Looking for player post not found"));
    }

    private void validateOwner(LookingForPlayerPost post, Long currentUserId) {
        if (!post.getUserId().equals(currentUserId)) {
            throw new IllegalStateException("Only the post owner can update this looking for player post");
        }
    }

    private LookingForPlayerPostResponse toResponse(LookingForPlayerPost post) {
        return LookingForPlayerPostResponse.builder()
                .id(post.getId())
                .userId(post.getUserId())
                .gameId(post.getGameId())
                .title(post.getTitle())
                .description(post.getDescription())
                .platform(post.getPlatform())
                .preferredRole(post.getPreferredRole())
                .playerLevel(post.getPlayerLevel())
                .microphoneRequired(post.getMicrophoneRequired())
                .playTime(post.getPlayTime())
                .status(post.getStatus())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
