import { BackToGreenhouses } from "../components/BackToGreenhouses";
import { TableRowsSkeleton } from "@/features/factory/components/panel/DetailPageSkeleton";
import { useMemo, useState } from "react";
import { CalendarRange, Plus } from "lucide-react";
import type { CropCycle, CropCycleStatus } from "@paapeli/api";
import { PageHeader } from "@/features/factory/components/PageHeader";
import { ListToolbar } from "@/features/factory/components/panel/ListToolbar";
import { LoadFailed } from "@/shared/components/LoadFailed";
import { UniformPage } from "@/features/factory/components/UniformPage";
import { Button } from "@/features/factory/components/ui/button";
import { Card, CardContent } from "@/features/factory/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { formatDate } from "@/shared/lib/formatDate";
import { cn } from "@/shared/lib/utils";
import { CropIcon } from "../components/CropIcon";
import { CropCycleSheet } from "../components/CropCycleSheet";
import { useNavigate } from "react-router-dom";
import { localizedPath } from "@/features/factory/lib/localizedPath";
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
  const navigate = useNavigate();
  const startCycle = () => navigate(localizedPath("/crop-cycles/new", language));

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
        <BackToGreenhouses />
        <PageHeader
          title={g("cropCycles")}
          count={everything.data ? everything.data.length : null}
          countLabel={g("cyclesCount")}
          actions={
            <Button onClick={startCycle} className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-5 gap-2 rounded-md">
              <Plus className="h-4 w-4" /> {g("startCycle")}
            </Button>
          }
        />

        <Card>
          <CardContent className="pt-6 space-y-4">
            <ListToolbar
              search={{ value: search, onChange: setSearch, placeholder: g("searchCycles") }}
              onRefresh={() => {
                void cycles.refetch();
                void everything.refetch();
              }}
              isRefreshing={cycles.isFetching}
              filter={{
                fields: [
                  {
                    key: "status",
                    label: g("statusLabel"),
                    value: status,
                    onChange: (v) => setStatus(v as CropCycleStatus | "ALL"),
                    options: STATUSES.map((s) => ({ value: s, label: s === "ALL" ? g("all") : g(`status_${s}` as GreenhouseTextKey) })),
                  },
                  {
                    key: "greenhouse",
                    label: g("greenhouseCol"),
                    value: greenhouseId,
                    onChange: setGreenhouseId,
                    options: [{ value: "all", label: g("allGreenhouses") }, ...(greenhouses.data ?? []).map((h) => ({ value: h.id, label: h.name }))],
                  },
                  {
                    key: "crop",
                    label: g("crop"),
                    value: cropId,
                    onChange: setCropId,
                    options: [{ value: "all", label: g("allCrops") }, ...(profiles.data ?? []).map((p) => ({ value: p.id, label: named(p.names, p.name) }))],
                  },
                ],
                activeCount: (status !== "ACTIVE" ? 1 : 0) + (greenhouseId !== "all" ? 1 : 0) + (cropId !== "all" ? 1 : 0),
                onClear: () => {
                  setStatus("ACTIVE");
                  setGreenhouseId("all");
                  setCropId("all");
                },
              }}
            />

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
                      <TableRowsSkeleton rows={8} columns={COLUMNS} />
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
                              <Button onClick={startCycle} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
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

      <CropCycleSheet cycle={open} open={!!open} onOpenChange={(next) => !next && setOpen(null)} />
    </UniformPage>
  );
}
