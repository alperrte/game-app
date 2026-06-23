package com.ltz.social_service.service;

import com.ltz.social_service.dto.request.PostCommentCreateRequest;
import com.ltz.social_service.dto.request.PostCommentUpdateRequest;
import com.ltz.social_service.dto.request.PostCreateRequest;
import com.ltz.social_service.dto.request.PostUpdateRequest;
import com.ltz.social_service.dto.response.PostCommentLikeResponse;
import com.ltz.social_service.dto.response.PostCommentResponse;
import com.ltz.social_service.dto.response.PostLikeResponse;
import com.ltz.social_service.dto.response.PostMediaResponse;
import com.ltz.social_service.dto.response.PostResponse;
import com.ltz.social_service.dto.response.PostPollOptionResponse;
import com.ltz.social_service.dto.response.PostPollResponse;
import com.ltz.social_service.entity.MediaAsset;
import com.ltz.social_service.entity.Community;
import com.ltz.social_service.entity.CommunityMember;
import com.ltz.social_service.entity.Post;
import com.ltz.social_service.entity.PostComment;
import com.ltz.social_service.entity.PostCommentLike;
import com.ltz.social_service.entity.PostLike;
import com.ltz.social_service.entity.PostPoll;
import com.ltz.social_service.entity.PostPollOption;
import com.ltz.social_service.entity.PostPollVote;
import com.ltz.social_service.enums.PostVisibility;
import com.ltz.social_service.repository.PostCommentLikeRepository;
import com.ltz.social_service.repository.PostCommentRepository;
import com.ltz.social_service.repository.PostLikeRepository;
import com.ltz.social_service.repository.PostRepository;
import com.ltz.social_service.repository.FriendshipRepository;
import com.ltz.social_service.repository.FollowRepository;
import com.ltz.social_service.repository.CommunityRepository;
import com.ltz.social_service.repository.CommunityMemberRepository;
import com.ltz.social_service.repository.PostPollOptionRepository;
import com.ltz.social_service.repository.PostPollRepository;
import com.ltz.social_service.repository.PostPollVoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.ArrayList;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class PostService {

    private final PostRepository postRepository;
    private final PostCommentRepository postCommentRepository;
    private final PostCommentLikeRepository postCommentLikeRepository;
    private final PostLikeRepository postLikeRepository;
    private final MediaStorageService mediaStorageService;
    private final FriendshipRepository friendshipRepository;
    private final FollowRepository followRepository;
    private final CommunityRepository communityRepository;
    private final CommunityMemberRepository communityMemberRepository;
    private final PostPollRepository postPollRepository;
    private final PostPollOptionRepository postPollOptionRepository;
    private final PostPollVoteRepository postPollVoteRepository;

    public PostResponse createPost(PostCreateRequest request) {
        if (request.getCommunityId() != null) {
            Community community = communityRepository.findById(request.getCommunityId())
                    .orElseThrow(() -> new IllegalArgumentException("Topluluk bulunamadı."));
            if (!communityMemberRepository.existsByCommunityIdAndUserId(
                    community.getId(),
                    request.getUserId())) {
                throw new IllegalStateException(
                        "Bu toplulukta gönderi paylaşmak için topluluğa katılmalısın.");
            }
        }

        List<String> mediaUrls = resolveRequestedMediaUrls(request);
        Post post = Post.builder()
                .userId(request.getUserId())
                .communityId(request.getCommunityId())
                .content(request.getContent())
                .imageUrl(mediaUrls.isEmpty() ? null : mediaUrls.get(0))
                .visibility(request.getVisibility() == null ? PostVisibility.PUBLIC : request.getVisibility())
                .isDeleted(false)
                .build();

        Post savedPost = postRepository.save(post);
        mediaStorageService.attachMediaToPost(mediaUrls, savedPost.getUserId(), savedPost.getId());
        createPoll(request, savedPost);

        return toPostResponse(savedPost, request.getUserId());
    }

    public PostPollResponse votePoll(Long postId, Long optionId, Long userId) {
        Post post = getPostEntity(postId);
        ensureCanViewPost(post, userId);

        PostPoll poll = postPollRepository.findByPostId(postId)
                .orElseThrow(() -> new IllegalArgumentException("Bu gönderide anket bulunmuyor."));
        if (!poll.getExpiresAt().isAfter(LocalDateTime.now())) {
            throw new IllegalStateException("Bu anket sona erdi.");
        }
        PostPollOption option = postPollOptionRepository.findById(optionId)
                .filter(item -> item.getPollId().equals(poll.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Geçersiz anket seçeneği."));
        if (postPollVoteRepository.findByPollIdAndUserId(poll.getId(), userId).isPresent()) {
            throw new IllegalStateException("Bu ankette daha önce oy kullandın.");
        }

        try {
            postPollVoteRepository.saveAndFlush(PostPollVote.builder()
                    .pollId(poll.getId())
                    .optionId(option.getId())
                    .userId(userId)
                    .build());
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalStateException("Bu ankette daha önce oy kullandın.");
        }
        return toPollResponse(poll, userId);
    }

    public PostResponse updatePost(Long postId, Long currentUserId, PostUpdateRequest request) {
        Post post = getPostEntity(postId);

        if (Boolean.TRUE.equals(post.getIsDeleted())) {
            throw new IllegalStateException("Deleted post cannot be edited");
        }
        if (!post.getUserId().equals(currentUserId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Only the post owner can edit this post");
        }

        List<String> mediaUrls = resolveRequestedMediaUrls(request.getImageUrl(), request.getMediaUrls());
        post.setContent(request.getContent().trim());
        post.setImageUrl(mediaUrls.isEmpty() ? null : mediaUrls.get(0));
        post.setVisibility(request.getVisibility() == null ? post.getVisibility() : request.getVisibility());

        Post savedPost = postRepository.save(post);
        mediaStorageService.replacePostMedia(mediaUrls, currentUserId, savedPost.getId());
        return toPostResponse(savedPost, currentUserId);
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getPublicPosts(Long currentUserId, int page, int size) {
        return postRepository.findByCommunityIdIsNullAndIsDeletedFalse(
                        PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .stream()
                .filter(post -> canViewPost(post, currentUserId))
                .map(post -> toPostResponse(post, currentUserId))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getCommunityFeed(
            Long currentUserId,
            Long communityId,
            int page,
            int size
    ) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        if (communityId != null) {
            ensureCommunityMember(communityId, currentUserId);
            return postRepository.findByCommunityIdAndIsDeletedFalse(communityId, pageable)
                    .stream()
                    .map(post -> toPostResponse(post, currentUserId))
                    .toList();
        }

        List<Long> communityIds = communityMemberRepository
                .findByUserIdOrderByJoinedAtDesc(currentUserId)
                .stream()
                .map(CommunityMember::getCommunityId)
                .toList();
        if (communityIds.isEmpty()) {
            return List.of();
        }
        return postRepository.findByCommunityIdInAndIsDeletedFalse(communityIds, pageable)
                .stream()
                .map(post -> toPostResponse(post, currentUserId))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getPostsByUser(Long userId, Long currentUserId, int page, int size) {
        return postRepository.findByUserIdAndIsDeletedFalse(
                        userId,
                        PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .stream()
                .filter(post -> canViewPost(post, currentUserId))
                .map(post -> toPostResponse(post, currentUserId))
                .toList();
    }

    @Transactional(readOnly = true)
    public PostResponse getPostById(Long postId, Long currentUserId) {
        Post post = getPostEntity(postId);
        ensureCanViewPost(post, currentUserId);
        return toPostResponse(post, currentUserId);
    }

    private boolean canViewPost(Post post, Long currentUserId) {
        if (post.getCommunityId() != null) {
            return currentUserId != null
                    && communityMemberRepository.existsByCommunityIdAndUserId(
                            post.getCommunityId(),
                            currentUserId);
        }
        if (PostVisibility.PUBLIC.equals(post.getVisibility())) {
            return true;
        }
        if (currentUserId == null) {
            return false;
        }
        if (post.getUserId().equals(currentUserId)) {
            return true;
        }
        if (PostVisibility.FRIENDS.equals(post.getVisibility())) {
            return friendshipRepository.existsByUserIdAndFriendUserId(
                    post.getUserId(),
                    currentUserId);
        }
        return PostVisibility.FOLLOWERS_ONLY.equals(post.getVisibility())
                && followRepository.existsByFollowerUserIdAndFollowingUserId(
                        currentUserId,
                        post.getUserId());
    }

    private void ensureCommunityMember(Long communityId, Long userId) {
        if (!communityRepository.existsById(communityId)) {
            throw new IllegalArgumentException("Topluluk bulunamadı.");
        }
        if (!communityMemberRepository.existsByCommunityIdAndUserId(communityId, userId)) {
            throw new IllegalStateException("Bu topluluğun gönderilerini görmek için üye olmalısın.");
        }
    }

    private void ensureCanViewPost(Post post, Long currentUserId) {
        if (Boolean.TRUE.equals(post.getIsDeleted())) {
            throw new IllegalArgumentException("Gönderi bulunamadı.");
        }
        if (!canViewPost(post, currentUserId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Bu gönderiyi görüntüleme yetkin yok.");
        }
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
        ensureCanViewPost(post, userId);

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
        ensureCanViewPost(getPostEntity(postId), userId);
        if (!postLikeRepository.existsByPostIdAndUserId(postId, userId)) {
            throw new IllegalStateException("Post like does not exist");
        }

        postLikeRepository.deleteByPostIdAndUserId(postId, userId);
    }

    @Transactional(readOnly = true)
    public List<PostLikeResponse> getLikesByPost(Long postId, Long currentUserId, int page, int size) {
        ensureCanViewPost(getPostEntity(postId), currentUserId);

        return postLikeRepository.findByPostId(
                        postId,
                        PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .stream()
                .map(this::toPostLikeResponse)
                .toList();
    }

    public PostCommentResponse addComment(PostCommentCreateRequest request) {
        Post post = getPostEntity(request.getPostId());
        ensureCanViewPost(post, request.getUserId());

        if (Boolean.TRUE.equals(post.getIsDeleted())) {
            throw new IllegalStateException("Deleted post cannot be commented");
        }

        Long parentCommentId = request.getParentCommentId();
        if (parentCommentId != null) {
            PostComment parentComment = postCommentRepository.findById(parentCommentId)
                    .orElseThrow(() -> new IllegalArgumentException("Parent comment not found"));

            if (!parentComment.getPostId().equals(request.getPostId())) {
                throw new IllegalStateException("Parent comment does not belong to this post");
            }

            if (Boolean.TRUE.equals(parentComment.getIsDeleted())) {
                throw new IllegalStateException("Deleted comment cannot be replied to");
            }

            if (parentComment.getParentCommentId() != null) {
                throw new IllegalStateException("Replies can only be added to top-level comments");
            }
        }

        PostComment postComment = PostComment.builder()
                .postId(request.getPostId())
                .userId(request.getUserId())
                .parentCommentId(parentCommentId)
                .replyingToUserId(request.getReplyingToUserId())
                .content(request.getContent())
                .isDeleted(false)
                .build();

        return toPostCommentResponse(postCommentRepository.save(postComment), request.getUserId());
    }

    public PostCommentResponse updateComment(
            Long commentId,
            Long currentUserId,
            PostCommentUpdateRequest request
    ) {
        PostComment postComment = getCommentEntity(commentId);
        if (Boolean.TRUE.equals(postComment.getIsDeleted())) {
            throw new IllegalStateException("Deleted comment cannot be edited");
        }
        if (!postComment.getUserId().equals(currentUserId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Only the comment owner can edit this comment");
        }
        ensureCanViewPost(getPostEntity(postComment.getPostId()), currentUserId);

        postComment.setContent(request.getContent().trim());
        return toPostCommentResponse(postCommentRepository.save(postComment), currentUserId);
    }

    @Transactional(readOnly = true)
    public List<PostCommentResponse> getCommentsByPost(Long postId, Long currentUserId, int page, int size) {
        ensureCanViewPost(getPostEntity(postId), currentUserId);

        return postCommentRepository.findByPostIdAndIsDeletedFalse(
                        postId,
                        PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt")))
                .stream()
                .map(comment -> toPostCommentResponse(comment, currentUserId))
                .toList();
    }

    public PostCommentLikeResponse likeComment(Long commentId, Long userId) {
        PostComment postComment = getCommentEntity(commentId);
        ensureCanViewPost(getPostEntity(postComment.getPostId()), userId);

        if (Boolean.TRUE.equals(postComment.getIsDeleted())) {
            throw new IllegalStateException("Deleted comment cannot be liked");
        }

        var existingLike = postCommentLikeRepository.findByCommentIdAndUserId(commentId, userId);

        if (existingLike.isPresent()) {
            return toPostCommentLikeResponse(existingLike.get());
        }

        PostCommentLike postCommentLike = PostCommentLike.builder()
                .commentId(commentId)
                .userId(userId)
                .build();

        return toPostCommentLikeResponse(postCommentLikeRepository.save(postCommentLike));
    }

    public void unlikeComment(Long commentId, Long userId) {
        PostComment postComment = getCommentEntity(commentId);
        ensureCanViewPost(getPostEntity(postComment.getPostId()), userId);
        if (!postCommentLikeRepository.existsByCommentIdAndUserId(commentId, userId)) {
            throw new IllegalStateException("Comment like does not exist");
        }

        postCommentLikeRepository.deleteByCommentIdAndUserId(commentId, userId);
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

    private PostComment getCommentEntity(Long commentId) {
        return postCommentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Post comment not found"));
    }

    private PostResponse toPostResponse(Post post, Long currentUserId) {
        long likeCount = postLikeRepository.countByPostId(post.getId());
        long commentCount = postCommentRepository.countByPostIdAndIsDeletedFalse(post.getId());
        boolean likedByCurrentUser = currentUserId != null
                && postLikeRepository.existsByPostIdAndUserId(post.getId(), currentUserId);

        return PostResponse.builder()
                .id(post.getId())
                .userId(post.getUserId())
                .communityId(post.getCommunityId())
                .communityName(post.getCommunityId() == null
                        ? null
                        : communityRepository.findById(post.getCommunityId())
                        .map(Community::getName)
                        .orElse(null))
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
                .poll(toPollResponse(post.getId(), currentUserId))
                .build();
    }

    private void createPoll(PostCreateRequest request, Post post) {
        if (request.getPoll() == null) {
            return;
        }

        List<String> options = request.getPoll().getOptions().stream()
                .map(String::trim)
                .filter(option -> !option.isBlank())
                .distinct()
                .toList();
        if (options.size() < 2) {
            throw new IllegalArgumentException("Ankette en az iki farklı seçenek olmalıdır.");
        }

        PostPoll poll = postPollRepository.save(PostPoll.builder()
                .postId(post.getId())
                .question(request.getPoll().getQuestion().trim())
                .expiresAt(LocalDateTime.now().plusMinutes(request.getPoll().getDurationMinutes()))
                .build());

        for (int index = 0; index < options.size(); index++) {
            postPollOptionRepository.save(PostPollOption.builder()
                    .pollId(poll.getId())
                    .optionText(options.get(index))
                    .displayOrder(index)
                    .build());
        }
    }

    private PostPollResponse toPollResponse(Long postId, Long currentUserId) {
        return postPollRepository.findByPostId(postId)
                .map(poll -> toPollResponse(poll, currentUserId))
                .orElse(null);
    }

    private PostPollResponse toPollResponse(PostPoll poll, Long currentUserId) {
        List<PostPollOption> options = postPollOptionRepository
                .findByPollIdOrderByDisplayOrderAsc(poll.getId());
        Long selectedOptionId = currentUserId == null
                ? null
                : postPollVoteRepository.findByPollIdAndUserId(poll.getId(), currentUserId)
                .map(PostPollVote::getOptionId)
                .orElse(null);
        long totalVotes = postPollVoteRepository.findByPollId(poll.getId()).size();

        List<PostPollOptionResponse> optionResponses = options.stream()
                .map(option -> {
                    long voteCount = postPollVoteRepository.countByOptionId(option.getId());
                    int percentage = totalVotes == 0
                            ? 0
                            : (int) Math.round(voteCount * 100.0 / totalVotes);
                    return PostPollOptionResponse.builder()
                            .id(option.getId())
                            .text(option.getOptionText())
                            .voteCount(voteCount)
                            .percentage(percentage)
                            .selectedByCurrentUser(option.getId().equals(selectedOptionId))
                            .build();
                })
                .toList();

        return PostPollResponse.builder()
                .id(poll.getId())
                .question(poll.getQuestion())
                .expiresAt(poll.getExpiresAt())
                .closed(!poll.getExpiresAt().isAfter(LocalDateTime.now()))
                .totalVotes(totalVotes)
                .selectedOptionId(selectedOptionId)
                .options(optionResponses)
                .build();
    }

    private List<String> resolveRequestedMediaUrls(PostCreateRequest request) {
        return resolveRequestedMediaUrls(request.getImageUrl(), request.getMediaUrls());
    }

    private List<String> resolveRequestedMediaUrls(String imageUrl, List<String> requestedMediaUrls) {
        List<String> mediaUrls = new ArrayList<>();

        if (requestedMediaUrls != null) {
            mediaUrls.addAll(
                    requestedMediaUrls
                            .stream()
                            .filter(mediaUrl -> mediaUrl != null && !mediaUrl.isBlank())
                            .distinct()
                            .toList()
            );
        }

        if (mediaUrls.isEmpty() && imageUrl != null && !imageUrl.isBlank()) {
            mediaUrls.add(imageUrl);
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

    private PostCommentResponse toPostCommentResponse(PostComment postComment, Long currentUserId) {
        long likeCount = postCommentLikeRepository.countByCommentId(postComment.getId());
        boolean likedByCurrentUser = currentUserId != null
                && postCommentLikeRepository.existsByCommentIdAndUserId(postComment.getId(), currentUserId);

        return PostCommentResponse.builder()
                .id(postComment.getId())
                .postId(postComment.getPostId())
                .userId(postComment.getUserId())
                .parentCommentId(postComment.getParentCommentId())
                .replyingToUserId(postComment.getReplyingToUserId())
                .content(postComment.getContent())
                .isDeleted(postComment.getIsDeleted())
                .createdAt(postComment.getCreatedAt())
                .updatedAt(postComment.getUpdatedAt())
                .likeCount(likeCount)
                .likedByCurrentUser(likedByCurrentUser)
                .build();
    }

    private PostCommentLikeResponse toPostCommentLikeResponse(PostCommentLike postCommentLike) {
        return PostCommentLikeResponse.builder()
                .id(postCommentLike.getId())
                .commentId(postCommentLike.getCommentId())
                .userId(postCommentLike.getUserId())
                .createdAt(postCommentLike.getCreatedAt())
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
