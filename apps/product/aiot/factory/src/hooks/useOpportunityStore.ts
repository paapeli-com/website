import { useCallback, useEffect, useState } from "react";

export type OpportunityStatus =
  | "New"
  | "Planned"
  | "In Progress"
  | "Implemented"
  | "Dismissed";

const KEY = "paapeli.opportunities.status.v1";
const EVT = "paapeli:opportunities-updated";

type StatusMap = Record<string, OpportunityStatus>;

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

export const useOpportunityStore = () => {
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
    (id: string): OpportunityStatus => statuses[id] || "New",
    [statuses],
  );
  const setStatus = useCallback((id: string, status: OpportunityStatus) => {
    const next = { ...load(), [id]: status };
    save(next);
    setStatuses(next);
  }, []);

  return { statuses, getStatus, setStatus };
};

export const OPPORTUNITY_STATUS_BADGE: Record<OpportunityStatus, string> = {
  New: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Planned: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "In Progress": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  Implemented: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  Dismissed: "bg-muted text-muted-foreground",
};
