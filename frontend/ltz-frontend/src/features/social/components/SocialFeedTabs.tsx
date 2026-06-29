import { ChevronDown } from "lucide-react";

import { cn } from "../../../utils/cn";
import type { SocialFeedTab } from "../types/social.types";

const tabs: Array<{ id: SocialFeedTab; label: string }> = [
  { id: "all", label: "Tümü" },
  { id: "following", label: "Takip Ettiklerim" },
  { id: "popular", label: "Popüler" },
  { id: "news", label: "Oyun Haberleri" },
  { id: "market", label: "İlanlar" },
  { id: "communities", label: "Topluluklarım" },
  { id: "saved", label: "Kaydedilenler" },
];

interface SocialFeedTabsProps {
  activeTab: SocialFeedTab;
  onTabChange: (tab: SocialFeedTab) => void;
}

export function SocialFeedTabs({ activeTab, onTabChange }: SocialFeedTabsProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-white/10 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={cn(
              "relative h-12 shrink-0 cursor-pointer px-4 text-sm font-semibold text-zinc-400 transition hover:-translate-y-0.5 hover:text-white",
              activeTab === tab.id && "text-fuchsia-300",
            )}
            type="button"
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-fuchsia-500 shadow-[0_0_18px_rgba(217,70,239,0.9)]" />
            )}
          </button>
        ))}
      </div>

      <button
        className="mb-3 inline-flex h-9 cursor-pointer items-center justify-end gap-2 rounded-md px-3 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.05]"
        type="button"
      >
        Sırala: En Yeniler
        <ChevronDown size={16} />
      </button>
    </div>
  );
}
