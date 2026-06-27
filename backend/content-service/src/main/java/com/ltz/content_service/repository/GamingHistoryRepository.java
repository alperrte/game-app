package com.ltz.content_service.repository;

import com.ltz.content_service.model.entity.GamingHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GamingHistoryRepository extends JpaRepository<GamingHistory, Long> {
    List<GamingHistory> findByEventMonthAndEventDay(int month, int day);
}
