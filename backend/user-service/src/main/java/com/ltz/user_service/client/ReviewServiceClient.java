package com.ltz.user_service.client;

import com.ltz.user_service.dto.client.response.ReviewClientResponse;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import org.springframework.beans.factory.annotation.Qualifier;
import java.util.List;

@Component
public class ReviewServiceClient {

    private final RestClient reviewServiceRestClient;

    public ReviewServiceClient(@Qualifier("reviewServiceRestClient") RestClient reviewServiceRestClient) {
        this.reviewServiceRestClient = reviewServiceRestClient;
    }

    /*
     * Belirli bir kullanıcının tüm incelemelerini review-service'ten çeker.
     */
    public List<ReviewClientResponse> getReviewsByUserId(Long userId) {
        try {
            return reviewServiceRestClient.get()
                    .uri("/api/reviews/user/{userId}", userId)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<ReviewClientResponse>>() {});
        } catch (Exception e) {
            // Servis kapalıysa veya hata verirse uygulamanın tamamen çökmesini önlemek için boş liste dönüyoruz (Resilience)
            return List.of();
        }
    }
}
