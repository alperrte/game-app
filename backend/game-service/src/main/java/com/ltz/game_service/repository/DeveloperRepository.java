package com.ltz.game_service.repository;

import com.ltz.game_service.entity.Developer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeveloperRepository extends JpaRepository<Developer, Long> {

    boolean existsByNameIgnoreCase(String name);
}