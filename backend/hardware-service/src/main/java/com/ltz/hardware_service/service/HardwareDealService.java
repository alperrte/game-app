package com.ltz.hardware_service.service;

import com.ltz.hardware_service.dto.request.HardwareDealCreateRequest;
import com.ltz.hardware_service.dto.request.HardwareDealUpdateRequest;
import com.ltz.hardware_service.dto.response.HardwareDealResponse;
import com.ltz.hardware_service.dto.response.MessageResponse;
import com.ltz.hardware_service.entity.HardwareDeal;
import com.ltz.hardware_service.repository.HardwareDealRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.ltz.hardware_service.entity.enums.DealSourceType;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HardwareDealService {

    private final HardwareDealRepository hardwareDealRepository;
    private final HardwareComponentService hardwareComponentService;
    private final HardwareResponseMapper mapper;

    @Transactional
    public HardwareDealResponse createDeal(HardwareDealCreateRequest request) {
        HardwareDeal deal = HardwareDeal.builder()
                .component(hardwareComponentService.findComponentByIdOrNull(request.getComponentId()))
                .title(request.getTitle())
                .storeName(request.getStoreName())
                .oldPrice(request.getOldPrice())
                .newPrice(request.getNewPrice())
                .currency(request.getCurrency() != null ? request.getCurrency() : "TRY")
                .discountPercentage(resolveDiscountPercentage(request.getOldPrice(), request.getNewPrice(), request.getDiscountPercentage()))
                .dealUrl(request.getDealUrl())
                .sourceType(request.getSourceType() != null ? request.getSourceType() : DealSourceType.MANUAL)                .active(true)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .build();

        return mapper.toDealResponse(hardwareDealRepository.save(deal));
    }

    public List<HardwareDealResponse> getAllDeals() {
        return hardwareDealRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(mapper::toDealResponse)
                .toList();
    }

    public List<HardwareDealResponse> getActiveDeals() {
        return hardwareDealRepository.findByActiveTrueOrderByCreatedAtDesc()
                .stream()
                .map(mapper::toDealResponse)
                .toList();
    }

    public HardwareDealResponse getDealById(Long id) {
        return mapper.toDealResponse(findDealById(id));
    }

    public List<HardwareDealResponse> getDealsByComponent(Long componentId) {
        return hardwareDealRepository.findByComponent_IdAndActiveTrueOrderByCreatedAtDesc(componentId)
                .stream()
                .map(mapper::toDealResponse)
                .toList();
    }

    public List<HardwareDealResponse> getDealsByStore(String storeName) {
        return hardwareDealRepository.findByStoreNameIgnoreCaseAndActiveTrueOrderByCreatedAtDesc(storeName)
                .stream()
                .map(mapper::toDealResponse)
                .toList();
    }

    @Transactional
    public HardwareDealResponse updateDeal(Long id, HardwareDealUpdateRequest request) {
        HardwareDeal deal = findDealById(id);

        if (request.getComponentId() != null) {
            deal.setComponent(hardwareComponentService.findComponentByIdOrNull(request.getComponentId()));
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            deal.setTitle(request.getTitle());
        }

        if (request.getStoreName() != null) {
            deal.setStoreName(request.getStoreName());
        }

        if (request.getOldPrice() != null) {
            deal.setOldPrice(request.getOldPrice());
        }

        if (request.getNewPrice() != null) {
            deal.setNewPrice(request.getNewPrice());
        }

        if (request.getCurrency() != null) {
            deal.setCurrency(request.getCurrency());
        }

        if (request.getDiscountPercentage() != null) {
            deal.setDiscountPercentage(request.getDiscountPercentage());
        } else {
            deal.setDiscountPercentage(resolveDiscountPercentage(deal.getOldPrice(), deal.getNewPrice(), deal.getDiscountPercentage()));
        }

        if (request.getDealUrl() != null) {
            deal.setDealUrl(request.getDealUrl());
        }

        if (request.getSourceType() != null) {
            deal.setSourceType(request.getSourceType());
        }

        if (request.getActive() != null) {
            deal.setActive(request.getActive());
        }

        if (request.getStartDate() != null) {
            deal.setStartDate(request.getStartDate());
        }

        if (request.getEndDate() != null) {
            deal.setEndDate(request.getEndDate());
        }

        return mapper.toDealResponse(hardwareDealRepository.save(deal));
    }

    @Transactional
    public MessageResponse deleteDeal(Long id) {
        HardwareDeal deal = findDealById(id);
        hardwareDealRepository.delete(deal);

        return MessageResponse.builder()
                .message("Donanım kampanyası başarıyla silindi.")
                .build();
    }

    private HardwareDeal findDealById(Long id) {
        return hardwareDealRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Donanım kampanyası bulunamadı."));
    }

    private BigDecimal resolveDiscountPercentage(
            BigDecimal oldPrice,
            BigDecimal newPrice,
            BigDecimal providedDiscount
    ) {
        if (providedDiscount != null) {
            return providedDiscount;
        }

        if (oldPrice == null || newPrice == null) {
            return null;
        }

        if (oldPrice.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }

        if (newPrice.compareTo(oldPrice) >= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal discount = oldPrice.subtract(newPrice)
                .multiply(BigDecimal.valueOf(100))
                .divide(oldPrice, 2, RoundingMode.HALF_UP);

        return discount;
    }
}