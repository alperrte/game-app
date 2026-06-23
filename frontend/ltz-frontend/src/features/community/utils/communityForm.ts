import type { Community, CommunityUpdateRequest } from "../types/community.types";

export function toCommunityUpdateForm(
  community: Community,
): CommunityUpdateRequest {
  return {
    name: community.name,
    description: community.description,
    category: community.category ?? "",
    imageUrl: community.imageUrl ?? "",
    visibility: community.visibility,
    membersVisible: community.membersVisible,
  };
}
