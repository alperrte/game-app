package com.ltz.content_service.service;

import com.ltz.content_service.entity.DealCampaign;
import com.ltz.content_service.repository.DealCampaignRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Reaksiyon zenginleştirmesinden önceki temel deal sorgusunu cache'ler.
 * Ayrı bean: @Cacheable self-invocation ile atlanmasın diye.
 */
@Service
@RequiredArgsConstructor
public class DealsQueryCache {

    private final DealCampaignRepository dealCampaignRepository;

    @Cacheable(value = "deals", key = "'all-sorted'")
    public List<DealCampaign> findAllSortedByDiscount() {
        return dealCampaignRepository.findAll(Sort.by(Sort.Direction.DESC, "discountPercent"));
    }

    @Cacheable(value = "deals", key = "'min-' + #minDiscount")
    public List<DealCampaign> findByMinDiscount(int minDiscount) {
        return dealCampaignRepository.findByDiscountPercentGreaterThanEqualOrderByDiscountPercentDesc(minDiscount);
    }

    @Cacheable(value = "deals", key = "'free-games'")
    public List<DealCampaign> findFreeGames() {
        return dealCampaignRepository.findByIsFreeTrue();
    }
}
