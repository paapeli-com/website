import { useLanguage } from "@/features/factory/contexts/LanguageContext";
import { cn } from "@/shared/lib/utils";
import { useT } from "./i18n";
import { groupInstances, type AutoScaleGroup } from "./lib/autoscaleStore";
import type { PrivateNetwork } from "./lib/networkStore";
import { serverStatus, type ServerRecord } from "./lib/serverStore";
import {
  memberStatus,
  type HealthMonitor,
  type LbAlgorithm,
  type LoadBalancer,
  type MemberStatus,
  type OperatingStatus,
  type Persistence,
  type TrafficRule,
} from "./lib/loadBalancerStore";

/* What the load balancer pages, and Auto Scale where it shows one, say about
 * a load balancer: one copy of each label and of who is behind a rule. */

export function useLbText() {
  const t = useT();
  const { formatNumber } = useLanguage();
  const algorithm: Record<LbAlgorithm, string> = {
    ROUND_ROBIN: t("Round robin"),
    LEAST_CONNECTIONS: t("Least connections"),
    SOURCE_IP: t("Source IP"),
  };
  const algorithmHint: Record<LbAlgorithm, string> = {
    ROUND_ROBIN: t("Each server in turn."),
    LEAST_CONNECTIONS: t("The server with the fewest open connections."),
    SOURCE_IP: t("The same visitor always reaches the same server."),
  };
  const persistence: Record<Persistence, string> = {
    NONE: t("None"),
    SOURCE_IP: t("By visitor's address"),
    HTTP_COOKIE: t("By a cookie the load balancer sets"),
    APP_COOKIE: t("By your application's cookie"),
  };
  const operating: Record<OperatingStatus, string> = {
    ONLINE: t("Healthy"),
    DEGRADED: t("Partly down"),
    ERROR: t("Down"),
    OFFLINE: t("No servers"),
  };
  const member: Record<MemberStatus, string> = {
    ONLINE: t("Healthy"),
    OFFLINE: t("Starting"),
    ERROR: t("Not answering"),
    DRAINING: t("Draining"),
    NO_MONITOR: t("Not checked"),
  };
  /** "HTTP GET / every 5 s" */
  const monitor = (m: HealthMonitor) => {
    if (!m.enabled) return t("Off");
    const what = m.type === "HTTP" || m.type === "HTTPS" ? `${m.type} ${m.path}` : m.type;
    return t("{what} every {n} s", { what, n: formatNumber(m.delay) });
  };
  return { algorithm, algorithmHint, persistence, operating, member, monitor };
}

export const OPERATING_TONE: Record<OperatingStatus, string> = {
  ONLINE: "bg-emerald-500",
  DEGRADED: "bg-amber-500",
  ERROR: "bg-red-500",
  OFFLINE: "bg-muted-foreground/50",
};

export const MEMBER_TONE: Record<MemberStatus, string> = {
  ONLINE: "bg-emerald-500",
  OFFLINE: "bg-sky-500",
  ERROR: "bg-red-500",
  DRAINING: "bg-amber-500",
  NO_MONITOR: "bg-muted-foreground/50",
};

export function StatusDot({ tone, label, className }: { tone: string; label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <span className={cn("h-2 w-2 shrink-0 rounded-full", tone)} />
      {label}
    </span>
  );
}

/** The load balancer and rule an Auto Scale group sends its instances to,
    as they are now; the name it was made with for groups from before. */
export function groupLb(g: AutoScaleGroup, lbs: LoadBalancer[]) {
  const lb = g.lb ? lbs.find((x) => x.id === g.lb!.id) : undefined;
  const rule = lb?.rules.find((r) => r.id === g.lb!.ruleId);
  return { lb, rule, name: lb?.name ?? g.loadBalancer };
}

/** One server behind a rule: picked by hand, or an Auto Scale instance. */
export interface MemberRow {
  key: string;
  name: string;
  ip: string;
  weight: number;
  backup: boolean;
  status: MemberStatus;
  server?: ServerRecord;
  group?: AutoScaleGroup;
}

/** Who is behind a rule: the servers picked for it, then the instances of
    every Auto Scale group sending its instances there. */
export function ruleMembers(
  lb: LoadBalancer,
  rule: TrafficRule,
  ctx: { servers: ServerRecord[]; networks: PrivateNetwork[]; groups: AutoScaleGroup[]; now: number },
): MemberRow[] {
  const network = ctx.networks.find((n) => n.id === lb.networkId);
  const picked = rule.members.map((m): MemberRow => {
    const server = ctx.servers.find((s) => s.id === m.serverId);
    return {
      key: m.id,
      name: server?.name ?? "-",
      ip: network?.ports.find((p) => p.serverId === m.serverId)?.ip ?? "-",
      weight: m.weight,
      backup: m.backup,
      status: memberStatus(rule, server ? serverStatus(server, ctx.now) : undefined, m.weight),
      server,
    };
  });
  const scaled = ctx.groups
    .filter((g) => g.lb?.id === lb.id && g.lb.ruleId === rule.id)
    .flatMap((g) =>
      groupInstances(g, ctx.now).map(
        (i): MemberRow => ({
          key: i.id,
          name: i.name,
          ip: i.privateIp,
          weight: 1,
          backup: false,
          status: memberStatus(rule, i.status, 1),
          group: g,
        }),
      ),
    );
  return [...picked, ...scaled];
}
