import { BackToGreenhouses } from "../components/BackToGreenhouses";
import { TableRowsSkeleton } from "@/features/factory/components/panel/DetailPageSkeleton";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Sprout } from "lucide-react";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { ListToolbar } from "@/features/factory/components/panel/ListToolbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { LoadFailed } from "@/shared/components/LoadFailed";
import { UniformPage } from "@/features/factory/components/UniformPage";
import { Button } from "@/features/factory/components/ui/button";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { Input } from "@/features/factory/components/ui/input";
import { FieldLabel } from "@/features/factory/components/FieldLabel";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/features/factory/components/ui/dialog";
import { localizedPath } from "@/features/factory/lib/localizedPath";
import { toast } from "@/shared/lib/toast";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { cn } from "@/shared/lib/utils";
import { CropIcon } from "../components/CropIcon";
import { CropPicker, profileFor, type CropChoice } from "../components/CropPicker";
import { useCropCycles, useCropLibrary, useCropProfiles, useGreenhouseWorkspace } from "../hooks";
import { useGreenhouseText } from "../i18n";

/** The crops a workspace grows, as a table like the rest of the panel's lists; a row opens the crop's profile. */
export default function Crops() {
  const { g, named, language, formatNumber } = useGreenhouseText();
  const navigate = useNavigate();
  const { refresh } = useGreenhouseWorkspace();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [sort, setSort] = useState("name");
  const profiles = useCropProfiles(status !== "active");
  const growing = useCropCycles({ status: "ACTIVE" });
  const [adding, setAdding] = useState(false);

  const growingBy = useMemo(() => {
    const counts = new Map<string, number>();
    (growing.data ?? []).forEach((c) => counts.set(c.crop.id, (counts.get(c.crop.id) ?? 0) + 1));
    return counts;
  }, [growing.data]);
  const all = useMemo(() => profiles.data ?? [], [profiles.data]);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all
      .filter((c) => status === "all" || (status === "archived" ? c.archived : !c.archived))
      .filter((c) => !q || `${named(c.names, c.name)} ${c.variety ?? ""}`.toLowerCase().includes(q))
      .sort((a, b) =>
        sort === "growing"
          ? (growingBy.get(b.id) ?? 0) - (growingBy.get(a.id) ?? 0)
          : sort === "newest"
            ? b.createdAt.localeCompare(a.createdAt)
            : named(a.names, a.name).localeCompare(named(b.names, b.name), language),
      );
  }, [all, search, status, sort, growingBy, named, language]);
  const nothingAtAll = !profiles.isLoading && all.length === 0 && status === "active";
  const COLUMNS = 5;

  return (
    <UniformPage>
      <div className="space-y-4">
        <BackToGreenhouses />
        <PageHeader
          title={g("crops")}
          count={profiles.data ? rows.length : null}
          countLabel={g("cropsCount")}
          actions={
            <Button onClick={() => setAdding(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-5 gap-2 rounded-md">
              <Plus className="h-4 w-4" /> {g("addCrop")}
            </Button>
          }
        />

        <Card>
          <CardContent className="pt-6">
            <ListToolbar
              search={{ value: search, onChange: setSearch, placeholder: g("searchCrops") }}
              onRefresh={() => void refresh()}
              isRefreshing={profiles.isFetching}
              filter={{
                fields: [
                  {
                    key: "status",
                    label: g("statusLabel"),
                    value: status,
                    onChange: setStatus,
                    options: [
                      { value: "active", label: g("cropActive") },
                      { value: "archived", label: g("archivedBadge") },
                      { value: "all", label: g("all") },
                    ],
                  },
                ],
                activeCount: status !== "active" ? 1 : 0,
                onClear: () => setStatus("active"),
              }}
              sort={{
                options: [
                  { key: "name", label: g("sortName") },
                  { key: "growing", label: g("sortGrowing") },
                  { key: "newest", label: g("sortNewest") },
                ],
                value: sort,
                onChange: setSort,
              }}
            />

            {profiles.isError ? (
              <LoadFailed onRetry={() => void profiles.refetch()} />
            ) : (
              <div className="rounded-lg border overflow-x-auto text-sm [&_th]:text-xs [&_td]:text-sm [&_th]:h-10 [&_td]:p-3">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>{g("crop")}</TableHead>
                      <TableHead>{g("growthStages")}</TableHead>
                      <TableHead>{g("growing")}</TableHead>
                      <TableHead>{g("cycleDays")}</TableHead>
                      <TableHead>{g("statusLabel")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.isLoading ? (
                      <TableRowsSkeleton rows={8} columns={COLUMNS} />
                    ) : rows.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={COLUMNS}>
                          {nothingAtAll ? (
                            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                              <Sprout className="h-12 w-12 text-muted-foreground/50" />
                              <div>
                                <p className="font-medium">{g("noCropsTitle")}</p>
                                <p className="text-xs text-muted-foreground mt-1 max-w-md">{g("noCropsDesc")}</p>
                              </div>
                              <Button onClick={() => setAdding(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                                <Plus className="h-4 w-4" /> {g("addCrop")}
                              </Button>
                            </div>
                          ) : (
                            <p className="py-12 text-center text-muted-foreground">{g("noCropsMatch")}</p>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((crop) => {
                        const withTargets = crop.stages.filter((s) => s.targets.length > 0).length;
                        const count = growingBy.get(crop.id) ?? 0;
                        return (
                          <TableRow
                            key={crop.id}
                            className="cursor-pointer hover:bg-muted/30"
                            onClick={() => navigate(localizedPath(`/crops/${crop.id}`, language))}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="h-8 w-8 shrink-0 rounded-md bg-emerald-50 dark:bg-emerald-950/30 inline-flex items-center justify-center">
                                  <CropIcon icon={crop.icon} className="h-6 w-6" />
                                </span>
                                <div className="min-w-0">
                                  <div className="font-medium truncate">{named(crop.names, crop.name)}</div>
                                  {crop.variety && <div className="text-xs text-muted-foreground truncate">{crop.variety}</div>}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="w-40 space-y-1">
                                <div className="flex gap-0.5">
                                  {crop.stages.map((stage) => (
                                    <span
                                      key={stage.id}
                                      title={named(stage.names, stage.name)}
                                      className={cn("h-1.5 flex-1 rounded-full", stage.targets.length ? "bg-emerald-500" : "bg-muted")}
                                    />
                                  ))}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {withTargets ? g("targetsSetN", { n: withTargets, m: crop.stages.length }) : g("noTargetsYet")}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {count ? g("growingInN", { n: count }) : <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {crop.cycleDays ? formatNumber(crop.cycleDays) : <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "rounded px-1.5 py-0.5 text-[11px] font-medium",
                                  crop.archived
                                    ? "bg-muted text-muted-foreground"
                                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
                                )}
                              >
                                {crop.archived ? g("archivedBadge") : g("cropActive")}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <AddCropDialog open={adding} onOpenChange={setAdding} />
    </UniformPage>
  );
}

function AddCropDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { g, language } = useGreenhouseText();
  const navigate = useNavigate();
  const { workspaceId, refresh } = useGreenhouseWorkspace();
  const profiles = useCropProfiles(true);
  const library = useCropLibrary();
  const [choice, setChoice] = useState<CropChoice | null>(null);
  const [customName, setCustomName] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = !!choice && (choice.kind !== "custom" || !!customName.trim()) && !saving;

  const save = async () => {
    if (!choice || !canSave) return;
    setSaving(true);
    try {
      const profile = await profileFor(workspaceId, choice, { name: customName, firstStage: g("stageN", { n: 1 }) });
      await refresh();
      onOpenChange(false);
      setChoice(null);
      setCustomName("");
      navigate(localizedPath(`/crops/${profile.id}`, language));
    } catch (error) {
      toast.error(apiErrorMessage(error, g("addCrop")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" data-uniform-type>
        <DialogHeader>
          <DialogTitle>{g("library")}</DialogTitle>
        </DialogHeader>
        <CropPicker
          profiles={profiles.data ?? []}
          library={library.data ?? []}
          value={choice}
          onChange={setChoice}
          offerCustom
          markAdded
        />
        {choice?.kind === "custom" && (
          <div className="space-y-2">
            <FieldLabel required className="mb-0">{g("customCropName")}</FieldLabel>
            <Input autoFocus value={customName} onChange={(e) => setCustomName(e.target.value)} maxLength={255} />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{g("cancel")}</Button>
          <Button onClick={save} disabled={!canSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {g("addCrop")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
