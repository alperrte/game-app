package com.ltz.user_service.service;

import com.ltz.user_service.dto.request.UserProfileRequest;
import com.ltz.user_service.dto.response.UserProfileResponse;
import com.ltz.user_service.dto.response.ProfileRelationshipResponse;
import com.ltz.user_service.entity.PrivacySettings;
import com.ltz.user_service.entity.UserProfile;
import com.ltz.user_service.entity.Visibility;
import com.ltz.user_service.exception.ResourceNotFoundException;
import com.ltz.user_service.repository.ConnectedAccountRepository;
import com.ltz.user_service.repository.PrivacySettingsRepository;
import com.ltz.user_service.repository.UserAssignedBadgeRepository;
import com.ltz.user_service.repository.UserProfileRepository;
import com.ltz.user_service.security.JwtUserPrincipal;
import com.ltz.user_service.util.ClientRequestContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
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

    @Mock
    private ProfileIntegrationService profileIntegrationService;

    @InjectMocks
    private UserProfileService userProfileService;

    private UserProfile userProfile;

    @BeforeEach
    void setUp() {
        userProfile = UserProfile.builder()
                .id(1L)
                .userId("123")
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
        when(userProfileRepository.findByUserId("123")).thenReturn(Optional.of(userProfile));

        UserProfileResponse response = userProfileService.getProfile("123");

        assertNotNull(response);
        assertEquals("123", response.getUserId());
        assertEquals("gamer123", response.getUsername());
    }

    @Test
    void testGetProfile_NotFound() {
        when(userProfileRepository.findByUserId("user404")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userProfileService.getProfile("user404"));
    }

    @Test
    void testCreateOrUpdateProfile_NewProfile() {
        when(userProfileRepository.findByUserId("123")).thenReturn(Optional.empty());
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(userProfile);
        when(privacySettingsRepository.findByUserId("123")).thenReturn(Optional.empty());

        UserProfileRequest request = new UserProfileRequest();
        request.setDisplayName("Gamer One");
        request.setBio("Just a simple gamer");

        UserProfileResponse response = userProfileService.createOrUpdateProfile("123", "gamer123", "gamer123@example.com", request, TEST_CONTEXT);

        assertNotNull(response);
        verify(userProfileRepository, times(1)).save(any(UserProfile.class));
        verify(privacySettingsRepository, times(1)).save(any(PrivacySettings.class));
        verify(auditLogService, times(1)).log(eq("123"), eq("CREATE_PROFILE"), anyString(), eq(TEST_CONTEXT));
    }

    private void mockSecurityContext(Long userId) {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        JwtUserPrincipal principal = new JwtUserPrincipal(userId, "test@example.com", "testuser", "USER");
        
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(principal);
        SecurityContextHolder.setContext(securityContext);
    }

    private void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void testGetProfile_Private_Denied() {
        when(userProfileRepository.findByUserId("123")).thenReturn(Optional.of(userProfile));
        PrivacySettings settings = PrivacySettings.builder().userId("123").profileVisibility(Visibility.PRIVATE).build();
        when(privacySettingsRepository.findByUserId("123")).thenReturn(Optional.of(settings));

        mockSecurityContext(999L); // Farklı kullanıcı

        try {
            assertThrows(AccessDeniedException.class, () -> userProfileService.getProfile("123"));
        } finally {
            clearSecurityContext();
        }
    }

    @Test
    void testGetProfile_FriendsOnly_Success_WhenFriends() {
        when(userProfileRepository.findByUserId("123")).thenReturn(Optional.of(userProfile));
        PrivacySettings settings = PrivacySettings.builder().userId("123").profileVisibility(Visibility.FRIENDS_ONLY).build();
        when(privacySettingsRepository.findByUserId("123")).thenReturn(Optional.of(settings));

        mockSecurityContext(999L); // Farklı kullanıcı

        ProfileRelationshipResponse relationship = ProfileRelationshipResponse.builder().friend(true).build();
        when(profileIntegrationService.getRelationship(999L, 123L)).thenReturn(relationship);

        try {
            UserProfileResponse response = userProfileService.getProfile("123");
            assertNotNull(response);
            assertEquals("123", response.getUserId());
        } finally {
            clearSecurityContext();
        }
    }

    @Test
    void testGetProfile_FriendsOnly_Denied_WhenNotFriends() {
        when(userProfileRepository.findByUserId("123")).thenReturn(Optional.of(userProfile));
        PrivacySettings settings = PrivacySettings.builder().userId("123").profileVisibility(Visibility.FRIENDS_ONLY).build();
        when(privacySettingsRepository.findByUserId("123")).thenReturn(Optional.of(settings));

        mockSecurityContext(999L); // Farklı kullanıcı

        ProfileRelationshipResponse relationship = ProfileRelationshipResponse.builder().friend(false).build();
        when(profileIntegrationService.getRelationship(999L, 123L)).thenReturn(relationship);

        try {
            assertThrows(AccessDeniedException.class, () -> userProfileService.getProfile("123"));
        } finally {
            clearSecurityContext();
        }
    }

    @Test
    void testGetProfile_FriendsOnly_Denied_WhenServiceFails_FailSecure() {
        when(userProfileRepository.findByUserId("123")).thenReturn(Optional.of(userProfile));
        PrivacySettings settings = PrivacySettings.builder().userId("123").profileVisibility(Visibility.FRIENDS_ONLY).build();
        when(privacySettingsRepository.findByUserId("123")).thenReturn(Optional.of(settings));

        mockSecurityContext(999L); // Farklı kullanıcı

        when(profileIntegrationService.getRelationship(999L, 123L)).thenThrow(new RuntimeException("Social service down"));

        try {
            assertThrows(AccessDeniedException.class, () -> userProfileService.getProfile("123"));
        } finally {
            clearSecurityContext();
        }
    }

    @Test
    void testGetProfile_FriendsOnly_Success_WhenOwner() {
        when(userProfileRepository.findByUserId("123")).thenReturn(Optional.of(userProfile));
        PrivacySettings settings = PrivacySettings.builder().userId("123").profileVisibility(Visibility.FRIENDS_ONLY).build();
        when(privacySettingsRepository.findByUserId("123")).thenReturn(Optional.of(settings));

        mockSecurityContext(123L); // Profil sahibi

        try {
            UserProfileResponse response = userProfileService.getProfile("123");
            assertNotNull(response);
            assertEquals("123", response.getUserId());
        } finally {
            clearSecurityContext();
        }
    }
}

