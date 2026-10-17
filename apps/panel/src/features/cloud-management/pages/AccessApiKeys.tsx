import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/shared/lib/toast";
import {
  ArrowLeft,
  ArrowUpDown,
  Check,
  Copy,
  Eye,
  Filter,
  Key as KeyIcon,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { getCurrentUser } from "@paapeli/brand/session";
import { Badge, Button, Card, EmptyState, Input, Label, PageHeader } from "@/features/cloud-management/ui";
import { useWorkspaceSelection } from "@/features/cloud-management/contexts/WorkspaceContext";
import { formatDate, formatDateTime } from "@/shared/lib/formatDate";
import { useAppLanguage } from "@/shared/i18n/appLanguage";
import { useShellT } from "@/shared/i18n/shell";
import { cn } from "@/shared/lib/utils";
import {
  createApiKey,
  isLegacyKey,
  removeGrant,
  revokeApiKeys,
  useApiKeys,
  type ApiKey,
  type ApiKeyGrant,
} from "@/shared/lib/apiKeys";
import { PRODUCT_REGISTRY, getProduct, productName } from "@/shared/lib/productRegistry";

/* The one place application API keys live.
 *
 * Every product that needs a key sends the user here rather than keeping a
 * list of its own. AI Inference's sidebar row is a shortcut into this page
 * with ?product=ai-inference&project=…&from=ai-inference, which is why this
 * page reads those parameters: the filters, the context banner and the "back"
 * link all come from the URL, so a refresh or a browser Back lands in the same
 * place it left.
 *
 * Device credentials are NOT here. Per-device MQTT tokens and certificates
 * have their own lifecycle behind @paapeli/api; a key on this page is an
 * application credential and revoking one must never take a fleet offline.
 *
 * BACKEND: there is no application-key service yet. shared/lib/apiKeys.ts is a
 * typed adapter over browser storage and says so at length; nothing issued
 * here authorises anything, and the secrets it shows are prefixed
 * pp_preview_. The screen is built against the shape the service will have.
 *
 * The toolbar deliberately matches the device list's: search on the leading
 * edge, then refresh, Filters, Sort, Actions. It is rebuilt from this
 * feature's own primitives rather than imported from the factory feature,
 * which would pull that product's chunk and its whole translation table into
 * Cloud Management for the sake of one row of buttons.
 */

type SortKey = "created" | "name" | "lastUsed" | "expires";

const EXPIRY_CHOICES = [
  { value: "30", labelKey: "30 days" },
  { value: "90", labelKey: "90 days" },
  { value: "365", labelKey: "1 year" },
  { value: "never", labelKey: "No expiration" },
];

export default function AccessApiKeys() {
  const t = useShellT();
  const language = useAppLanguage();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { selected: workspace } = useWorkspaceSelection();
  const { keys, refresh } = useApiKeys();

  /* Context comes from the URL, not from state: refresh and Back keep it. */
  const productFilter = params.get("product") ?? "all";
  const projectFilter = params.get("project") ?? "all";
  const from = params.get("from");
  const wantsCreate = params.get("create") === "1";

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [created, setCreated] = useState<{ key: ApiKey; secret: string } | null>(null);
  const [detail, setDetail] = useState<ApiKey | null>(null);
  const [revoking, setRevoking] = useState<ApiKey[] | null>(null);

  /* Arriving with ?create=1 opens the same dialog every other entry point
     opens; the flag is then dropped so a refresh does not reopen it. */
  useEffect(() => {
    if (!wantsCreate) return;
    setCreateOpen(true);
    const next = new URLSearchParams(params);
    next.delete("create");
    setParams(next, { replace: true });
  }, [wantsCreate, params, setParams]);

  const setParam = (name: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null) next.delete(name);
    else next.set(name, value);
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = keys.filter((k) => {
      if (productFilter !== "all" && !k.grants.some((g) => g.productId === productFilter)) return false;
      if (projectFilter !== "all") {
        const relevant = productFilter === "all" ? k.grants : k.grants.filter((g) => g.productId === productFilter);
        if (!relevant.some((g) => g.projectIds.includes(projectFilter))) return false;
      }
      if (statusFilter !== "all" && k.status !== statusFilter) return false;
      if (expiryFilter === "expiring") {
        const soon = Date.now() + 30 * 24 * 60 * 60 * 1000;
        if (!k.expiresAt || k.expiresAt > soon || k.status !== "active") return false;
      }
      if (expiryFilter === "never" && k.expiresAt !== null) return false;
      if (!q) return true;
      /* Name, prefix and product names — never a secret, because none is
         stored to search. */
      return (
        k.name.toLowerCase().includes(q) ||
        k.prefix.toLowerCase().includes(q) ||
        k.grants.some((g) => productName(g.productId).toLowerCase().includes(q))
      );
    });

    const sorted = [...rows];
    if (sortKey === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sortKey === "lastUsed") sorted.sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0));
    if (sortKey === "expires") sorted.sort((a, b) => (a.expiresAt ?? Infinity) - (b.expiresAt ?? Infinity));
    return sorted;
  }, [keys, query, productFilter, projectFilter, statusFilter, expiryFilter, sortKey]);

  const selectedKeys = keys.filter((k) => selectedIds.has(k.id));
  const revocable = selectedKeys.filter((k) => k.status === "active");

  const activeChips = [
    productFilter !== "all" && { key: "product", label: `${t("Products")}: ${productName(productFilter)}` },
    projectFilter !== "all" && { key: "project", label: `${t("Project")}: ${projectFilter}` },
    statusFilter !== "all" && { key: "status", label: `${t("Status")}: ${t(statusFilter)}` },
    expiryFilter !== "all" && { key: "expiry", label: t("Expiration") },
  ].filter(Boolean) as { key: string; label: string }[];

  const clearChip = (key: string) => {
    if (key === "product") setParam("product", null);
    if (key === "project") setParam("project", null);
    if (key === "status") setStatusFilter("all");
    if (key === "expiry") setExpiryFilter("all");
  };

  const clearAll = () => {
    const next = new URLSearchParams(params);
    next.delete("product");
    next.delete("project");
    setParams(next, { replace: true });
    setStatusFilter("all");
    setExpiryFilter("all");
  };

  return (
    /* data-uniform-type: the page is written in Tailwind steps and reads at
       those steps in every language, like Dashboards and the device list. */
    <div data-uniform-type className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t("Access & API keys")}
        description={t("One key can reach several Paapeli products. They all live here.")}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            {t("Create API key")}
          </Button>
        }
      />

      {/* Opened from a product: say so, and offer both ways out. */}
      {from && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-primary/30 bg-primary/[0.04] py-3">
          <span className="text-[13.5px] text-foreground">
            {t("Opened from")} <span className="font-semibold">{productName(from)}</span>
            {projectFilter !== "all" && ` · ${projectFilter}`}
          </span>
          <span className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={clearAll}>
              {t("Show all products")}
            </Button>
            <Button variant="ghost" onClick={() => navigate("/AIInfra/AIInference")}>
              <ArrowLeft className="size-4 rtl:rotate-180" />
              {t("Back to AI Inference")}
            </Button>
          </span>
        </Card>
      )}

      <Card className="flex flex-col gap-4 p-4">
        {/* Search leading, then refresh, Filters, Sort, Actions — the order
            the device list uses. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative min-w-[240px] flex-1 md:max-w-md">
            <Search className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted-foreground ltr:left-3 rtl:right-3" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Search keys")}
              className="bg-muted/40 ltr:pl-9 rtl:pr-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              className="size-10 px-0"
              aria-label={t("Refresh")}
              onClick={() => {
                setRefreshing(true);
                refresh();
                window.setTimeout(() => setRefreshing(false), 400);
              }}
            >
              <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
            </Button>

            <Popover open={filtersOpen} onOpenChange={setFiltersOpen} label={t("Filters")} icon={Filter} count={activeChips.length}>
              <FilterField
                label={t("Products")}
                value={productFilter}
                onChange={(v) => setParam("product", v === "all" ? null : v)}
                options={[
                  { value: "all", label: t("All products") },
                  ...PRODUCT_REGISTRY.map((p) => ({ value: p.id, label: p.name })),
                ]}
              />
              <FilterField
                label={t("Project")}
                value={projectFilter}
                onChange={(v) => setParam("project", v === "all" ? null : v)}
                options={[
                  { value: "all", label: t("All projects") },
                  ...(getProduct(productFilter)?.projects ?? []).map((p) => ({ value: p.id, label: p.name })),
                ]}
              />
              <FilterField
                label={t("Status")}
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "all", label: t("All statuses") },
                  { value: "active", label: t("active") },
                  { value: "expired", label: t("expired") },
                  { value: "revoked", label: t("revoked") },
                ]}
              />
              <FilterField
                label={t("Expiration")}
                value={expiryFilter}
                onChange={setExpiryFilter}
                options={[
                  { value: "all", label: t("Any") },
                  { value: "expiring", label: t("Expiring soon") },
                  { value: "never", label: t("No expiration") },
                ]}
              />
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="ghost" onClick={clearAll}>
                  {t("Reset")}
                </Button>
                <Button onClick={() => setFiltersOpen(false)}>{t("Apply")}</Button>
              </div>
            </Popover>

            <Popover open={sortOpen} onOpenChange={setSortOpen} label={t("Sort")} icon={ArrowUpDown}>
              {(
                [
                  ["created", t("Created")],
                  ["name", t("Name")],
                  ["lastUsed", t("Last used")],
                  ["expires", t("Expiration")],
                ] as [SortKey, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSortKey(key);
                    setSortOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm",
                    sortKey === key ? "bg-primary/10 font-medium text-primary" : "text-foreground hover:bg-muted",
                  )}
                >
                  {label}
                  {sortKey === key && <Check className="size-4" />}
                </button>
              ))}
            </Popover>

            <Popover
              open={actionsOpen}
              onOpenChange={setActionsOpen}
              label={`${t("Actions")}${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}`}
              disabled={selectedIds.size === 0}
            >
              <button
                type="button"
                disabled={revocable.length === 0}
                onClick={() => {
                  setActionsOpen(false);
                  setRevoking(revocable);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="size-4" />
                {t("Revoke selected")}
              </button>
            </Popover>
          </div>
        </div>

        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {activeChips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground"
              >
                {chip.label}
                <button type="button" onClick={() => clearChip(chip.key)} aria-label={t("Clear")}>
                  <X className="size-3" />
                </button>
              </span>
            ))}
            <button type="button" onClick={clearAll} className="text-xs font-semibold text-primary hover:underline">
              {t("Clear all")}
            </button>
          </div>
        )}

        {/* The device list table, to the class: same border, same type
            scale, same row height, so this list reads like every other. */}
        <div className="overflow-x-auto overflow-y-hidden rounded-lg border text-sm [&_td]:p-3 [&_td]:text-sm [&_th]:h-10 [&_th]:text-xs">
          <table className="w-full min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/40">
                <th className="w-10 border-b border-border px-3">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={filtered.length > 0 && filtered.every((k) => selectedIds.has(k.id))}
                    onChange={(e) =>
                      setSelectedIds((prev) => {
                        const next = new Set(prev);
                        filtered.forEach((k) => (e.target.checked ? next.add(k.id) : next.delete(k.id)));
                        return next;
                      })
                    }
                    aria-label={t("Name")}
                  />
                </th>
                {[t("Name"), t("Products"), t("Access"), t("Status"), t("Last used"), t("Expiration"), ""].map((c, i) => (
                  <th
                    key={i}
                    className="whitespace-nowrap border-b border-border px-3 text-start font-semibold text-muted-foreground"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3">
                    <EmptyState
                      title={t("No API keys yet")}
                      description={t("Create one to let an application call a Paapeli product.")}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((k) => (
                  <KeyRow
                    key={k.id}
                    apiKey={k}
                    selected={selectedIds.has(k.id)}
                    onToggle={() =>
                      setSelectedIds((prev) => {
                        const next = new Set(prev);
                        next.has(k.id) ? next.delete(k.id) : next.add(k.id);
                        return next;
                      })
                    }
                    onView={() => setDetail(k)}
                    onRevoke={() => setRevoking([k])}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">{t("Secrets are shown once when a key is created.")}</p>
      </Card>

      {createOpen && (
        <CreateKeyDialog
          defaultProductId={productFilter !== "all" ? productFilter : undefined}
          defaultProjectId={projectFilter !== "all" ? projectFilter : undefined}
          workspaceId={workspace?.workspaceId ?? null}
          onClose={() => setCreateOpen(false)}
          onCreated={(result) => {
            setCreateOpen(false);
            setCreated(result);
            refresh();
          }}
        />
      )}

      {created && <SecretOnceDialog created={created} onClose={() => setCreated(null)} />}

      {detail && (
        <KeyDetailDialog
          apiKey={detail}
          onClose={() => setDetail(null)}
          onRevoke={() => {
            setRevoking([detail]);
            setDetail(null);
          }}
          onRemoveGrant={(productId) => {
            removeGrant(detail.id, productId);
            refresh();
            toast.success(t("Product access removed."));
            setDetail(null);
          }}
        />
      )}

      {revoking && (
        <RevokeDialog
          keys={revoking}
          onCancel={() => setRevoking(null)}
          onConfirm={() => {
            revokeApiKeys(revoking.map((k) => k.id));
            refresh();
            setSelectedIds(new Set());
            setRevoking(null);
            toast.success(t("Key revoked."));
          }}
        />
      )}
    </div>
  );

  function KeyRow({
    apiKey,
    selected,
    onToggle,
    onView,
    onRevoke,
  }: {
    apiKey: ApiKey;
    selected: boolean;
    onToggle: () => void;
    onView: () => void;
    onRevoke: () => void;
  }) {
    const shownProducts = apiKey.grants.slice(0, 2);
    const extra = apiKey.grants.length - shownProducts.length;
    const soon =
      apiKey.status === "active" && apiKey.expiresAt !== null && apiKey.expiresAt < Date.now() + 30 * 24 * 60 * 60 * 1000;

    return (
      <tr className="border-b border-border/60 last:border-0">
        <td className="px-3 py-3">
          <input type="checkbox" className="size-4 accent-primary" checked={selected} onChange={onToggle} aria-label={apiKey.name} />
        </td>
        <td className="px-3 py-3">
          <span className="flex items-center gap-2.5">
            <KeyIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0">
              <span className="block font-medium text-foreground">{apiKey.name}</span>
              <span className="block font-mono text-xs text-muted-foreground" dir="ltr">
                {apiKey.prefix}
              </span>
            </span>
          </span>
        </td>
        <td className="px-3 py-3">
          {isLegacyKey(apiKey) ? (
            /* No product metadata is not "every product". */
            <Badge tone="gray">{t("Unclassified")}</Badge>
          ) : (
            <span className="flex flex-wrap gap-1">
              {shownProducts.map((g) => (
                <Badge key={g.productId} tone="brand">
                  {productName(g.productId)}
                </Badge>
              ))}
              {extra > 0 && (
                <button type="button" onClick={onView} className="text-xs font-semibold text-primary hover:underline">
                  +{extra}
                </button>
              )}
            </span>
          )}
        </td>
        <td className="px-3 py-3 text-muted-foreground">
          {isLegacyKey(apiKey)
            ? t("Legacy key · permissions not mapped")
            : apiKey.grants
                .map((g) => `${g.projectIds.join(", ")} · ${g.actions.length} ${t("actions")}`)
                .join(" / ")}
        </td>
        <td className="px-3 py-3">
          <Badge tone={apiKey.status === "active" ? "ok" : apiKey.status === "expired" ? "warn" : "bad"}>
            {t(apiKey.status)}
          </Badge>
        </td>
        <td className="px-3 py-3 text-muted-foreground">
          {apiKey.lastUsedAt ? formatDateTime(apiKey.lastUsedAt, language) : t("Never used")}
        </td>
        <td className="px-3 py-3 text-muted-foreground">
          {apiKey.expiresAt ? (
            <span className={soon ? "font-medium text-primary" : undefined}>{formatDate(apiKey.expiresAt, language)}</span>
          ) : (
            t("No expiration")
          )}
        </td>
        <td className="px-3 py-3">
          <span className="flex items-center justify-end gap-1">
            <Button variant="ghost" className="size-9 px-0" onClick={onView} aria-label={t("View")}>
              <Eye className="size-4" />
            </Button>
            <Button
              variant="ghost"
              className="size-9 px-0"
              onClick={onRevoke}
              disabled={apiKey.status !== "active"}
              aria-label={t("Revoke")}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </span>
        </td>
      </tr>
    );
  }
}

/* ------------------------------------------------------------------ */
/* Small pieces this page needs and the feature's ui.tsx doesn't have. */
/* ------------------------------------------------------------------ */

function Popover({
  open,
  onOpenChange,
  label,
  icon: Icon,
  count,
  disabled,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  label: string;
  icon?: typeof Filter;
  count?: number;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Button variant="ghost" disabled={disabled} onClick={() => onOpenChange(!open)}>
        {Icon && <Icon className="size-4" />}
        {label}
        {count ? <span className="rounded-full bg-primary/15 px-1.5 text-xs text-primary">{count}</span> : null}
      </Button>
      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => onOpenChange(false)} aria-hidden />
          <div className="absolute z-50 mt-1 w-64 rounded-xl border border-border bg-popover p-3 shadow-lg ltr:right-0 rtl:left-0">
            {children}
          </div>
        </>
      )}
    </div>
  );
}

function FilterField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-lg border border-border bg-card px-2 text-sm text-foreground outline-none focus:border-primary"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label={title} className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-card shadow-lg">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-border px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

function CreateKeyDialog({
  defaultProductId,
  defaultProjectId,
  workspaceId,
  onClose,
  onCreated,
}: {
  defaultProductId?: string;
  defaultProjectId?: string;
  workspaceId: string | null;
  onClose: () => void;
  onCreated: (result: { key: ApiKey; secret: string }) => void;
}) {
  const t = useShellT();
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("30");
  /* Nothing is granted until it is chosen. A new product, or a new model in an
     existing one, never inherits access from a key created before it. */
  const [grants, setGrants] = useState<Record<string, ApiKeyGrant>>(() =>
    defaultProductId
      ? {
          [defaultProductId]: {
            productId: defaultProductId,
            projectIds: defaultProjectId ? [defaultProjectId] : [],
            actions: [],
            resourceIds: [],
          },
        }
      : {},
  );

  const toggleProduct = (productId: string) =>
    setGrants((prev) => {
      const next = { ...prev };
      if (next[productId]) delete next[productId];
      else next[productId] = { productId, projectIds: [], actions: [], resourceIds: [] };
      return next;
    });

  const patch = (productId: string, change: Partial<ApiKeyGrant>) =>
    setGrants((prev) => ({ ...prev, [productId]: { ...prev[productId], ...change } }));

  const toggleIn = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const chosen = Object.values(grants);
  const valid =
    name.trim().length > 0 &&
    chosen.length > 0 &&
    chosen.every((g) => g.projectIds.length > 0 && g.actions.length > 0);

  const submit = () => {
    if (!valid) return;
    const expiresAt = expiry === "never" ? null : Date.now() + Number(expiry) * 24 * 60 * 60 * 1000;
    onCreated(
      createApiKey({
        name,
        workspaceId,
        createdBy: getCurrentUser()?.email ?? "",
        expiresAt,
        grants: chosen,
      }),
    );
  };

  return (
    <Modal
      title={t("Create API key")}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("Cancel")}
          </Button>
          <Button onClick={submit} disabled={!valid}>
            <KeyIcon className="size-4" />
            {t("Create key")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <Label>{t("Name")}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="customer-support-backend" />
        </div>

        <div>
          <Label>{t("Expiration")}</Label>
          <select
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-card px-3.5 text-sm text-foreground outline-none focus:border-primary"
          >
            {EXPIRY_CHOICES.map((c) => (
              <option key={c.value} value={c.value}>
                {t(c.labelKey)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>{t("Product access")}</Label>
          <p className="mb-2 text-xs text-muted-foreground">{t("Choose at least one product, project and action.")}</p>

          <div className="flex flex-col gap-3">
            {PRODUCT_REGISTRY.filter((p) => p.enabled).map((product) => {
              const grant = grants[product.id];
              const resources = grant ? product.resources() : [];
              return (
                <div key={product.id} className={cn("rounded-xl border p-3", grant ? "border-primary/40" : "border-border")}>
                  <label className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={!!grant}
                      onChange={() => toggleProduct(product.id)}
                    />
                    <span className="text-sm font-medium text-foreground">{product.name}</span>
                  </label>

                  {grant && (
                    <div className="mt-3 flex flex-col gap-3 ps-6">
                      <div>
                        <span className="mb-1 block text-xs font-medium text-muted-foreground">{t("Project")}</span>
                        <div className="flex flex-wrap gap-2">
                          {product.projects.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => patch(product.id, { projectIds: toggleIn(grant.projectIds, p.id) })}
                              className={cn(
                                "rounded-lg px-2.5 py-1 text-xs",
                                grant.projectIds.includes(p.id)
                                  ? "bg-primary/10 font-medium text-primary"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="mb-1 block text-xs font-medium text-muted-foreground">{t("Actions")}</span>
                        <div className="flex flex-wrap gap-2">
                          {product.actions.map((a) => (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => patch(product.id, { actions: toggleIn(grant.actions, a.id) })}
                              className={cn(
                                "rounded-lg px-2.5 py-1 text-xs",
                                grant.actions.includes(a.id)
                                  ? "bg-primary/10 font-medium text-primary"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {a.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {resources.length > 0 && (
                        <div>
                          <span className="mb-1 block text-xs font-medium text-muted-foreground">
                            {product.resourceLabel ?? t("Resources")}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {resources.map((r) => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => patch(product.id, { resourceIds: toggleIn(grant.resourceIds, r.id) })}
                                className={cn(
                                  "rounded-lg px-2.5 py-1 text-xs",
                                  grant.resourceIds.includes(r.id)
                                    ? "bg-primary/10 font-medium text-primary"
                                    : "bg-muted text-muted-foreground",
                                )}
                              >
                                {r.label}
                              </button>
                            ))}
                          </div>
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            {t("New models require an explicit permission update.")}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
          {t("The secret will be shown only once. Your project's budget and rate limits apply to this key.")}
        </p>
      </div>
    </Modal>
  );
}

function SecretOnceDialog({ created, onClose }: { created: { key: ApiKey; secret: string }; onClose: () => void }) {
  const t = useShellT();
  return (
    <Modal
      title={t("API key created")}
      onClose={onClose}
      footer={<Button onClick={onClose}>{t("Done")}</Button>}
    >
      <p className="text-[13.5px] text-muted-foreground">{t("Copy it now. It is not shown again.")}</p>
      <div className="mt-3 flex items-center gap-2">
        <code className="flex-1 overflow-x-auto rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-xs" dir="ltr">
          {created.secret}
        </code>
        <Button
          variant="ghost"
          onClick={() => {
            void navigator.clipboard.writeText(created.secret);
            toast.success(t("Copied"));
          }}
        >
          <Copy className="size-4" />
        </Button>
      </div>
      <div className="mt-4 text-[13.5px]">
        <p className="font-medium text-foreground">{created.key.name}</p>
        <p className="mt-1 flex flex-wrap gap-1">
          {created.key.grants.map((g) => (
            <Badge key={g.productId} tone="brand">
              {productName(g.productId)}
            </Badge>
          ))}
        </p>
      </div>
    </Modal>
  );
}

function KeyDetailDialog({
  apiKey,
  onClose,
  onRevoke,
  onRemoveGrant,
}: {
  apiKey: ApiKey;
  onClose: () => void;
  onRevoke: () => void;
  onRemoveGrant: (productId: string) => void;
}) {
  const t = useShellT();
  const language = useAppLanguage();

  return (
    <Modal
      title={apiKey.name}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("Close")}
          </Button>
          <Button variant="danger" onClick={onRevoke} disabled={apiKey.status !== "active"}>
            <Trash2 className="size-4" />
            {t("Revoke")}
          </Button>
        </>
      }
    >
      <div className="text-[13.5px]">
        <Row label={t("Key")} value={<code className="font-mono text-xs" dir="ltr">{apiKey.prefix}</code>} />
        <Row label={t("Status")} value={<Badge tone={apiKey.status === "active" ? "ok" : "bad"}>{t(apiKey.status)}</Badge>} />
        <Row label={t("Created")} value={formatDateTime(apiKey.createdAt, language)} />
        <Row label={t("Created by")} value={apiKey.createdBy || "—"} />
        <Row label={t("Last used")} value={apiKey.lastUsedAt ? formatDateTime(apiKey.lastUsedAt, language) : t("Never used")} />
        <Row label={t("Expiration")} value={apiKey.expiresAt ? formatDate(apiKey.expiresAt, language) : t("No expiration")} />
      </div>

      <h3 className="mt-4 text-sm font-bold text-foreground">{t("Product access")}</h3>
      {isLegacyKey(apiKey) ? (
        <p className="mt-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
          {t("This key predates product grants. Its permissions are unchanged and have not been mapped.")}
        </p>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          {apiKey.grants.map((g) => (
            <div key={g.productId} className="rounded-xl border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">{productName(g.productId)}</span>
                {/* Removing one product's access is not revoking the key. */}
                <button
                  type="button"
                  onClick={() => onRemoveGrant(g.productId)}
                  className="text-xs font-semibold text-destructive hover:underline"
                >
                  {t("Remove access")}
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("Project")}: {g.projectIds.join(", ") || "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("Actions")}: {g.actions.join(", ") || "—"}
              </p>
              {g.resourceIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("Resources")}: {g.resourceIds.join(", ")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );

  function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
      <div className="flex items-center justify-between gap-4 border-b border-border/60 py-2.5 last:border-0">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value}</span>
      </div>
    );
  }
}

function RevokeDialog({ keys, onCancel, onConfirm }: { keys: ApiKey[]; onCancel: () => void; onConfirm: () => void }) {
  const t = useShellT();
  /* Naming every product a revoke reaches, because a multi-product key going
     away takes more than the product the user happens to be looking at. */
  const products = Array.from(new Set(keys.flatMap((k) => k.grants.map((g) => g.productId))));

  return (
    <Modal
      title={t("Revoke API key?")}
      onClose={onCancel}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            {t("Cancel")}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {t("Revoke")}
          </Button>
        </>
      }
    >
      <p className="text-[13.5px] text-foreground">
        {t("This stops every application using it. It cannot be undone.")}
      </p>
      <ul className="mt-3 flex flex-col gap-1 text-[13.5px] text-muted-foreground">
        {keys.map((k) => (
          <li key={k.id}>
            <span className="font-medium text-foreground">{k.name}</span>{" "}
            <code className="font-mono text-xs" dir="ltr">
              {k.prefix}
            </code>
          </li>
        ))}
      </ul>
      {products.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground">{t("Affected products")}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {products.map((p) => (
              <Badge key={p} tone="bad">
                {productName(p)}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
