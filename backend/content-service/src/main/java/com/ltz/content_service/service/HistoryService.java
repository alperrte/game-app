package com.ltz.content_service.service;

import com.ltz.content_service.dto.GamingHistoryRequest;
import com.ltz.content_service.dto.GamingHistoryResponse;
import com.ltz.content_service.exception.ResourceNotFoundException;
import com.ltz.content_service.entity.GamingHistory;
import com.ltz.content_service.repository.GamingHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class HistoryService {

    private final GamingHistoryRepository gamingHistoryRepository;

    public List<GamingHistoryResponse> getTodayHistory() {
        LocalDate today = LocalDate.now();
        return getHistoryByDate(today.getMonthValue(), today.getDayOfMonth());
    }

    public List<GamingHistoryResponse> getHistoryByDate(int month, int day) {
        if (month < 1 || month > 12 || day < 1 || day > 31) {
            throw new IllegalArgumentException("Invalid month or day parameters");
        }
        return gamingHistoryRepository.findByEventMonthAndEventDay(month, day).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public GamingHistoryResponse createHistoryEvent(GamingHistoryRequest request) {
        GamingHistory event = GamingHistory.builder()
                .eventDay(request.getEventDay())
                .eventMonth(request.getEventMonth())
                .eventYear(request.getEventYear())
                .title(request.getTitle())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .build();

        log.info("Creating new gaming history event: {}", event.getTitle());
        return mapToResponse(gamingHistoryRepository.save(event));
    }

    @Transactional
    public GamingHistoryResponse updateHistoryEvent(Long id, GamingHistoryRequest request) {
        GamingHistory event = gamingHistoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gaming history event not found with id: " + id));

        event.setEventDay(request.getEventDay());
        event.setEventMonth(request.getEventMonth());
        event.setEventYear(request.getEventYear());
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setImageUrl(request.getImageUrl());

        log.info("Updating gaming history event id: {}", id);
        return mapToResponse(gamingHistoryRepository.save(event));
    }

    @Transactional
    public void deleteHistoryEvent(Long id) {
        GamingHistory event = gamingHistoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gaming history event not found with id: " + id));
        gamingHistoryRepository.delete(event);
        log.info("Deleted gaming history event id: {}", id);
    }

    private GamingHistoryResponse mapToResponse(GamingHistory event) {
        return GamingHistoryResponse.builder()
                .id(event.getId())
                .eventDay(event.getEventDay())
                .eventMonth(event.getEventMonth())
                .eventYear(event.getEventYear())
                .title(event.getTitle())
                .description(event.getDescription())
                .imageUrl(event.getImageUrl())
                .createdAt(event.getCreatedAt())
                .build();
    }
}
