package com.ltz.social_service.service;

import com.ltz.social_service.dto.request.PostCommentCreateRequest;
import com.ltz.social_service.dto.request.PostCreateRequest;
import com.ltz.social_service.dto.response.PostCommentResponse;
import com.ltz.social_service.dto.response.PostLikeResponse;
import com.ltz.social_service.dto.response.PostMediaResponse;
import com.ltz.social_service.dto.response.PostResponse;
import com.ltz.social_service.entity.MediaAsset;
import com.ltz.social_service.entity.Post;
import com.ltz.social_service.entity.PostComment;
import com.ltz.social_service.entity.PostLike;
import com.ltz.social_service.enums.PostVisibility;
import com.ltz.social_service.repository.PostCommentRepository;
import com.ltz.social_service.repository.PostLikeRepository;
import com.ltz.social_service.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Transactional
public class PostService {

    private final PostRepository postRepository;
    private final PostCommentRepository postCommentRepository;
    private final PostLikeRepository postLikeRepository;
    private final MediaStorageService mediaStorageService;

    public PostResponse createPost(PostCreateRequest request) {
        List<String> mediaUrls = resolveRequestedMediaUrls(request);
        Post post = Post.builder()
                .userId(request.getUserId())
                .content(request.getContent())
                .imageUrl(mediaUrls.isEmpty() ? null : mediaUrls.get(0))
                .visibility(request.getVisibility() == null ? PostVisibility.PUBLIC : request.getVisibility())
                .isDeleted(false)
                .build();

        Post savedPost = postRepository.save(post);
        mediaStorageService.attachMediaToPost(mediaUrls, savedPost.getUserId(), savedPost.getId());

        return toPostResponse(savedPost, request.getUserId());
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getPublicPosts(Long currentUserId) {
        return postRepository.findByVisibilityAndIsDeletedFalseOrderByCreatedAtDesc(PostVisibility.PUBLIC)
                .stream()
                .map(post -> toPostResponse(post, currentUserId))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getPostsByUser(Long userId, Long currentUserId) {
        return postRepository.findByUserIdAndIsDeletedFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(post -> toPostResponse(post, currentUserId))
                .toList();
    }

    public void deletePost(Long postId, Long currentUserId) {
        Post post = getPostEntity(postId);

        if (!post.getUserId().equals(currentUserId)) {
            throw new IllegalStateException("Only the post owner can delete this post");
        }

        post.setIsDeleted(true);
        postRepository.save(post);
        mediaStorageService.deleteMediaByPostId(post.getId());
        mediaStorageService.deleteMediaByUrl(post.getImageUrl());
    }

    public PostLikeResponse likePost(Long postId, Long userId) {
        Post post = getPostEntity(postId);

        if (Boolean.TRUE.equals(post.getIsDeleted())) {
            throw new IllegalStateException("Deleted post cannot be liked");
        }

        var existingLike = postLikeRepository.findByPostIdAndUserId(postId, userId);

        if (existingLike.isPresent()) {
            return toPostLikeResponse(existingLike.get());
        }

        PostLike postLike = PostLike.builder()
                .postId(postId)
                .userId(userId)
                .build();

        return toPostLikeResponse(postLikeRepository.save(postLike));
    }

    public void unlikePost(Long postId, Long userId) {
        if (!postLikeRepository.existsByPostIdAndUserId(postId, userId)) {
            throw new IllegalStateException("Post like does not exist");
        }

        postLikeRepository.deleteByPostIdAndUserId(postId, userId);
    }

    @Transactional(readOnly = true)
    public List<PostLikeResponse> getLikesByPost(Long postId) {
        getPostEntity(postId);

        return postLikeRepository.findByPostIdOrderByCreatedAtDesc(postId)
                .stream()
                .map(this::toPostLikeResponse)
                .toList();
    }

    public PostCommentResponse addComment(PostCommentCreateRequest request) {
        Post post = getPostEntity(request.getPostId());

        if (Boolean.TRUE.equals(post.getIsDeleted())) {
            throw new IllegalStateException("Deleted post cannot be commented");
        }

        PostComment postComment = PostComment.builder()
                .postId(request.getPostId())
                .userId(request.getUserId())
                .content(request.getContent())
                .isDeleted(false)
                .build();

        return toPostCommentResponse(postCommentRepository.save(postComment));
    }

    @Transactional(readOnly = true)
    public List<PostCommentResponse> getCommentsByPost(Long postId) {
        return postCommentRepository.findByPostIdAndIsDeletedFalseOrderByCreatedAtAsc(postId)
                .stream()
                .map(this::toPostCommentResponse)
                .toList();
    }

    public void deleteComment(Long commentId, Long currentUserId) {
        PostComment postComment = postCommentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Post comment not found"));

        if (!postComment.getUserId().equals(currentUserId)) {
            throw new IllegalStateException("Only the comment owner can delete this comment");
        }

        postComment.setIsDeleted(true);
        postCommentRepository.save(postComment);
    }

    private Post getPostEntity(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
    }

    private PostResponse toPostResponse(Post post, Long currentUserId) {
        long likeCount = postLikeRepository.countByPostId(post.getId());
        long commentCount = postCommentRepository
                .findByPostIdAndIsDeletedFalseOrderByCreatedAtAsc(post.getId())
                .size();
        boolean likedByCurrentUser = currentUserId != null
                && postLikeRepository.existsByPostIdAndUserId(post.getId(), currentUserId);

        return PostResponse.builder()
                .id(post.getId())
                .userId(post.getUserId())
                .content(post.getContent())
                .imageUrl(post.getImageUrl())
                .mediaType(mediaStorageService.findMediaTypeByUrl(post.getImageUrl())
                        .map(Enum::name)
                        .orElse(null))
                .media(toPostMediaResponses(post.getId()))
                .visibility(post.getVisibility())
                .isDeleted(post.getIsDeleted())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .likeCount(likeCount)
                .commentCount(commentCount)
                .likedByCurrentUser(likedByCurrentUser)
                .build();
    }

    private List<String> resolveRequestedMediaUrls(PostCreateRequest request) {
        List<String> mediaUrls = new ArrayList<>();

        if (request.getMediaUrls() != null) {
            mediaUrls.addAll(
                    request.getMediaUrls()
                            .stream()
                            .filter(mediaUrl -> mediaUrl != null && !mediaUrl.isBlank())
                            .distinct()
                            .toList()
            );
        }

        if (mediaUrls.isEmpty() && request.getImageUrl() != null && !request.getImageUrl().isBlank()) {
            mediaUrls.add(request.getImageUrl());
        }

        if (mediaUrls.size() > 3) {
            throw new IllegalArgumentException("Bir gönderiye en fazla 3 medya ekleyebilirsin.");
        }

        return mediaUrls;
    }

    private List<PostMediaResponse> toPostMediaResponses(Long postId) {
        return mediaStorageService.findAttachedMediaByPostId(postId)
                .stream()
                .map(this::toPostMediaResponse)
                .toList();
    }

    private PostMediaResponse toPostMediaResponse(MediaAsset mediaAsset) {
        return PostMediaResponse.builder()
                .url(mediaAsset.getUrl())
                .mediaType(mediaAsset.getMediaType().name())
                .contentType(mediaAsset.getContentType())
                .size(mediaAsset.getSizeBytes())
                .build();
    }

    private PostCommentResponse toPostCommentResponse(PostComment postComment) {
        return PostCommentResponse.builder()
                .id(postComment.getId())
                .postId(postComment.getPostId())
                .userId(postComment.getUserId())
                .content(postComment.getContent())
                .isDeleted(postComment.getIsDeleted())
                .createdAt(postComment.getCreatedAt())
                .updatedAt(postComment.getUpdatedAt())
                .build();
    }

    private PostLikeResponse toPostLikeResponse(PostLike postLike) {
        return PostLikeResponse.builder()
                .id(postLike.getId())
                .postId(postLike.getPostId())
                .userId(postLike.getUserId())
                .createdAt(postLike.getCreatedAt())
                .build();
    }
}
