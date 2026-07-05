package com.ltz.user_service.service;

import com.ltz.user_service.dto.AvailabilitySlotDto;
import com.ltz.user_service.dto.request.UpdateAvailabilityRequest;
import com.ltz.user_service.entity.UserAvailability;
import com.ltz.user_service.exception.BadRequestException;
import com.ltz.user_service.exception.ResourceNotFoundException;
import com.ltz.user_service.repository.UserAvailabilityRepository;
import com.ltz.user_service.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserAvailabilityService {

    private final UserAvailabilityRepository availabilityRepository;
    private final UserProfileRepository userProfileRepository;

    @Transactional(readOnly = true)
    public List<AvailabilitySlotDto> getAvailabilityByUserId(String userId) {
        // Profil var mı kontrol et
        userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found for ID: " + userId));

        return availabilityRepository.findByUserId(userId).stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional
    public List<AvailabilitySlotDto> updateAvailability(String userId, UpdateAvailabilityRequest request) {
        // Profil var mı kontrol et
        userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found for ID: " + userId));

        // Mevcut müsaitlik slotlarını sil
        availabilityRepository.deleteByUserId(userId);

        // Yeni slotları kaydet
        if (request.getSlots() != null && !request.getSlots().isEmpty()) {
            List<UserAvailability> newSlots = request.getSlots().stream()
                    .map(dto -> {
                        String day = dto.getDayOfWeek().toUpperCase().trim();
                        String slot = dto.getTimeSlot().toUpperCase().trim();
                        validateSlot(day, slot);

                        return UserAvailability.builder()
                                .userId(userId)
                                .dayOfWeek(day)
                                .timeSlot(slot)
                                .build();
                    })
                    .toList();

            availabilityRepository.saveAll(newSlots);
            log.info("Updated availability with {} slots for user {}", newSlots.size(), userId);
        } else {
            log.info("Cleared all availability slots for user {}", userId);
        }

        return getAvailabilityByUserId(userId);
    }

    private void validateSlot(String day, String slot) {
        boolean validDay = day.equals("MONDAY") || day.equals("TUESDAY") || day.equals("WEDNESDAY") ||
                day.equals("THURSDAY") || day.equals("FRIDAY") || day.equals("SATURDAY") ||
                day.equals("SUNDAY");
        boolean validSlot = slot.equals("MORNING") || slot.equals("AFTERNOON") ||
                slot.equals("EVENING") || slot.equals("NIGHT");

        if (!validDay || !validSlot) {
            throw new BadRequestException("Invalid day or time slot: day=" + day + ", slot=" + slot);
        }
    }

    private AvailabilitySlotDto mapToDto(UserAvailability availability) {
        return AvailabilitySlotDto.builder()
                .dayOfWeek(availability.getDayOfWeek())
                .timeSlot(availability.getTimeSlot())
                .build();
    }
}
