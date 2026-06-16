import type { ReactNode } from "react";
import { Award, Calendar, Edit3, Sparkles } from "lucide-react";

import type { UserProfileResponse } from "../../types/user";
import { BIO_MAX_LENGTH } from "../../types/user";
import { getImageUrl, isImageValid } from "../../utils/profileImage";
import { formatProfileDate, getGamerTypeLabel } from "../../utils/profileHelpers";
import { getRoleNameClass } from "../../utils/roleStyles";
import type { ProfileBadge } from "../../utils/badges";
import { ProfileBadgeChip, RoleBadge } from "./ProfilePrimitives";

const HEX_CLIP = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

type ProfileHeroProps = {
  profile: UserProfileResponse;
  role: string | null | undefined;
  badges: ProfileBadge[];
  isOwnProfile: boolean;
  lastSeenLabel?: string | null;
  onEditClick: () => void;
  onSettingsClick?: () => void;
  socialActions?: ReactNode;
};

export function ProfileHero({
  profile,
  role,
  badges,
  isOwnProfile,
  lastSeenLabel,
  onEditClick,
  socialActions,
}: ProfileHeroProps) {
  const hasCover = isImageValid(profile.coverUrl);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-violet-500/30 bg-zinc-950/80 shadow-lg">
      <div className="relative h-48 overflow-hidden border-b border-white/5 bg-zinc-950 md:h-64">
        {hasCover ? (
          <img
            alt="Kapak görseli"
            className="h-full w-full object-cover"
            loading="lazy"
            src={getImageUrl(profile.coverUrl)}
          />
        ) : (
          <div
            className="h-full w-full bg-gradient-to-br from-violet-950 via-zinc-950 to-fuchsia-950"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.35) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(217,70,239,0.25) 0%, transparent 40%)",
            }}
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
      </div>

      <div className="relative flex flex-col items-start justify-between gap-6 px-6 pb-6 pt-16 md:flex-row md:pt-4">
        <div className="absolute -top-16 left-6 z-20 md:left-8">
          <div
            className="h-28 w-28 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 p-[3px] md:h-36 md:w-36"
            style={{ clipPath: HEX_CLIP }}
          >
            <div
              className="h-full w-full overflow-hidden bg-zinc-950"
              style={{ clipPath: HEX_CLIP }}
            >
              {isImageValid(profile.avatarUrl) ? (
                <img
                  alt={profile.displayName || profile.username}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  src={getImageUrl(profile.avatarUrl)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-900 font-mono text-3xl font-black uppercase text-violet-400 md:text-4xl">
                  {profile.username.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3 pt-14 md:pl-48 md:pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1
              className={`profile-display-font text-3xl font-black tracking-tight ${getRoleNameClass(role)}`}
            >
              {profile.displayName || profile.username}
            </h1>
            <RoleBadge role={role} />
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="text-base font-semibold text-zinc-500">@{profile.username}</p>
            {socialActions}
          </div>

          {profile.gamerType ? (
            <span className="inline-flex rounded border border-violet-500/40 bg-violet-600/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-violet-200">
              {getGamerTypeLabel(profile.gamerType)}
            </span>
          ) : null}

          {badges.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {badges.map((badge) => (
                <ProfileBadgeChip
                  icon={<Award className="h-3.5 w-3.5 text-violet-300" />}
                  key={badge.id}
                  label={badge.label}
                />
              ))}
            </div>
          ) : null}

          <div className="max-w-xl rounded-xl border border-zinc-800/80 bg-zinc-950/30 p-4">
            {profile.bio ? (
              <p className="whitespace-pre-wrap break-words text-base leading-relaxed text-zinc-300">
                {profile.bio}
              </p>
            ) : (
              <p className="text-base italic text-zinc-500">Henüz bir biyografi yazılmamış.</p>
            )}
            {profile.bio && profile.bio.length > BIO_MAX_LENGTH * 0.85 ? (
              <p className="mt-2 text-xs text-zinc-500">
                {profile.bio.length}/{BIO_MAX_LENGTH} karakter
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-violet-500" />
              Kayıt: {formatProfileDate(profile.createdAt)}
            </span>
            {lastSeenLabel ? (
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Son görülme: {lastSeenLabel}
              </span>
            ) : null}
            {isOwnProfile ? (
              <span className="flex items-center gap-1 rounded border border-violet-500/30 bg-violet-950/20 px-2 py-0.5 text-xs font-bold uppercase text-fuchsia-400">
                <Sparkles className="h-3 w-3 text-fuchsia-400" /> Öncü Hesap
              </span>
            ) : null}
          </div>
        </div>

        {isOwnProfile ? (
          <button
            className="mt-4 flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-violet-500/30 bg-violet-500/10 px-5 py-2.5 text-sm font-bold text-violet-300 transition-colors hover:bg-violet-600 hover:text-white md:mt-2"
            onClick={onEditClick}
            type="button"
          >
            <Edit3 className="h-4 w-4" /> Profili Düzenle
          </button>
        ) : null}
      </div>
    </div>
  );
}
