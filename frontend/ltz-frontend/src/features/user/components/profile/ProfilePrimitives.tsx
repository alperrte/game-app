import type { ReactNode } from "react";

import { cn } from "../../../../utils/cn";
import { getRoleBadgeClass, getRoleLabel } from "../../utils/roleStyles";

export function SectionPanel({
  title,
  description,
  children,
  className,
  id,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      className={cn(
        "scroll-mt-24 rounded-2xl border border-violet-500/15 bg-zinc-950/60 p-5 md:p-6",
        className,
      )}
      id={id}
    >
      <header className="mb-4 space-y-1">
        <h2 className="profile-display-font text-sm font-bold uppercase tracking-wider text-zinc-200">
          {title}
        </h2>
        {description ? (
          <p className="text-sm leading-relaxed text-zinc-500">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

export function StatTile({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string | number;
  onClick?: () => void;
}) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      className={cn(
        "rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 text-left",
        onClick && "cursor-pointer transition hover:border-violet-500/40 hover:bg-violet-500/5",
      )}
      onClick={onClick}
      type={onClick ? "button" : undefined}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="profile-display-font mt-1 text-3xl font-black text-white">{value}</p>
    </Component>
  );
}

export function ProfileStatRibbon({
  followers,
  following,
  friends,
  posts,
  onFollowersClick,
  onFollowingClick,
  onFriendsClick,
  onPostsClick,
}: {
  followers: string | number;
  following: string | number;
  friends: string | number;
  posts: string | number;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
  onFriendsClick?: () => void;
  onPostsClick?: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatTile label="Takipçi" onClick={onFollowersClick} value={followers} />
      <StatTile label="Takip" onClick={onFollowingClick} value={following} />
      <StatTile label="Arkadaş" onClick={onFriendsClick} value={friends} />
      <StatTile label="Gönderi" onClick={onPostsClick} value={posts} />
    </div>
  );
}

export function InfoRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <div className="text-base font-semibold text-zinc-200">{value}</div>
      {hint ? <p className="text-sm text-zinc-500">{hint}</p> : null}
    </div>
  );
}

export function ProfileBadgeChip({
  label,
  icon,
}: {
  label: string;
  icon?: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-100">
      {icon}
      {label}
    </span>
  );
}

export function RoleBadge({ role }: { role?: string | null }) {
  return (
    <span
      className={cn(
        "profile-display-font inline-flex items-center rounded-md border px-3 py-1 text-xs font-black uppercase tracking-wider shadow-lg",
        getRoleBadgeClass(role),
      )}
    >
      {getRoleLabel(role)}
    </span>
  );
}

export function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-xl bg-zinc-800/60", className)} />
  );
}
