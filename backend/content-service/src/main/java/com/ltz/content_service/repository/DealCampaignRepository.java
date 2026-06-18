package com.ltz.content_service.repository;

import com.ltz.content_service.model.entity.DealCampaign;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DealCampaignRepository extends JpaRepository<DealCampaign, Long> {
    List<DealCampaign> findByGameTitleIgnoreCase(String gameTitle);
    List<DealCampaign> findByGameTitleContainingIgnoreCase(String gameTitle);
    Optional<DealCampaign> findByGameTitleAndStoreName(String gameTitle, String storeName);
    List<DealCampaign> findByDiscountPercentGreaterThanEqualOrderByDiscountPercentDesc(int discountPercent);
    Page<DealCampaign> findByDiscountPercentGreaterThanEqual(int discountPercent, Pageable pageable);
    List<DealCampaign> findByIsFreeTrue();
    boolean existsByDealUrl(String dealUrl);
    void deleteByLastUpdatedBefore(LocalDateTime dateTime);
}
