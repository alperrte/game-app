package com.ltz.content_service.repository;

import com.ltz.content_service.model.entity.GamingHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GamingHistoryRepository extends JpaRepository<GamingHistory, Long> {
    List<GamingHistory> findByEventMonthAndEventDay(int month, int day);
}
