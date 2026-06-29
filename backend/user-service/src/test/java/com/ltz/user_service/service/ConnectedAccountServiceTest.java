package com.ltz.user_service.service;

import com.ltz.user_service.dto.request.ConnectedAccountRequest;
import com.ltz.user_service.dto.response.ConnectedAccountResponse;
import com.ltz.user_service.entity.ConnectedAccount;
import com.ltz.user_service.exception.BadRequestException;
import com.ltz.user_service.exception.ResourceNotFoundException;
import com.ltz.user_service.repository.ConnectedAccountRepository;
import com.ltz.user_service.util.ClientRequestContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConnectedAccountServiceTest {

    private static final ClientRequestContext TEST_CONTEXT =
            new ClientRequestContext("127.0.0.1", "JUnit", "Desktop");

    @Mock
    private ConnectedAccountRepository connectedAccountRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private ConnectedAccountService connectedAccountService;

    private ConnectedAccount connectedAccount;

    @BeforeEach
    void setUp() {
        connectedAccount = ConnectedAccount.builder()
                .id(1L)
                .userId("user123")
                .platformName("STEAM")
                .platformUserId("steamId123")
                .platformUsername("steamUser")
                .build();
    }

    @Test
    void testGetConnectedAccounts() {
        when(connectedAccountRepository.findByUserId("user123")).thenReturn(Collections.singletonList(connectedAccount));

        List<ConnectedAccountResponse> responses = connectedAccountService.getConnectedAccounts("user123");

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("STEAM", responses.get(0).getPlatformName());
    }

    @Test
    void testConnectAccount_NewLink() {
        when(connectedAccountRepository.findByUserIdAndPlatformName("user123", "STEAM")).thenReturn(Optional.empty());
        when(connectedAccountRepository.save(any(ConnectedAccount.class))).thenReturn(connectedAccount);

        ConnectedAccountRequest request = new ConnectedAccountRequest();
        request.setPlatformName("Steam");
        request.setPlatformUserId("steamId123");
        request.setPlatformUsername("steamUser");

        ConnectedAccountResponse response = connectedAccountService.connectAccount("user123", request, TEST_CONTEXT);

        assertNotNull(response);
        assertEquals("STEAM", response.getPlatformName());
        verify(connectedAccountRepository, times(1)).save(any(ConnectedAccount.class));
        verify(auditLogService, times(1)).log(eq("user123"), eq("CONNECT_ACCOUNT"), anyString(), eq(TEST_CONTEXT));
    }

    @Test
    void testConnectAccount_UpdateExisting() {
        when(connectedAccountRepository.findByUserIdAndPlatformName("user123", "STEAM")).thenReturn(Optional.of(connectedAccount));
        when(connectedAccountRepository.save(any(ConnectedAccount.class))).thenReturn(connectedAccount);

        ConnectedAccountRequest request = new ConnectedAccountRequest();
        request.setPlatformName("Steam");
        request.setPlatformUserId("newSteamId");
        request.setPlatformUsername("newSteamUser");

        ConnectedAccountResponse response = connectedAccountService.connectAccount("user123", request, TEST_CONTEXT);

        assertNotNull(response);
        verify(connectedAccountRepository, times(1)).save(any(ConnectedAccount.class));
        verify(auditLogService, times(1)).log(eq("user123"), eq("UPDATE_CONNECTED_ACCOUNT"), anyString(), eq(TEST_CONTEXT));
    }

    @Test
    void testDisconnectAccount_Success() {
        when(connectedAccountRepository.findById(1L)).thenReturn(Optional.of(connectedAccount));

        connectedAccountService.disconnectAccount("user123", 1L, TEST_CONTEXT);

        verify(connectedAccountRepository, times(1)).delete(connectedAccount);
        verify(auditLogService, times(1)).log(eq("user123"), eq("DISCONNECT_ACCOUNT"), anyString(), eq(TEST_CONTEXT));
    }

    @Test
    void testDisconnectAccount_Unauthorized() {
        when(connectedAccountRepository.findById(1L)).thenReturn(Optional.of(connectedAccount));

        assertThrows(BadRequestException.class, () -> connectedAccountService.disconnectAccount("other_user", 1L, TEST_CONTEXT));
        verify(connectedAccountRepository, never()).delete(any(ConnectedAccount.class));
    }

    @Test
    void testDisconnectAccount_NotFound() {
        when(connectedAccountRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> connectedAccountService.disconnectAccount("user123", 1L, TEST_CONTEXT));
    }
}
