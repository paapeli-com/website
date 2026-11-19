import { Check, Plus } from "lucide-react";
import { cropService, type CropProfile, type CropTemplate } from "@paapeli/api";
import { cn } from "@/shared/lib/utils";
import { currentProductKey } from "@/features/factory/lib/product";
import { CropIcon } from "./CropIcon";
import { useGreenhouseText } from "../i18n";

/** What a grower picked: a crop they already grow, a library crop, or a custom one. */
export type CropChoice =
  | { kind: "profile"; profile: CropProfile }
  | { kind: "template"; template: CropTemplate }
  | { kind: "custom" };

export const choiceKey = (choice: CropChoice | null | undefined): string =>
  !choice ? "" : choice.kind === "profile" ? `p:${choice.profile.id}` : choice.kind === "template" ? `t:${choice.template.key}` : "custom";

/**
 * A grid of crop tiles. The grower's own crops come first; then the library
 * crops they have not added yet (picking one adds it with the library's
 * stages); and, when offered, a tile for a crop of their own.
 */
export function CropPicker({
  profiles,
  library,
  value,
  onChange,
  offerCustom = false,
  markAdded = false,
  compact = false,
}: {
  profiles: CropProfile[];
  library: CropTemplate[];
  value: CropChoice | null;
  onChange: (choice: CropChoice) => void;
  offerCustom?: boolean;
  /** Show the library crops already added, marked, instead of hiding them. */
  markAdded?: boolean;
  compact?: boolean;
}) {
  const { g, named } = useGreenhouseText();
  const added = new Set(profiles.filter((p) => p.templateKey && !p.name).map((p) => p.templateKey));
  const selected = choiceKey(value);

  const tiles: { key: string; icon: string; title: string; subtitle?: string; disabled?: boolean; choice?: CropChoice }[] = [
    ...(markAdded
      ? []
      : profiles
          .filter((p) => !p.archived)
          .map((profile) => ({
            key: `p:${profile.id}`,
            icon: profile.icon,
            title: named(profile.names, profile.name),
            subtitle: profile.variety ?? undefined,
            choice: { kind: "profile", profile } as CropChoice,
          }))),
    ...library
      .filter((template) => markAdded || !added.has(template.key))
      .map((template) => ({
        key: `t:${template.key}`,
        icon: template.icon,
        title: named(template.names),
        subtitle: markAdded && added.has(template.key) ? g("alreadyAdded") : undefined,
        disabled: markAdded && added.has(template.key),
        choice: { kind: "template", template } as CropChoice,
      })),
  ];

  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4")}>
      {tiles.map((tile) => {
        const isSelected = selected === tile.key;
        return (
          <button
            key={tile.key}
            type="button"
            disabled={tile.disabled}
            onClick={() => tile.choice && onChange(tile.choice)}
            className={cn(
              "relative flex flex-col items-center gap-1.5 rounded-xl border bg-card px-2 text-center transition-all",
              compact ? "py-2.5" : "py-4",
              tile.disabled
                ? "opacity-50 cursor-default"
                : "hover:border-emerald-400 hover:shadow-sm",
              isSelected && "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-950/20",
            )}
          >
            {isSelected && (
              <span className="absolute top-1.5 end-1.5 h-4 w-4 rounded-full bg-emerald-500 text-white inline-flex items-center justify-center">
                <Check className="h-3 w-3" />
              </span>
            )}
            <CropIcon icon={tile.icon} className={compact ? "h-8 w-8" : "h-11 w-11"} />
            <span className="text-sm font-medium leading-tight">{tile.title}</span>
            {tile.subtitle && <span className="text-[11px] text-muted-foreground leading-tight">{tile.subtitle}</span>}
          </button>
        );
      })}
      {offerCustom && (
        <button
          type="button"
          onClick={() => onChange({ kind: "custom" })}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed bg-card px-2 text-center transition-all hover:border-emerald-400",
            compact ? "py-2.5" : "py-4",
            selected === "custom" && "border-emerald-500 ring-2 ring-emerald-500/20",
          )}
        >
          <span className={cn("rounded-full bg-muted inline-flex items-center justify-center", compact ? "h-8 w-8" : "h-11 w-11")}>
            <Plus className="h-5 w-5 text-muted-foreground" />
          </span>
          <span className="text-sm font-medium leading-tight">{g("customCrop")}</span>
          {!compact && <span className="text-[11px] text-muted-foreground leading-tight">{g("customCropDesc")}</span>}
        </button>
      )}
    </div>
  );
}

/**
 * The profile a choice stands for, adding a library crop to the grower's crops
 * first when it is not one of them yet.
 */
export async function profileFor(
  workspaceId: string,
  choice: CropChoice,
  custom?: { name: string; firstStage: string },
): Promise<CropProfile> {
  if (choice.kind === "profile") return choice.profile;
  if (choice.kind === "template") {
    return cropService.create(workspaceId, currentProductKey(), { templateKey: choice.template.key });
  }
  // A custom crop starts with one stage, renamed and added to in its profile.
  return cropService.create(workspaceId, currentProductKey(), {
    name: custom?.name.trim() ?? "",
    stages: [{ name: custom?.firstStage ?? "1" }],
  });
}
