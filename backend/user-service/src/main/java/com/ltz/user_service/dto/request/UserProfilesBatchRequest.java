package com.ltz.user_service.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class UserProfilesBatchRequest {

    @NotEmpty(message = "User IDs list cannot be empty")
    @Size(max = 50, message = "Cannot request more than 50 profiles at once")
    private List<String> userIds;
}
