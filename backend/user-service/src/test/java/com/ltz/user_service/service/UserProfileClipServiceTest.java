package com.ltz.user_service.service;

import com.ltz.user_service.dto.request.CreateClipRequest;
import com.ltz.user_service.dto.response.UserProfileClipResponse;
import com.ltz.user_service.entity.UserProfile;
import com.ltz.user_service.entity.UserProfileClip;
import com.ltz.user_service.exception.BadRequestException;
import com.ltz.user_service.exception.ResourceNotFoundException;
import com.ltz.user_service.repository.UserProfileClipRepository;
import com.ltz.user_service.repository.UserProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserProfileClipServiceTest {

    @Mock
    private UserProfileClipRepository clipRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @InjectMocks
    private UserProfileClipService clipService;

    private UserProfile profile;
    private UserProfileClip clip;

    @BeforeEach
    void setUp() {
        profile = UserProfile.builder()
                .id(1L)
                .userId("user123")
                .username("gamer123")
                .email("gamer123@ltz.com")
                .build();

        clip = UserProfileClip.builder()
                .id(100L)
                .userId("user123")
                .title("Sick Plays")
                .videoUrl("https://www.youtube.com/watch?v=12345")
                .platform("YOUTUBE")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void getClipsByUserId_shouldReturnList() {
        when(clipRepository.findByUserIdOrderByCreatedAtDesc("user123")).thenReturn(List.of(clip));

        List<UserProfileClipResponse> responses = clipService.getClipsByUserId("user123");

        assertEquals(1, responses.size());
        assertEquals("Sick Plays", responses.get(0).getTitle());
        assertEquals("YOUTUBE", responses.get(0).getPlatform());
    }

    @Test
    void addClip_shouldSaveSuccessfully() {
        CreateClipRequest request = new CreateClipRequest();
        request.setTitle("My Cool Clip");
        request.setVideoUrl("https://www.twitch.tv/videos/98765");

        when(userProfileRepository.findByUserId("user123")).thenReturn(Optional.of(profile));
        when(clipRepository.countByUserId("user123")).thenReturn(2L);
        when(clipRepository.save(any(UserProfileClip.class))).thenAnswer(inv -> {
            UserProfileClip saved = inv.getArgument(0);
            saved.setId(101L);
            saved.setCreatedAt(LocalDateTime.now());
            return saved;
        });

        UserProfileClipResponse response = clipService.addClip("user123", request);

        assertNotNull(response);
        assertEquals(101L, response.getId());
        assertEquals("My Cool Clip", response.getTitle());
        assertEquals("TWITCH", response.getPlatform());
        verify(clipRepository, times(1)).save(any(UserProfileClip.class));
    }

    @Test
    void addClip_shouldThrowBadRequest_whenMaxLimitExceeded() {
        CreateClipRequest request = new CreateClipRequest();
        request.setTitle("Sixth Clip");
        request.setVideoUrl("https://www.youtube.com/watch?v=123");

        when(userProfileRepository.findByUserId("user123")).thenReturn(Optional.of(profile));
        when(clipRepository.countByUserId("user123")).thenReturn(5L);

        assertThrows(BadRequestException.class, () -> clipService.addClip("user123", request));
        verify(clipRepository, never()).save(any(UserProfileClip.class));
    }

    @Test
    void addClip_shouldThrowBadRequest_whenInvalidPlatform() {
        CreateClipRequest request = new CreateClipRequest();
        request.setTitle("Invalid Video");
        request.setVideoUrl("https://www.invalidplatform.com/video");

        when(userProfileRepository.findByUserId("user123")).thenReturn(Optional.of(profile));
        when(clipRepository.countByUserId("user123")).thenReturn(1L);

        assertThrows(BadRequestException.class, () -> clipService.addClip("user123", request));
    }

    @Test
    void deleteClip_shouldDeleteSuccessfully_whenOwner() {
        when(clipRepository.findById(100L)).thenReturn(Optional.of(clip));

        assertDoesNotThrow(() -> clipService.deleteClip(100L, "user123"));
        verify(clipRepository, times(1)).delete(clip);
    }

    @Test
    void deleteClip_shouldThrowBadRequest_whenNotOwner() {
        when(clipRepository.findById(100L)).thenReturn(Optional.of(clip));

        assertThrows(BadRequestException.class, () -> clipService.deleteClip(100L, "otherUser"));
        verify(clipRepository, never()).delete(any(UserProfileClip.class));
    }

    @Test
    void deleteClip_shouldThrowNotFound_whenClipDoesNotExist() {
        when(clipRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> clipService.deleteClip(999L, "user123"));
    }
}
