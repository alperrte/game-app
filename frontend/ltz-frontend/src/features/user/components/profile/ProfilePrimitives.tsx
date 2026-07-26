import type { ReactNode } from "react";

import { cn } from "../../../../utils/cn";
import { getRoleBadgeClass, getRoleLabel } from "../../utils/roleStyles";
import type { ProfileThemeClasses } from "../../utils/theme";

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
        "scroll-mt-24 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5 md:p-6",
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
  theme,
  label,
  value,
  onClick,
}: {
  theme?: ProfileThemeClasses;
  label: string;
  value: string | number;
  onClick?: () => void;
}) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      className={cn(
        "rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 text-left",
        onClick && theme && cn("cursor-pointer transition", theme.borderHover, theme.bgHover),
        onClick && !theme && "cursor-pointer transition hover:border-violet-500/40 hover:bg-violet-500/5",
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
  theme,
  followers,
  following,
  friends,
  posts,
  onFollowersClick,
  onFollowingClick,
  onFriendsClick,
  onPostsClick,
}: {
  theme?: ProfileThemeClasses;
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
      <StatTile theme={theme} label="Takipçi" onClick={onFollowersClick} value={followers} />
      <StatTile theme={theme} label="Takip" onClick={onFollowingClick} value={following} />
      <StatTile theme={theme} label="Arkadaş" onClick={onFriendsClick} value={friends} />
      <StatTile theme={theme} label="Gönderi" onClick={onPostsClick} value={posts} />
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
  theme,
  label,
  icon,
}: {
  theme?: ProfileThemeClasses;
  label: string;
  icon?: ReactNode;
}) {
  const borderClass = theme?.border || "border-violet-500/35";
  const bgClass = theme?.bg || "bg-violet-500/10";
  const textClass = theme?.text || "text-violet-100";

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-bold", borderClass, bgClass, textClass)}>
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
