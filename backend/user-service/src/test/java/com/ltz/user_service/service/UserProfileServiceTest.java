package com.ltz.user_service.service;

import com.ltz.user_service.dto.request.UserProfileRequest;
import com.ltz.user_service.dto.response.UserProfileResponse;
import com.ltz.user_service.entity.PrivacySettings;
import com.ltz.user_service.entity.UserProfile;
import com.ltz.user_service.exception.ResourceNotFoundException;
import com.ltz.user_service.repository.ConnectedAccountRepository;
import com.ltz.user_service.repository.PrivacySettingsRepository;
import com.ltz.user_service.repository.UserAssignedBadgeRepository;
import com.ltz.user_service.repository.UserProfileRepository;
import com.ltz.user_service.util.ClientRequestContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceTest {

    private static final ClientRequestContext TEST_CONTEXT =
            new ClientRequestContext("127.0.0.1", "JUnit", "Desktop");

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private PrivacySettingsRepository privacySettingsRepository;

    @Mock
    private ConnectedAccountRepository connectedAccountRepository;

    @Mock
    private UserAssignedBadgeRepository userAssignedBadgeRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private UserProfileService userProfileService;

    private UserProfile userProfile;

    @BeforeEach
    void setUp() {
        userProfile = UserProfile.builder()
                .id(1L)
                .userId("user123")
                .username("gamer123")
                .email("gamer123@example.com")
                .displayName("Gamer One")
                .bio("Just a simple gamer")
                .avatarUrl("avatar.png")
                .coverUrl("cover.png")
                .gamerType("HARDCORE")
                .favoriteCategories("RPG")
                .profileThemeUrl("theme.gif")
                .build();
    }

    @Test
    void testGetProfile_Success() {
        when(userProfileRepository.findByUserId("user123")).thenReturn(Optional.of(userProfile));

        UserProfileResponse response = userProfileService.getProfile("user123");

        assertNotNull(response);
        assertEquals("user123", response.getUserId());
        assertEquals("gamer123", response.getUsername());
    }

    @Test
    void testGetProfile_NotFound() {
        when(userProfileRepository.findByUserId("user404")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userProfileService.getProfile("user404"));
    }

    @Test
    void testCreateOrUpdateProfile_NewProfile() {
        when(userProfileRepository.findByUserId("user123")).thenReturn(Optional.empty());
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(userProfile);
        when(privacySettingsRepository.findByUserId("user123")).thenReturn(Optional.empty());

        UserProfileRequest request = new UserProfileRequest();
        request.setDisplayName("Gamer One");
        request.setBio("Just a simple gamer");

        UserProfileResponse response = userProfileService.createOrUpdateProfile("user123", "gamer123", "gamer123@example.com", request, TEST_CONTEXT);

        assertNotNull(response);
        verify(userProfileRepository, times(1)).save(any(UserProfile.class));
        verify(privacySettingsRepository, times(1)).save(any(PrivacySettings.class));
        verify(auditLogService, times(1)).log(eq("user123"), eq("CREATE_PROFILE"), anyString(), eq(TEST_CONTEXT));
    }
}

