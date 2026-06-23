package com.ltz.hardware_service.controller;

import com.ltz.hardware_service.dto.request.HardwareBrandCreateRequest;
import com.ltz.hardware_service.dto.request.HardwareBrandUpdateRequest;
import com.ltz.hardware_service.dto.response.HardwareBrandResponse;
import com.ltz.hardware_service.dto.response.MessageResponse;
import com.ltz.hardware_service.service.HardwareBrandService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hardware/brands")
@RequiredArgsConstructor
public class HardwareBrandController {

    private final HardwareBrandService hardwareBrandService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HardwareBrandResponse createBrand(
            @Valid @RequestBody HardwareBrandCreateRequest request
    ) {
        return hardwareBrandService.createBrand(request);
    }

    @GetMapping
    public List<HardwareBrandResponse> getAllBrands() {
        return hardwareBrandService.getAllBrands();
    }

    @GetMapping("/active")
    public List<HardwareBrandResponse> getActiveBrands() {
        return hardwareBrandService.getActiveBrands();
    }

    @GetMapping("/{id}")
    public HardwareBrandResponse getBrandById(
            @PathVariable Long id
    ) {
        return hardwareBrandService.getBrandById(id);
    }

    @PutMapping("/{id}")
    public HardwareBrandResponse updateBrand(
            @PathVariable Long id,
            @Valid @RequestBody HardwareBrandUpdateRequest request
    ) {
        return hardwareBrandService.updateBrand(id, request);
    }

    @DeleteMapping("/{id}")
    public MessageResponse deleteBrand(
            @PathVariable Long id
    ) {
        return hardwareBrandService.deleteBrand(id);
    }
}