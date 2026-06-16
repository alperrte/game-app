package com.ltz.user_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileSectionVisibility {
    private boolean showHardware;
    private boolean showFriendList;
    private boolean showFollowerList;
    private boolean showLastSeen;
    private boolean showGameLibrary;
}
