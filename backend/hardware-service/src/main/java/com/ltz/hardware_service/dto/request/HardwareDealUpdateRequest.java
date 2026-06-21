package com.ltz.hardware_service.dto.request;

import com.ltz.hardware_service.entity.enums.DealSourceType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class HardwareDealUpdateRequest {

    private Long componentId;

    @Size(max = 200, message = "Kampanya başlığı en fazla 200 karakter olabilir.")
    private String title;

    @Size(max = 150, message = "Mağaza adı en fazla 150 karakter olabilir.")
    private String storeName;

    @DecimalMin(value = "0.0", message = "Eski fiyat negatif olamaz.")
    private BigDecimal oldPrice;

    @DecimalMin(value = "0.0", message = "Yeni fiyat negatif olamaz.")
    private BigDecimal newPrice;

    @Size(max = 10, message = "Para birimi en fazla 10 karakter olabilir.")
    private String currency;

    @DecimalMin(value = "0.0", message = "İndirim oranı negatif olamaz.")
    @DecimalMax(value = "100.0", message = "İndirim oranı en fazla 100 olabilir.")
    private BigDecimal discountPercentage;

    @Size(max = 1000, message = "Kampanya URL en fazla 1000 karakter olabilir.")
    private String dealUrl;

    private DealSourceType sourceType;

    private Boolean active;

    private LocalDateTime startDate;

    private LocalDateTime endDate;
}