import { useCallback, useEffect, useState } from "react";

export type ForecastStatus =
  | "Open"
  | "Acknowledged"
  | "Investigating"
  | "Resolved"
  | "Dismissed";

const KEY = "paapeli.forecasts.status.v1";
const EVT = "paapeli:forecasts-updated";

type StatusMap = Record<string, ForecastStatus>;

const load = (): StatusMap => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StatusMap) : {};
  } catch {
    return {};
  }
};

const save = (m: StatusMap) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(m));
    window.dispatchEvent(new Event(EVT));
  } catch {}
};

export const useForecastStore = () => {
  const [statuses, setStatuses] = useState<StatusMap>(() => load());

  useEffect(() => {
    const sync = () => setStatuses(load());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const getStatus = useCallback(
    (devId: string): ForecastStatus => statuses[devId] || "Open",
    [statuses],
  );

  const setStatus = useCallback((devId: string, status: ForecastStatus) => {
    const next = { ...load(), [devId]: status };
    save(next);
    setStatuses(next);
  }, []);

  return { statuses, getStatus, setStatus };
};

export const FORECAST_STATUS_BADGE: Record<ForecastStatus, string> = {
  Open: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  Acknowledged: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Investigating: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  Dismissed: "bg-muted text-muted-foreground",
};
