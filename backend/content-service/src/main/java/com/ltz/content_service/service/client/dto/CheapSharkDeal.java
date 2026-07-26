package com.ltz.content_service.service.client.dto;

import java.util.Map;

public record CheapSharkDeal(
        String title,
        String dealId,
        String storeId,
        String normalPrice,
        String salePrice,
        String savings,
        String thumb,
        String metacriticScore,
        String steamRatingPercent,
        String steamAppId
) {
    public static CheapSharkDeal fromMap(Map<String, Object> raw) {
        return new CheapSharkDeal(
                (String) raw.get("title"),
                (String) raw.get("dealID"),
                (String) raw.get("storeID"),
                (String) raw.get("normalPrice"),
                (String) raw.get("salePrice"),
                (String) raw.get("savings"),
                (String) raw.get("thumb"),
                (String) raw.get("metacriticScore"),
                (String) raw.get("steamRatingPercent"),
                (String) raw.get("steamAppID")
        );
    }
}
