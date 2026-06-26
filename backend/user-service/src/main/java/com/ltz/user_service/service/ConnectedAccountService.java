package com.ltz.user_service.service;

import com.ltz.user_service.dto.request.ConnectedAccountRequest;
import lombok.extern.slf4j.Slf4j;
import com.ltz.user_service.dto.response.ConnectedAccountResponse;
import com.ltz.user_service.entity.ConnectedAccount;
import com.ltz.user_service.entity.AuditAction;
import com.ltz.user_service.exception.BadRequestException;
import com.ltz.user_service.exception.ResourceNotFoundException;
import com.ltz.user_service.repository.ConnectedAccountRepository;
import com.ltz.user_service.util.ClientRequestContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ConnectedAccountService {

    private final ConnectedAccountRepository connectedAccountRepository;
    private final AuditLogService auditLogService;

    public ConnectedAccountService(ConnectedAccountRepository connectedAccountRepository,
                                   AuditLogService auditLogService) {
        this.connectedAccountRepository = connectedAccountRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<ConnectedAccountResponse> getConnectedAccounts(String userId) {
        return connectedAccountRepository.findByUserId(userId).stream()
                .map(this::mapToConnectedAccountResponse)
                .collect(Collectors.toList());
      }

    @Transactional
    public ConnectedAccountResponse connectAccount(String userId, ConnectedAccountRequest request, ClientRequestContext context) {
        Optional<ConnectedAccount> existing = connectedAccountRepository
                .findByUserIdAndPlatformName(userId, request.getPlatformName().toUpperCase());

        ConnectedAccount account;
        boolean isNew = !existing.isPresent();
        if (existing.isPresent()) {
            account = existing.get();
            account.setPlatformUserId(request.getPlatformUserId());
            account.setPlatformUsername(request.getPlatformUsername());
        } else {
            account = ConnectedAccount.builder()
                    .userId(userId)
                    .platformName(request.getPlatformName().toUpperCase())
                    .platformUserId(request.getPlatformUserId())
                    .platformUsername(request.getPlatformUsername())
                    .build();
        }

        ConnectedAccount saved = connectedAccountRepository.save(account);

        auditLogService.log(userId, isNew ? AuditAction.CONNECT_ACCOUNT.name() : AuditAction.UPDATE_CONNECTED_ACCOUNT.name(),
                "Linked platform: " + request.getPlatformName().toUpperCase(), context);

        log.info("Platform account successfully linked for userId: {}, platform: {}", userId, request.getPlatformName().toUpperCase());

        return mapToConnectedAccountResponse(saved);
    }

    @Transactional
    public void disconnectAccount(String userId, Long id, ClientRequestContext context) {
        ConnectedAccount account = connectedAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Connected account not found"));

        if (!account.getUserId().equals(userId)) {
            throw new BadRequestException("Unauthorized to disconnect this account");
        }

        connectedAccountRepository.delete(account);

        auditLogService.log(userId, AuditAction.DISCONNECT_ACCOUNT.name(), "Disconnected platform: " + account.getPlatformName(), context);

        log.info("Platform account successfully unlinked for userId: {}, connectedAccountId: {}", userId, id);
    }

    private ConnectedAccountResponse mapToConnectedAccountResponse(ConnectedAccount account) {
        return ConnectedAccountResponse.builder()
                .id(account.getId())
                .userId(account.getUserId())
                .platformName(account.getPlatformName())
                .platformUserId(account.getPlatformUserId())
                .platformUsername(account.getPlatformUsername())
                .connectedAt(account.getConnectedAt())
                .build();
    }
}
