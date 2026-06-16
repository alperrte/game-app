import { useState } from "react";
import type { ReactNode } from "react";

import type {
  ActiveEvent,
  OnlineFriend,
  SuggestedGroup,
} from "../types/social.types";

interface SocialRightPanelProps {
  groups: SuggestedGroup[];
  events: ActiveEvent[];
  friends: OnlineFriend[];
}

export function SocialRightPanel({
  groups,
  events,
  friends,
}: SocialRightPanelProps) {
  const [joinedGroupIds, setJoinedGroupIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [joinedEventIds, setJoinedEventIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [notice, setNotice] = useState<string | null>(null);

  function toggleGroup(group: SuggestedGroup) {
    setJoinedGroupIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(group.id)) {
        nextIds.delete(group.id);
        setNotice(`${group.name} grubundan ayrıldın.`);
      } else {
        nextIds.add(group.id);
        setNotice(`${group.name} grubuna katıldın.`);
      }

      return nextIds;
    });
  }

  function toggleEvent(event: ActiveEvent) {
    setJoinedEventIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(event.id)) {
        nextIds.delete(event.id);
        setNotice(`${event.title} katılımın kaldırıldı.`);
      } else {
        nextIds.add(event.id);
        setNotice(`${event.title} etkinliğine katıldın.`);
      }

      return nextIds;
    });
  }

  return (
    <aside className="space-y-4">
      {notice && (
        <div className="rounded-lg border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-100">
          {notice}
        </div>
      )}

      <Panel title="Önerilen Gruplar" onShowAll={() => setNotice("Tüm gruplar modülü hazırlanıyor.")}>
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.id} className="grid grid-cols-[56px_1fr_auto] gap-3">
              <img
                src={group.imageUrl}
                alt={group.name}
                className="h-14 w-14 rounded-md object-cover"
              />
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-white">{group.name}</h3>
                <p className="mt-1 text-xs text-zinc-400">{group.members} üye</p>
                <p className="mt-2 line-clamp-1 text-xs text-zinc-400">
                  {group.description}
                </p>
              </div>
              <button
                className="h-10 cursor-pointer rounded-lg bg-violet-700 px-4 text-sm font-bold text-white shadow-[0_0_22px_rgba(124,58,237,0.34)] transition hover:-translate-y-0.5 hover:bg-violet-600"
                onClick={() => toggleGroup(group)}
                type="button"
              >
                {joinedGroupIds.has(group.id) ? "Katıldın" : "Katıl"}
              </button>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Aktif Etkinlikler" onShowAll={() => setNotice("Tüm etkinlikler modülü hazırlanıyor.")}>
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="grid grid-cols-[56px_1fr_auto] gap-3 rounded-lg border border-white/8 bg-white/[0.025] p-3"
            >
              <div className="grid h-14 w-14 place-items-center rounded-md border border-white/10 bg-[#0d1422] text-center">
                <span className="text-xl font-black leading-none text-white">
                  {event.date.day}
                </span>
                <span className="text-[10px] font-semibold text-zinc-400">
                  {event.date.month}
                </span>
              </div>

              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-white">{event.title}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                  <span>{event.date.detail}</span>
                  <span
                    className={
                      event.tagTone === "green"
                        ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-300"
                        : "rounded-full bg-violet-500/18 px-2 py-0.5 text-violet-300"
                    }
                  >
                    {event.tag}
                  </span>
                </div>
                <div className="mt-3 flex items-center">
                  {event.attendeeAvatars.map((avatar) => (
                    <img
                      key={avatar}
                      src={avatar}
                      alt=""
                      className="-mr-2 h-6 w-6 rounded-full border-2 border-[#111827] object-cover"
                    />
                  ))}
                  <span className="ml-4 text-xs text-zinc-400">
                    +{event.extraAttendees}
                  </span>
                </div>
              </div>

              <button
                className="h-9 cursor-pointer self-center rounded-md border border-white/12 px-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:border-violet-400/60 hover:bg-white/[0.05]"
                onClick={() => toggleEvent(event)}
                type="button"
              >
                {joinedEventIds.has(event.id) ? "Katıldın" : "Katıl"}
              </button>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Online Arkadaşlar" onShowAll={() => setNotice("Tüm arkadaşlar modülü hazırlanıyor.")}>
        <div className="grid grid-cols-5 gap-3">
          {friends.map((friend) => (
            <button
              key={friend.id}
              className="min-w-0 cursor-pointer text-center transition hover:-translate-y-0.5"
              onClick={() => setNotice(`${friend.name} profili açılacak.`)}
              type="button"
            >
              <div className="relative mx-auto h-14 w-14">
                <img
                  src={friend.avatarUrl}
                  alt={friend.name}
                  className="h-14 w-14 rounded-full border border-white/15 object-cover"
                />
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#0a101c] bg-emerald-400" />
              </div>
              <p className="mt-2 truncate text-xs font-bold text-white">{friend.name}</p>
              <p className="mt-1 truncate text-[11px] text-zinc-400">
                {friend.statusText}
              </p>
            </button>
          ))}
          <button
            className="mx-auto grid h-14 w-14 cursor-pointer place-items-center self-start rounded-full border border-white/10 bg-white/[0.025] text-base font-bold text-white transition hover:-translate-y-0.5 hover:border-violet-400/60"
            onClick={() => setNotice("Daha fazla arkadaş listesi hazırlanıyor.")}
            type="button"
          >
            +12
          </button>
        </div>
      </Panel>
    </aside>
  );
}

interface PanelProps {
  title: string;
  children: ReactNode;
  onShowAll: () => void;
}

function Panel({ title, children, onShowAll }: PanelProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#0a101c]/88 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-white">{title}</h2>
        <button
          className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"
          onClick={onShowAll}
          type="button"
        >
          Tümünü Gör
        </button>
      </div>
      {children}
    </section>
  );
}
