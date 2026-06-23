package com.ltz.hardware_service.service;

import com.ltz.hardware_service.dto.request.HardwareBrandCreateRequest;
import com.ltz.hardware_service.dto.request.HardwareBrandUpdateRequest;
import com.ltz.hardware_service.dto.response.HardwareBrandResponse;
import com.ltz.hardware_service.dto.response.MessageResponse;
import com.ltz.hardware_service.entity.HardwareBrand;
import com.ltz.hardware_service.repository.HardwareBrandRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HardwareBrandService {

    private final HardwareBrandRepository hardwareBrandRepository;
    private final HardwareResponseMapper mapper;

    @Transactional
    public HardwareBrandResponse createBrand(HardwareBrandCreateRequest request) {
        if (hardwareBrandRepository.existsByNameIgnoreCase(request.getName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu marka zaten mevcut.");
        }

        HardwareBrand brand = HardwareBrand.builder()
                .name(request.getName())
                .logoUrl(request.getLogoUrl())
                .websiteUrl(request.getWebsiteUrl())
                .active(true)
                .build();

        return mapper.toBrandResponse(hardwareBrandRepository.save(brand));
    }

    public List<HardwareBrandResponse> getAllBrands() {
        return hardwareBrandRepository.findAll()
                .stream()
                .map(mapper::toBrandResponse)
                .toList();
    }

    public List<HardwareBrandResponse> getActiveBrands() {
        return hardwareBrandRepository.findByActiveTrueOrderByNameAsc()
                .stream()
                .map(mapper::toBrandResponse)
                .toList();
    }

    public HardwareBrandResponse getBrandById(Long id) {
        return mapper.toBrandResponse(findBrandById(id));
    }

    @Transactional
    public HardwareBrandResponse updateBrand(Long id, HardwareBrandUpdateRequest request) {
        HardwareBrand brand = findBrandById(id);

        if (request.getName() != null && !request.getName().isBlank()) {
            hardwareBrandRepository.findByNameIgnoreCase(request.getName())
                    .ifPresent(existingBrand -> {
                        if (!existingBrand.getId().equals(id)) {
                            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu marka adı zaten kullanılıyor.");
                        }
                    });

            brand.setName(request.getName());
        }

        if (request.getLogoUrl() != null) {
            brand.setLogoUrl(request.getLogoUrl());
        }

        if (request.getWebsiteUrl() != null) {
            brand.setWebsiteUrl(request.getWebsiteUrl());
        }

        if (request.getActive() != null) {
            brand.setActive(request.getActive());
        }

        return mapper.toBrandResponse(hardwareBrandRepository.save(brand));
    }

    @Transactional
    public MessageResponse deleteBrand(Long id) {
        HardwareBrand brand = findBrandById(id);
        hardwareBrandRepository.delete(brand);

        return MessageResponse.builder()
                .message("Marka başarıyla silindi.")
                .build();
    }

    public HardwareBrand findBrandById(Long id) {
        return hardwareBrandRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Marka bulunamadı."));
    }
}