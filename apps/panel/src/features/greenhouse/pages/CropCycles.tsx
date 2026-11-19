import { useMemo, useState } from "react";
import { CalendarRange, Plus, Search } from "lucide-react";
import type { CropCycle, CropCycleStatus } from "@paapeli/api";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { LoadFailed } from "@/shared/components/LoadFailed";
import { DataState } from "@/features/factory/components/DataState";
import { UniformPage } from "@/features/factory/components/UniformPage";
import { Button } from "@/features/factory/components/ui/button";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { Input } from "@/features/factory/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/factory/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { formatDate } from "@/shared/lib/formatDate";
import { cn } from "@/shared/lib/utils";
import { CropIcon } from "../components/CropIcon";
import { CropCycleSheet } from "../components/CropCycleSheet";
import { StartCycleDialog } from "../components/StartCycleDialog";
import { daysSince, daysUntil, useCropCycles, useCropProfiles, useGreenhouses } from "../hooks";
import { useGreenhouseText, type GreenhouseTextKey } from "../i18n";

const STATUSES: (CropCycleStatus | "ALL")[] = ["ACTIVE", "COMPLETED", "ARCHIVED", "ALL"];
const COLUMNS = 7;

/** Every crop cycle, growing ones first by default, filtered by greenhouse, crop and status. */
export default function CropCycles() {
  const { g, named, language, formatNumber } = useGreenhouseText();
  const [status, setStatus] = useState<CropCycleStatus | "ALL">("ACTIVE");
  const [greenhouseId, setGreenhouseId] = useState("all");
  const [cropId, setCropId] = useState("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<CropCycle | null>(null);
  const [starting, setStarting] = useState(false);

  const greenhouses = useGreenhouses();
  const profiles = useCropProfiles(true);
  const cycles = useCropCycles({
    ...(status === "ALL" ? {} : { status }),
    ...(greenhouseId === "all" ? {} : { greenhouseId }),
    ...(cropId === "all" ? {} : { cropProfileId: cropId }),
  });
  const everything = useCropCycles();

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = cycles.data ?? [];
    if (!q) return list;
    return list.filter((c) =>
      [named(c.crop.names, c.crop.name), c.variety, c.assetName, c.greenhouseName, named(c.stage.names, c.stage.name)]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q)),
    );
  }, [cycles.data, search, named]);
  const nothingAtAll = (everything.data?.length ?? 0) === 0;

  const STATUS_TONE: Record<CropCycleStatus, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    COMPLETED: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
    ARCHIVED: "bg-muted text-muted-foreground",
  };

  return (
    <UniformPage>
      <div className="space-y-4">
        <PageHeader
          title={g("cropCycles")}
          count={everything.data ? everything.data.length : null}
          countLabel={g("cyclesCount")}
          actions={
            <Button onClick={() => setStarting(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-5 gap-2 rounded-md">
              <Plus className="h-4 w-4" /> {g("startCycle")}
            </Button>
          }
        />

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg border p-0.5">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm transition-colors",
                      status === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {s === "ALL" ? g("all") : g(`status_${s}` as GreenhouseTextKey)}
                  </button>
                ))}
              </div>
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={g("searchCycles")} className="ps-9 h-10" />
              </div>
              <Select value={greenhouseId} onValueChange={setGreenhouseId}>
                <SelectTrigger className="h-10 w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{g("allGreenhouses")}</SelectItem>
                  {(greenhouses.data ?? []).map((h) => (
                    <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={cropId} onValueChange={setCropId}>
                <SelectTrigger className="h-10 w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{g("allCrops")}</SelectItem>
                  {(profiles.data ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{named(p.names, p.name)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {cycles.isError ? (
              <LoadFailed onRetry={() => void cycles.refetch()} />
            ) : (
              <div className="rounded-lg border overflow-x-auto text-sm [&_th]:text-xs [&_td]:text-sm [&_th]:h-10 [&_td]:p-3">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>{g("crop")}</TableHead>
                      <TableHead>{g("where")}</TableHead>
                      <TableHead>{g("stage")}</TableHead>
                      <TableHead>{g("planted")}</TableHead>
                      <TableHead>{g("age")}</TableHead>
                      <TableHead>{g("expectedHarvest")}</TableHead>
                      <TableHead>{g("statusLabel")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cycles.isLoading ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={COLUMNS}>
                          <DataState loading />
                        </TableCell>
                      </TableRow>
                    ) : rows.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={COLUMNS}>
                          {nothingAtAll ? (
                            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                              <CalendarRange className="h-12 w-12 text-muted-foreground/50" />
                              <div>
                                <p className="font-medium">{g("noCyclesTitle")}</p>
                                <p className="text-xs text-muted-foreground mt-1">{g("noCyclesDesc")}</p>
                              </div>
                              <Button onClick={() => setStarting(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                                <Plus className="h-4 w-4" /> {g("startCycle")}
                              </Button>
                            </div>
                          ) : (
                            <p className="py-12 text-center text-muted-foreground">{g("noCyclesMatch")}</p>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((c) => {
                        const toHarvest = c.expectedHarvestOn ? daysUntil(c.expectedHarvestOn) : null;
                        return (
                          <TableRow key={c.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setOpen(c)}>
                            <TableCell>
                              <div className="flex items-center gap-2 min-w-0">
                                <CropIcon icon={c.crop.icon} className="h-7 w-7 shrink-0" />
                                <div className="min-w-0">
                                  <div className="font-medium truncate">{named(c.crop.names, c.crop.name)}</div>
                                  {c.variety && <div className="text-xs text-muted-foreground truncate">{c.variety}</div>}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {[c.greenhouseName, c.assetName].filter(Boolean).join(" › ")}
                            </TableCell>
                            <TableCell>
                              <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                                {named(c.stage.names, c.stage.name)}
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{formatDate(c.plantedOn, language)}</TableCell>
                            <TableCell className="whitespace-nowrap tabular-nums">
                              {c.status === "ACTIVE" ? g("dayN", { n: daysSince(c.plantedOn) + 1 }) : <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {c.expectedHarvestOn ? (
                                <div>
                                  <div>{formatDate(c.expectedHarvestOn, language)}</div>
                                  {c.status === "ACTIVE" && toHarvest != null && (
                                    <div className={cn("text-xs", toHarvest > 0 ? "text-muted-foreground" : "text-amber-600")}>
                                      {toHarvest > 0 ? g("daysToHarvest", { n: toHarvest }) : g("harvestDue")}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">{g("notSet")}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", STATUS_TONE[c.status])}>
                                {g(`status_${c.status}` as GreenhouseTextKey)}
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
            {rows.length > 0 && (
              <p className="text-xs text-muted-foreground">{`${formatNumber(rows.length)} ${g("cyclesCount")}`}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <StartCycleDialog open={starting} onOpenChange={setStarting} greenhouses={greenhouses.data ?? []} />
      <CropCycleSheet cycle={open} open={!!open} onOpenChange={(next) => !next && setOpen(null)} />
    </UniformPage>
  );
}
