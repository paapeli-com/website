import { useEffect, useMemo, useRef } from "react";
import { useQueries } from "@tanstack/react-query";
import { telemetryService, type TelemetryPoint } from "@paapeli/api";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PRODUCT_KEY } from "@/features/factory/lib/product";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { useDevices } from "@/features/factory/hooks/useDevices";
import { toNumber } from "@/features/factory/components/dashboard/DeviceTelemetrySource";
import { addBaseLayer, DEFAULT_CENTER, DEFAULT_ZOOM } from "@/features/track/components/map/baseLayer";
import { makeMarkerIcon } from "@/features/track/components/map/markerIcon";
import { Hint } from "./chartKit";
import type { WidgetRenderProps } from "./types";

const T = {
  noDevices: { en: "Pick a device in the widget settings", ar: "اختر جهازًا في إعدادات العنصر", fa: "در تنظیمات ویجت یک دستگاه انتخاب کنید" },
  queryUnsupported: { en: "Device-query sources aren't available yet", ar: "مصادر استعلام الأجهزة غير متاحة بعد", fa: "منبع «جستجوی دستگاه» هنوز در دسترس نیست" },
  noPositions: { en: "None of these devices has reported a position", ar: "لم يرسل أي من هذه الأجهزة موقعًا", fa: "هیچ‌کدام از این دستگاه‌ها موقعیتی ارسال نکرده‌اند" },
};

type Options = { latitudeKey?: string; longitudeKey?: string; showLabels?: boolean };

/**
 * The "device-map" widget: each bound device at its latest position, read
 * from GET /telemetry/{ws}/{pk}/devices/{deviceId}/latest for the two position
 * keys named in the widget's options. A device that has reported neither key
 * is left off the map.
 */
export function DeviceMapWidget({ widget, dataSources, lang }: WidgetRenderProps) {
  const workspaceId = useWorkspaceId() ?? "";
  const options = (widget.options ?? {}) as Options;
  const latitudeKey = options.latitudeKey?.trim() || "latitude";
  const longitudeKey = options.longitudeKey?.trim() || "longitude";
  const showLabels = options.showLabels ?? true;
  const { items } = useDevices();

  const bound = useMemo(() => {
    const seen = new Map<string, string>();
    widget.data.forEach((d) => {
      const s = dataSources[d.source];
      if (s?.type === "device" && !seen.has(s.deviceId)) seen.set(s.deviceId, d.label?.trim() || "");
    });
    return [...seen.entries()].map(([deviceId, label]) => ({ deviceId, label }));
  }, [widget.data, dataSources]);

  const results = useQueries({
    queries: bound.map(({ deviceId }) => ({
      queryKey: ["telemetryLatest", workspaceId, PRODUCT_KEY, deviceId, `${latitudeKey},${longitudeKey}`],
      queryFn: () => telemetryService.getLatest(workspaceId, PRODUCT_KEY, deviceId, [latitudeKey, longitudeKey]),
      enabled: !!workspaceId,
      placeholderData: (prev: unknown) => prev,
    })),
  }) as Array<{ data?: Record<string, TelemetryPoint[]>; isLoading: boolean }>;

  const names = new Map(items.map((d) => [d.id, d.label || d.name]));
  const points = bound.flatMap(({ deviceId, label }, i) => {
    const latest = results[i]?.data;
    const lat = toNumber(latest?.[latitudeKey]?.[0]?.value);
    const lng = toNumber(latest?.[longitudeKey]?.[0]?.value);
    if (lat === null || lng === null || Math.abs(lat) > 90 || Math.abs(lng) > 180) return [];
    return [{ id: deviceId, lat, lng, name: label || names.get(deviceId) || deviceId }];
  });
  const signature = points.map((p) => `${p.id}:${p.lat}:${p.lng}:${p.name}`).join("|") + `|${showLabels}`;

  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const fittedRef = useRef(false);
  const hasMap = points.length > 0;

  // The map exists only while there is something to put on it.
  useEffect(() => {
    if (!hasMap || !elRef.current) return;
    const map = L.map(elRef.current, { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, attributionControl: true, zoomControl: true });
    addBaseLayer(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    fittedRef.current = false;
    // The widget can be resized on the canvas; the tiles must follow.
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(elRef.current);
    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, [hasMap]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    points.forEach((p) => {
      const marker = L.marker([p.lat, p.lng], { icon: makeMarkerIcon({}) }).addTo(layer);
      marker.bindTooltip(p.name, { permanent: showLabels, direction: "top", offset: [0, -16] });
    });
    // Frame the devices once; after that the user's own pan and zoom are kept.
    if (!fittedRef.current && points.length > 0) {
      if (points.length === 1) map.setView([points[0].lat, points[0].lng], 13);
      else map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng] as L.LatLngTuple)), { padding: [28, 28] });
      fittedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, hasMap]);

  if (widget.data.length === 0) return <Hint>{T.noDevices[lang]}</Hint>;
  if (bound.length === 0) return <Hint>{T.queryUnsupported[lang]}</Hint>;
  if (!hasMap) return results.some((r) => r.isLoading) ? <Hint>{""}</Hint> : <Hint>{T.noPositions[lang]}</Hint>;

  return <div ref={elRef} dir="ltr" className="h-full w-full min-h-0 overflow-hidden rounded-lg" />;
}
