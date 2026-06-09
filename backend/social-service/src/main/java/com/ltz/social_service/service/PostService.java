package com.ltz.social_service.service;

import com.ltz.social_service.dto.request.PostCommentCreateRequest;
import com.ltz.social_service.dto.request.PostCreateRequest;
import com.ltz.social_service.dto.response.PostCommentResponse;
import com.ltz.social_service.dto.response.PostLikeResponse;
import com.ltz.social_service.dto.response.PostResponse;
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

@Service
@RequiredArgsConstructor
@Transactional
public class PostService {

    private final PostRepository postRepository;
    private final PostCommentRepository postCommentRepository;
    private final PostLikeRepository postLikeRepository;

    public PostResponse createPost(PostCreateRequest request) {
        Post post = Post.builder()
                .userId(request.getUserId())
                .content(request.getContent())
                .imageUrl(request.getImageUrl())
                .visibility(request.getVisibility() == null ? PostVisibility.PUBLIC : request.getVisibility())
                .isDeleted(false)
                .build();

        return toPostResponse(postRepository.save(post));
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getPublicPosts() {
        return postRepository.findByVisibilityAndIsDeletedFalseOrderByCreatedAtDesc(PostVisibility.PUBLIC)
                .stream()
                .map(this::toPostResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getPostsByUser(Long userId) {
        return postRepository.findByUserIdAndIsDeletedFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toPostResponse)
                .toList();
    }

    public void deletePost(Long postId) {
        Post post = getPostEntity(postId);
        post.setIsDeleted(true);
        postRepository.save(post);
    }

    public PostLikeResponse likePost(Long postId, Long userId) {
        Post post = getPostEntity(postId);

        if (Boolean.TRUE.equals(post.getIsDeleted())) {
            throw new IllegalStateException("Deleted post cannot be liked");
        }

        if (postLikeRepository.existsByPostIdAndUserId(postId, userId)) {
            throw new IllegalStateException("Post already liked by this user");
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

    public void deleteComment(Long commentId) {
        PostComment postComment = postCommentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Post comment not found"));

        postComment.setIsDeleted(true);
        postCommentRepository.save(postComment);
    }

    private Post getPostEntity(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
    }

    private PostResponse toPostResponse(Post post) {
        long likeCount = postLikeRepository.countByPostId(post.getId());
        long commentCount = postCommentRepository
                .findByPostIdAndIsDeletedFalseOrderByCreatedAtAsc(post.getId())
                .size();

        return PostResponse.builder()
                .id(post.getId())
                .userId(post.getUserId())
                .content(post.getContent())
                .imageUrl(post.getImageUrl())
                .visibility(post.getVisibility())
                .isDeleted(post.getIsDeleted())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .likeCount(likeCount)
                .commentCount(commentCount)
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