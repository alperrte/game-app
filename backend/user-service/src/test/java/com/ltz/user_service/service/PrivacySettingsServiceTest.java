package com.ltz.user_service.service;

import com.ltz.user_service.dto.request.PrivacySettingsRequest;
import com.ltz.user_service.dto.response.PrivacySettingsResponse;
import com.ltz.user_service.entity.PrivacySettings;
import com.ltz.user_service.entity.Visibility;
import com.ltz.user_service.repository.PrivacySettingsRepository;
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
class PrivacySettingsServiceTest {

    private static final ClientRequestContext TEST_CONTEXT =
            new ClientRequestContext("127.0.0.1", "JUnit", "Desktop");

    @Mock
    private PrivacySettingsRepository privacySettingsRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private PrivacySettingsService privacySettingsService;

    private PrivacySettings privacySettings;

    @BeforeEach
    void setUp() {
        privacySettings = PrivacySettings.builder()
                .id(1L)
                .userId("user123")
                .profileVisibility(Visibility.PUBLIC)
                .gameLibraryVisibility(Visibility.PUBLIC)
                .hardwareVisibility(Visibility.PUBLIC)
                .friendListVisibility(Visibility.PUBLIC)
                .build();
    }

    @Test
    void testGetPrivacySettings_Exists() {
        when(privacySettingsRepository.findByUserId("user123")).thenReturn(Optional.of(privacySettings));

        PrivacySettingsResponse response = privacySettingsService.getPrivacySettings("user123");

        assertNotNull(response);
        assertEquals("user123", response.getUserId());
        assertEquals(Visibility.PUBLIC, response.getProfileVisibility());
    }

    @Test
    void testGetPrivacySettings_New() {
        when(privacySettingsRepository.findByUserId("user123")).thenReturn(Optional.empty());
        when(privacySettingsRepository.save(any(PrivacySettings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PrivacySettingsResponse response = privacySettingsService.getPrivacySettings("user123");

        assertNotNull(response);
        assertEquals("user123", response.getUserId());
        verify(privacySettingsRepository, times(1)).save(any(PrivacySettings.class));
    }

    @Test
    void testUpdatePrivacySettings() {
        when(privacySettingsRepository.findByUserId("user123")).thenReturn(Optional.of(privacySettings));
        when(privacySettingsRepository.save(any(PrivacySettings.class))).thenReturn(privacySettings);

        PrivacySettingsRequest request = new PrivacySettingsRequest();
        request.setProfileVisibility(Visibility.PRIVATE);

        PrivacySettingsResponse response = privacySettingsService.updatePrivacySettings("user123", request, TEST_CONTEXT);

        assertNotNull(response);
        verify(privacySettingsRepository, times(1)).save(any(PrivacySettings.class));
        verify(auditLogService, times(1)).log(eq("user123"), eq("UPDATE_PRIVACY"), anyString(), eq(TEST_CONTEXT));
    }
}
