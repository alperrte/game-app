package com.ltz.user_service.dto.request;

import com.ltz.user_service.dto.AvailabilitySlotDto;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class UpdateAvailabilityRequest {
    @NotNull(message = "Slots list cannot be null")
    private List<AvailabilitySlotDto> slots;
}
