import { useEffect, useState } from "react";
import {
  assetsService,
  greenhouseService,
  type CultivationMethod,
  type Greenhouse,
  type GreenhouseStructure,
} from "@paapeli/api";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/features/factory/components/ui/dialog";
import { Button } from "@/features/factory/components/ui/button";
import { Input } from "@/features/factory/components/ui/input";
import { FieldLabel } from "@/features/factory/components/FieldLabel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { currentProductKey } from "@/features/factory/lib/product";
import { toast } from "@/shared/lib/toast";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { cn } from "@/shared/lib/utils";
import { CULTIVATIONS, STRUCTURES, timeZoneOptions } from "./AddGreenhouseWizard";
import { useGreenhouseWorkspace } from "../hooks";
import { useGreenhouseText, type GreenhouseTextKey } from "../i18n";

/** A greenhouse's name and details, changed after it was made. */
export function GreenhouseDetailsDialog({
  greenhouse,
  onOpenChange,
}: {
  greenhouse: Greenhouse | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { g } = useGreenhouseText();
  const { workspaceId, refresh } = useGreenhouseWorkspace();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");
  const [timeZone, setTimeZone] = useState("");
  const [structure, setStructure] = useState<GreenhouseStructure | null>(null);
  const [cultivation, setCultivation] = useState<CultivationMethod | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!greenhouse) return;
    setName(greenhouse.name);
    setLocation(greenhouse.location ?? "");
    setArea(greenhouse.areaM2 != null ? String(greenhouse.areaM2) : "");
    setTimeZone(greenhouse.timeZone ?? "");
    setStructure(greenhouse.structureType ?? null);
    setCultivation(greenhouse.cultivationMethod ?? null);
  }, [greenhouse]);

  const save = async () => {
    if (!greenhouse || !name.trim()) return;
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
      });
      await refresh();
      toast.success(g("saved"));
      onOpenChange(false);
    } catch (error) {
      toast.error(apiErrorMessage(error, g("editDetails")));
    } finally {
      setSaving(false);
    }
  };

  const zones = [...new Set([timeZone, ...timeZoneOptions()].filter(Boolean))];

  return (
    <Dialog open={!!greenhouse} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" data-uniform-type>
        <DialogHeader>
          <DialogTitle>{g("editDetails")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2 py-1">
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
          <div className="space-y-2 sm:col-span-2">
            <FieldLabel optional className="mb-0">{g("cultivation")}</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {CULTIVATIONS.map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCultivation(cultivation === key ? null : key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                    cultivation === key ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300" : "hover:border-emerald-300",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {g(`cultivation_${key}` as GreenhouseTextKey)}
                </button>
              ))}
            </div>
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
