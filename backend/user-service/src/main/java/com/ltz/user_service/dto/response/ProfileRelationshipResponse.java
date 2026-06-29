package com.ltz.user_service.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProfileRelationshipResponse {
    private boolean following;
    private boolean friend;
    private boolean incomingRequestFromTarget;
    private boolean outgoingRequestToTarget;
    private boolean blockedByMe;
}
