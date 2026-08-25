import { BatteryFull, BatteryLow, BatteryMedium, Car, Dog, User, type LucideIcon } from "lucide-react";
import { AssetType } from "@/data/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

/* Presentation metadata per asset type. Full class strings (not          */
/* interpolated) so Tailwind can see them at build time.                  */
export const ASSET_META: Record<
  AssetType,
  { Icon: LucideIcon; text: string; bg: string; tint: string; ring: string; border: string; marker: string }
> = {
  pet: {
    Icon: Dog,
    text: "text-pet",
    bg: "bg-pet",
    tint: "bg-pet/10",
    ring: "ring-pet",
    border: "border-pet/30",
    marker: "bg-pet",
  },
  person: {
    Icon: User,
    text: "text-person",
    bg: "bg-person",
    tint: "bg-person/10",
    ring: "ring-person",
    border: "border-person/30",
    marker: "bg-person",
  },
  vehicle: {
    Icon: Car,
    text: "text-vehicle",
    bg: "bg-vehicle",
    tint: "bg-vehicle/10",
    ring: "ring-vehicle",
    border: "border-vehicle/30",
    marker: "bg-vehicle",
  },
};

export function TypeAvatar({ type, size = 40, className }: { type: AssetType; size?: number; className?: string }) {
  const { Icon, tint, text } = ASSET_META[type];
  return (
    <span
      className={cn("flex items-center justify-center rounded-full", tint, className)}
      style={{ width: size, height: size }}
    >
      <Icon className={cn(text)} style={{ width: size * 0.5, height: size * 0.5 }} />
    </span>
  );
}

export function StatusPill({ status }: { status: "online" | "offline" }) {
  const { t } = useLanguage();
  const online = status === "online";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        online ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground",
      )}
    >
      <span className={cn("size-1.5 rounded-full", online ? "bg-emerald-500" : "bg-muted-foreground/50")} />
      {online ? t("online") : t("offline")}
    </span>
  );
}

export function Battery({ level }: { level: number }) {
  const { num } = useLanguage();
  const Icon = level > 50 ? BatteryFull : level > 20 ? BatteryMedium : BatteryLow;
  const color = level > 50 ? "text-emerald-500" : level > 20 ? "text-amber-500" : "text-destructive";
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
      <Icon className={cn("size-4", color)} />
      {num(level)}%
    </span>
  );
}

export function Signal({ bars }: { bars: number }) {
  return (
    <span className="inline-flex items-end gap-0.5" aria-label={`signal ${bars}/4`}>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={cn("w-1 rounded-sm", i <= bars ? "bg-emerald-500" : "bg-muted")}
          style={{ height: 3 + i * 2.5 }}
        />
      ))}
    </span>
  );
}
