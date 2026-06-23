package com.ltz.social_service.repository;

import com.ltz.social_service.entity.PostPoll;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostPollRepository extends JpaRepository<PostPoll, Long> {
    Optional<PostPoll> findByPostId(Long postId);
}
