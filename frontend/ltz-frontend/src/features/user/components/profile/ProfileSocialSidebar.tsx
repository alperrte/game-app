import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { UserAvatar } from "../UserAvatar";
import type { ProfileIdentity } from "../../hooks/useProfileIdentities";
import { SectionPanel } from "./ProfilePrimitives";

type FriendRequest = {
  id: number;
  senderUserId?: number;
  receiverUserId?: number;
};

type ProfileSocialSidebarProps = {
  socialError: string | null;
  socialDataLoading: boolean;
  showFollowers: boolean;
  showFollowing: boolean;
  showFriends: boolean;
  socialIdentityGroups: {
    followers: Map<number, ProfileIdentity>;
    following: Map<number, ProfileIdentity>;
    friends: Map<number, ProfileIdentity>;
  };
  isOwnProfile: boolean;
  friendRequests: {
    incoming: FriendRequest[];
    outgoing: FriendRequest[];
  };
  friendRequestIdentities: Map<number, ProfileIdentity>;
  onFriendRequestAction: (requestId: number, action: "accept" | "reject" | "cancel") => void;
  onOpenList: (title: string, group: Map<number, ProfileIdentity>) => void;
};

export function ProfileSocialSidebar({
  socialError,
  socialDataLoading,
  showFollowers,
  showFollowing,
  showFriends,
  socialIdentityGroups,
  isOwnProfile,
  friendRequests,
  friendRequestIdentities,
  onFriendRequestAction,
  onOpenList,
}: ProfileSocialSidebarProps) {
  const navigate = useNavigate();

  const sections = [
    showFollowers
      ? { title: "Takipçiler", group: socialIdentityGroups.followers }
      : null,
    showFollowing
      ? { title: "Takip Edilenler", group: socialIdentityGroups.following }
      : null,
    showFriends ? { title: "Arkadaşlar", group: socialIdentityGroups.friends } : null,
  ].filter(Boolean) as { title: string; group: Map<number, ProfileIdentity> }[];

  if (!sections.length && !isOwnProfile) return null;

  return (
    <SectionPanel description="Takipçi, takip ve arkadaş önizlemesi." title="Sosyal Bağlantılar">
      {socialError ? <p className="mb-3 text-sm text-rose-300">{socialError}</p> : null}
      {socialDataLoading ? (
        <div className="flex items-center gap-2 text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Sosyal listeler yükleniyor...
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map(({ title, group }) => (
            <div key={title}>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">{title}</h4>
                {group.size > 4 ? (
                  <button
                    className="text-xs font-semibold text-violet-400 hover:text-violet-300"
                    onClick={() => onOpenList(title, group)}
                    type="button"
                  >
                    Tümünü gör
                  </button>
                ) : null}
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2">
                {Array.from(group.values())
                  .slice(0, 4)
                  .map((identity) => (
                    <button
                      className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-2 text-left hover:border-violet-500/40"
                      key={`${title}-${identity.userId}`}
                      onClick={() => navigate(`/profile/${identity.username}`)}
                      type="button"
                    >
                      <UserAvatar
                        avatarUrl={identity.avatarUrl}
                        className="h-8 w-8"
                        imageClassName="h-8 w-8 rounded-full object-cover"
                        name={identity.displayName}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {identity.displayName}
                        </p>
                        <p className="truncate text-xs text-zinc-500">@{identity.username}</p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isOwnProfile ? (
        <div className="mt-4 space-y-3 border-t border-zinc-800 pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Arkadaşlık İstekleri
          </h4>
          <div className="grid gap-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
              <p className="text-sm font-semibold text-zinc-300">
                Gelen ({friendRequests.incoming.length})
              </p>
              <div className="mt-2 space-y-2">
                {friendRequests.incoming.slice(0, 3).map((request) => {
                  const identity = friendRequestIdentities.get(request.senderUserId ?? 0);
                  const label = identity?.displayName ?? `#${request.senderUserId}`;
                  return (
                    <div className="flex items-center justify-between text-sm" key={request.id}>
                      <span className="truncate">{label}</span>
                      <div className="flex gap-1">
                        <button
                          className="rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300"
                          onClick={() => onFriendRequestAction(request.id, "accept")}
                          type="button"
                        >
                          Kabul
                        </button>
                        <button
                          className="rounded bg-rose-500/20 px-2 py-1 text-xs text-rose-300"
                          onClick={() => onFriendRequestAction(request.id, "reject")}
                          type="button"
                        >
                          Red
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
              <p className="text-sm font-semibold text-zinc-300">
                Giden ({friendRequests.outgoing.length})
              </p>
              <div className="mt-2 space-y-2">
                {friendRequests.outgoing.slice(0, 3).map((request) => {
                  const identity = friendRequestIdentities.get(request.receiverUserId ?? 0);
                  const label = identity?.displayName ?? `#${request.receiverUserId}`;
                  return (
                    <div className="flex items-center justify-between text-sm" key={request.id}>
                      <span className="truncate">{label}</span>
                      <button
                        className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
                        onClick={() => onFriendRequestAction(request.id, "cancel")}
                        type="button"
                      >
                        İptal
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </SectionPanel>
  );
}
