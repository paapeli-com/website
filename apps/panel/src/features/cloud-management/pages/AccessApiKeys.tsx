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
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
import {
  useCreateApiKeyMutation,
  useListApiKeysQuery,
  useListWorkspaceProductsQuery,
  useRemoveApiKeyGrantMutation,
  useRevokeApiKeysMutation,
  type ApiKey,
  type ApiKeyAccess,
  type CreatedApiKey,
} from "@paapeli/api";
import { Badge, Button, Card, EmptyState, Input, Label, PageHeader } from "@/features/cloud-management/ui";
import { useWorkspaceSelection } from "@/features/cloud-management/contexts/WorkspaceContext";
import { formatDate, formatDateTime } from "@/shared/lib/formatDate";
import { apiErrorMessage } from "@/shared/lib/apiError";
import { PAAPELI_API_BASE_URL } from "@/shared/config";
import { useAppLanguage } from "@/shared/i18n/appLanguage";
import { useShellT } from "@/shared/i18n/shell";
import { cn } from "@/shared/lib/utils";

/* The workspace's application API keys, issued and enforced by the gateway
 * (/workspaces/{id}/api-keys).
 *
 * A key belongs to the active workspace and acts as the member who created
 * it, narrowed to the products it was granted, each up to an access level:
 * Read, Operate or Administer, the same three levels product access already
 * has for a signed-in member. The gateway checks both on every call — the
 * key's grant and the creator's own role — so a key can never do more than
 * its creator could, and stops working when they leave the workspace.
 *
 * Keys reach the product endpoints only. Account, workspace and key
 * management answer 403 to a key, whatever it was granted.
 *
 * The secret is shown once, in the dialog after creating; the gateway keeps
 * only a hash of it.
 *
 * Device credentials are NOT here. Per-device MQTT tokens and certificates
 * have their own lifecycle; revoking an application key never takes a fleet
 * offline.
 */

type SortKey = "created" | "name" | "lastUsed" | "expires";

const DAY_MS = 24 * 60 * 60 * 1000;

const EXPIRY_CHOICES = [
  { value: "30", labelKey: "30 days" },
  { value: "90", labelKey: "90 days" },
  { value: "365", labelKey: "1 year" },
  { value: "never", labelKey: "No expiration" },
];

/* The product's own name for a productKey the gateway reports. */
const PRODUCT_NAMES: Record<string, string> = {
  smartFactory: "Smart Infrastructure",
  gpsTracking: "Fleet Management",
};
const productName = (key: string) => PRODUCT_NAMES[key] ?? key;

const ACCESS_LEVELS: { value: ApiKeyAccess; label: string; description: string }[] = [
  { value: "READ", label: "Read", description: "Read devices, telemetry, alarms and the rest of the product's data." },
  { value: "OPERATE", label: "Operate", description: "Also create and change devices, send commands and act on alarms." },
  { value: "ADMINISTER", label: "Administer", description: "Also delete and configure, as a product admin can." },
];

/* The highest level each workspace role can hand to a key — no more than the
   role itself reaches in a product, which the gateway enforces too. */
const ROLE_CEILING: Record<string, ApiKeyAccess> = {
  OWNER: "ADMINISTER",
  ADMIN: "ADMINISTER",
  MEMBER: "OPERATE",
  VIEWER: "READ",
};
const LEVEL_ORDER: ApiKeyAccess[] = ["READ", "OPERATE", "ADMINISTER"];
const withinCeiling = (level: ApiKeyAccess, role?: string) =>
  LEVEL_ORDER.indexOf(level) <= LEVEL_ORDER.indexOf(ROLE_CEILING[role ?? ""] ?? "READ");

const time = (iso: string | null) => (iso ? Date.parse(iso) : null);

/* The call every example on this page shows: one product's devices. */
const exampleCall = (secret: string, workspaceId: string, productKey: string) =>
  `curl -H "Authorization: Bearer ${secret}" \\\n  "${PAAPELI_API_BASE_URL}/api/v1/aiot/devices/${workspaceId}/${productKey}/tenant?page=0&size=25"`;

export default function AccessApiKeys() {
  const t = useShellT();
  const language = useAppLanguage();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { selected: workspace } = useWorkspaceSelection();
  const workspaceId = workspace?.workspaceId ?? "";

  const keysQuery = useListApiKeysQuery(workspaceId);
  const keys = useMemo(() => keysQuery.data ?? [], [keysQuery.data]);
  const { data: workspaceProducts } = useListWorkspaceProductsQuery(workspaceId, !!workspaceId);
  /* What a key can be granted: the products this workspace actually holds. */
  const grantable = useMemo(
    () => (workspaceProducts ?? []).filter((p) => p.status === "ACTIVE").map((p) => p.productKey),
    [workspaceProducts],
  );
  const revokeKeys = useRevokeApiKeysMutation(workspaceId);
  const removeGrant = useRemoveApiKeyGrantMutation(workspaceId);

  /* Context comes from the URL, not from state: refresh and Back keep it. */
  const productFilter = params.get("product") ?? "all";
  const from = params.get("from");
  const wantsCreate = params.get("create") === "1";

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [created, setCreated] = useState<CreatedApiKey | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<ApiKey[] | null>(null);
  const detail = keys.find((k) => k.id === detailId) ?? null;

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
      if (productFilter !== "all" && !k.grants.some((g) => g.productKey === productFilter)) return false;
      if (statusFilter !== "all" && k.status !== statusFilter) return false;
      const expires = time(k.expiresAt);
      if (expiryFilter === "expiring") {
        if (!expires || expires > Date.now() + 30 * DAY_MS || k.status !== "ACTIVE") return false;
      }
      if (expiryFilter === "never" && expires !== null) return false;
      if (!q) return true;
      /* Name, prefix and product names — never a secret, because none is
         kept to search. */
      return (
        k.name.toLowerCase().includes(q) ||
        k.prefix.toLowerCase().includes(q) ||
        k.grants.some((g) => productName(g.productKey).toLowerCase().includes(q))
      );
    });

    const sorted = [...rows];
    if (sortKey === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sortKey === "lastUsed") sorted.sort((a, b) => (time(b.lastUsedAt) ?? 0) - (time(a.lastUsedAt) ?? 0));
    if (sortKey === "expires") sorted.sort((a, b) => (time(a.expiresAt) ?? Infinity) - (time(b.expiresAt) ?? Infinity));
    return sorted;
  }, [keys, query, productFilter, statusFilter, expiryFilter, sortKey]);

  const selectedKeys = keys.filter((k) => selectedIds.has(k.id));
  const revocable = selectedKeys.filter((k) => k.status === "ACTIVE");

  const activeChips = [
    productFilter !== "all" && { key: "product", label: `${t("Products")}: ${t(productName(productFilter))}` },
    statusFilter !== "all" && { key: "status", label: `${t("Status")}: ${t(statusFilter.toLowerCase())}` },
    expiryFilter !== "all" && { key: "expiry", label: t("Expiration") },
  ].filter(Boolean) as { key: string; label: string }[];

  const clearChip = (key: string) => {
    if (key === "product") setParam("product", null);
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

  const confirmRevoke = (toRevoke: ApiKey[]) =>
    revokeKeys.mutate(
      toRevoke.map((k) => k.id),
      {
        onSuccess: () => {
          setSelectedIds(new Set());
          setRevoking(null);
          toast.success(t("Key revoked."));
        },
        onError: (error) => toast.error(apiErrorMessage(error, t("Could not revoke the key."))),
      },
    );

  return (
    /* data-uniform-type: the page is written in Tailwind steps and reads at
       those steps in every language, like Dashboards and the device list. */
    <div data-uniform-type className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t("Access & API keys")}
        description={t("Keys let your own software call the Paapeli APIs of this workspace's products.")}
        actions={
          <Button onClick={() => setCreateOpen(true)} disabled={!workspaceId}>
            <Plus className="size-4" />
            {t("Create API key")}
          </Button>
        }
      />

      {/* Opened from a product: say so, and offer both ways out. */}
      {from === "ai-inference" && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-primary/30 bg-primary/[0.04] py-3">
          <span className="text-[13.5px] text-foreground">
            {t("AI Inference keys are not available yet. Keys here reach Smart Infrastructure and Fleet Management.")}
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

      <UsageCard workspaceId={workspaceId} productKey={grantable[0] ?? "smartFactory"} />

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
              onClick={() => void keysQuery.refetch()}
            >
              <RefreshCw className={cn("size-4", keysQuery.isFetching && "animate-spin")} />
            </Button>

            <Popover open={filtersOpen} onOpenChange={setFiltersOpen} label={t("Filters")} icon={Filter} count={activeChips.length}>
              <FilterField
                label={t("Products")}
                value={productFilter}
                onChange={(v) => setParam("product", v === "all" ? null : v)}
                options={[
                  { value: "all", label: t("All products") },
                  ...grantable.map((p) => ({ value: p, label: t(productName(p)) })),
                ]}
              />
              <FilterField
                label={t("Status")}
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "all", label: t("All statuses") },
                  { value: "ACTIVE", label: t("active") },
                  { value: "EXPIRED", label: t("expired") },
                  { value: "REVOKED", label: t("revoked") },
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
              {keysQuery.isLoading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center">
                    <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                  </td>
                </tr>
              ) : keysQuery.isError ? (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center">
                    <p className="text-sm text-destructive">{apiErrorMessage(keysQuery.error, t("Could not load the keys."))}</p>
                    <Button variant="ghost" className="mt-3" onClick={() => void keysQuery.refetch()}>
                      <RefreshCw className="size-4" />
                      {t("Retry")}
                    </Button>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3">
                    <EmptyState
                      icon={KeyIcon}
                      title={keys.length === 0 ? t("No API keys yet") : t("No key matches these filters.")}
                      description={keys.length === 0 ? t("Create one to let an application call a Paapeli product.") : undefined}
                      action={
                        keys.length === 0 ? (
                          <Button onClick={() => setCreateOpen(true)} disabled={!workspaceId}>
                            <Plus className="size-4" />
                            {t("Create API key")}
                          </Button>
                        ) : undefined
                      }
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
                        if (next.has(k.id)) next.delete(k.id);
                        else next.add(k.id);
                        return next;
                      })
                    }
                    onView={() => setDetailId(k.id)}
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
          workspaceId={workspaceId}
          role={workspace?.role}
          products={grantable}
          defaultProductKey={productFilter !== "all" ? productFilter : undefined}
          onClose={() => setCreateOpen(false)}
          onCreated={(result) => {
            setCreateOpen(false);
            setCreated(result);
          }}
        />
      )}

      {created && <SecretOnceDialog created={created} workspaceId={workspaceId} onClose={() => setCreated(null)} />}

      {detail && (
        <KeyDetailDialog
          apiKey={detail}
          removing={removeGrant.isPending}
          onClose={() => setDetailId(null)}
          onRevoke={() => {
            setRevoking([detail]);
            setDetailId(null);
          }}
          onRemoveGrant={(productKey) =>
            removeGrant.mutate(
              { apiKeyId: detail.id, productKey },
              {
                onSuccess: () => toast.success(t("Product access removed.")),
                onError: (error) => toast.error(apiErrorMessage(error, t("Could not remove the access."))),
              },
            )
          }
        />
      )}

      {revoking && (
        <RevokeDialog
          keys={revoking}
          pending={revokeKeys.isPending}
          onCancel={() => setRevoking(null)}
          onConfirm={() => confirmRevoke(revoking)}
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
    const shown = apiKey.grants.slice(0, 2);
    const extra = apiKey.grants.length - shown.length;
    const expires = time(apiKey.expiresAt);
    const soon = apiKey.status === "ACTIVE" && expires !== null && expires < Date.now() + 30 * DAY_MS;

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
          {apiKey.grants.length === 0 ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span className="flex flex-wrap gap-1">
              {shown.map((g) => (
                <Badge key={g.productKey} tone="brand">
                  {t(productName(g.productKey))}
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
          {apiKey.grants.map((g) => t(ACCESS_LEVELS.find((l) => l.value === g.access)?.label ?? g.access)).join(" / ") || "—"}
        </td>
        <td className="px-3 py-3">
          <Badge tone={apiKey.status === "ACTIVE" ? "ok" : apiKey.status === "EXPIRED" ? "warn" : "bad"}>
            {t(apiKey.status.toLowerCase())}
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
            <Button variant="ghost" className="size-9 px-0" onClick={onView} aria-label={t("View")} title={t("View")}>
              <Eye className="size-4" />
            </Button>
            <Button
              variant="ghost"
              className="size-9 px-0 text-destructive hover:text-destructive"
              onClick={onRevoke}
              disabled={apiKey.status !== "ACTIVE"}
              aria-label={t("Revoke")}
              title={t("Revoke")}
            >
              <Trash2 className="size-4" />
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

/** How to call the APIs with a key: the header, an example, and the reference. */
function UsageCard({ workspaceId, productKey }: { workspaceId: string; productKey: string }) {
  const t = useShellT();
  const example = exampleCall("pp_live_…", workspaceId || "{workspaceId}", productKey);
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Terminal className="size-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground">{t("Calling the API with a key")}</h2>
      </div>
      <p className="text-[13px] text-muted-foreground">
        {t("Send the key in the Authorization header as a bearer token, or in an X-API-Key header. A key works on the product endpoints of this workspace only.")}
      </p>
      <CodeBlock code={example} />
      <p className="text-[13px] text-muted-foreground">
        {t("Every endpoint is described in the API reference:")}{" "}
        <a
          href={`${PAAPELI_API_BASE_URL}/swagger-ui.html`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary hover:underline"
          dir="ltr"
        >
          {PAAPELI_API_BASE_URL}/swagger-ui.html
        </a>
      </p>
    </Card>
  );
}

function CodeBlock({ code }: { code: string }) {
  const t = useShellT();
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-xl border border-border bg-muted/40 p-3 pe-12 font-mono text-xs leading-relaxed text-foreground" dir="ltr">
        {code}
      </pre>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(code);
          toast.success(t("Copied"));
        }}
        aria-label={t("Copy")}
        className="absolute end-2 top-2 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Copy className="size-4" />
      </button>
    </div>
  );
}

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
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted" aria-label="Close">
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
  workspaceId,
  role,
  products,
  defaultProductKey,
  onClose,
  onCreated,
}: {
  workspaceId: string;
  role?: string;
  products: string[];
  defaultProductKey?: string;
  onClose: () => void;
  onCreated: (result: CreatedApiKey) => void;
}) {
  const t = useShellT();
  const createKey = useCreateApiKeyMutation(workspaceId);
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("90");
  /* Nothing is granted until it is chosen, and each product starts at Read:
     the least a key can do there. */
  const [grants, setGrants] = useState<Record<string, ApiKeyAccess>>(() =>
    defaultProductKey && products.includes(defaultProductKey) ? { [defaultProductKey]: "READ" } : {},
  );

  const toggleProduct = (productKey: string) =>
    setGrants((prev) => {
      const next = { ...prev };
      if (next[productKey]) delete next[productKey];
      else next[productKey] = "READ";
      return next;
    });

  const chosen = Object.entries(grants);
  const valid = name.trim().length > 0 && chosen.length > 0;

  const submit = () => {
    if (!valid || createKey.isPending) return;
    const expiresAt = expiry === "never" ? null : new Date(Date.now() + Number(expiry) * DAY_MS).toISOString();
    createKey.mutate(
      { name: name.trim(), expiresAt, grants: chosen.map(([productKey, access]) => ({ productKey, access })) },
      {
        onSuccess: onCreated,
        onError: (error) => toast.error(apiErrorMessage(error, t("Could not create the key."))),
      },
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
          <Button onClick={submit} disabled={!valid || createKey.isPending}>
            {createKey.isPending ? <Loader2 className="size-4 animate-spin" /> : <KeyIcon className="size-4" />}
            {t("Create key")}
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div>
          <Label required>{t("Name")}</Label>
          <Input value={name} maxLength={120} onChange={(e) => setName(e.target.value)} placeholder="customer-support-backend" />
        </div>

        <div>
          <Label required>{t("Expiration")}</Label>
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
          <Label required>{t("Product access")}</Label>
          <p className="mb-2 text-xs text-muted-foreground">
            {t("Choose at least one product and what the key may do there. It never does more than your own role allows.")}
          </p>

          {products.length === 0 ? (
            <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
              {t("This workspace has no active product yet. Open Smart Infrastructure or Fleet Management once to set it up.")}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {products.map((productKey) => {
                const access = grants[productKey];
                return (
                  <div key={productKey} className={cn("rounded-xl border p-3", access ? "border-primary/40" : "border-border")}>
                    <label className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={!!access}
                        onChange={() => toggleProduct(productKey)}
                      />
                      <span className="text-sm font-medium text-foreground">{t(productName(productKey))}</span>
                    </label>

                    {access && (
                      <div className="mt-3 flex flex-col gap-2 ps-6">
                        <div className="inline-flex w-fit rounded-xl bg-muted p-1">
                          {ACCESS_LEVELS.map((level) => {
                            const allowed = withinCeiling(level.value, role);
                            return (
                              <button
                                key={level.value}
                                type="button"
                                disabled={!allowed}
                                title={allowed ? undefined : t("Your role cannot grant this level.")}
                                onClick={() => setGrants((prev) => ({ ...prev, [productKey]: level.value }))}
                                className={cn(
                                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                                  access === level.value
                                    ? "bg-card text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground",
                                )}
                              >
                                {t(level.label)}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t(ACCESS_LEVELS.find((l) => l.value === access)!.description)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
          {t("The secret will be shown only once. Store it somewhere safe, like a secrets manager.")}
        </p>
      </form>
    </Modal>
  );
}

function SecretOnceDialog({
  created,
  workspaceId,
  onClose,
}: {
  created: CreatedApiKey;
  workspaceId: string;
  onClose: () => void;
}) {
  const t = useShellT();
  const firstProduct = created.key.grants[0]?.productKey ?? "smartFactory";
  return (
    <Modal title={t("API key created")} onClose={onClose} footer={<Button onClick={onClose}>{t("Done")}</Button>}>
      <p className="text-[13.5px] text-muted-foreground">{t("Copy it now. It is not shown again.")}</p>
      <div className="mt-3">
        <CodeBlock code={created.secret} />
      </div>
      <div className="mt-4 text-[13.5px]">
        <p className="font-medium text-foreground">{created.key.name}</p>
        <p className="mt-1 flex flex-wrap gap-1">
          {created.key.grants.map((g) => (
            <Badge key={g.productKey} tone="brand">
              {t(productName(g.productKey))} · {t(ACCESS_LEVELS.find((l) => l.value === g.access)?.label ?? g.access)}
            </Badge>
          ))}
        </p>
      </div>
      <p className="mt-4 text-xs font-medium text-muted-foreground">{t("Try it")}</p>
      <div className="mt-1.5">
        <CodeBlock code={exampleCall(created.secret, workspaceId, firstProduct)} />
      </div>
    </Modal>
  );
}

function KeyDetailDialog({
  apiKey,
  removing,
  onClose,
  onRevoke,
  onRemoveGrant,
}: {
  apiKey: ApiKey;
  removing: boolean;
  onClose: () => void;
  onRevoke: () => void;
  onRemoveGrant: (productKey: string) => void;
}) {
  const t = useShellT();
  const language = useAppLanguage();
  const active = apiKey.status === "ACTIVE";

  return (
    <Modal
      title={apiKey.name}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("Close")}
          </Button>
          <Button variant="danger" onClick={onRevoke} disabled={!active}>
            <Trash2 className="size-4" />
            {t("Revoke")}
          </Button>
        </>
      }
    >
      <div className="text-[13.5px]">
        <Row label={t("Key")} value={<code className="font-mono text-xs" dir="ltr">{apiKey.prefix}</code>} />
        <Row
          label={t("Status")}
          value={
            <Badge tone={active ? "ok" : apiKey.status === "EXPIRED" ? "warn" : "bad"}>{t(apiKey.status.toLowerCase())}</Badge>
          }
        />
        <Row label={t("Created")} value={formatDateTime(apiKey.createdAt, language)} />
        <Row label={t("Created by")} value={apiKey.createdByEmail || "—"} />
        <Row label={t("Last used")} value={apiKey.lastUsedAt ? formatDateTime(apiKey.lastUsedAt, language) : t("Never used")} />
        <Row label={t("Expiration")} value={apiKey.expiresAt ? formatDate(apiKey.expiresAt, language) : t("No expiration")} />
        {apiKey.revokedAt && <Row label={t("Revoked")} value={formatDateTime(apiKey.revokedAt, language)} />}
      </div>

      <h3 className="mt-4 text-sm font-bold text-foreground">{t("Product access")}</h3>
      {apiKey.grants.length === 0 ? (
        <p className="mt-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
          {t("This key has no product access left, so it cannot call anything.")}
        </p>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          {apiKey.grants.map((g) => (
            <div key={g.productKey} className="flex items-center justify-between gap-2 rounded-xl border border-border p-3">
              <span>
                <span className="block text-sm font-medium text-foreground">{t(productName(g.productKey))}</span>
                <span className="block text-xs text-muted-foreground">
                  {t(ACCESS_LEVELS.find((l) => l.value === g.access)?.label ?? g.access)}
                </span>
              </span>
              {/* Removing one product's access is not revoking the key. */}
              {active && (
                <button
                  type="button"
                  disabled={removing}
                  onClick={() => onRemoveGrant(g.productKey)}
                  className="text-xs font-semibold text-destructive hover:underline disabled:opacity-50"
                >
                  {t("Remove access")}
                </button>
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

function RevokeDialog({
  keys,
  pending,
  onCancel,
  onConfirm,
}: {
  keys: ApiKey[];
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = useShellT();
  /* Naming every product a revoke reaches, because a multi-product key going
     away takes more than the product the user happens to be looking at. */
  const products = Array.from(new Set(keys.flatMap((k) => k.grants.map((g) => g.productKey))));

  return (
    <Modal
      title={t("Revoke API key?")}
      onClose={onCancel}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            {t("Cancel")}
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
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
                {t(productName(p))}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
