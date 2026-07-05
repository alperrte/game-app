package com.ltz.user_service.service;

import com.ltz.user_service.dto.AvailabilitySlotDto;
import com.ltz.user_service.dto.request.UpdateAvailabilityRequest;
import com.ltz.user_service.entity.UserAvailability;
import com.ltz.user_service.entity.UserProfile;
import com.ltz.user_service.exception.BadRequestException;
import com.ltz.user_service.exception.ResourceNotFoundException;
import com.ltz.user_service.repository.UserAvailabilityRepository;
import com.ltz.user_service.repository.UserProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserAvailabilityServiceTest {

    @Mock
    private UserAvailabilityRepository availabilityRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @InjectMocks
    private UserAvailabilityService availabilityService;

    private UserProfile profile;
    private UserAvailability availability;

    @BeforeEach
    void setUp() {
        profile = UserProfile.builder()
                .id(1L)
                .userId("user123")
                .username("gamer123")
                .email("gamer123@ltz.com")
                .build();

        availability = UserAvailability.builder()
                .id(10L)
                .userId("user123")
                .dayOfWeek("MONDAY")
                .timeSlot("EVENING")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void getAvailabilityByUserId_Success() {
        when(userProfileRepository.findByUserId("user123")).thenReturn(Optional.of(profile));
        when(availabilityRepository.findByUserId("user123")).thenReturn(List.of(availability));

        List<AvailabilitySlotDto> result = availabilityService.getAvailabilityByUserId("user123");

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("MONDAY", result.get(0).getDayOfWeek());
        assertEquals("EVENING", result.get(0).getTimeSlot());
    }

    @Test
    void getAvailabilityByUserId_ProfileNotFound_ThrowsException() {
        when(userProfileRepository.findByUserId("user123")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> 
                availabilityService.getAvailabilityByUserId("user123"));
    }

    @Test
    void updateAvailability_Success() {
        when(userProfileRepository.findByUserId("user123")).thenReturn(Optional.of(profile));
        doNothing().when(availabilityRepository).deleteByUserId("user123");

        UpdateAvailabilityRequest request = new UpdateAvailabilityRequest();
        List<AvailabilitySlotDto> slots = new ArrayList<>();
        slots.add(new AvailabilitySlotDto("FRIDAY", "NIGHT"));
        slots.add(new AvailabilitySlotDto("SATURDAY", "AFTERNOON"));
        request.setSlots(slots);

        // Map expected updated DB state
        UserAvailability slot1 = UserAvailability.builder()
                .userId("user123")
                .dayOfWeek("FRIDAY")
                .timeSlot("NIGHT")
                .build();
        UserAvailability slot2 = UserAvailability.builder()
                .userId("user123")
                .dayOfWeek("SATURDAY")
                .timeSlot("AFTERNOON")
                .build();

        when(availabilityRepository.findByUserId("user123")).thenReturn(List.of(slot1, slot2));

        List<AvailabilitySlotDto> result = availabilityService.updateAvailability("user123", request);

        verify(availabilityRepository, times(1)).deleteByUserId("user123");
        verify(availabilityRepository, times(1)).saveAll(any());

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("FRIDAY", result.get(0).getDayOfWeek());
        assertEquals("SATURDAY", result.get(1).getDayOfWeek());
    }

    @Test
    void updateAvailability_EmptySlots_ClearsAll() {
        when(userProfileRepository.findByUserId("user123")).thenReturn(Optional.of(profile));
        doNothing().when(availabilityRepository).deleteByUserId("user123");

        UpdateAvailabilityRequest request = new UpdateAvailabilityRequest();
        request.setSlots(new ArrayList<>());

        when(availabilityRepository.findByUserId("user123")).thenReturn(List.of());

        List<AvailabilitySlotDto> result = availabilityService.updateAvailability("user123", request);

        verify(availabilityRepository, times(1)).deleteByUserId("user123");
        verify(availabilityRepository, never()).saveAll(any());

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void updateAvailability_InvalidDay_ThrowsBadRequestException() {
        when(userProfileRepository.findByUserId("user123")).thenReturn(Optional.of(profile));

        UpdateAvailabilityRequest request = new UpdateAvailabilityRequest();
        List<AvailabilitySlotDto> slots = new ArrayList<>();
        slots.add(new AvailabilitySlotDto("INVALID_DAY", "NIGHT"));
        request.setSlots(slots);

        assertThrows(BadRequestException.class, () -> 
                availabilityService.updateAvailability("user123", request));
    }

    @Test
    void updateAvailability_InvalidSlot_ThrowsBadRequestException() {
        when(userProfileRepository.findByUserId("user123")).thenReturn(Optional.of(profile));

        UpdateAvailabilityRequest request = new UpdateAvailabilityRequest();
        List<AvailabilitySlotDto> slots = new ArrayList<>();
        slots.add(new AvailabilitySlotDto("FRIDAY", "INVALID_SLOT"));
        request.setSlots(slots);

        assertThrows(BadRequestException.class, () -> 
                availabilityService.updateAvailability("user123", request));
    }
}
