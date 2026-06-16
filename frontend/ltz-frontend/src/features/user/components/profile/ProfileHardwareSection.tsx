import type { UserProfileResponse } from "../../types/user";
import { InfoRow, SectionPanel } from "./ProfilePrimitives";

type ProfileHardwareSectionProps = {
  profile: UserProfileResponse;
  isOwnProfile?: boolean;
};

export function ProfileHardwareSection({ profile, isOwnProfile = false }: ProfileHardwareSectionProps) {
  const hasHardware =
    profile.hardwareCpu || profile.hardwareGpu || profile.hardwareRam || profile.hardwareOs;

  return (
    <SectionPanel
      description="Profilde paylaşılan donanım bilgileri."
      id="profile-hardware"
      title="Sistem Donanımı"
    >
      {hasHardware ? (
        <div className="grid gap-4">
          <InfoRow label="İşlemci (CPU)" value={profile.hardwareCpu || "Belirtilmemiş"} />
          <InfoRow label="Ekran Kartı (GPU)" value={profile.hardwareGpu || "Belirtilmemiş"} />
          <InfoRow label="Bellek (RAM)" value={profile.hardwareRam || "Belirtilmemiş"} />
          <InfoRow label="İşletim Sistemi" value={profile.hardwareOs || "Belirtilmemiş"} />
        </div>
      ) : (
        <p className="text-base text-zinc-500">
          {isOwnProfile
            ? "Donanım bilgisi eklenmemiş — Profili Düzenle üzerinden ekleyebilirsin."
            : "Bu oyuncu donanım bilgisini paylaşmıyor."}
        </p>
      )}
    </SectionPanel>
  );
}
