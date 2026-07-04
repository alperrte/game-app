package com.ltz.hardware_service.service;

import com.ltz.hardware_service.dto.response.*;
import com.ltz.hardware_service.entity.*;
import org.springframework.stereotype.Component;

@Component
public class HardwareResponseMapper {

    public HardwareBrandResponse toBrandResponse(HardwareBrand brand) {
        if (brand == null) {
            return null;
        }

        return HardwareBrandResponse.builder()
                .id(brand.getId())
                .name(brand.getName())
                .logoUrl(brand.getLogoUrl())
                .websiteUrl(brand.getWebsiteUrl())
                .active(brand.getActive())
                .createdAt(brand.getCreatedAt())
                .updatedAt(brand.getUpdatedAt())
                .build();
    }

    public HardwareComponentSummaryResponse toComponentSummaryResponse(HardwareComponent component) {
        if (component == null) {
            return null;
        }

        return HardwareComponentSummaryResponse.builder()
                .id(component.getId())
                .componentType(component.getComponentType())
                .category(component.getCategory())
                .brandName(component.getBrand() != null ? component.getBrand().getName() : null)
                .seriesName(component.getSeriesName())
                .modelName(component.getModelName())
                .imageUrl(component.getImageUrl())
                .verified(component.getVerified())
                .build();
    }

    public HardwareComponentResponse toComponentResponse(HardwareComponent component) {
        if (component == null) {
            return null;
        }

        return HardwareComponentResponse.builder()
                .id(component.getId())
                .componentType(component.getComponentType())
                .category(component.getCategory())
                .brandId(component.getBrand() != null ? component.getBrand().getId() : null)
                .brandName(component.getBrand() != null ? component.getBrand().getName() : null)
                .seriesName(component.getSeriesName())
                .modelName(component.getModelName())
                .normalizedName(component.getNormalizedName())
                .aliases(component.getAliases())
                .imageUrl(component.getImageUrl())
                .verified(component.getVerified())
                .createdByUserId(component.getCreatedByUserId())
                .vramGb(component.getVramGb())
                .coreCount(component.getCoreCount())
                .threadCount(component.getThreadCount())
                .memoryGb(component.getMemoryGb())
                .storageCapacityGb(component.getStorageCapacityGb())
                .extraSpecs(component.getExtraSpecs())
                .active(component.getActive())
                .createdAt(component.getCreatedAt())
                .updatedAt(component.getUpdatedAt())
                .build();
    }

    public UserHardwareResponse toUserHardwareResponse(UserHardware userHardware) {
        if (userHardware == null) {
            return null;
        }

        return UserHardwareResponse.builder()
                .id(userHardware.getId())
                .userId(userHardware.getUserId())
                .cpuComponent(toComponentSummaryResponse(userHardware.getCpuComponent()))
                .gpuComponent(toComponentSummaryResponse(userHardware.getGpuComponent()))
                .ramGb(userHardware.getRamGb())
                .ramType(userHardware.getRamType())
                .storageGb(userHardware.getStorageGb())
                .storageType(userHardware.getStorageType())
                .motherboardComponent(toComponentSummaryResponse(userHardware.getMotherboardComponent()))
                .monitorComponent(toComponentSummaryResponse(userHardware.getMonitorComponent()))
                .keyboardComponent(toComponentSummaryResponse(userHardware.getKeyboardComponent()))
                .mouseComponent(toComponentSummaryResponse(userHardware.getMouseComponent()))
                .headsetComponent(toComponentSummaryResponse(userHardware.getHeadsetComponent()))
                .operatingSystem(userHardware.getOperatingSystem())
                .monitorResolution(userHardware.getMonitorResolution())
                .monitorRefreshRate(userHardware.getMonitorRefreshRate())
                .rigImageUrl(userHardware.getRigImageUrl())
                .visibility(userHardware.getVisibility())
                .createdAt(userHardware.getCreatedAt())
                .updatedAt(userHardware.getUpdatedAt())
                .build();
    }

    public HardwareReviewResponse toReviewResponse(HardwareReview review) {
        if (review == null) {
            return null;
        }

        return HardwareReviewResponse.builder()
                .id(review.getId())
                .userId(review.getUserId())
                .component(toComponentSummaryResponse(review.getComponent()))
                .reviewType(review.getReviewType())
                .rating(review.getRating())
                .title(review.getTitle())
                .content(review.getContent())
                .pros(review.getPros())
                .cons(review.getCons())
                .usageDurationMonths(review.getUsageDurationMonths())
                .verifiedOwner(review.getVerifiedOwner())
                .likeCount(review.getLikeCount())
                .reportCount(review.getReportCount())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }

    public GamePerformanceReportResponse toPerformanceReportResponse(GamePerformanceReport report) {
        if (report == null) {
            return null;
        }

        return GamePerformanceReportResponse.builder()
                .id(report.getId())
                .userId(report.getUserId())
                .gameId(report.getGameId())
                .reviewId(report.getReviewId())
                .cpuComponent(toComponentSummaryResponse(report.getCpuComponent()))
                .gpuComponent(toComponentSummaryResponse(report.getGpuComponent()))
                .ramGb(report.getRamGb())
                .resolution(report.getResolution())
                .graphicsPreset(report.getGraphicsPreset())
                .averageFps(report.getAverageFps())
                .minimumFps(report.getMinimumFps())
                .maximumFps(report.getMaximumFps())
                .rayTracingEnabled(report.getRayTracingEnabled())
                .upscalingType(report.getUpscalingType())
                .driverVersion(report.getDriverVersion())
                .notes(report.getNotes())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .build();
    }

    public HardwareDealResponse toDealResponse(HardwareDeal deal) {
        if (deal == null) {
            return null;
        }

        return HardwareDealResponse.builder()
                .id(deal.getId())
                .component(toComponentSummaryResponse(deal.getComponent()))
                .title(deal.getTitle())
                .storeName(deal.getStoreName())
                .oldPrice(deal.getOldPrice())
                .newPrice(deal.getNewPrice())
                .currency(deal.getCurrency())
                .discountPercentage(deal.getDiscountPercentage())
                .dealUrl(deal.getDealUrl())
                .sourceType(deal.getSourceType())
                .active(deal.getActive())
                .startDate(deal.getStartDate())
                .endDate(deal.getEndDate())
                .createdAt(deal.getCreatedAt())
                .updatedAt(deal.getUpdatedAt())
                .build();
    }
}
