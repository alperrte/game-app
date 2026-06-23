import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { OnlineFriend } from "../types/social.types";
import type {
  Community,
  CommunityEvent,
} from "../../community/types/community.types";
import { SOCIAL_ROUTES } from "../../../lib/constants";
import { getImageUrl } from "../../user/utils/profileImage";

interface SocialRightPanelProps {
  communities: Community[];
  events: CommunityEvent[];
  friends: OnlineFriend[];
  onCommunityClick: () => void;
  onEventClick: () => void;
  onFriendProfileClick: (username: string) => void;
}

export function SocialRightPanel({
  communities,
  events,
  friends,
  onCommunityClick,
  onEventClick,
  onFriendProfileClick,
}: SocialRightPanelProps) {
  const navigate = useNavigate();

  return (
    <aside className="space-y-4">
      <Panel title="Topluluklarım" onShowAll={onCommunityClick}>
        {communities.length > 0 ? (
          <div className="space-y-4">
            {communities.slice(0, 3).map((community) => (
              <button
                className="grid w-full grid-cols-[52px_1fr_auto] items-center gap-3 text-left"
                key={community.id}
                onClick={() => navigate(SOCIAL_ROUTES.communityDetail(community.id))}
                type="button"
              >
                <div
                  className="h-13 w-13 rounded-lg bg-gradient-to-br from-violet-600/60 to-fuchsia-600/30 bg-cover bg-center"
                  style={
                    community.imageUrl
                      ? {
                          backgroundImage: `url(${getImageUrl(community.imageUrl)})`,
                        }
                      : undefined
                  }
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">
                    {community.name}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {community.memberCount} üye
                  </p>
                </div>
                <span className="rounded-full border border-violet-500/30 px-2 py-1 text-[10px] font-bold text-violet-200">
                  {community.ownedByCurrentUser ? "Sahibi" : "Üye"}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <EmptyText>Henüz bir topluluğa katılmadın.</EmptyText>
        )}
      </Panel>

      <Panel title="Yaklaşan Etkinlikler" onShowAll={onEventClick}>
        {events.length > 0 ? (
          <div className="space-y-3">
            {events.slice(0, 3).map((event) => (
              <button
                className="grid w-full grid-cols-[56px_1fr] gap-3 rounded-lg border border-white/8 bg-white/[0.025] p-3 text-left"
                key={event.id}
                onClick={onEventClick}
                type="button"
              >
                <div className="grid h-14 w-14 place-items-center rounded-md border border-white/10 bg-[#0d1422] text-center">
                  <span className="text-xl font-black leading-none text-white">
                    {new Date(event.startsAt).getDate()}
                  </span>
                  <span className="text-[10px] font-semibold uppercase text-zinc-400">
                    {new Date(event.startsAt).toLocaleDateString("tr-TR", {
                      month: "short",
                    })}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">
                    {event.title}
                  </p>
                  <p className="mt-1 truncate text-xs text-violet-300">
                    {event.communityName}
                  </p>
                  <p className="mt-2 text-xs text-zinc-400">
                    {event.participantCount}
                    {event.capacity ? ` / ${event.capacity}` : ""} katılımcı
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyText>Yaklaşan etkinlik bulunmuyor.</EmptyText>
        )}
      </Panel>

      <Panel title="Arkadaşlar" onShowAll={() => undefined}>
        {friends.length > 0 ? (
          <div className="grid grid-cols-5 gap-3">
            {friends.slice(0, 10).map((friend) => (
              <button
                className="group relative"
                key={friend.id}
                onClick={() => onFriendProfileClick(friend.username)}
                title={friend.name}
                type="button"
              >
                <img
                  alt={friend.name}
                  className="h-11 w-11 rounded-full border border-white/15 object-cover transition group-hover:border-violet-400"
                  src={friend.avatarUrl}
                />
              </button>
            ))}
          </div>
        ) : (
          <EmptyText>Arkadaş listen henüz boş.</EmptyText>
        )}
      </Panel>
    </aside>
  );
}

function EmptyText({ children }: { children: string }) {
  return <p className="text-sm text-zinc-500">{children}</p>;
}

function Panel({
  title,
  children,
  onShowAll,
}: {
  title: string;
  children: ReactNode;
  onShowAll: () => void;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#0a101c]/88 p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-black text-white">{title}</h2>
        <button
          className="text-xs font-bold text-violet-300 hover:text-violet-200"
          onClick={onShowAll}
          type="button"
        >
          Tümünü gör
        </button>
      </div>
      {children}
    </section>
  );
}
