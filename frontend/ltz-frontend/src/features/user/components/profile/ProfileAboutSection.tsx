import type { UserProfileResponse } from "../../types/user";
import { formatProfileDate, getGamerTypeLabel } from "../../utils/profileHelpers";
import { InfoRow, SectionPanel } from "./ProfilePrimitives";

type ProfileAboutSectionProps = {
  profile: UserProfileResponse;
  categoriesList: string[];
};

export function ProfileAboutSection({ profile, categoriesList }: ProfileAboutSectionProps) {
  return (
    <SectionPanel
      description="Favori kategoriler, oyun tarzı ve profil özeti."
      id="profile-about"
      title="Hakkında"
    >
      {profile.bio ? (
        <p className="mb-4 whitespace-pre-wrap break-words text-base leading-relaxed text-zinc-300">
          {profile.bio}
        </p>
      ) : (
        <p className="mb-4 text-sm italic text-zinc-500">Henüz bir biyografi yazılmamış.</p>
      )}

      {categoriesList.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {categoriesList.map((category) => (
            <span
              className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-sm font-semibold text-zinc-300"
              key={category}
            >
              {category}
            </span>
          ))}
        </div>
      ) : (
        <p className="mb-4 text-sm italic text-zinc-500">Kategori seçilmemiş.</p>
      )}
      <InfoRow
        label="Oyuncu Tipi"
        value={profile.gamerType ? getGamerTypeLabel(profile.gamerType) : "Belirlenmemiş"}
      />
      <InfoRow label="Kayıt Tarihi" value={formatProfileDate(profile.createdAt)} />
    </SectionPanel>
  );
}
