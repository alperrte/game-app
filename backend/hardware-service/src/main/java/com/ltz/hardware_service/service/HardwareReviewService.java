package com.ltz.hardware_service.service;

import com.ltz.hardware_service.dto.request.HardwareReviewCreateRequest;
import com.ltz.hardware_service.dto.request.HardwareReviewUpdateRequest;
import com.ltz.hardware_service.dto.response.HardwareReviewResponse;
import com.ltz.hardware_service.dto.response.MessageResponse;
import com.ltz.hardware_service.entity.HardwareComponent;
import com.ltz.hardware_service.entity.HardwareReview;
import com.ltz.hardware_service.entity.enums.HardwareReviewType;
import com.ltz.hardware_service.repository.HardwareReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HardwareReviewService {

    private final HardwareReviewRepository hardwareReviewRepository;
    private final HardwareComponentService hardwareComponentService;
    private final HardwareResponseMapper mapper;

    @Transactional
    public HardwareReviewResponse createReview(Long userId, HardwareReviewCreateRequest request) {
        HardwareComponent component = hardwareComponentService.findComponentById(request.getComponentId());

        HardwareReview review = HardwareReview.builder()
                .userId(userId)
                .component(component)
                .reviewType(request.getReviewType())
                .rating(request.getRating())
                .title(request.getTitle())
                .content(request.getContent())
                .pros(request.getPros())
                .cons(request.getCons())
                .usageDurationMonths(request.getUsageDurationMonths())
                .verifiedOwner(false)
                .likeCount(0)
                .reportCount(0)
                .build();

        return mapper.toReviewResponse(hardwareReviewRepository.save(review));
    }

    public HardwareReviewResponse getReviewById(Long id) {
        return mapper.toReviewResponse(findReviewById(id));
    }

    public List<HardwareReviewResponse> getReviewsByComponent(Long componentId) {
        return hardwareReviewRepository.findByComponent_IdOrderByCreatedAtDesc(componentId)
                .stream()
                .map(mapper::toReviewResponse)
                .toList();
    }

    public List<HardwareReviewResponse> getReviewsByUser(Long userId) {
        return hardwareReviewRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(mapper::toReviewResponse)
                .toList();
    }

    public List<HardwareReviewResponse> getReviewsByType(HardwareReviewType reviewType) {
        return hardwareReviewRepository.findByReviewTypeOrderByCreatedAtDesc(reviewType)
                .stream()
                .map(mapper::toReviewResponse)
                .toList();
    }

    public List<HardwareReviewResponse> getReviewsByComponentAndType(
            Long componentId,
            HardwareReviewType reviewType
    ) {
        return hardwareReviewRepository.findByComponent_IdAndReviewTypeOrderByCreatedAtDesc(componentId, reviewType)
                .stream()
                .map(mapper::toReviewResponse)
                .toList();
    }

    @Transactional
    public HardwareReviewResponse updateReview(Long reviewId, Long userId, HardwareReviewUpdateRequest request) {
        HardwareReview review = findReviewById(reviewId);

        validateReviewOwner(review, userId);

        if (request.getReviewType() != null) {
            review.setReviewType(request.getReviewType());
        }

        if (request.getRating() != null) {
            review.setRating(request.getRating());
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            review.setTitle(request.getTitle());
        }

        if (request.getContent() != null && !request.getContent().isBlank()) {
            review.setContent(request.getContent());
        }

        if (request.getPros() != null) {
            review.setPros(request.getPros());
        }

        if (request.getCons() != null) {
            review.setCons(request.getCons());
        }

        if (request.getUsageDurationMonths() != null) {
            review.setUsageDurationMonths(request.getUsageDurationMonths());
        }

        return mapper.toReviewResponse(hardwareReviewRepository.save(review));
    }

    @Transactional
    public MessageResponse deleteReview(Long reviewId, Long userId) {
        HardwareReview review = findReviewById(reviewId);

        validateReviewOwner(review, userId);

        hardwareReviewRepository.delete(review);

        return MessageResponse.builder()
                .message("Donanım incelemesi başarıyla silindi.")
                .build();
    }

    private HardwareReview findReviewById(Long id) {
        return hardwareReviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Donanım incelemesi bulunamadı."));
    }

    private void validateReviewOwner(HardwareReview review, Long userId) {
        if (!review.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu inceleme üzerinde işlem yapamazsın.");
        }
    }
}