package com.ltz.hardware_service.service;

import com.ltz.hardware_service.dto.request.HardwareComponentCreateRequest;
import com.ltz.hardware_service.dto.request.HardwareComponentUpdateRequest;
import com.ltz.hardware_service.dto.response.HardwareComponentResponse;
import com.ltz.hardware_service.dto.response.MessageResponse;
import com.ltz.hardware_service.entity.HardwareBrand;
import com.ltz.hardware_service.entity.HardwareComponent;
import com.ltz.hardware_service.entity.enums.ComponentCategory;
import com.ltz.hardware_service.entity.enums.ComponentType;
import com.ltz.hardware_service.repository.HardwareComponentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HardwareComponentService {

    private final HardwareComponentRepository hardwareComponentRepository;
    private final HardwareBrandService hardwareBrandService;
    private final HardwareResponseMapper mapper;

    @Transactional
    public HardwareComponentResponse createComponent(HardwareComponentCreateRequest request) {
        HardwareBrand brand = request.getBrandId() != null
                ? hardwareBrandService.findBrandById(request.getBrandId())
                : null;

        HardwareComponent component = HardwareComponent.builder()
                .componentType(request.getComponentType())
                .category(request.getCategory())
                .brand(brand)
                .seriesName(request.getSeriesName())
                .modelName(request.getModelName())
                .normalizedName(resolveNormalizedName(request.getNormalizedName(), request.getModelName()))
                .aliases(request.getAliases())
                .imageUrl(request.getImageUrl())
                .verified(request.getVerified() != null ? request.getVerified() : false)
                .createdByUserId(request.getCreatedByUserId())
                .vramGb(request.getVramGb())
                .coreCount(request.getCoreCount())
                .threadCount(request.getThreadCount())
                .memoryGb(request.getMemoryGb())
                .storageCapacityGb(request.getStorageCapacityGb())
                .extraSpecs(request.getExtraSpecs())
                .active(true)
                .build();

        return mapper.toComponentResponse(hardwareComponentRepository.save(component));
    }

    public List<HardwareComponentResponse> getAllComponents() {
        return hardwareComponentRepository.findAll()
                .stream()
                .map(mapper::toComponentResponse)
                .toList();
    }

    public List<HardwareComponentResponse> getActiveComponents() {
        return hardwareComponentRepository.findByActiveTrueOrderByModelNameAsc()
                .stream()
                .map(mapper::toComponentResponse)
                .toList();
    }

    public HardwareComponentResponse getComponentById(Long id) {
        return mapper.toComponentResponse(findComponentById(id));
    }

    public List<HardwareComponentResponse> searchComponents(
            ComponentType componentType,
            ComponentCategory category,
            String query
    ) {
        String normalizedQuery = query != null && !query.isBlank()
                ? query.trim()
                : null;

        return hardwareComponentRepository.searchComponents(componentType, category, normalizedQuery)
                .stream()
                .map(mapper::toComponentResponse)
                .toList();
    }

    @Transactional
    public HardwareComponentResponse updateComponent(Long id, HardwareComponentUpdateRequest request) {
        HardwareComponent component = findComponentById(id);

        if (request.getComponentType() != null) {
            component.setComponentType(request.getComponentType());
        }

        if (request.getCategory() != null) {
            component.setCategory(request.getCategory());
        }

        if (request.getBrandId() != null) {
            component.setBrand(hardwareBrandService.findBrandById(request.getBrandId()));
        }

        if (request.getSeriesName() != null) {
            component.setSeriesName(request.getSeriesName());
        }

        if (request.getModelName() != null && !request.getModelName().isBlank()) {
            component.setModelName(request.getModelName());

            if (request.getNormalizedName() == null || request.getNormalizedName().isBlank()) {
                component.setNormalizedName(normalize(request.getModelName()));
            }
        }

        if (request.getNormalizedName() != null) {
            component.setNormalizedName(resolveNormalizedName(request.getNormalizedName(), component.getModelName()));
        }

        if (request.getAliases() != null) {
            component.setAliases(request.getAliases());
        }

        if (request.getImageUrl() != null) {
            component.setImageUrl(request.getImageUrl());
        }

        if (request.getVerified() != null) {
            component.setVerified(request.getVerified());
        }

        if (request.getVramGb() != null) {
            component.setVramGb(request.getVramGb());
        }

        if (request.getCoreCount() != null) {
            component.setCoreCount(request.getCoreCount());
        }

        if (request.getThreadCount() != null) {
            component.setThreadCount(request.getThreadCount());
        }

        if (request.getMemoryGb() != null) {
            component.setMemoryGb(request.getMemoryGb());
        }

        if (request.getStorageCapacityGb() != null) {
            component.setStorageCapacityGb(request.getStorageCapacityGb());
        }

        if (request.getExtraSpecs() != null) {
            component.setExtraSpecs(request.getExtraSpecs());
        }

        if (request.getActive() != null) {
            component.setActive(request.getActive());
        }

        return mapper.toComponentResponse(hardwareComponentRepository.save(component));
    }

    @Transactional
    public MessageResponse deleteComponent(Long id) {
        HardwareComponent component = findComponentById(id);
        hardwareComponentRepository.delete(component);

        return MessageResponse.builder()
                .message("Donanım bileşeni başarıyla silindi.")
                .build();
    }

    public HardwareComponent findComponentById(Long id) {
        return hardwareComponentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Donanım bileşeni bulunamadı."));
    }

    public HardwareComponent findComponentByIdOrNull(Long id) {
        if (id == null) {
            return null;
        }

        return findComponentById(id);
    }

    private String resolveNormalizedName(String normalizedName, String modelName) {
        if (normalizedName != null && !normalizedName.isBlank()) {
            return normalize(normalizedName);
        }

        return normalize(modelName);
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }

        return value.trim().toLowerCase();
    }
}