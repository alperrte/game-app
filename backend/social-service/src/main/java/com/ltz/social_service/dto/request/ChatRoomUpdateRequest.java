package com.ltz.social_service.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatRoomUpdateRequest {

    @Size(max = 100, message = "Room name can be at most 100 characters")
    private String roomName;

    @Size(max = 1000, message = "Image URL can be at most 1000 characters")
    private String imageUrl;
}
