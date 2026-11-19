import { useEffect, useState } from "react";
import {
  assetsService,
  greenhouseService,
  type CultivationMethod,
  type Greenhouse,
  type GreenhouseStructure,
  type GreenhouseZone,
} from "@paapeli/api";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/features/factory/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/features/factory/components/ui/alert-dialog";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { FieldLabel } from "@/features/factory/components/FieldLabel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { currentProductKey } from "@/features/factory/lib/product";
import { toast } from "@/shared/lib/toast";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { cn } from "@/shared/lib/utils";
import { CULTIVATIONS, STRUCTURES, timeZoneOptions } from "./AddGreenhouseWizard";
import { COVERS, CoverPicker, coverOf, type CoverKey } from "./GreenhouseCover";
import { useGreenhouseWorkspace } from "../hooks";
import { useGreenhouseText, type GreenhouseTextKey } from "../i18n";

/** Each picture's name in the reader's language. */
export function useCoverLabels(): Record<CoverKey, string> {
  const { g } = useGreenhouseText();
  return Object.fromEntries(COVERS.map((c) => [c, g(`cover_${c}` as GreenhouseTextKey)])) as Record<CoverKey, string>;
}

export function CultivationChips({ value, onChange }: { value: CultivationMethod | null; onChange: (v: CultivationMethod | null) => void }) {
  const { g } = useGreenhouseText();
  return (
    <div className="flex flex-wrap gap-2">
      {CULTIVATIONS.map(({ key, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(value === key ? null : key)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
            value === key ? "border-primary bg-primary/10 text-primary" : "hover:border-primary/40",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {g(`cultivation_${key}` as GreenhouseTextKey)}
        </button>
      ))}
    </div>
  );
}

/**
 * A greenhouse's name, picture and details. The name is the location tree's;
 * the rest is kept as the greenhouse's details. Used in the edit dialog and
 * in a greenhouse's settings.
 */
export function GreenhouseDetailsForm({
  greenhouse,
  onSaved,
  onCancel,
}: {
  greenhouse: Greenhouse;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const { g } = useGreenhouseText();
  const coverLabels = useCoverLabels();
  const { workspaceId, refresh } = useGreenhouseWorkspace();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");
  const [timeZone, setTimeZone] = useState("");
  const [structure, setStructure] = useState<GreenhouseStructure | null>(null);
  const [cultivation, setCultivation] = useState<CultivationMethod | null>(null);
  const [cover, setCover] = useState<CoverKey>("tunnel");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(greenhouse.name);
    setLocation(greenhouse.location ?? "");
    setArea(greenhouse.areaM2 != null ? String(greenhouse.areaM2) : "");
    setTimeZone(greenhouse.timeZone ?? "");
    setStructure(greenhouse.structureType ?? null);
    setCultivation(greenhouse.cultivationMethod ?? null);
    setCover(coverOf(greenhouse.cover, greenhouse.structureType));
  }, [greenhouse]);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const pk = currentProductKey();
      if (name.trim() !== greenhouse.name) {
        await assetsService.updateAsset(workspaceId, pk, { id: greenhouse.id, name: name.trim(), label: name.trim() });
      }
      await greenhouseService.saveDetail(workspaceId, pk, greenhouse.id, {
        location: location.trim() || null,
        areaM2: area ? Number(area) : null,
        timeZone: timeZone || null,
        structureType: structure,
        cultivationMethod: cultivation,
        cover,
      });
      await refresh();
      toast.success(g("savedDetails"));
      onSaved?.();
    } catch (error) {
      toast.error(apiErrorMessage(error, g("editDetails")));
    } finally {
      setSaving(false);
    }
  };

  const zones = [...new Set([timeZone, ...timeZoneOptions()].filter(Boolean))];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <FieldLabel required className="mb-0">{g("greenhouseName")}</FieldLabel>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={255} />
        </div>
        <div className="space-y-2">
          <FieldLabel optional className="mb-0">{g("locationLabel")}</FieldLabel>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={g("locationPh")} />
        </div>
        <div className="space-y-2">
          <FieldLabel optional className="mb-0">{`${g("area")} (${g("m2")})`}</FieldLabel>
          <Input type="number" min="1" dir="ltr" value={area} onChange={(e) => setArea(e.target.value)} />
        </div>
        <div className="space-y-2">
          <FieldLabel optional className="mb-0">{g("structure")}</FieldLabel>
          <Select value={structure ?? ""} onValueChange={(v) => setStructure(v as GreenhouseStructure)}>
            <SelectTrigger>
              <SelectValue placeholder={g("notSet")} />
            </SelectTrigger>
            <SelectContent>
              {STRUCTURES.map((s) => (
                <SelectItem key={s} value={s}>{g(`structure_${s}` as GreenhouseTextKey)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <FieldLabel optional className="mb-0">{g("timeZone")}</FieldLabel>
          <Select value={timeZone} onValueChange={setTimeZone}>
            <SelectTrigger dir="ltr">
              <SelectValue placeholder={g("notSet")} />
            </SelectTrigger>
            <SelectContent>
              {zones.map((tz) => (
                <SelectItem key={tz} value={tz}>{tz}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <FieldLabel optional className="mb-0">{g("cultivation")}</FieldLabel>
        <CultivationChips value={cultivation} onChange={setCultivation} />
      </div>
      <div className="space-y-2">
        <FieldLabel className="mb-0">{g("picture")}</FieldLabel>
        <CoverPicker value={cover} onChange={setCover} labels={coverLabels} />
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && <Button variant="outline" onClick={onCancel}>{g("cancel")}</Button>}
        <Button onClick={save} disabled={saving || !name.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          {g("save")}
        </Button>
      </div>
    </div>
  );
}

export function GreenhouseDetailsDialog({
  greenhouse,
  onOpenChange,
}: {
  greenhouse: Greenhouse | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { g } = useGreenhouseText();
  return (
    <Dialog open={!!greenhouse} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto" data-uniform-type>
        <DialogHeader>
          <DialogTitle>{g("editDetails")}</DialogTitle>
        </DialogHeader>
        {greenhouse && <GreenhouseDetailsForm greenhouse={greenhouse} onSaved={() => onOpenChange(false)} onCancel={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

/** A zone (or a bed in a zone) added to a greenhouse after it was made. */
export function AddPlaceDialog({
  parent,
  onOpenChange,
}: {
  /** The greenhouse a zone goes in, or the zone a bed goes in. */
  parent: { id: string; kind: "ZONE" | "BED"; nextNumber: number } | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { g } = useGreenhouseText();
  const { workspaceId, refresh } = useGreenhouseWorkspace();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!parent) return;
    setName(g(parent.kind === "ZONE" ? "zoneDefaultName" : "bedDefaultName", { n: parent.nextNumber }));
  }, [parent, g]);

  const save = async () => {
    if (!parent || !name.trim()) return;
    setSaving(true);
    try {
      await assetsService.createChild(workspaceId, currentProductKey(), parent.id, {
        name: name.trim(),
        type: parent.kind,
        label: name.trim(),
      });
      await refresh();
      onOpenChange(false);
    } catch (error) {
      toast.error(apiErrorMessage(error, g(parent.kind === "ZONE" ? "addZone" : "addBed")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!parent} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" data-uniform-type>
        <DialogHeader>
          <DialogTitle>{parent && g(parent.kind === "ZONE" ? "addZone" : "addBed")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-1">
          <FieldLabel required className="mb-0">{parent && g(parent.kind === "ZONE" ? "zoneName" : "bedName")}</FieldLabel>
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} maxLength={255} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{g("cancel")}</Button>
          <Button onClick={save} disabled={saving || !name.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {g("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** A zone's name, area and cultivation method. */
export function ZoneSettingsDialog({ zone, onOpenChange }: { zone: GreenhouseZone | null; onOpenChange: (open: boolean) => void }) {
  const { g } = useGreenhouseText();
  const { workspaceId, refresh } = useGreenhouseWorkspace();
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [cultivation, setCultivation] = useState<CultivationMethod | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!zone) return;
    setName(zone.name);
    setArea(zone.areaM2 != null ? String(zone.areaM2) : "");
    setCultivation(zone.cultivationMethod ?? null);
  }, [zone]);

  const save = async () => {
    if (!zone || !name.trim()) return;
    setSaving(true);
    try {
      const pk = currentProductKey();
      if (name.trim() !== zone.name) {
        await assetsService.updateAsset(workspaceId, pk, { id: zone.id, name: name.trim(), label: name.trim() });
      }
      await greenhouseService.saveDetail(workspaceId, pk, zone.id, {
        areaM2: area ? Number(area) : null,
        cultivationMethod: cultivation,
      });
      await refresh();
      toast.success(g("savedDetails"));
      onOpenChange(false);
    } catch (error) {
      toast.error(apiErrorMessage(error, g("zoneSettings")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!zone} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-uniform-type>
        <DialogHeader>
          <DialogTitle>{g("zoneSettings")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <FieldLabel required className="mb-0">{g("zoneName")}</FieldLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={255} />
          </div>
          <div className="space-y-2">
            <FieldLabel optional className="mb-0">{`${g("area")} (${g("m2")})`}</FieldLabel>
            <Input type="number" min="1" dir="ltr" value={area} onChange={(e) => setArea(e.target.value)} />
          </div>
          <div className="space-y-2">
            <FieldLabel optional className="mb-0">{g("cultivation")}</FieldLabel>
            <CultivationChips value={cultivation} onChange={setCultivation} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{g("cancel")}</Button>
          <Button onClick={save} disabled={saving || !name.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {g("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive,
  onConfirm,
  onOpenChange,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const { g } = useGreenhouseText();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{g("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
