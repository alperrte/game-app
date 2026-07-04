package com.ltz.hardware_service.service;

import com.ltz.hardware_service.dto.request.UserHardwareUpsertRequest;
import com.ltz.hardware_service.dto.response.MessageResponse;
import com.ltz.hardware_service.dto.response.UserHardwareResponse;
import com.ltz.hardware_service.entity.UserHardware;
import com.ltz.hardware_service.entity.enums.HardwareVisibility;
import com.ltz.hardware_service.repository.UserHardwareRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UserHardwareService {

    private final UserHardwareRepository userHardwareRepository;
    private final HardwareComponentService hardwareComponentService;
    private final HardwareResponseMapper mapper;

    public UserHardwareResponse getUserHardware(Long userId) {
        UserHardware userHardware = userHardwareRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kullanıcı donanım bilgisi bulunamadı."));

        return mapper.toUserHardwareResponse(userHardware);
    }

    @Transactional
    public UserHardwareResponse upsertUserHardware(Long userId, UserHardwareUpsertRequest request) {
        UserHardware userHardware = userHardwareRepository.findByUserId(userId)
                .orElseGet(() -> UserHardware.builder()
                        .userId(userId)
                        .visibility(HardwareVisibility.PRIVATE)
                        .build());

        userHardware.setCpuComponent(hardwareComponentService.findComponentByIdOrNull(request.getCpuComponentId()));
        userHardware.setGpuComponent(hardwareComponentService.findComponentByIdOrNull(request.getGpuComponentId()));
        userHardware.setRamGb(request.getRamGb());
        userHardware.setRamType(request.getRamType());
        userHardware.setStorageGb(request.getStorageGb());
        userHardware.setStorageType(request.getStorageType());

        userHardware.setMotherboardComponent(hardwareComponentService.findComponentByIdOrNull(request.getMotherboardComponentId()));
        userHardware.setMonitorComponent(hardwareComponentService.findComponentByIdOrNull(request.getMonitorComponentId()));
        userHardware.setKeyboardComponent(hardwareComponentService.findComponentByIdOrNull(request.getKeyboardComponentId()));
        userHardware.setMouseComponent(hardwareComponentService.findComponentByIdOrNull(request.getMouseComponentId()));
        userHardware.setHeadsetComponent(hardwareComponentService.findComponentByIdOrNull(request.getHeadsetComponentId()));

        userHardware.setRigImageUrl(request.getRigImageUrl());
        userHardware.setOperatingSystem(request.getOperatingSystem());
        userHardware.setMonitorResolution(request.getMonitorResolution());
        userHardware.setMonitorRefreshRate(request.getMonitorRefreshRate());

        if (request.getVisibility() != null) {
            userHardware.setVisibility(request.getVisibility());
        }

        return mapper.toUserHardwareResponse(userHardwareRepository.save(userHardware));
    }

    @Transactional
    public MessageResponse deleteUserHardware(Long userId) {
        UserHardware userHardware = userHardwareRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kullanıcı donanım bilgisi bulunamadı."));

        userHardwareRepository.delete(userHardware);

        return MessageResponse.builder()
                .message("Kullanıcı donanım bilgisi başarıyla silindi.")
                .build();
    }
}
