import { useState, useEffect, useCallback } from "react";
import { Loader2, Calendar, Check, RotateCcw } from "lucide-react";

import type { AvailabilitySlot } from "../../types/user";
import { userService } from "../../services/userService";
import { cn } from "../../../../utils/cn";
import type { ProfileThemeClasses } from "../../utils/theme";

type ProfileAvailabilitySectionProps = {
  theme: ProfileThemeClasses;
  userId: string;
  isOwnProfile: boolean;
};

const DAYS = [
  { key: "MONDAY", label: "Pazartesi" },
  { key: "TUESDAY", label: "Salı" },
  { key: "WEDNESDAY", label: "Çarşamba" },
  { key: "THURSDAY", label: "Perşembe" },
  { key: "FRIDAY", label: "Cuma" },
  { key: "SATURDAY", label: "Cumartesi" },
  { key: "SUNDAY", label: "Pazar" },
];

const SLOTS = [
  { key: "MORNING", label: "Sabah", time: "06:00 - 12:00" },
  { key: "AFTERNOON", label: "Öğle", time: "12:00 - 18:00" },
  { key: "EVENING", label: "Akşam", time: "18:00 - 00:00" },
  { key: "NIGHT", label: "Gece", time: "00:00 - 06:00" },
];

export function ProfileAvailabilitySection({ theme, userId, isOwnProfile }: ProfileAvailabilitySectionProps) {
  const [savedSlots, setSavedSlots] = useState<AvailabilitySlot[]>([]);
  const [tempSlots, setTempSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchAvailability = useCallback(async (active: boolean) => {
    try {
      if (active) setLoading(true);
      const data = await userService.getUserAvailability(userId);
      if (active) {
        setSavedSlots(data);
        setTempSlots(data);
        setError(null);
      }
    } catch (err) {
      if (active) {
        setError("Müsaitlik bilgileri yüklenirken bir hata oluştu.");
      }
      console.error(err);
    } finally {
      if (active) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      void fetchAvailability(active);
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [fetchAvailability]);

  const isSlotSelected = (day: string, slot: string, list: AvailabilitySlot[]) => {
    return list.some((item) => item.dayOfWeek === day && item.timeSlot === slot);
  };

  const handleCellClick = (day: string, slot: string) => {
    if (!isOwnProfile) return;

    setSaveSuccess(false);
    const exists = isSlotSelected(day, slot, tempSlots);
    if (exists) {
      setTempSlots(tempSlots.filter((item) => !(item.dayOfWeek === day && item.timeSlot === slot)));
    } else {
      setTempSlots([...tempSlots, { dayOfWeek: day, timeSlot: slot }]);
    }
  };

  const handleSave = async () => {
    if (!isOwnProfile) return;

    try {
      setSaving(true);
      setSaveSuccess(false);
      const data = await userService.updateUserAvailability({ slots: tempSlots });
      setSavedSlots(data);
      setTempSlots(data);
      setSaveSuccess(true);
      
      // 3 saniye sonra başarı bildirimini kapat
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      alert("Takvim güncellenirken bir hata oluştu.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setTempSlots(savedSlots);
    setSaveSuccess(false);
  };

  const hasChanges = JSON.stringify(tempSlots.sort()) !== JSON.stringify(savedSlots.sort());

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-5 space-y-4">
      {/* Başlık */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/50 pb-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
            <Calendar className={cn("h-4.5 w-4.5", theme.text)} /> Oyun Takvimi (LFG Müsaitliği)
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Haftalık grup arama (LFG) ve oyun daveti müsaitlik saatleri.
          </p>
        </div>

        {isOwnProfile && hasChanges && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg transition duration-200 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" /> Sıfırla
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                "inline-flex items-center gap-1 text-xs font-bold text-white px-3 py-1.5 rounded-lg transition duration-200 cursor-pointer border",
                theme.border,
                theme.bg,
                "hover:bg-white/10"
              )}
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Değişiklikleri Kaydet
            </button>
          </div>
        )}

        {saveSuccess && (
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
            Müsaitlik güncellendi!
          </span>
        )}
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Grid Tablo Yapısı */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-800/80">
              <th className="py-2.5 font-semibold text-zinc-400 w-[120px]">Gün</th>
              {SLOTS.map((slot) => (
                <th key={slot.key} className="py-2.5 font-semibold text-zinc-400 text-center">
                  <div>{slot.label}</div>
                  <div className="text-[9px] text-zinc-600 font-normal">{slot.time}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/60">
            {DAYS.map((day) => (
              <tr key={day.key} className="hover:bg-white/[0.01] transition-colors">
                <td className="py-3 font-semibold text-zinc-300">{day.label}</td>
                {SLOTS.map((slot) => {
                  const isSelected = isSlotSelected(day.key, slot.key, tempSlots);
                  return (
                    <td key={slot.key} className="py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleCellClick(day.key, slot.key)}
                        disabled={!isOwnProfile}
                        className={cn(
                          "mx-auto h-7 w-12 rounded-lg border text-[10px] font-bold transition duration-200 flex items-center justify-center cursor-pointer",
                          isSelected
                            ? cn("text-white", theme.bg, theme.border, theme.glow)
                            : "bg-zinc-950/60 border-zinc-800/80 text-zinc-700 hover:border-zinc-700 hover:text-zinc-500",
                          !isOwnProfile && "cursor-default"
                        )}
                        title={`${day.label} - ${slot.label} (${slot.time})`}
                      >
                        {isSelected ? "EVET" : "-"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isOwnProfile && tempSlots.length === 0 && (
        <p className="text-center text-xs italic text-zinc-500 py-2">
          Bu oyuncu henüz müsaitlik takvimini doldurmamış.
        </p>
      )}
    </div>
  );
}
