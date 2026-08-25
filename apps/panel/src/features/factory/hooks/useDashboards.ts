import { useCallback, useEffect, useState } from "react";
import aiManagersCover from "@/features/factory/assets/ai-managers-dashboard-cover.svg";

export type DashboardStatus = "Published" | "Draft" | "Archived";
export type DashboardView = "card" | "grid" | "table";

export interface DashboardItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  location?: string;
  coverImage?: string; // dataURL or URL
  access: "only_me" | "team" | "organization" | "public";
  shareWith?: string[];
  refreshInterval: string;
  timeRange: string;
  timezone: string;
  tags: string[];
  owner: string;
  status: DashboardStatus;
  pinned?: boolean;
  archived?: boolean;
  builtIn?: boolean;
  route?: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "paapeli-dashboards-v1";
const VIEW_KEY = "paapeli-dashboards-view";
const SEED_KEY = "paapeli-dashboards-seeded";
const DEFAULTS_KEY = "paapeli-dashboards-defaults-v5";

export const AI_MANAGERS_DASHBOARD_ID = "ai-dashboard-managers";
export const AI_EXECUTIVE_DASHBOARD_ID = "ai-dashboard-executive";

const buildDefaults = (): DashboardItem[] => {
  const now = Date.now();
  return [
    {
      id: AI_EXECUTIVE_DASHBOARD_ID,
      name: "AI Executive Dashboard",
      description: "Built-in executive overview — KPIs, AI insights, forecasts, recommendations, system status and quick actions.",
      category: "Executive",
      location: "All Sites",
      coverImage: aiManagersCover,
      access: "organization",
      refreshInterval: "1m",
      timeRange: "Last 24 Hours",
      timezone: "(UTC) Coordinated Universal Time",
      tags: ["ai", "executive", "overview", "built-in"],
      owner: "System",
      status: "Published",
      pinned: true,
      builtIn: true,
      route: "/dashboard/ai-executive",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: AI_MANAGERS_DASHBOARD_ID,
      name: "AI Dashboard - Managers",
      description: "Executive AI Operations Center — real-time insights on risks, anomalies and opportunities. Optimized for PC and TV display.",
      category: "Executive",
      location: "All Sites",
      coverImage: aiManagersCover,
      access: "organization",
      refreshInterval: "1m",
      timeRange: "Last 7 Days",
      timezone: "(UTC) Coordinated Universal Time",
      tags: ["ai", "executive", "managers", "tv"],
      owner: "System",
      status: "Published",
      pinned: true,
      builtIn: true,
      route: "/dashboard/ai-managers",
      createdAt: now,
      updatedAt: now,
    },
  ];
};

const sampleCategories = ["Operations", "Utilities", "AI Analytics", "Energy", "Quality", "Safety", "Maintenance", "Executive"];

const seedData = (): DashboardItem[] => {
  const now = Date.now();
  const mk = (i: number, partial: Partial<DashboardItem>): DashboardItem => ({
    id: `seed-${i}`,
    name: "",
    access: "team",
    refreshInterval: "Manual",
    timeRange: "Last 24 Hours",
    timezone: "(UTC) Coordinated Universal Time",
    tags: [],
    owner: "Ali Hosseini",
    status: "Published",
    createdAt: now - i * 3600_000,
    updatedAt: now - i * 600_000,
    ...partial,
  });
  return [
    mk(1, { name: "Sulfonation Overview", description: "Real-time monitoring of sulfonation line performance and key parameters", category: "Operations", location: "Factory A > Sulfonation", pinned: true, owner: "Ali Hosseini" }),
    mk(2, { name: "Boiler Room Monitoring", description: "Monitor boiler efficiency, temperature, pressure and pump status", category: "Utilities", location: "Factory B > Boiler", pinned: true, owner: "Maintenance Team" }),
    mk(3, { name: "AI Predictive Maintenance", description: "AI insights on asset health and failure prediction", category: "AI Analytics", location: "All Sites", pinned: true, owner: "AI Engine" }),
    mk(4, { name: "Energy Consumption", description: "Track electricity and utility consumption across factories", category: "Energy", location: "Factory A", owner: "Operations Team" }),
    mk(5, { name: "Production Line Overview", description: "Overall production, OEE and line performance", category: "Operations", location: "Factory A > Line 1", owner: "Ali Hosseini" }),
    mk(6, { name: "Quality Control Dashboard", description: "Quality metrics, defects and inspection results", category: "Quality", location: "Factory B > Packaging", owner: "Quality Team" }),
    mk(7, { name: "Safety Monitoring", description: "Safety incidents, alerts and compliance status", category: "Safety", location: "All Sites", owner: "HSE Team", status: "Draft" }),
    mk(8, { name: "Compressor Monitoring", description: "Compressor performance and health monitoring", category: "Maintenance", location: "Factory A > Utilities", owner: "Maintenance Team" }),
    mk(9, { name: "Water Treatment Plant", description: "Water quality, flow and pump station monitoring", category: "Utilities", location: "Factory C > WTP", owner: "Operations Team" }),
    mk(10, { name: "Executive Summary", description: "High-level KPIs and business performance overview", category: "Executive", location: "All Sites", owner: "Management" }),
  ];
};

const load = (): DashboardItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

const save = (items: DashboardItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
};

const mergeDefaults = (existing: DashboardItem[]): DashboardItem[] => {
  let applied = false;
  try { applied = localStorage.getItem(DEFAULTS_KEY) === "1"; } catch {}
  const defaults = buildDefaults();
  const byId = new Map(existing.map((d) => [d.id, d]));
  // Always ensure built-in defaults exist; refresh cover/route/builtIn flags.
  defaults.forEach((def) => {
    const cur = byId.get(def.id);
    if (!cur) {
      byId.set(def.id, def);
    } else {
      byId.set(def.id, {
        ...cur,
        coverImage: def.coverImage,
        builtIn: true,
        route: def.route,
        category: cur.category || def.category,
        description: cur.description || def.description,
      });
    }
  });
  const merged = Array.from(byId.values());
  if (!applied || merged.length !== existing.length) {
    save(merged);
    try { localStorage.setItem(DEFAULTS_KEY, "1"); } catch {}
  }
  return merged;
};

export const useDashboards = () => {
  const [items, setItems] = useState<DashboardItem[]>(() => mergeDefaults(load()));


  const persist = useCallback((updater: (prev: DashboardItem[]) => DashboardItem[]) => {
    setItems((prev) => {
      const next = updater(prev);
      save(next);
      return next;
    });
  }, []);

  const create = useCallback((d: Omit<DashboardItem, "id" | "createdAt" | "updatedAt" | "status" | "owner"> & Partial<Pick<DashboardItem, "status" | "owner">>) => {
    const now = Date.now();
    const item: DashboardItem = {
      id: `db-${now}-${Math.random().toString(36).slice(2, 7)}`,
      status: "Published",
      owner: "You",
      createdAt: now,
      updatedAt: now,
      ...d,
    };
    persist((prev) => [item, ...prev]);
    return item;
  }, [persist]);

  const update = useCallback((id: string, patch: Partial<DashboardItem>) => {
    persist((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch, updatedAt: Date.now() } : it)));
  }, [persist]);

  const remove = useCallback((id: string) => {
    persist((prev) => prev.filter((it) => it.id !== id));
  }, [persist]);

  const duplicate = useCallback((id: string) => {
    persist((prev) => {
      const src = prev.find((p) => p.id === id);
      if (!src) return prev;
      const now = Date.now();
      const copy: DashboardItem = { ...src, id: `db-${now}-${Math.random().toString(36).slice(2, 7)}`, name: `${src.name} (Copy)`, pinned: false, createdAt: now, updatedAt: now };
      return [copy, ...prev];
    });
  }, [persist]);

  const seedSamples = useCallback(() => {
    const data = seedData();
    save(data);
    setItems(data);
    try { localStorage.setItem(SEED_KEY, "1"); } catch {}
  }, []);

  // Sync across tabs / hook instances
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { items, create, update, remove, duplicate, seedSamples, categories: sampleCategories };
};

export const useViewMode = () => {
  const [view, setView] = useState<DashboardView>(() => {
    try { return (localStorage.getItem(VIEW_KEY) as DashboardView) || "card"; } catch { return "card"; }
  });
  useEffect(() => { try { localStorage.setItem(VIEW_KEY, view); } catch {} }, [view]);
  return [view, setView] as const;
};
