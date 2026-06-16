import { Loader2, MessageCircle, ShieldBan, UserPlus, UserRoundCheck } from "lucide-react";
import React from "react";
import type { RelationshipSnapshot } from "../../social/services/socialProfileService";

type Props = {
  relationship: RelationshipSnapshot | null;
  busyAction: string | null;
  onToggleFollow: () => Promise<void>;
  onFriendAction: () => Promise<void>;
  onToggleBlock: () => Promise<void>;
  onStartChat: () => Promise<void>;
};

export const ProfileSocialActions: React.FC<Props> = ({
  relationship,
  busyAction,
  onToggleFollow,
  onFriendAction,
  onToggleBlock,
  onStartChat,
}) => {
  if (!relationship) return null;

  const friendLabel = relationship.isFriend
    ? "Arkadaş"
    : relationship.hasIncomingRequestFromTarget
      ? "İsteği Kabul Et"
      : relationship.hasOutgoingRequestToTarget
        ? "İstek Gönderildi"
        : "Arkadaş Ekle";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        disabled={busyAction !== null || relationship.isBlockedByMe}
        onClick={() => void onToggleFollow()}
        className="rounded-lg border border-violet-500/35 bg-violet-500/10 px-2.5 py-1.5 text-[11px] font-bold text-violet-300 hover:bg-violet-500 hover:text-white disabled:opacity-60"
      >
        {busyAction === "follow" ? (
          <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />
        ) : null}
        {relationship.isFollowing ? "Takibi Bırak" : "Takip Et"}
      </button>

      <button
        type="button"
        disabled={
          busyAction !== null ||
          relationship.isBlockedByMe ||
          relationship.hasOutgoingRequestToTarget ||
          relationship.isFriend
        }
        onClick={() => void onFriendAction()}
        className="rounded-lg border border-sky-500/35 bg-sky-500/10 px-2.5 py-1.5 text-[11px] font-bold text-sky-300 hover:bg-sky-500 hover:text-white disabled:opacity-60"
      >
        {busyAction === "friend" ? (
          <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />
        ) : relationship.isFriend ? (
          <UserRoundCheck className="mr-1 inline h-3.5 w-3.5" />
        ) : (
          <UserPlus className="mr-1 inline h-3.5 w-3.5" />
        )}
        {friendLabel}
      </button>

      <button
        type="button"
        disabled={busyAction !== null || relationship.isBlockedByMe}
        onClick={() => void onStartChat()}
        className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500 hover:text-white disabled:opacity-60"
      >
        {busyAction === "chat" ? (
          <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />
        ) : (
          <MessageCircle className="mr-1 inline h-3.5 w-3.5" />
        )}
        Mesaj At
      </button>

      <button
        type="button"
        disabled={busyAction !== null}
        onClick={() => void onToggleBlock()}
        className="rounded-lg border border-rose-500/35 bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-bold text-rose-300 hover:bg-rose-500 hover:text-white disabled:opacity-60"
      >
        {busyAction === "block" ? (
          <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />
        ) : (
          <ShieldBan className="mr-1 inline h-3.5 w-3.5" />
        )}
        {relationship.isBlockedByMe ? "Engeli Kaldır" : "Engelle"}
      </button>
    </div>
  );
};
