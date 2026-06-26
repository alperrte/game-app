export type CommunityVisibility = "PUBLIC" | "PRIVATE";
export type CommunityEventType = "GAME_NIGHT" | "TOURNAMENT" | "MEETUP";
export type CommunityEventStatus = "UPCOMING" | "COMPLETED" | "CANCELLED";

export interface Community {
  id: number;
  ownerUserId: number;
  name: string;
  description: string;
  category?: string | null;
  imageUrl?: string | null;
  visibility: CommunityVisibility;
  membersVisible: boolean;
  memberCount: number;
  joinedByCurrentUser: boolean;
  ownedByCurrentUser: boolean;
  createdAt: string;
}

export interface CommunityCreateRequest {
  name: string;
  description: string;
  category?: string;
  imageUrl?: string;
  visibility: CommunityVisibility;
}

export interface CommunityUpdateRequest extends CommunityCreateRequest {
  membersVisible: boolean;
}

export interface CommunityMember {
  userId: number;
  role: "OWNER" | "MEMBER";
  joinedAt: string;
}

export interface CommunityInvitation {
  id: number;
  communityId: number;
  communityName: string;
  inviterUserId: number;
  invitedUserId: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
}

export interface CommunityEvent {
  id: number;
  communityId: number;
  communityName: string;
  organizerUserId: number;
  title: string;
  description: string;
  eventType: CommunityEventType;
  status: CommunityEventStatus;
  location?: string | null;
  imageUrl?: string | null;
  startsAt: string;
  endsAt?: string | null;
  capacity?: number | null;
  participantCount: number;
  joinedByCurrentUser: boolean;
  createdAt: string;
}

export interface CommunityEventCreateRequest {
  title: string;
  description: string;
  eventType: CommunityEventType;
  location?: string;
  imageUrl?: string;
  startsAt: string;
  endsAt?: string;
  capacity?: number;
}

export type CommunityEventUpdateRequest = CommunityEventCreateRequest;
