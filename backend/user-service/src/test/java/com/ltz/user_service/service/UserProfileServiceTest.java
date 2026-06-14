package com.ltz.user_service.service;

import com.ltz.user_service.dto.request.ConnectedAccountRequest;
import com.ltz.user_service.dto.request.PrivacySettingsRequest;
import com.ltz.user_service.dto.request.UserProfileRequest;
import com.ltz.user_service.dto.response.ConnectedAccountResponse;
import com.ltz.user_service.dto.response.PrivacySettingsResponse;
import com.ltz.user_service.dto.response.UserProfileResponse;
import com.ltz.user_service.entity.ConnectedAccount;
import com.ltz.user_service.entity.PrivacySettings;
import com.ltz.user_service.entity.UserProfile;
import com.ltz.user_service.exception.BadRequestException;
import com.ltz.user_service.exception.ResourceNotFoundException;
import com.ltz.user_service.repository.ConnectedAccountRepository;
import com.ltz.user_service.repository.PrivacySettingsRepository;
import com.ltz.user_service.repository.UserProfileRepository;
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

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private PrivacySettingsRepository privacySettingsRepository;

    @Mock
    private ConnectedAccountRepository connectedAccountRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private UserProfileService userProfileService;

    private UserProfile userProfile;
    private PrivacySettings privacySettings;
    private ConnectedAccount connectedAccount;

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

        privacySettings = PrivacySettings.builder()
                .id(1L)
                .userId("user123")
                .profileVisibility("PUBLIC")
                .gameLibraryVisibility("PUBLIC")
                .hardwareVisibility("PUBLIC")
                .friendListVisibility("PUBLIC")
                .build();

        connectedAccount = ConnectedAccount.builder()
                .id(1L)
                .userId("user123")
                .platformName("STEAM")
                .platformUserId("steamId123")
                .platformUsername("steamUser")
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

        UserProfileResponse response = userProfileService.createOrUpdateProfile("user123", "gamer123", "gamer123@example.com", request, "127.0.0.1");

        assertNotNull(response);
        verify(userProfileRepository, times(1)).save(any(UserProfile.class));
        verify(privacySettingsRepository, times(1)).save(any(PrivacySettings.class));
        verify(auditLogService, times(1)).log(eq("user123"), eq("CREATE_PROFILE"), anyString(), eq("127.0.0.1"));
    }

    @Test
    void testUpdatePrivacySettings() {
        when(privacySettingsRepository.findByUserId("user123")).thenReturn(Optional.of(privacySettings));
        when(privacySettingsRepository.save(any(PrivacySettings.class))).thenReturn(privacySettings);

        PrivacySettingsRequest request = new PrivacySettingsRequest();
        request.setProfileVisibility("PRIVATE");

        PrivacySettingsResponse response = userProfileService.updatePrivacySettings("user123", request, "127.0.0.1");

        assertNotNull(response);
        verify(privacySettingsRepository, times(1)).save(any(PrivacySettings.class));
        verify(auditLogService, times(1)).log(eq("user123"), eq("UPDATE_PRIVACY"), anyString(), eq("127.0.0.1"));
    }

    @Test
    void testConnectAccount_NewLink() {
        when(connectedAccountRepository.findByUserIdAndPlatformName("user123", "STEAM")).thenReturn(Optional.empty());
        when(connectedAccountRepository.save(any(ConnectedAccount.class))).thenReturn(connectedAccount);

        ConnectedAccountRequest request = new ConnectedAccountRequest();
        request.setPlatformName("Steam");
        request.setPlatformUserId("steamId123");
        request.setPlatformUsername("steamUser");

        ConnectedAccountResponse response = userProfileService.connectAccount("user123", request, "127.0.0.1");

        assertNotNull(response);
        assertEquals("STEAM", response.getPlatformName());
        verify(connectedAccountRepository, times(1)).save(any(ConnectedAccount.class));
        verify(auditLogService, times(1)).log(eq("user123"), eq("CONNECT_ACCOUNT"), anyString(), eq("127.0.0.1"));
    }

    @Test
    void testDisconnectAccount_Success() {
        when(connectedAccountRepository.findById(1L)).thenReturn(Optional.of(connectedAccount));

        userProfileService.disconnectAccount("user123", 1L, "127.0.0.1");

        verify(connectedAccountRepository, times(1)).delete(connectedAccount);
        verify(auditLogService, times(1)).log(eq("user123"), eq("DISCONNECT_ACCOUNT"), anyString(), eq("127.0.0.1"));
    }

    @Test
    void testDisconnectAccount_Unauthorized() {
        when(connectedAccountRepository.findById(1L)).thenReturn(Optional.of(connectedAccount));

        assertThrows(BadRequestException.class, () -> userProfileService.disconnectAccount("other_user", 1L, "127.0.0.1"));
        verify(connectedAccountRepository, never()).delete(any(ConnectedAccount.class));
    }
}
