package com.ltz.game_service.provider;

import com.ltz.game_service.dto.response.external.ExternalGameDetailResponse;

/**
 * Import job sırasında bir oyunun normalize edilmiş detayını ve mağaza
 * (fiyat/indirim/ücretsiz) bilgisini birlikte taşıyan import katmanı kaydı.
 */
public class ExternalGameImportData {

    private final ExternalGameDetailResponse detail;
    private final String appType;
    private final boolean free;
    private final Integer priceFinal;
    private final Integer priceInitial;
    private final String currency;
    private final Integer discountPercent;
    private final String storeUrl;

    public ExternalGameImportData(
            ExternalGameDetailResponse detail,
            String appType,
            boolean free,
            Integer priceFinal,
            Integer priceInitial,
            String currency,
            Integer discountPercent,
            String storeUrl
    ) {
        this.detail = detail;
        this.appType = appType;
        this.free = free;
        this.priceFinal = priceFinal;
        this.priceInitial = priceInitial;
        this.currency = currency;
        this.discountPercent = discountPercent;
        this.storeUrl = storeUrl;
    }

    public ExternalGameDetailResponse getDetail() {
        return detail;
    }

    public String getAppType() {
        return appType;
    }

    public boolean isFree() {
        return free;
    }

    public Integer getPriceFinal() {
        return priceFinal;
    }

    public Integer getPriceInitial() {
        return priceInitial;
    }

    public String getCurrency() {
        return currency;
    }

    public Integer getDiscountPercent() {
        return discountPercent;
    }

    public String getStoreUrl() {
        return storeUrl;
    }
}
