package com.ltz.social_service.controller;

import com.ltz.social_service.dto.request.PostCommentCreateRequest;
import com.ltz.social_service.dto.request.PostCreateRequest;
import com.ltz.social_service.dto.response.PostCommentResponse;
import com.ltz.social_service.dto.response.PostLikeResponse;
import com.ltz.social_service.dto.response.PostResponse;
import com.ltz.social_service.security.JwtUserPrincipal;
import com.ltz.social_service.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping("/posts")
    @ResponseStatus(HttpStatus.CREATED)
    public PostResponse createPost(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody PostCreateRequest request
    ) {
        request.setUserId(principal.userId());
        return postService.createPost(request);
    }

    @GetMapping("/posts/public")
    public List<PostResponse> getPublicPosts(
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        return postService.getPublicPosts(principal == null ? null : principal.userId());
    }

    @GetMapping("/users/{userId}/posts")
    public List<PostResponse> getPostsByUser(
            @PathVariable Long userId,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        return postService.getPostsByUser(userId, principal == null ? null : principal.userId());
    }

    @DeleteMapping("/posts/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        postService.deletePost(postId, principal.userId());
    }

    @PostMapping("/posts/{postId}/likes")
    @ResponseStatus(HttpStatus.CREATED)
    public PostLikeResponse likePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        return postService.likePost(postId, principal.userId());
    }

    @DeleteMapping("/posts/{postId}/likes")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unlikePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        postService.unlikePost(postId, principal.userId());
    }

    @GetMapping("/posts/{postId}/likes")
    public List<PostLikeResponse> getLikesByPost(@PathVariable Long postId) {
        return postService.getLikesByPost(postId);
    }

    @PostMapping("/posts/{postId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public PostCommentResponse addComment(
            @PathVariable Long postId,
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody PostCommentCreateRequest request
    ) {
        request.setPostId(postId);
        request.setUserId(principal.userId());
        return postService.addComment(request);
    }

    @GetMapping("/posts/{postId}/comments")
    public List<PostCommentResponse> getCommentsByPost(@PathVariable Long postId) {
        return postService.getCommentsByPost(postId);
    }

    @DeleteMapping("/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        postService.deleteComment(commentId, principal.userId());
    }
}
