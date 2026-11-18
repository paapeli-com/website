import { useEffect, useMemo, useState } from "react";
import { LISTED_PRODUCTS } from "@/shared/config";
import { useNavigate } from "react-router-dom";
import { Bell, Box, ClipboardList, History, LayoutDashboard, Loader2, MapPin, Search, X, type LucideIcon } from "lucide-react";
import { useListWorkspaceProductsQuery, useSearchProductsQueries, type SearchHit, type SearchHitType } from "@paapeli/api";
import { solutionPath } from "@paapeli/brand/config";
import { useActiveWorkspaceId } from "@paapeli/brand/workspace";
import { useShellT } from "@/shared/i18n/shell";

/* The header search: a name match over every product the active workspace
   subscribes to (GET /api/v1/aiot/search/{ws}/{productKey}, one request per
   product, side by side). Each hit opens its own page in its own product; a
   kind of hit a product has no page for is left out rather than shown dead. */

const MIN_QUERY = 2;
const DEBOUNCE_MS = 250;

/* Recent searches: what was typed before a result was picked, newest first.
   A per-browser convenience, so localStorage, and every access guarded: it
   can throw in a private window and the search must work without it. */
const RECENT_KEY = "paapeli_recent_searches";
const RECENT_MAX = 5;

function readRecent(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((q): q is string => typeof q === "string").slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function writeRecent(list: string[]) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    /* Not kept this time; nothing else depends on it. */
  }
}

/** Every solution with an API scope, in the product switcher's order. */
const SOLUTIONS = LISTED_PRODUCTS.flatMap((p) => p.solutions ?? []).filter((s) => !!s.productKey);

const TYPE_ORDER: SearchHitType[] = ["DEVICE", "LOCATION", "ALARM_RULE", "WORK_ORDER", "DASHBOARD"];

const TYPE_META: Record<SearchHitType, { label: string; icon: LucideIcon }> = {
  DEVICE: { label: "Devices", icon: Box },
  LOCATION: { label: "Locations", icon: MapPin },
  ALARM_RULE: { label: "Alarm rules", icon: Bell },
  WORK_ORDER: { label: "Work orders", icon: ClipboardList },
  DASHBOARD: { label: "Dashboards", icon: LayoutDashboard },
};

/** Where a hit opens, per solution; undefined when that solution has no such page. */
const hitPath = (solutionId: string, hit: SearchHit): string | undefined => {
  const base = solutionPath(solutionId);
  if (solutionId === "SmartFactory") {
    switch (hit.type) {
      case "DEVICE": return `${base}/devices/${hit.id}`;
      case "LOCATION": return `${base}/locations?q=${encodeURIComponent(hit.title)}`;
      case "ALARM_RULE": return `${base}/alarms/rules/${hit.id}/edit`;
      case "WORK_ORDER": return `${base}/work-orders/${hit.id}`;
      case "DASHBOARD": return `${base}/dashboard/${hit.id}`;
    }
  }
  if (solutionId === "GPSTracking" && hit.type === "DEVICE") return `${base}/devices/${hit.id}`;
  return undefined;
};

type Row = { key: string; hit: SearchHit; path: string; product: string };
type Group = { key: string; label: string; product: string; rows: Row[] };

export function HeaderSearch() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState(readRecent);
  const t = useShellT();
  const navigate = useNavigate();
  const workspaceId = useActiveWorkspaceId() ?? "";

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  // Only products this workspace actually subscribes to; the others 404.
  const { data: subscribed } = useListWorkspaceProductsQuery(workspaceId);
  const solutions = useMemo(() => {
    const keys = new Set((subscribed ?? []).map((p) => p.productKey));
    return SOLUTIONS.filter((s) => keys.has(s.productKey!));
  }, [subscribed]);
  const results = useSearchProductsQueries(workspaceId, solutions.map((s) => s.productKey!), debounced);

  const groups = useMemo<Group[]>(() => {
    const out: Group[] = [];
    const several = solutions.length > 1;
    solutions.forEach((solution, i) => {
      const hits = results[i]?.data?.hits ?? [];
      for (const type of TYPE_ORDER) {
        const rows = hits
          .filter((h) => h.type === type)
          .map((hit) => ({ hit, path: hitPath(solution.id, hit) }))
          .filter((r): r is { hit: SearchHit; path: string } => !!r.path)
          .map((r) => ({ ...r, key: `${solution.id}:${r.hit.type}:${r.hit.id}`, product: solution.name }));
        if (rows.length) {
          out.push({ key: `${solution.id}:${type}`, label: TYPE_META[type].label, product: several ? solution.name : "", rows });
        }
      }
    });
    return out;
  }, [results, solutions]);

  const rows = groups.flatMap((g) => g.rows);
  const loading = results.some((r) => r.isFetching);
  const failed = results.length > 0 && results.every((r) => r.isError);
  const tooShort = query.trim().length < MIN_QUERY;
  const open = focused && query.trim().length > 0;
  const showRecent = focused && query.trim().length === 0 && recent.length > 0;

  const remember = (q: string) => {
    const next = [q, ...recent.filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, RECENT_MAX);
    setRecent(next);
    writeRecent(next);
  };
  const forget = (q: string) => {
    const next = recent.filter((r) => r !== q);
    setRecent(next);
    writeRecent(next);
  };

  useEffect(() => setActive(0), [debounced]);

  const pick = (row: Row) => {
    if (query.trim().length >= MIN_QUERY) remember(query.trim());
    navigate(row.path);
    setFocused(false);
    setQuery("");
    (document.activeElement as HTMLElement | null)?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") { setFocused(false); (e.target as HTMLInputElement).blur(); return; }
    if (!rows.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => (i + 1) % rows.length); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => (i - 1 + rows.length) % rows.length); }
    if (e.key === "Enter") { e.preventDefault(); pick(rows[Math.min(active, rows.length - 1)]); }
  };

  let message: string | null = null;
  if (tooShort) message = t("Type at least 2 characters.");
  else if (failed) message = t("Search failed. Try again.");
  else if (!rows.length) message = loading || debounced !== query.trim() ? t("Searching…") : t("No results found.");

  return (
    <div className="relative hidden w-64 md:block lg:w-72">
      <Search className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted-foreground ltr:left-3.5 rtl:right-3.5" />
      {loading && !tooShort && (
        <Loader2 className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground ltr:right-3.5 rtl:left-3.5" />
      )}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        // Delay so a click on a result registers before the dropdown unmounts.
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        onKeyDown={onKeyDown}
        placeholder={t("Search")}
        role="combobox"
        aria-expanded={open || showRecent}
        aria-controls="header-search-results"
        className="h-10 w-full rounded-xl border border-border bg-card text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary ltr:pl-9 ltr:pr-9 rtl:pr-9 rtl:pl-9"
      />

      {showRecent && (
        <div
          id="header-search-results"
          role="listbox"
          className="absolute z-50 mt-2 w-[420px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-border bg-popover py-2 shadow-lg ltr:left-0 rtl:right-0"
        >
          <div className="flex items-center justify-between px-4 pb-1 pt-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("Recent searches")}</span>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setRecent([]); writeRecent([]); }}
              className="text-xs font-medium text-primary hover:underline"
            >
              {t("Clear")}
            </button>
          </div>
          {recent.map((q) => (
            <div key={q} className="group flex items-center hover:bg-muted">
              <button
                type="button"
                role="option"
                aria-selected={false}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setQuery(q)}
                className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2 text-start"
              >
                <History className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm text-foreground" dir="auto">{q}</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => forget(q)}
                aria-label={t("Remove")}
                className="me-2 flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground group-hover:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div
          id="header-search-results"
          role="listbox"
          className="absolute z-50 mt-2 max-h-[70vh] w-[420px] max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-2xl border border-border bg-popover py-2 shadow-lg ltr:left-0 rtl:right-0"
        >
          {message && <p className="px-4 py-8 text-center text-sm text-muted-foreground">{message}</p>}

          {groups.map((g) => {
            const Icon = TYPE_META[g.rows[0].hit.type].icon;
            return (
              <div key={g.key}>
                <div className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground first:pt-2">
                  {t(g.label)}
                  {g.product && <span className="font-normal normal-case"> · {t(g.product)}</span>}
                </div>
                {g.rows.map((row) => {
                  const index = rows.indexOf(row);
                  return (
                    <button
                      key={row.key}
                      type="button"
                      role="option"
                      aria-selected={index === active}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => pick(row)}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-start transition-colors ${index === active ? "bg-muted" : "hover:bg-muted"}`}
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground">
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground" dir="auto">{row.hit.title}</span>
                        {row.hit.subtitle && (
                          <span className="block truncate text-xs text-muted-foreground" dir="auto">{row.hit.subtitle}</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}

          <div className="mt-1 border-t border-border px-4 pt-2 text-xs text-muted-foreground">
            {t("Searches all your products")}
          </div>
        </div>
      )}
    </div>
  );
}
