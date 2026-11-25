import type { ReactNode } from "react";
import { Droplets, Layers, Minus, Mountain, Plus, Sparkles } from "lucide-react";
import { assetsService, type CultivationMethod, type GreenhouseStructure } from "@paapeli/api";
import { Button } from "@/features/factory/components/ui/button";
import { Card } from "@/features/factory/components/ui/card";
import { FieldLabel } from "@/features/factory/components/FieldLabel";
import { currentProductKey } from "@/features/factory/lib/product";
import type { CropChoice } from "./CropPicker";
import { useGreenhouseText } from "../i18n";

/* Pieces shared by the greenhouse forms: the create pages, the details
   dialog and the crop cycle forms. */

export const STRUCTURES: GreenhouseStructure[] = ["GLASS", "POLY_FILM", "POLYCARBONATE", "NET_HOUSE", "TUNNEL", "OTHER"];
export const CULTIVATIONS: { key: CultivationMethod; icon: typeof Mountain }[] = [
  { key: "SOIL", icon: Mountain },
  { key: "HYDROPONIC", icon: Droplets },
  { key: "SUBSTRATE", icon: Layers },
  { key: "OTHER", icon: Sparkles },
];

/** Time zones a greenhouse here is likely to be in, the reader's own first. */
export function timeZoneOptions(): string[] {
  const own = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return [...new Set(["Asia/Tehran", own, "Asia/Dubai", "Asia/Riyadh", "Asia/Baghdad", "Asia/Kabul", "Europe/Istanbul", "UTC"])].filter(Boolean);
}

/** The stages a choice offers: the profile's, or the library crop's it would be made with. */
export function stagesOf(choice: CropChoice | null): { id: string; names: Record<string, string>; name?: string | null }[] {
  if (!choice || choice.kind === "custom") return [];
  if (choice.kind === "profile") return choice.profile.stages.map((s) => ({ id: s.id, names: s.names, name: s.name }));
  return choice.template.stages.map((s) => ({ id: s.key, names: s.names }));
}

/** The root of the product's location tree, made on the first greenhouse. */
export async function ensureRoot(workspaceId: string): Promise<string> {
  try {
    return (await assetsService.getRoot(workspaceId, currentProductKey())).id;
  } catch (error) {
    const code = (error as { response?: { data?: { code?: string } } })?.response?.data?.code;
    if (code !== "ASSET_TREE_NOT_FOUND") throw error;
    return (await assetsService.provisionRoot(workspaceId, currentProductKey())).id;
  }
}

/** A numbered section of a create page, as on the device and server pages. */
export function SectionCard({ step, title, right, children }: { step: number; title: string; right?: ReactNode; children: ReactNode }) {
  const { formatNumber } = useGreenhouseText();
  return (
    <Card className="p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-primary text-xs font-semibold text-primary">
            {formatNumber(step)}
          </span>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        </div>
        {right}
      </div>
      {children}
    </Card>
  );
}

export function Counter({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const { formatNumber } = useGreenhouseText();
  return (
    <div className="space-y-2">
      <FieldLabel className="mb-0">{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="icon" className="h-9 w-9" disabled={value <= min} onClick={() => onChange(value - 1)}>
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-10 text-center text-lg font-semibold tabular-nums">{formatNumber(value)}</span>
        <Button type="button" variant="outline" size="icon" className="h-9 w-9" disabled={value >= max} onClick={() => onChange(value + 1)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {hint && <p className="max-w-[240px] text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
