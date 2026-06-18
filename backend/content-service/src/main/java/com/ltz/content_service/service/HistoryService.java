package com.ltz.content_service.service;

import com.ltz.content_service.exception.ResourceNotFoundException;
import com.ltz.content_service.model.entity.GamingHistory;
import com.ltz.content_service.repository.GamingHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class HistoryService {

    private final GamingHistoryRepository gamingHistoryRepository;

    public List<GamingHistory> getTodayHistory() {
        LocalDate today = LocalDate.now();
        return getHistoryByDate(today.getMonthValue(), today.getDayOfMonth());
    }

    public List<GamingHistory> getHistoryByDate(int month, int day) {
        if (month < 1 || month > 12 || day < 1 || day > 31) {
            throw new IllegalArgumentException("Invalid month or day parameters");
        }
        return gamingHistoryRepository.findByEventMonthAndEventDay(month, day);
    }

    @Transactional
    public GamingHistory createHistoryEvent(GamingHistory event) {
        if (event.getEventMonth() < 1 || event.getEventMonth() > 12 || event.getEventDay() < 1 || event.getEventDay() > 31) {
            throw new IllegalArgumentException("Invalid event month or day");
        }
        log.info("Creating new gaming history event: {}", event.getTitle());
        return gamingHistoryRepository.save(event);
    }

    @Transactional
    public GamingHistory updateHistoryEvent(Long id, GamingHistory eventDetails) {
        GamingHistory event = gamingHistoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gaming history event not found with id: " + id));
        
        if (eventDetails.getEventMonth() < 1 || eventDetails.getEventMonth() > 12 || eventDetails.getEventDay() < 1 || eventDetails.getEventDay() > 31) {
            throw new IllegalArgumentException("Invalid event month or day");
        }

        event.setEventDay(eventDetails.getEventDay());
        event.setEventMonth(eventDetails.getEventMonth());
        event.setEventYear(eventDetails.getEventYear());
        event.setTitle(eventDetails.getTitle());
        event.setDescription(eventDetails.getDescription());
        event.setImageUrl(eventDetails.getImageUrl());

        log.info("Updating gaming history event id: {}", id);
        return gamingHistoryRepository.save(event);
    }

    @Transactional
    public void deleteHistoryEvent(Long id) {
        GamingHistory event = gamingHistoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gaming history event not found with id: " + id));
        gamingHistoryRepository.delete(event);
        log.info("Deleted gaming history event id: {}", id);
    }
}
