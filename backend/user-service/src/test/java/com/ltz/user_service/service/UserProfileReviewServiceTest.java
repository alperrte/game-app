package com.ltz.user_service.service;

import com.ltz.user_service.dto.response.UserProfileReviewResponse;
import com.ltz.user_service.entity.UserProfileReview;
import com.ltz.user_service.exception.ResourceNotFoundException;
import com.ltz.user_service.repository.UserProfileRepository;
import com.ltz.user_service.repository.UserProfileReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserProfileReviewServiceTest {

    @Mock
    private UserProfileReviewRepository reviewRepository;

    @Mock
    private UserProfileRepository profileRepository;

    @InjectMocks
    private UserProfileReviewService reviewService;

    private UserProfileReview review;

    @BeforeEach
    void setUp() {
        review = UserProfileReview.builder()
                .id(10L)
                .reviewerId("user-1")
                .reviewerUsername("reviewer")
                .reviewerDisplayName("Reviewer Display")
                .reviewerAvatarUrl("/uploads/avatar.png")
                .reviewedId("user-2")
                .content("Friendly player, nice aim!")
                .friendlyPoint(true)
                .aimGodPoint(true)
                .reported(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void testReportReview_Success() {
        when(reviewRepository.findById(10L)).thenReturn(Optional.of(review));
        when(reviewRepository.save(any(UserProfileReview.class))).thenAnswer(invocation -> invocation.getArgument(0));

        reviewService.reportReview(10L, "Offensive content");

        assertTrue(review.isReported());
        assertEquals("Offensive content", review.getReportReason());
        verify(reviewRepository, times(1)).save(review);
    }

    @Test
    void testReportReview_NotFound() {
        when(reviewRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> reviewService.reportReview(99L, "Spam"));
    }

    @Test
    void testGetReportedReviews() {
        review.setReported(true);
        review.setReportReason("Spam behavior");
        when(reviewRepository.findByReportedTrueOrderByCreatedAtDesc()).thenReturn(List.of(review));

        List<UserProfileReviewResponse> reportedReviews = reviewService.getReportedReviews();

        assertNotNull(reportedReviews);
        assertEquals(1, reportedReviews.size());
        UserProfileReviewResponse response = reportedReviews.get(0);
        assertEquals(10L, response.getId());
        assertTrue(response.isReported());
        assertEquals("Spam behavior", response.getReportReason());
    }

    @Test
    void testResolveReport_Success() {
        review.setReported(true);
        review.setReportReason("Abusive");
        when(reviewRepository.findById(10L)).thenReturn(Optional.of(review));
        when(reviewRepository.save(any(UserProfileReview.class))).thenAnswer(invocation -> invocation.getArgument(0));

        reviewService.resolveReport(10L);

        assertFalse(review.isReported());
        assertNull(review.getReportReason());
        verify(reviewRepository, times(1)).save(review);
    }
}
