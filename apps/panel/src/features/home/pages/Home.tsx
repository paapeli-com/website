import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  ChevronRight,
  CircleAlert,
  Cloud,
  Code2,
  MapPin,
  Server,
  Sparkles,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  useGetAssetChildrenQuery,
  useGetAssetRootQuery,
  useGetTenantDevicesQuery,
  useGetWorkspaceAlarmsQueries,
  useListActiveWorkspacesQuery,
  useListWorkspaceProductsQuery,
  type WorkspaceAlarmItem,
} from "@paapeli/api";
import { productKeyFor, solutionPath } from "@paapeli/brand/config";
import { getCurrentUser } from "@paapeli/brand/session";
import { useActiveWorkspaceId } from "@paapeli/brand/workspace";
import { cn } from "@/shared/lib/utils";
import { useShellT } from "@/shared/i18n/shell";
import { isRTLLanguage, localizeDigits, useAppLanguage } from "@/shared/i18n/appLanguage";
import {
  getRecentVisits,
  hasVisitedBefore,
  isEstablishedAccount,
  markVisited,
} from "@/shared/lib/userHistory";
import { Card, IconTile, Pill, PillSkeleton, SectionLabel, Tag } from "@/features/home/ui";
import { WaitlistDialog } from "@/features/home/WaitlistDialog";
import { TopoBackdrop } from "@/shared/components/TopoBackdrop";

/* The account's front door: every product on the account in one place, plus
   what needs looking at right now. Reached at /Home, and where signing in
   lands (see src/login/LoginPage.tsx).
 *
 * Where each figure comes from:
 *   - Assets, locations, trackers and the attention list are the workspace's
 *     own endpoints. A product the workspace isn't subscribed to holds
 *     nothing, and its endpoints 404, so its counts read zero without a
 *     request being made.
 *   - Pending work orders come from the same browser-local store the Smart
 *     Factory pages write to (paapeli.anomalies.workorders.v1). There is no
 *     work-order endpoint on the gateway yet.
 *   - Geofences have no backend and no local store anywhere in the panel yet
 *     (see features/track/data/mockData.ts), so that count is always zero.
 *   - "Recently visited" is recorded by the shell as you navigate, per user
 *     and per browser — see src/shared/lib/userHistory.ts.
 *   - Usage quotas, data ingest and inference tokens are metered nowhere, so
 *     they keep their place in the layout and report no data rather than
 *     showing a plausible-looking figure nobody measured.
 *
 * AI Infra is not in @paapeli/brand/config's PRODUCTS (the header's switcher
 * owns that list), so it is described locally and its cards collect an email
 * instead of navigating.
 */

const FACTORY = "SmartFactory";
const TRACKING = "GPSTracking";

/** How many attention rows fit before the card starts scrolling the rest off. */
const ATTENTION_ROWS = 4;

/* "Needs attention" = an alarm nobody has acknowledged yet. The gateway's
   statuses are ThingsBoard's: ACTIVE_UNACK, ACTIVE_ACK, CLEARED_UNACK,
   CLEARED_ACK, so anything cleared, or already acknowledged, is out. Same
   rule the Smart Factory overview applies to its own attention list. */
const isUnacknowledged = (a: WorkspaceAlarmItem) => {
  const s = a.status?.toUpperCase() ?? "";
  return !s.startsWith("CLEARED") && s !== "ACTIVE_ACK";
};

const isCritical = (a: WorkspaceAlarmItem) => a.severity?.toUpperCase() === "CRITICAL";

/* Work orders live in localStorage, not on the gateway: the Smart Factory
   pages write this key (see features/factory/hooks/useWorkOrders.ts). Read
   by key rather than through that hook, which belongs to another lazy chunk
   and would pull the whole factory feature in behind it. */
const WORK_ORDERS_KEY = "paapeli.anomalies.workorders.v1";

function countPendingWorkOrders(): number {
  try {
    const raw = window.localStorage.getItem(WORK_ORDERS_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return 0;
    return parsed.filter((w) => w?.status === "Open" || w?.status === "In Progress").length;
  } catch {
    return 0;
  }
}

type Waiting = { title: string; tag: string; description: string; icon: LucideIcon; pills: string[] };

/* AI Infra: announced, not shipped. No route, no endpoint, so the cards
   describe the product and their action is inert until there is one. */
const AI_INFRA: Waiting[] = [
  {
    title: "AI Inference",
    tag: "New",
    icon: Server,
    description: "Serve open models behind a managed endpoint. Pay per token, autoscaled.",
    pills: ["OpenAI-compatible API"],
  },
  {
    title: "AI Agent Maker",
    tag: "Phase 2",
    icon: Sparkles,
    description: "Build tool-using agents on your own data and connect them to Paapeli products.",
    pills: ["Visual flow builder", "Runs on AI Inference"],
  },
];

const PLATFORM: { title: string; description: string; icon: LucideIcon; to?: string; href?: string }[] = [
  { title: "Cloud Management", description: "Clusters, storage, billing", icon: Cloud, to: "/CloudManagement" },
  { title: "Dev Center & Help", description: "API keys, docs, support", icon: Code2, href: "https://docs.paapeli.com/" },
  { title: "Members", description: "Invite teammates and manage roles", icon: Users, to: `${solutionPath(FACTORY)}/members` },
];

export default function Home() {
  const navigate = useNavigate();
  const t = useShellT();
  const lang = useAppLanguage();
  const n = (value: number) => localizeDigits(lang, value);

  const user = getCurrentUser();
  const workspaceId = useActiveWorkspaceId() ?? "";

  /* Which products this workspace actually holds. Everything product-scoped
     below is gated on it: those endpoints 404 without a subscription, and
     Home is a catalogue, so unlike ProductGate it must not subscribe on the
     user's behalf just because they looked at the page. */
  const { data: workspaceProducts, isPending: productsPending } = useListWorkspaceProductsQuery(
    workspaceId,
    !!workspaceId,
  );
  const owned = new Set((workspaceProducts ?? []).map((p) => p.productKey));
  /* Until this answers, "not subscribed" and "still asking" look identical,
     and every count below would flash a zero it hasn't confirmed. */
  const subscriptionsUnknown = !workspaceId || productsPending;

  const factoryKey = productKeyFor(FACTORY) ?? "";
  const trackingKey = productKeyFor(TRACKING) ?? "";
  const hasFactory = owned.has(factoryKey);
  const hasTracking = owned.has(trackingKey);

  /* One row is enough: only `totalElements` is read from these. */
  const factoryDevices = useGetTenantDevicesQuery(workspaceId, factoryKey, 0, 1, hasFactory);
  const trackingDevices = useGetTenantDevicesQuery(workspaceId, trackingKey, 0, 1, hasTracking);

  /* The asset hierarchy has no count endpoint; the root's direct children are
     the top-level locations, which is what the card reports. */
  const factoryRoot = useGetAssetRootQuery(workspaceId, factoryKey, hasFactory);
  const factoryLocations = useGetAssetChildrenQuery(
    workspaceId,
    factoryKey,
    factoryRoot.data?.id ?? "",
    0,
    1,
    hasFactory && !!factoryRoot.data?.id,
  );

  /* Alarms for every product the workspace holds. Same query keys the
     header's notifications menu uses, so the two share one fetch. */
  const alarmKeys = [factoryKey, trackingKey].filter((key) => owned.has(key));
  const alarmQueries = useGetWorkspaceAlarmsQueries(workspaceId, alarmKeys, !!workspaceId);
  const alarmsOf = (key: string) => {
    const index = alarmKeys.indexOf(key);
    return index === -1 ? [] : (alarmQueries[index]?.data ?? []);
  };
  const openAlarmsOf = (key: string) => alarmsOf(key).filter(isUnacknowledged).length;

  /* Counts for the product tags. A product the workspace hasn't subscribed to
     holds nothing at all, so it reads zero rather than staying blank — its
     endpoints are never called, since without a subscription they 404. */
  const factoryAssets = hasFactory ? (factoryDevices.data?.totalElements ?? 0) : 0;
  const factoryLocationCount = hasFactory ? (factoryLocations.data?.totalElements ?? 0) : 0;
  const trackerCount = hasTracking ? (trackingDevices.data?.totalElements ?? 0) : 0;
  const [pendingWorkOrders] = useState(countPendingWorkOrders);
  /* Nothing in the panel stores a geofence yet. Kept as a tag so the card
     reads the same once the gateway serves them. */
  const geofenceCount = 0;

  /* The greeting. "Welcome back" has to be earned: this browser has seen the
     user before, or the account itself predates today. Everyone else is new
     and gets "Welcome". Read once on mount, so marking them seen a moment
     later doesn't change the wording under them. */
  const { data: workspaces } = useListActiveWorkspacesQuery(!!workspaceId);
  const [seenBefore] = useState(hasVisitedBefore);
  const establishedAccount = isEstablishedAccount(
    (workspaceProducts ?? []).map((p) => p.createdAt),
  );
  const returning = seenBefore || establishedAccount;
  useEffect(markVisited, []);

  const [recent] = useState(() => getRecentVisits(4));
  const [waitlistFor, setWaitlistFor] = useState<string | null>(null);
  const activeWorkspaceName = workspaces?.find((w) => w.workspaceId === workspaceId)?.workspaceName;

  const productOf = (key: string) => (key === trackingKey ? t("GPS Tracking") : t("Smart Factory"));
  const attention = alarmKeys
    .flatMap((key) => alarmsOf(key).filter(isUnacknowledged).map((alarm) => ({ alarm, key })))
    .sort((a, b) => new Date(b.alarm.createdAt).getTime() - new Date(a.alarm.createdAt).getTime());

  const deviceTotal =
    (hasFactory ? (factoryDevices.data?.totalElements ?? 0) : 0) +
    (hasTracking ? (trackingDevices.data?.totalElements ?? 0) : 0);
  const deviceTotalKnown =
    (hasFactory && factoryDevices.isSuccess) || (hasTracking && trackingDevices.isSuccess);

  const welcome = returning ? t("Welcome back") : t("Welcome");
  const greeting = user?.name ? `${welcome}${isRTLLanguage(lang) ? "، " : ", "}${user.name}` : welcome;

  return (
    /* data-home-page: keeps the designed type scale in Persian and Arabic —
       see the matching block in src/index.css for why it is needed. */
    <div data-home-page className="relative mx-auto w-full max-w-[1340px] px-4 py-8 sm:px-6">
      <TopoBackdrop />

      <div className="relative z-[1]">
        <header className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold leading-tight text-foreground">{greeting}</h1>
          <p className="text-sm text-muted-foreground">
            {t("Pick a product to continue, or activate a new one. Everything on this account lives here.")}
          </p>
        </header>

        <div className="mt-7 grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-6">
            <section className="flex flex-col gap-2.5">
              <SectionLabel>AIoT</SectionLabel>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ProductCard
                  icon={Box}
                  title={t("Smart Factory")}
                  description={t("Assets, alarms, work orders and OTA for production lines.")}
                  action={t("Open")}
                  onAction={() => navigate(`${solutionPath(FACTORY)}/`)}
                  pending={subscriptionsUnknown || (hasFactory && (factoryDevices.isPending || factoryLocations.isPending))}
                  pills={[
                    { text: `${n(factoryAssets)} ${t("assets")}` },
                    { text: `${n(factoryLocationCount)} ${t("locations")}` },
                    {
                      text: `${n(pendingWorkOrders)} ${t("pending orders")}`,
                      tone: pendingWorkOrders > 0 ? ("bad" as const) : ("gray" as const),
                    },
                    openAlarmsOf(factoryKey) > 0 && {
                      text: `${n(openAlarmsOf(factoryKey))} ${t("open alarms")}`,
                      tone: "bad" as const,
                    },
                  ]}
                />
                <ProductCard
                  icon={MapPin}
                  title={t("GPS Tracking")}
                  description={t("Live fleet positions, geofences and trip history.")}
                  action={t("Open")}
                  onAction={() => navigate(`${solutionPath(TRACKING)}/`)}
                  pending={subscriptionsUnknown || (hasTracking && trackingDevices.isPending)}
                  pills={[
                    { text: `${n(trackerCount)} ${t("trackers")}` },
                    { text: `${n(geofenceCount)} ${t("geofences")}` },
                    openAlarmsOf(trackingKey) > 0 && {
                      text: `${n(openAlarmsOf(trackingKey))} ${t("open alarms")}`,
                      tone: "bad" as const,
                    },
                  ]}
                />
              </div>
            </section>

            <section className="flex flex-col gap-2.5">
              <SectionLabel>{t("AI Infra")}</SectionLabel>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {AI_INFRA.map((product, i) => (
                  <ProductCard
                    key={product.title}
                    icon={product.icon}
                    title={t(product.title)}
                    tag={t(product.tag)}
                    /* The first is the one being launched, the second is further
                       out: solid brand edge vs. a dashed outline. */
                    variant={i === 0 ? "featured" : "planned"}
                    description={t(product.description)}
                    action={t("Join waitlist")}
                    onAction={() => setWaitlistFor(product.title)}
                    pills={product.pills.map((text, pi) => ({
                      text: t(text),
                      tone: i === 0 && pi === 0 ? ("brand" as const) : ("gray" as const),
                    }))}
                  />
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-2.5">
              <SectionLabel>{t("Platform")}</SectionLabel>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {PLATFORM.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() =>
                      item.href ? window.open(item.href, "_blank", "noopener,noreferrer") : navigate(item.to!)
                    }
                    className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4 text-start shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/40"
                  >
                    <IconTile icon={item.icon} tone="blue" />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-sm font-semibold text-foreground">{t(item.title)}</span>
                      <span className="truncate text-xs text-muted-foreground">{t(item.description)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-4">
            <Card className="flex flex-col gap-3">
              <h2 className="text-sm font-bold text-foreground">{t("Recently visited")}</h2>
              {recent.length === 0 ? (
                /* A first visit has nothing behind it yet — the shell starts
                   recording from the next page they open. */
                <p className="py-6 text-center text-sm text-muted-foreground">{t("Nothing here yet.")}</p>
              ) : (
                <div className="flex flex-col">
                  {recent.map((visit) => (
                    <button
                      key={visit.path}
                      type="button"
                      onClick={() => navigate(visit.path)}
                      className="-mx-1.5 flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-start transition-colors hover:bg-muted"
                    >
                      <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        {t(visit.title)}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">{t(visit.section)}</span>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            <Card className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-foreground">{t("Needs attention")}</h2>
                {attention.length > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-destructive/10 text-[11px] font-semibold text-destructive">
                    {n(attention.length)}
                  </span>
                )}
              </div>

              {attention.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t("Nothing here yet.")}</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {attention.slice(0, ATTENTION_ROWS).map(({ alarm, key }) => {
                    const critical = isCritical(alarm);
                    const Icon = critical ? CircleAlert : TriangleAlert;
                    return (
                      <button
                        key={alarm.id}
                        type="button"
                        onClick={() =>
                          navigate(key === trackingKey ? `${solutionPath(TRACKING)}/alerts` : `${solutionPath(FACTORY)}/alarms`)
                        }
                        className={cn(
                          "flex items-start gap-2.5 rounded-xl border p-3 text-start transition-colors",
                          critical
                            ? "border-destructive/20 bg-destructive/10 hover:bg-destructive/15"
                            : "border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/15",
                        )}
                      >
                        <Icon className={cn("mt-0.5 size-4 shrink-0", critical ? "text-destructive" : "text-amber-600")} />
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span
                            className={cn(
                              "truncate text-sm font-semibold",
                              critical ? "text-destructive" : "text-foreground",
                            )}
                          >
                            {alarm.alarmName}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {[productOf(key), alarm.deviceName ?? alarm.assetName].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-foreground">{t("Usage this month")}</h2>
                <button
                  type="button"
                  onClick={() => navigate("/CloudManagement/billing")}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  {t("Billing")}
                </button>
              </div>

              {/* Only the device count is metered today. The quota behind it, the
                  ingest volume and the token count have no endpoint, so those
                  meters stay empty instead of being filled in from guesswork. */}
              <UsageRow label={t("Devices")} value={deviceTotalKnown ? n(deviceTotal) : t("No data")} />
              <UsageRow label={t("Data ingest")} value={t("No data")} />
              <UsageRow label={t("Inference tokens")} value={t("Not active")} />
            </Card>
          </aside>
        </div>
      </div>

      {waitlistFor && (
        <WaitlistDialog
          product={waitlistFor}
          workspaceName={activeWorkspaceName}
          onClose={() => setWaitlistFor(null)}
        />
      )}
    </div>
  );
}

function UsageRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted" />
    </div>
  );
}

type CardPill = { text: string; tone?: "gray" | "brand" | "bad" } | false | undefined;

function ProductCard({
  icon,
  title,
  tag,
  description,
  pills,
  pending,
  action,
  onAction,
  variant = "default",
}: {
  icon: LucideIcon;
  title: string;
  tag?: string;
  description: string;
  pills: CardPill[];
  pending?: boolean;
  action: string;
  onAction?: () => void;
  variant?: "default" | "featured" | "planned";
}) {
  const shown = pills.filter(Boolean) as { text: string; tone?: "gray" | "brand" | "bad" }[];

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm transition-colors",
        variant === "featured" && "border-primary/40",
        variant === "planned" && "border-dashed border-border",
        variant === "default" && "border-border hover:border-primary/30",
      )}
    >
      <div className="flex items-start gap-3.5">
        <IconTile icon={icon} />
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {tag && <Tag tone={variant === "featured" ? "brand" : "gray"}>{tag}</Tag>}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>

      {/* Aligned under the title, past the icon tile (40px) and its gap. */}
      {(pending || shown.length > 0) && (
        <div className="ms-[54px] mt-3.5 flex flex-wrap gap-2">
          {pending ? (
            /* One placeholder per tag the card is about to show, so nothing
               shifts sideways when the figures land. */
            Array.from({ length: Math.max(shown.length, 2) }).map((_, i) => <PillSkeleton key={i} />)
          ) : (
            shown.map((pill) => (
              <Pill key={pill.text} tone={pill.tone}>
                {pill.text}
              </Pill>
            ))
          )}
        </div>
      )}

      <div className="mt-auto flex flex-col">
        <div className="mt-5 h-px bg-border" />
        <div className="mt-3.5 flex justify-end">
          {onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              {action}
              <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex h-9 cursor-not-allowed items-center rounded-xl border border-border bg-card px-3.5 text-sm font-semibold text-muted-foreground"
            >
              {action}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
