import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Circle, Cpu, Hexagon, Loader2, Pencil, Plus, Radar, RectangleHorizontal, Trash2, Undo2 } from "lucide-react";
import {
  useDeleteDeviceZoneMutation,
  useSaveDeviceZoneMutation,
  type Zone,
  type ZoneType,
} from "@paapeli/api";
import { useActiveWorkspaceId } from "@paapeli/brand/workspace";
import { useLanguage } from "@/features/track/i18n/LanguageContext";
import { TranslationKey } from "@/features/track/i18n/translations";
import { PRODUCT_KEY } from "@/features/track/lib/product";
import { useTrackers } from "@/features/track/lib/useTrackers";
import { useTrackerPositions } from "@/features/track/lib/useTrackerPositions";
import { useTrackerZones, type TrackerZoneState } from "@/features/track/lib/useTrackerZones";
import {
  addPoint,
  dragCorner,
  draftFromZone,
  emptyDraft,
  shapePoints,
  toCoordinate,
  zoneFromDraft,
  type ZoneDraft,
} from "@/features/track/lib/zones";
import { ZoneMap, type MapZone } from "@/features/track/components/map/ZoneMap";
import { Button } from "@/features/track/components/ui/button";
import { Modal } from "@/features/track/components/ui/modal";
import { NoData } from "@/features/track/components/NoData";
import { LoadFailed } from "@/shared/components/LoadFailed";
import { PageSkeleton } from "@/shared/components/PageSkeleton";
import { usePageLoad } from "@/shared/hooks/usePageLoad";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { cn } from "@/shared/lib/utils";

/* Safe Zones, backed by the device zone API: each zone-capable tracker has at
 * most one zone — a circle, rectangle or polygon — drawn by clicking the map.
 * The mock page this replaces listed free-standing zones shared by several
 * devices; the API has no such thing, so zones are listed per tracker. */

const SHAPES: { type: ZoneType; key: TranslationKey; Icon: typeof Circle }[] = [
  { type: "CIRCLE", key: "zoneCircle", Icon: Circle },
  { type: "RECTANGLE", key: "zoneRectangle", Icon: RectangleHorizontal },
  { type: "POLYGON", key: "zonePolygon", Icon: Hexagon },
];

const HINTS: Record<ZoneType, TranslationKey> = {
  CIRCLE: "drawHintCircle",
  RECTANGLE: "drawHintRectangle",
  POLYGON: "drawHintPolygon",
};

export default function Geofences() {
  const { t, num } = useLanguage();
  const workspaceId = useActiveWorkspaceId();
  const { trackers, load, noWorkspace, refetch } = useTrackers();
  const deviceIds = useMemo(() => trackers.map((d) => d.id), [trackers]);
  const zoneStates = useTrackerZones(workspaceId, deviceIds);
  const { fixes } = useTrackerPositions(workspaceId, deviceIds);
  const saveZone = useSaveDeviceZoneMutation();
  const deleteZone = useDeleteDeviceZoneMutation();

  const pageLoad = usePageLoad({ loading: load.loading || noWorkspace, failed: load.failed, onRetry: refetch });

  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [draft, setDraft] = useState<ZoneDraft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const selected = trackers.find((d) => d.id === selectedId);
  const selectedState: TrackerZoneState | undefined = selectedId ? zoneStates.get(selectedId) : undefined;
  const selectedZone = selectedState?.status === "zone" ? selectedState.zone : null;
  const editing = !!draft;

  const describe = (zone: Zone) =>
    zone.type === "CIRCLE"
      ? `${t("zoneCircle")} · ${num(zone.area.radiusMeters ?? 0)} m`
      : zone.type === "RECTANGLE"
        ? t("zoneRectangle")
        : `${t("zonePolygon")} · ${num(zone.area.vertices.length)} ${t("points")}`;

  const stateLabel = (s?: TrackerZoneState) =>
    !s || s.status === "loading" ? t("loading")
    : s.status === "zone" ? describe(s.zone)
    : s.status === "none" ? t("noZone")
    : s.status === "unsupported" ? t("zonesUnsupported")
    : t("zoneLoadFailed");

  const mapZones = useMemo<MapZone[]>(
    () => trackers.flatMap((d) => {
      const s = zoneStates.get(d.id);
      return s?.status === "zone" ? [{ id: d.id, name: d.name, zone: s.zone }] : [];
    }),
    [trackers, zoneStates],
  );
  const mapDevices = useMemo(
    () => trackers.flatMap((d) => {
      const f = fixes.get(d.id);
      return f ? [{ id: d.id, lat: f.lat, lng: f.lng }] : [];
    }),
    [trackers, fixes],
  );

  // Fit to the selected tracker's zone, or failing that its last position.
  const focus = useMemo(() => {
    if (!selectedId) return undefined;
    if (selectedZone) {
      return {
        key: `${selectedId}:zone`,
        points: shapePoints(selectedZone),
        radiusMeters: selectedZone.type === "CIRCLE" ? selectedZone.area.radiusMeters : undefined,
      };
    }
    const f = fixes.get(selectedId);
    return f ? { key: `${selectedId}:fix`, points: [[f.lat, f.lng] as [number, number]] } : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, !!selectedZone]);

  const select = (id: string) => {
    if (editing) return;
    setSelectedId(id);
  };

  /* A new circle or rectangle starts already placed on the tracker's last
     position, if it has one, so often it only needs adjusting. A polygon
     starts empty — its points are the whole shape. */
  const freshDraft = (type: ZoneType): ZoneDraft => {
    const fresh = emptyDraft(type);
    const fix = selectedId ? fixes.get(selectedId) : undefined;
    return fix && type !== "POLYGON" ? addPoint(fresh, toCoordinate(fix.lat, fix.lng)) : fresh;
  };

  const startEditing = (type?: ZoneType) => {
    setDraft(selectedZone && !type ? draftFromZone(selectedZone) : freshDraft(type ?? "CIRCLE"));
  };

  // Points don't carry over between shapes — switching starts the shape over.
  const changeShape = (type: ZoneType) => {
    if (draft?.type !== type) setDraft(freshDraft(type));
  };

  const undoPoint = () =>
    setDraft((d) =>
      !d ? d
      : d.type === "RECTANGLE" ? { ...d, corners: [] }
      : d.type === "POLYGON" ? { ...d, vertices: d.vertices.slice(0, -1) }
      : { ...d, center: undefined },
    );

  const handleSave = async () => {
    if (!workspaceId || !selectedId || !draft) return;
    const zone = zoneFromDraft(draft);
    if (!zone) return void toast.error(t("zoneIncomplete"));
    try {
      await saveZone.mutateAsync({ workspaceId, productKey: PRODUCT_KEY, deviceId: selectedId, zone });
      toast.success(t("zoneSaved"));
      setDraft(null);
    } catch (error) {
      toast.error(apiErrorMessage(error, t("zoneSaveFailed")));
    }
  };

  const handleDelete = async () => {
    if (!workspaceId || !selectedId) return;
    try {
      await deleteZone.mutateAsync({ workspaceId, productKey: PRODUCT_KEY, deviceId: selectedId });
      toast.success(t("zoneDeleted"));
      setConfirmDelete(false);
    } catch (error) {
      toast.error(apiErrorMessage(error, t("zoneDeleteFailed")));
    }
  };

  if (pageLoad.status === "loading") return <PageSkeleton />;
  if (pageLoad.status === "failed") return <LoadFailed onRetry={pageLoad.retry} />;

  const pointCount = draft ? shapePoints(draft).length : 0;
  const complete = draft ? !!zoneFromDraft(draft) : false;

  return (
    <div className="mx-auto max-w-6xl p-4 lg:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold">{t("geofences")}</h1>
        <p className="text-sm text-muted-foreground">{t("safeZonesDesc")}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="relative">
          <ZoneMap
            zones={mapZones}
            devices={mapDevices}
            selectedId={selectedId}
            onSelect={select}
            draft={draft}
            drawing={editing}
            onMapClick={(lat, lng, view) => setDraft((d) => (d ? addPoint(d, toCoordinate(lat, lng), view) : d))}
            onCornerDrag={(i, lat, lng) => setDraft((d) => (d ? dragCorner(d, i, toCoordinate(lat, lng)) : d))}
            focus={focus}
            className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border"
          />
          {editing && (
            <div className="pointer-events-none absolute inset-x-3 top-3 z-[1000] flex justify-center">
              <span className="rounded-full bg-card/95 px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur">
                {t(HINTS[draft!.type])}
              </span>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          {/* Selected tracker — its zone, or the editor */}
          {selected && (
            <div className="rounded-2xl border border-primary/40 bg-card p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Radar className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p dir="auto" className="truncate text-sm font-semibold">{selected.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{stateLabel(selectedState)}</p>
                </div>
              </div>

              {editing ? (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
                    {SHAPES.map(({ type, key, Icon }) => (
                      <button
                        key={type}
                        onClick={() => changeShape(type)}
                        className={cn(
                          "flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                          draft!.type === type ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <Icon className="size-3.5 shrink-0" />
                        <span className="truncate">{t(key)}</span>
                      </button>
                    ))}
                  </div>

                  {draft!.type === "CIRCLE" && (
                    <label className="block">
                      <span className="mb-1.5 flex items-center justify-between text-xs font-medium">
                        {t("radius")}
                        <span className="text-muted-foreground">{num(draft!.radiusMeters)} m</span>
                      </span>
                      <input
                        type="number"
                        min={1}
                        step={10}
                        dir="ltr"
                        value={draft!.radiusMeters}
                        onChange={(e) => {
                          const r = Math.max(0, Math.round(Number(e.target.value) || 0));
                          setDraft((d) => (d?.type === "CIRCLE" ? { ...d, radiusMeters: r } : d));
                        }}
                        className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                      />
                    </label>
                  )}

                  {draft!.type === "POLYGON" && (
                    <p className="text-xs text-muted-foreground">
                      {num(pointCount)} {t("points")}
                      {pointCount < 3 && ` · ${t("polygonMinPoints")}`}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="min-w-0 flex-1" onClick={handleSave} disabled={!complete || saveZone.isPending}>
                      {saveZone.isPending && <Loader2 className="size-4 animate-spin" />}
                      {t("save")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={undoPoint} disabled={pointCount === 0} aria-label={t("undoPoint")}>
                      <Undo2 className="size-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setDraft(null)}>{t("cancel")}</Button>
                  </div>
                </div>
              ) : selectedState?.status === "zone" ? (
                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="min-w-0 flex-1" onClick={() => startEditing()}>
                    <Pencil className="size-4" />
                    {t("editZone")}
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => setConfirmDelete(true)}>
                    <Trash2 className="size-4" />
                    {t("deleteZone")}
                  </Button>
                </div>
              ) : selectedState?.status === "none" ? (
                <Button size="sm" className="mt-4 w-full" onClick={() => startEditing("CIRCLE")}>
                  <Plus className="size-4" />
                  {t("addZone")}
                </Button>
              ) : null}
            </div>
          )}

          {!selected && trackers.length > 0 && (
            <p className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              {t("selectTrackerForZone")}
            </p>
          )}

          {/* Every tracker and its zone */}
          <div className="rounded-2xl border border-border bg-card p-2">
            {trackers.length === 0 && <NoData size="sm" />}
            {trackers.map((d) => {
              const s = zoneStates.get(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() => select(d.id)}
                  disabled={editing && d.id !== selectedId}
                  className={cn(
                    "mb-1 flex w-full items-center gap-3 rounded-xl p-2.5 text-start transition-colors last:mb-0 disabled:opacity-50",
                    d.id === selectedId ? "bg-primary/10" : "hover:bg-muted",
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Cpu className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p dir="auto" className="truncate text-sm font-medium">{d.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{stateLabel(s)}</p>
                  </div>
                  {s?.status === "zone" && <Radar className="size-4 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title={t("deleteZoneQuestion")}>
        <p className="text-sm text-muted-foreground">
          {t("deleteZoneDesc")} <span dir="auto" className="font-medium text-foreground">{selected?.name}</span>
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDelete(false)}>{t("cancel")}</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteZone.isPending}>
            {deleteZone.isPending && <Loader2 className="size-4 animate-spin" />}
            {t("deleteZone")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
