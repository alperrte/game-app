package com.ltz.social_service.repository;

import com.ltz.social_service.entity.MessageReaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MessageReactionRepository extends JpaRepository<MessageReaction, Long> {

    Optional<MessageReaction> findByMessageIdAndUserId(Long messageId, Long userId);

    List<MessageReaction> findByMessageIdIn(Collection<Long> messageIds);

    void deleteByMessageIdAndUserId(Long messageId, Long userId);
}
