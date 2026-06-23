package com.ltz.social_service.repository;

import com.ltz.social_service.entity.PostPollOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostPollOptionRepository extends JpaRepository<PostPollOption, Long> {
    List<PostPollOption> findByPollIdOrderByDisplayOrderAsc(Long pollId);
}
