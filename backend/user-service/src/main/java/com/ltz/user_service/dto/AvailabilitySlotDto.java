package com.ltz.user_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvailabilitySlotDto {
    private String dayOfWeek;
    private String timeSlot;
}
