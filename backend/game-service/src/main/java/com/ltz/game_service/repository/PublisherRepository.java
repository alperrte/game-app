package com.ltz.game_service.repository;

import com.ltz.game_service.entity.Publisher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PublisherRepository extends JpaRepository<Publisher, Long> {

    boolean existsByNameIgnoreCase(String name);
}