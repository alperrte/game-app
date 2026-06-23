package com.ltz.hardware_service.controller;

import com.ltz.hardware_service.dto.request.HardwareComponentCreateRequest;
import com.ltz.hardware_service.dto.request.HardwareComponentUpdateRequest;
import com.ltz.hardware_service.dto.response.HardwareComponentResponse;
import com.ltz.hardware_service.dto.response.MessageResponse;
import com.ltz.hardware_service.entity.enums.ComponentCategory;
import com.ltz.hardware_service.entity.enums.ComponentType;
import com.ltz.hardware_service.service.HardwareComponentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hardware/components")
@RequiredArgsConstructor
public class HardwareComponentController {

    private final HardwareComponentService hardwareComponentService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HardwareComponentResponse createComponent(
            @Valid @RequestBody HardwareComponentCreateRequest request
    ) {
        return hardwareComponentService.createComponent(request);
    }

    @GetMapping
    public List<HardwareComponentResponse> getAllComponents() {
        return hardwareComponentService.getAllComponents();
    }

    @GetMapping("/active")
    public List<HardwareComponentResponse> getActiveComponents() {
        return hardwareComponentService.getActiveComponents();
    }

    @GetMapping("/{id}")
    public HardwareComponentResponse getComponentById(
            @PathVariable Long id
    ) {
        return hardwareComponentService.getComponentById(id);
    }

    @GetMapping("/search")
    public List<HardwareComponentResponse> searchComponents(
            @RequestParam(required = false) ComponentType componentType,
            @RequestParam(required = false) ComponentCategory category,
            @RequestParam(required = false) String query
    ) {
        return hardwareComponentService.searchComponents(componentType, category, query);
    }

    @PutMapping("/{id}")
    public HardwareComponentResponse updateComponent(
            @PathVariable Long id,
            @Valid @RequestBody HardwareComponentUpdateRequest request
    ) {
        return hardwareComponentService.updateComponent(id, request);
    }

    @DeleteMapping("/{id}")
    public MessageResponse deleteComponent(
            @PathVariable Long id
    ) {
        return hardwareComponentService.deleteComponent(id);
    }
}