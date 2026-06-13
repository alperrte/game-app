package com.ltz.social_service.controller;

import com.ltz.social_service.dto.request.PostCommentCreateRequest;
import com.ltz.social_service.dto.request.PostCreateRequest;
import com.ltz.social_service.dto.response.PostCommentResponse;
import com.ltz.social_service.dto.response.PostLikeResponse;
import com.ltz.social_service.dto.response.PostResponse;
import com.ltz.social_service.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping("/posts")
    @ResponseStatus(HttpStatus.CREATED)
    public PostResponse createPost(
            @Valid @RequestBody PostCreateRequest request
    ) {
        return postService.createPost(request);
    }

    @GetMapping("/posts/public")
    public List<PostResponse> getPublicPosts() {
        return postService.getPublicPosts();
    }

    @GetMapping("/users/{userId}/posts")
    public List<PostResponse> getPostsByUser(
            @PathVariable Long userId
    ) {
        return postService.getPostsByUser(userId);
    }

    @DeleteMapping("/posts/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePost(
            @PathVariable Long postId
    ) {
        postService.deletePost(postId);
    }

    @PostMapping("/posts/{postId}/likes")
    @ResponseStatus(HttpStatus.CREATED)
    public PostLikeResponse likePost(
            @PathVariable Long postId,
            @RequestParam Long userId
    ) {
        return postService.likePost(postId, userId);
    }

    @DeleteMapping("/posts/{postId}/likes")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unlikePost(
            @PathVariable Long postId,
            @RequestParam Long userId
    ) {
        postService.unlikePost(postId, userId);
    }

    @PostMapping("/posts/{postId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public PostCommentResponse addComment(
            @PathVariable Long postId,
            @Valid @RequestBody PostCommentCreateRequest request
    ) {
        request.setPostId(postId);
        return postService.addComment(request);
    }

    @GetMapping("/posts/{postId}/comments")
    public List<PostCommentResponse> getCommentsByPost(
            @PathVariable Long postId
    ) {
        return postService.getCommentsByPost(postId);
    }

    @DeleteMapping("/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(
            @PathVariable Long commentId
    ) {
        postService.deleteComment(commentId);
    }
}