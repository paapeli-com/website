import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  dashboardKeys,
  dashboardService,
  emptyDashboardDefinition,
  useDeleteDashboardMutation,
  useListDashboardCategoriesQuery,
  useListDashboardsQuery,
  useListWorkspaceMembersQuery,
  type CreateDashboardRequest,
  type DashboardResponse,
} from "@paapeli/api";
import { getCurrentUserId } from "@paapeli/brand/session";
import aiManagersCover from "@/features/factory/assets/ai-managers-dashboard-cover.svg";
import { currentProductKey } from "@/features/factory/lib/product";
import { DEFAULT_DASHBOARD_SETTINGS } from "@/features/factory/lib/dashboardSettings";
import { useWorkspaceId } from "@/features/factory/store/workspaceStore";
import { useAssetLocations } from "@/features/factory/hooks/useAssetLocations";

/* Dashboards come from the gateway (/api/v1/aiot/dashboards/...). The two
 * built-in AI dashboards are pages of this app, not records, so they are
 * listed alongside the server's dashboards but never sent to it.
 *
 * Pinning and archiving have no API field, so they are kept per browser as a
 * view preference, keyed by dashboard id. */

export type DashboardStatus = "Published" | "Draft" | "Archived";
export type DashboardView = "card" | "grid" | "table";

export interface DashboardItem {
  id: string;
  name: string;
  description?: string;
  /** Category name, for display. */
  category?: string;
  categoryId?: string;
  /** Location breadcrumb, for display. */
  location?: string;
  assetId?: string;
  coverImage?: string;
  access: "private" | "workspace";
  tags: string[];
  owner: string;
  status: DashboardStatus;
  pinned?: boolean;
  archived?: boolean;
  builtIn?: boolean;
  /** In-app route for built-ins; server dashboards open at /dashboard/:id. */
  route?: string;
  createdAt: number;
  updatedAt: number;
}

export const AI_MANAGERS_DASHBOARD_ID = "ai-dashboard-managers";
export const AI_EXECUTIVE_DASHBOARD_ID = "ai-dashboard-executive";

export const isBuiltInDashboardId = (id: string | undefined) =>
  id === AI_MANAGERS_DASHBOARD_ID || id === AI_EXECUTIVE_DASHBOARD_ID;

const BUILT_INS: DashboardItem[] = [
  {
    id: AI_EXECUTIVE_DASHBOARD_ID,
    name: "AI Executive Dashboard",
    description: "Built-in executive overview — KPIs, AI insights, forecasts, recommendations, system status and quick actions.",
    category: "Executive",
    location: "All Sites",
    coverImage: aiManagersCover,
    access: "workspace",
    tags: ["ai", "executive", "overview", "built-in"],
    owner: "System",
    status: "Published",
    pinned: true,
    builtIn: true,
    route: "/dashboard/ai-executive",
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: AI_MANAGERS_DASHBOARD_ID,
    name: "AI Dashboard - Managers",
    description: "Executive AI Operations Center — real-time insights on risks, anomalies and opportunities. Optimized for PC and TV display.",
    category: "Executive",
    location: "All Sites",
    coverImage: aiManagersCover,
    access: "workspace",
    tags: ["ai", "executive", "managers", "tv"],
    owner: "System",
    status: "Published",
    pinned: true,
    builtIn: true,
    route: "/dashboard/ai-managers",
    createdAt: 0,
    updatedAt: 0,
  },
];

/* The built-in dashboards' descriptions, translated. Their names stay English
   on purpose — "AI Executive Dashboard" is what the product is called. Keyed
   by id, so a dashboard someone wrote themselves is never touched. */
const BUILT_IN_DESCRIPTIONS: Record<string, { ar: string; fa: string }> = {
  [AI_EXECUTIVE_DASHBOARD_ID]: {
    fa: "نمای کلی مدیریتی داخلی: شاخص‌های کلیدی، بینش‌های هوش مصنوعی، پیش‌بینی‌ها، پیشنهادها، وضعیت سیستم و اقدامات سریع.",
    ar: "نظرة تنفيذية مدمجة: مؤشرات الأداء، ورؤى الذكاء الاصطناعي، والتنبؤات، والتوصيات، وحالة النظام، والإجراءات السريعة.",
  },
  [AI_MANAGERS_DASHBOARD_ID]: {
    fa: "مرکز عملیات هوش مصنوعی مدیریتی: بینش لحظه‌ای دربارهٔ ریسک‌ها، ناهنجاری‌ها و فرصت‌ها. بهینه‌شده برای نمایش روی رایانه و تلویزیون.",
    ar: "مركز عمليات الذكاء الاصطناعي التنفيذي: رؤى لحظية حول المخاطر والحالات الشاذة والفرص. محسّن للعرض على الحاسوب والتلفاز.",
  },
};

/** A dashboard's description in the reader's language, English as written. */
export const dashboardDescription = (d: Pick<DashboardItem, "id" | "description">, language: string): string =>
  (language === "fa" || language === "ar" ? BUILT_IN_DESCRIPTIONS[d.id]?.[language] : undefined) ?? d.description ?? "";

/* ---------------- legacy localStorage ---------------- */

/* Dashboards and canvases used to live in localStorage. They are not
   migrated — the server is the only source now — so drop them once. */
const purgeLegacyStorage = () => {
  try {
    ["paapeli-dashboards-v1", "paapeli-dashboards-seeded", "paapeli-dashboards-defaults-v5"].forEach((k) =>
      localStorage.removeItem(k),
    );
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && /^paapeli-canvas-.+-v1$/.test(k)) localStorage.removeItem(k);
    }
  } catch {}
};
purgeLegacyStorage();

/* ---------------- per-browser view preferences ---------------- */

type Prefs = Record<string, { pinned?: boolean; archived?: boolean }>;
const PREFS_KEY = "paapeli-dashboard-prefs-v1";
const VIEW_KEY = "paapeli-dashboards-view";

const loadPrefs = (): Prefs => {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
  } catch {
    return {};
  }
};

/* ---------------- mapping ---------------- */

const toMillis = (iso?: string | null) => {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(t) ? 0 : t;
};

/** What "Duplicate" and templates send: a copy with a fresh name. */
export const copyRequest = (d: DashboardResponse, name: string): CreateDashboardRequest => ({
  name,
  description: d.description ?? undefined,
  categoryId: d.categoryId ?? undefined,
  assetId: d.assetId ?? undefined,
  coverImageUri: d.coverImageUri ?? undefined,
  visibility: d.visibility,
  definition: d.definition ?? emptyDashboardDefinition(DEFAULT_DASHBOARD_SETTINGS),
});

export const useDashboards = () => {
  const workspaceId = useWorkspaceId() ?? "";
  const queryClient = useQueryClient();
  const list = useListDashboardsQuery(workspaceId, currentProductKey(), 1, 100);
  const categories = useListDashboardCategoriesQuery(workspaceId, currentProductKey());
  const members = useListWorkspaceMembersQuery(workspaceId, "", 1, 100);
  const { options: locations } = useAssetLocations();
  const deleteMutation = useDeleteDashboardMutation();

  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  useEffect(() => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch {}
  }, [prefs]);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === PREFS_KEY) setPrefs(loadPrefs()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const items = useMemo<DashboardItem[]>(() => {
    const me = getCurrentUserId();
    const categoryName = new Map((categories.data ?? []).map((c) => [c.id, c.name]));
    const locationPath = new Map(locations.map((l) => [l.id, l.path]));
    const memberName = new Map(
      (members.data?.data ?? []).map((m) => [m.userId, m.displayName || m.email || ""]),
    );
    const remote = (list.data?.data ?? []).map<DashboardItem>((d) => ({
      id: d.id,
      name: d.name,
      description: d.description ?? undefined,
      category: d.categoryId ? categoryName.get(d.categoryId) : undefined,
      categoryId: d.categoryId ?? undefined,
      location: d.assetId ? locationPath.get(d.assetId) : undefined,
      assetId: d.assetId ?? undefined,
      coverImage: d.coverImageUri ?? undefined,
      access: d.visibility === "PRIVATE" ? "private" : "workspace",
      tags: [],
      owner: d.createdByUserId && d.createdByUserId === me ? "You" : memberName.get(d.createdByUserId) || "—",
      status: "Published",
      createdAt: toMillis(d.createdAt),
      updatedAt: toMillis(d.updatedAt),
    }));
    return [...BUILT_INS, ...remote].map((d) => {
      const p = prefs[d.id];
      const pinned = p?.pinned ?? d.pinned;
      const archived = p?.archived ?? false;
      return { ...d, pinned, archived, status: archived ? "Archived" : d.status };
    });
  }, [list.data, categories.data, members.data, locations, prefs]);

  /** Pin / archive only — the rest of a dashboard is edited through the form. */
  const update = useCallback((id: string, patch: Partial<Pick<DashboardItem, "pinned" | "archived" | "status">>) => {
    setPrefs((prev) => {
      const cur = prev[id] ?? {};
      const archived = patch.archived ?? (patch.status ? patch.status === "Archived" : cur.archived);
      return { ...prev, [id]: { ...cur, ...(patch.pinned !== undefined ? { pinned: patch.pinned } : {}), archived } };
    });
  }, []);

  const remove = useCallback(async (id: string) => {
    if (isBuiltInDashboardId(id)) return;
    await deleteMutation.mutateAsync({ workspaceId, productKey: currentProductKey(), dashboardId: id });
    setPrefs((prev) => {
      const { [id]: _gone, ...rest } = prev;
      return rest;
    });
  }, [deleteMutation, workspaceId]);

  /** Copies a dashboard, widgets included. Resolves to the new dashboard. */
  const duplicate = useCallback(async (id: string) => {
    if (isBuiltInDashboardId(id)) return null;
    const src = await dashboardService.getDashboard(workspaceId, currentProductKey(), id);
    const created = await dashboardService.createDashboard(workspaceId, currentProductKey(), copyRequest(src, `${src.name} (Copy)`));
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all(workspaceId, currentProductKey()) });
    return created;
  }, [queryClient, workspaceId]);

  return {
    items,
    isLoading: list.isLoading || !workspaceId,
    isError: list.isError,
    update,
    remove,
    duplicate,
  };
};

export const useViewMode = () => {
  const [view, setView] = useState<DashboardView>(() => {
    try { return (localStorage.getItem(VIEW_KEY) as DashboardView) || "card"; } catch { return "card"; }
  });
  useEffect(() => { try { localStorage.setItem(VIEW_KEY, view); } catch {} }, [view]);
  return [view, setView] as const;
};
