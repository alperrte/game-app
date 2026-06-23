package com.ltz.hardware_service.controller;

import com.ltz.hardware_service.dto.request.HardwareDealCreateRequest;
import com.ltz.hardware_service.dto.request.HardwareDealUpdateRequest;
import com.ltz.hardware_service.dto.response.HardwareDealResponse;
import com.ltz.hardware_service.dto.response.MessageResponse;
import com.ltz.hardware_service.service.HardwareDealService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hardware/deals")
@RequiredArgsConstructor
public class HardwareDealController {

    private final HardwareDealService hardwareDealService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HardwareDealResponse createDeal(
            @Valid @RequestBody HardwareDealCreateRequest request
    ) {
        return hardwareDealService.createDeal(request);
    }

    @GetMapping
    public List<HardwareDealResponse> getAllDeals() {
        return hardwareDealService.getAllDeals();
    }

    @GetMapping("/active")
    public List<HardwareDealResponse> getActiveDeals() {
        return hardwareDealService.getActiveDeals();
    }

    @GetMapping("/{id}")
    public HardwareDealResponse getDealById(
            @PathVariable Long id
    ) {
        return hardwareDealService.getDealById(id);
    }

    @GetMapping("/components/{componentId}")
    public List<HardwareDealResponse> getDealsByComponent(
            @PathVariable Long componentId
    ) {
        return hardwareDealService.getDealsByComponent(componentId);
    }

    @GetMapping("/stores/{storeName}")
    public List<HardwareDealResponse> getDealsByStore(
            @PathVariable String storeName
    ) {
        return hardwareDealService.getDealsByStore(storeName);
    }

    @PutMapping("/{id}")
    public HardwareDealResponse updateDeal(
            @PathVariable Long id,
            @Valid @RequestBody HardwareDealUpdateRequest request
    ) {
        return hardwareDealService.updateDeal(id, request);
    }

    @DeleteMapping("/{id}")
    public MessageResponse deleteDeal(
            @PathVariable Long id
    ) {
        return hardwareDealService.deleteDeal(id);
    }
}