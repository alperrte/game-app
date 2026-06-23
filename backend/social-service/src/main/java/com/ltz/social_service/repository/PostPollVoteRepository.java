package com.ltz.social_service.repository;

import com.ltz.social_service.entity.PostPollVote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PostPollVoteRepository extends JpaRepository<PostPollVote, Long> {
    Optional<PostPollVote> findByPollIdAndUserId(Long pollId, Long userId);
    List<PostPollVote> findByPollId(Long pollId);
    long countByOptionId(Long optionId);
}
