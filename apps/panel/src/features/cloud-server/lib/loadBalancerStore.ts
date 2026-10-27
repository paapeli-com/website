import { useSyncExternalStore } from "react";
import { ApiError } from "./openstackErrors";
import { isCidr, parseCidr } from "./ipv4";
import { fixedIpProblem, getNetworks, releaseDevice, renameDevice, reserveAddress, type PrivateNetwork, type Problem } from "./networkStore";
import { getGroups } from "./autoscaleStore";
import { associateFloating, disassociateFloating, getFloatingIps } from "./floatingStore";

/* Load balancers, until Cloud Server has an API.
 *
 * One load balancer is an Octavia load balancer with its address (the VIP)
 * on one of the account's private networks, and an optional floating IP for
 * the internet. What Octavia splits in three (a listener, its default pool
 * and the pool's health monitor) is one traffic rule here: "traffic on this
 * protocol and port goes to these servers on that port". Without L7 policies
 * every listener has exactly one pool, so nothing is lost.
 *
 *   rule          HTTP, HTTPS (passed through, not ended here), TCP or UDP,
 *                 on a port no other rule of the same family uses
 *   pool          round robin, least connections or source IP; session
 *                 persistence by source IP, or by cookie for HTTP
 *   members       servers on the load balancer's network, with a weight
 *                 (0 drains a server) and backup; an Auto Scale group's
 *                 instances join on their own and are listed from the group
 *   monitor       the types Octavia allows for the protocol; the timeout
 *                 no longer than the interval
 *   advanced      connection limit, the listener's timeouts, X-Forwarded-For
 *                 (HTTP) and the address ranges allowed in
 *
 * Every change leaves the load balancer PENDING_UPDATE for a moment, during
 * which Octavia refuses another (ImmutableObject); the store does the same.
 * The region, network and address stay as made.
 */

export type LbProtocol = "HTTP" | "HTTPS" | "TCP" | "UDP";
export type LbAlgorithm = "ROUND_ROBIN" | "LEAST_CONNECTIONS" | "SOURCE_IP";
export type Persistence = "NONE" | "SOURCE_IP" | "HTTP_COOKIE" | "APP_COOKIE";
export type MonitorType = "HTTP" | "HTTPS" | "TLS-HELLO" | "TCP" | "PING" | "UDP-CONNECT";

export const LB_PROTOCOLS: LbProtocol[] = ["HTTP", "HTTPS", "TCP", "UDP"];
export const LB_ALGORITHMS: LbAlgorithm[] = ["ROUND_ROBIN", "LEAST_CONNECTIONS", "SOURCE_IP"];

/** The monitor types Octavia takes for each pool protocol, the usual first. */
export const MONITOR_TYPES: Record<LbProtocol, MonitorType[]> = {
  HTTP: ["HTTP", "TCP", "PING"],
  HTTPS: ["HTTPS", "TLS-HELLO", "TCP", "PING"],
  TCP: ["TCP", "HTTP", "HTTPS", "PING"],
  UDP: ["UDP-CONNECT"],
};

/** Session persistence by cookie needs HTTP; the rest take source IP. */
export const PERSISTENCE_FOR: Record<LbProtocol, Persistence[]> = {
  HTTP: ["NONE", "SOURCE_IP", "HTTP_COOKIE", "APP_COOKIE"],
  HTTPS: ["NONE", "SOURCE_IP"],
  TCP: ["NONE", "SOURCE_IP"],
  UDP: ["NONE", "SOURCE_IP"],
};

export const LB_QUOTA = 10;
export const MAX_RULES = 10;
export const MAX_WEIGHT = 256;
/** How long a change keeps the load balancer busy. */
export const LB_BUSY_MS = 4000;

export interface HealthMonitor {
  enabled: boolean;
  type: MonitorType;
  /** HTTP and HTTPS only. */
  path: string;
  /** HTTP and HTTPS only: "200", "200,202" or "200-204". */
  codes: string;
  /** Seconds between checks. */
  delay: number;
  /** Seconds an answer may take; no longer than the delay. */
  timeout: number;
  /** Successes in a row before a server counts as healthy again. */
  maxRetries: number;
  /** Failures in a row before it counts as down. */
  maxRetriesDown: number;
}

export interface LbMember {
  id: string;
  serverId: string;
  /** 0 to 256; 0 takes no new connections. */
  weight: number;
  /** Gets traffic only when every other server is down. */
  backup: boolean;
}

export interface TrafficRule {
  id: string;
  protocol: LbProtocol;
  /** The port it listens on. */
  port: number;
  /** The port on the servers. */
  targetPort: number;
  algorithm: LbAlgorithm;
  persistence: Persistence;
  /** APP_COOKIE only. */
  cookieName: string;
  members: LbMember[];
  monitor: HealthMonitor;
  /** Null: no limit. */
  connectionLimit: number | null;
  clientTimeoutSec: number;
  memberTimeoutSec: number;
  connectTimeoutSec: number;
  /** X-Forwarded-For and X-Forwarded-Port, HTTP only. */
  forwardedFor: boolean;
  /** Empty: from anywhere. */
  allowedCidrs: string[];
}

export interface LoadBalancerInput {
  name: string;
  description: string;
  region: string;
  networkId: string;
  /** Empty: the next free address on the network. */
  vipAddress: string;
  rules: TrafficRule[];
}

export interface LoadBalancer extends LoadBalancerInput {
  id: string;
  floatingIpId?: string;
  createdAt: number;
  updatedAt: number;
  /** PENDING_* until then. */
  busyUntil: number;
}

export type ProvisioningStatus = "ACTIVE" | "PENDING_CREATE" | "PENDING_UPDATE";
export type MemberStatus = "ONLINE" | "OFFLINE" | "ERROR" | "DRAINING" | "NO_MONITOR";
export type OperatingStatus = "ONLINE" | "DEGRADED" | "ERROR" | "OFFLINE";

export const provisioningStatus = (lb: LoadBalancer, now = Date.now()): ProvisioningStatus =>
  now >= lb.busyUntil ? "ACTIVE" : lb.updatedAt === lb.createdAt ? "PENDING_CREATE" : "PENDING_UPDATE";

/** A member's health, from what the monitor would find on the server. */
export function memberStatus(rule: TrafficRule, server: "creating" | "running" | "stopped" | undefined, weight: number): MemberStatus {
  if (!server) return "ERROR";
  if (weight === 0) return "DRAINING";
  if (!rule.monitor.enabled) return "NO_MONITOR";
  return server === "running" ? "ONLINE" : server === "creating" ? "OFFLINE" : "ERROR";
}

/** The whole from its members: all answering, some, none, or no servers. */
export function operatingStatus(members: MemberStatus[]): OperatingStatus {
  if (members.length === 0) return "OFFLINE";
  const up = members.filter((m) => m === "ONLINE" || m === "NO_MONITOR" || m === "DRAINING").length;
  return up === members.length ? "ONLINE" : up > 0 ? "DEGRADED" : "ERROR";
}

/** "HTTP :80 → :8080" */
export const ruleLabel = (r: Pick<TrafficRule, "protocol" | "port" | "targetPort">) => `${r.protocol} :${r.port} → :${r.targetPort}`;

// ---- Defaults -------------------------------------------------------------------

let seq = 0;
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${++seq}`;

export function defaultMonitor(protocol: LbProtocol): HealthMonitor {
  return {
    enabled: true,
    type: MONITOR_TYPES[protocol][0],
    path: "/",
    codes: "200",
    delay: 5,
    timeout: 5,
    maxRetries: 3,
    maxRetriesDown: 3,
  };
}

export function newRule(existing: TrafficRule[] = [], protocol: LbProtocol = "HTTP"): TrafficRule {
  /* 80, then 443, then 8080 and up: the first port no rule uses. */
  const used = new Set(existing.map((r) => r.port));
  const port = [80, 443, 8080, 8081, 8082, 8083, 8084, 8085].find((p) => !used.has(p)) ?? 9000 + existing.length;
  return {
    id: newId("rule"),
    protocol,
    port,
    targetPort: port,
    algorithm: "ROUND_ROBIN",
    persistence: "NONE",
    cookieName: "",
    members: [],
    monitor: defaultMonitor(protocol),
    connectionLimit: null,
    clientTimeoutSec: 50,
    memberTimeoutSec: 50,
    connectTimeoutSec: 5,
    forwardedFor: protocol === "HTTP",
    allowedCidrs: [],
  };
}

export const newMember = (serverId: string): LbMember => ({ id: newId("member"), serverId, weight: 1, backup: false });

/** Changing a rule's protocol keeps what still fits and resets the rest. */
export function withProtocol(rule: TrafficRule, protocol: LbProtocol): TrafficRule {
  return {
    ...rule,
    protocol,
    persistence: PERSISTENCE_FOR[protocol].includes(rule.persistence) ? rule.persistence : "NONE",
    monitor: MONITOR_TYPES[protocol].includes(rule.monitor.type) ? rule.monitor : { ...rule.monitor, type: MONITOR_TYPES[protocol][0] },
    forwardedFor: protocol === "HTTP" ? rule.forwardedFor : false,
  };
}

/** A new load balancer that can be created as it is: the next free name, the
    region's first private network, and one HTTP rule on port 80. */
export function newLoadBalancerInput(region: string, existing: LoadBalancer[], networks: PrivateNetwork[]): LoadBalancerInput {
  let i = 1;
  while (existing.some((x) => x.name === `lb-${String(i).padStart(2, "0")}`)) i++;
  return {
    name: `lb-${String(i).padStart(2, "0")}`,
    description: "",
    region,
    networkId: networks.find((n) => n.region === region)?.id ?? "",
    vipAddress: "",
    rules: [newRule()],
  };
}

// ---- Checks ---------------------------------------------------------------------

export interface RuleErrors {
  port?: Problem;
  targetPort?: Problem;
  cookie?: Problem;
  path?: Problem;
  codes?: Problem;
  delay?: Problem;
  timeout?: Problem;
  retries?: Problem;
  connectionLimit?: Problem;
  timeouts?: Problem;
  cidrs: (Problem | undefined)[];
  members?: Problem;
  weights: (Problem | undefined)[];
}

export interface LoadBalancerErrors {
  name?: Problem;
  network?: Problem;
  vip?: Problem;
  rules: RuleErrors[];
  rulesAll?: Problem;
}

const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,62}$/;
const CODES_RE = /^[1-5]\d\d(-[1-5]\d\d|(,[1-5]\d\d)*)$/;
const COOKIE_RE = /^[A-Za-z0-9_-]{1,64}$/;
const portOk = (p: number) => Number.isInteger(p) && p >= 1 && p <= 65535;
const between = (v: number, lo: number, hi: number) => Number.isInteger(v) && v >= lo && v <= hi;
const BAD_PORT: Problem = { type: "InvalidInput", text: "Enter a port from 1 to 65535." };

/** UDP and the TCP-based protocols may share a port number; two TCP-based
    rules may not. */
const portFamily = (p: LbProtocol) => (p === "UDP" ? "udp" : "tcp");

export function validateRule(rule: TrafficRule, others: TrafficRule[], network: PrivateNetwork | undefined): RuleErrors {
  const e: RuleErrors = { cidrs: [], weights: [] };
  if (!portOk(rule.port)) e.port = BAD_PORT;
  else if (others.some((o) => o.id !== rule.id && o.port === rule.port && portFamily(o.protocol) === portFamily(rule.protocol)))
    e.port = { type: "DuplicateListenerEntry", text: "Another rule already listens on port {port}.", vars: { port: rule.port } };
  if (!portOk(rule.targetPort)) e.targetPort = BAD_PORT;

  if (rule.persistence === "APP_COOKIE" && !COOKIE_RE.test(rule.cookieName.trim()))
    e.cookie = { type: "InvalidInput", text: "Enter the cookie's name: letters, digits, - or _." };

  const m = rule.monitor;
  if (m.enabled) {
    if (m.type === "HTTP" || m.type === "HTTPS") {
      if (!/^\/\S*$/.test(m.path)) e.path = { type: "InvalidInput", text: "The path starts with / and has no spaces." };
      if (!CODES_RE.test(m.codes.replace(/\s/g, "")))
        e.codes = { type: "InvalidInput", text: "Enter a code like 200, a list like 200,202 or a range like 200-204." };
    }
    if (!between(m.delay, 1, 3600)) e.delay = { type: "InvalidInput", text: "From {min} to {max} seconds.", vars: { min: 1, max: 3600 } };
    if (!between(m.timeout, 1, 3600)) e.timeout = { type: "InvalidInput", text: "From {min} to {max} seconds.", vars: { min: 1, max: 3600 } };
    else if (between(m.delay, 1, 3600) && m.timeout > m.delay)
      e.timeout = { type: "InvalidInput", text: "The timeout cannot be longer than the time between checks." };
    if (!between(m.maxRetries, 1, 10) || !between(m.maxRetriesDown, 1, 10))
      e.retries = { type: "InvalidInput", text: "From {min} to {max} times.", vars: { min: 1, max: 10 } };
  }

  if (rule.connectionLimit !== null && !between(rule.connectionLimit, 1, 1_000_000))
    e.connectionLimit = { type: "InvalidInput", text: "From {min} to {max} connections.", vars: { min: 1, max: 1_000_000 } };
  if (![rule.clientTimeoutSec, rule.memberTimeoutSec, rule.connectTimeoutSec].every((s) => between(s, 1, 86400)))
    e.timeouts = { type: "InvalidInput", text: "From {min} to {max} seconds.", vars: { min: 1, max: 86400 } };

  const seen = new Set<string>();
  rule.allowedCidrs.forEach((c, i) => {
    const parsed = parseCidr(c);
    if ("suggest" in parsed) e.cidrs[i] = { type: "InvalidInput", text: "Write the range as its network address: {suggest}.", vars: { suggest: parsed.suggest } };
    else if (!isCidr(parsed)) e.cidrs[i] = { type: "InvalidInput", text: "Enter a range like 203.0.113.0/24." };
    else if (seen.has(parsed.text)) e.cidrs[i] = { type: "InvalidInput", text: "This range is listed twice." };
    else seen.add(parsed.text);
  });

  const servers = new Set<string>();
  rule.members.forEach((mb, i) => {
    if (!between(mb.weight, 0, MAX_WEIGHT)) e.weights[i] = { type: "InvalidInput", text: "From {min} to {max}.", vars: { min: 0, max: MAX_WEIGHT } };
    if (servers.has(mb.serverId)) e.members = { type: "DuplicateMemberEntry", text: "A server is listed twice in this rule." };
    servers.add(mb.serverId);
    if (network && !network.ports.some((p) => p.serverId === mb.serverId))
      e.members = { type: "InvalidInput", text: "Every server must be on the load balancer's private network." };
  });
  return e;
}

export function validateLoadBalancer(input: LoadBalancerInput, others: LoadBalancer[], creating: boolean): LoadBalancerErrors {
  const e: LoadBalancerErrors = { rules: [] };
  const name = input.name.trim();
  if (!name) e.name = { type: "InvalidInput", text: "Enter a name." };
  else if (!NAME_RE.test(name)) e.name = { type: "InvalidInput", text: "Use letters, digits, dots, hyphens or underscores, starting with a letter or digit." };
  else if (others.some((x) => x.name === name && x.region === input.region))
    e.name = { type: "InvalidInput", text: "A load balancer with this name already exists." };

  const network = getNetworks().find((n) => n.id === input.networkId);
  if (!input.networkId) e.network = { type: "InvalidInput", text: "Choose a private network." };
  else if (!network) e.network = { type: "NetworkNotFound", text: "" };
  else if (creating && input.vipAddress.trim()) e.vip = fixedIpProblem(network, input.vipAddress.trim());

  if (input.rules.length > MAX_RULES) e.rulesAll = { type: "OverQuota", text: "A load balancer can have at most {n} rules.", vars: { n: MAX_RULES } };
  e.rules = input.rules.map((r) => validateRule(r, input.rules, network));
  return e;
}

const ruleProblems = (r: RuleErrors): Problem[] =>
  [r.port, r.targetPort, r.cookie, r.members, ...r.weights, r.path, r.codes, r.delay, r.timeout, r.retries, r.connectionLimit, r.timeouts, ...r.cidrs].filter(
    (p): p is Problem => !!p,
  );

/** Every problem, in the order of the form. */
export const problemsOf = (e: LoadBalancerErrors): Problem[] =>
  [e.name, e.network, e.vip, e.rulesAll].filter((p): p is Problem => !!p).concat(e.rules.flatMap(ruleProblems));

export const ruleHasProblems = (r: RuleErrors | undefined) => !!r && ruleProblems(r).length > 0;

// ---- Store ----------------------------------------------------------------------

const STORAGE_KEY = "paapeli.cloudServer.loadBalancers";
const listeners = new Set<() => void>();

function read(): LoadBalancer[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as LoadBalancer[]) : [];
  } catch {
    return [];
  }
}

let cache: LoadBalancer[] = read();

function write(next: LoadBalancer[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked: the list still holds for this visit */
  }
  listeners.forEach((l) => l());
}

const refuse = (status: number, p: Problem): never => {
  throw new ApiError(status, p.type, p.text, p.vars, true);
};

const find = (id: string) => cache.find((x) => x.id === id) ?? refuse(404, { type: "LoadBalancerNotFound", text: "" });

/** Octavia refuses any change while the last one is still being applied. */
function idle(lb: LoadBalancer) {
  if (Date.now() < lb.busyUntil) refuse(409, { type: "ImmutableObject", text: "" });
}

const clean = (input: LoadBalancerInput): LoadBalancerInput => ({
  ...input,
  name: input.name.trim(),
  description: input.description.trim(),
  vipAddress: input.vipAddress.trim(),
  rules: input.rules.map((r) => ({
    ...r,
    cookieName: r.cookieName.trim(),
    monitor: { ...r.monitor, path: r.monitor.path.trim(), codes: r.monitor.codes.replace(/\s/g, "") },
    allowedCidrs: r.allowedCidrs.map((c) => c.trim()).filter(Boolean),
  })),
});

/** The Auto Scale groups whose instances join this load balancer. */
export const groupsUsing = (lbId: string, ruleId?: string) => getGroups().filter((g) => g.lb?.id === lbId && (!ruleId || g.lb.ruleId === ruleId));

export function createLoadBalancer(raw: LoadBalancerInput): LoadBalancer {
  const input = clean(raw);
  if (cache.length >= LB_QUOTA) refuse(409, { type: "OverQuota", text: "" });
  const first = problemsOf(validateLoadBalancer(input, cache, true))[0];
  if (first) refuse(400, first);
  const at = Date.now();
  const id = `lb-${at.toString(36)}`;
  const port = reserveAddress(input.networkId, { kind: "loadbalancer", id, name: input.name }, input.vipAddress || undefined);
  const lb: LoadBalancer = { ...input, id, vipAddress: port.ip, createdAt: at, updatedAt: at, busyUntil: at + LB_BUSY_MS };
  write([lb, ...cache]);
  return lb;
}

/** The region, network and address stay as made; the rest may change. A
    rule an Auto Scale group's instances are in is not removed. */
export function updateLoadBalancer(id: string, raw: LoadBalancerInput) {
  const current = find(id);
  idle(current);
  const input = { ...clean(raw), region: current.region, networkId: current.networkId, vipAddress: current.vipAddress };
  const first = problemsOf(validateLoadBalancer(input, cache.filter((x) => x.id !== id), false))[0];
  if (first) refuse(400, first);
  const dropped = current.rules.filter((r) => !input.rules.some((n) => n.id === r.id));
  if (dropped.some((r) => groupsUsing(id, r.id).length > 0)) refuse(409, { type: "PoolInUseByGroup", text: "" });
  const at = Date.now();
  write(cache.map((x) => (x.id === id ? { ...x, ...input, updatedAt: at, busyUntil: at + LB_BUSY_MS } : x)));
  if (input.name !== current.name) {
    renameDevice(id, input.name);
    const ip = getFloatingIps().find((f) => f.id === current.floatingIpId);
    if (ip) associateFloating(ip.id, id, input.name, "loadbalancer");
  }
}

/** Deleted with its rules (Octavia's cascade). Its address goes back to the
    network; its public IP stays in the account, unattached. */
export function deleteLoadBalancers(ids: string[]) {
  const targets = cache.filter((x) => ids.includes(x.id));
  targets.forEach(idle);
  if (targets.some((x) => groupsUsing(x.id).length > 0)) refuse(409, { type: "LoadBalancerInUse", text: "" });
  targets.forEach((x) => {
    releaseDevice(x.id);
    if (x.floatingIpId) disassociateFloating(x.floatingIpId);
  });
  write(cache.filter((x) => !ids.includes(x.id)));
}

/** A floating IP on the load balancer's address, moved from wherever it was. */
export function attachPublicIp(lbId: string, floatingId: string) {
  const lb = find(lbId);
  const ip = getFloatingIps().find((f) => f.id === floatingId) ?? refuse(404, { type: "FloatingIPNotFound", text: "" });
  if (ip.region !== lb.region) refuse(400, { type: "InvalidInput", text: "The public IP must be in the load balancer's region." });
  if (lb.floatingIpId && lb.floatingIpId !== floatingId) disassociateFloating(lb.floatingIpId);
  /* Taken from another load balancer: that one loses it. */
  if (ip.attachedTo?.kind === "loadbalancer" && ip.attachedTo.serverId !== lbId)
    write(cache.map((x) => (x.id === ip.attachedTo!.serverId ? { ...x, floatingIpId: undefined } : x)));
  associateFloating(floatingId, lbId, lb.name, "loadbalancer");
  write(cache.map((x) => (x.id === lbId ? { ...x, floatingIpId: floatingId } : x)));
}

export function detachPublicIp(lbId: string) {
  const lb = find(lbId);
  if (lb.floatingIpId) disassociateFloating(lb.floatingIpId);
  write(cache.map((x) => (x.id === lbId ? { ...x, floatingIpId: undefined } : x)));
}

/** The floating IP was detached or deleted on its own page. */
export const forgetPublicIp = (floatingId: string) =>
  write(cache.map((x) => (x.floatingIpId === floatingId ? { ...x, floatingIpId: undefined } : x)));

/** The servers are deleted, or left the network: they leave every pool. */
export function releaseServersFromLoadBalancers(serverIds: string[], networkId?: string) {
  write(
    cache.map((x) =>
      (!networkId || x.networkId === networkId) && x.rules.some((r) => r.members.some((m) => serverIds.includes(m.serverId)))
        ? { ...x, rules: x.rules.map((r) => ({ ...r, members: r.members.filter((m) => !serverIds.includes(m.serverId)) })) }
        : x,
    ),
  );
}

/** The load balancers a server is behind, on any rule. */
export const loadBalancersOf = (all: LoadBalancer[], serverId: string) =>
  all.filter((x) => x.rules.some((r) => r.members.some((m) => m.serverId === serverId)));

export const getLoadBalancers = () => cache;

export function useLoadBalancers(): LoadBalancer[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => cache,
    () => cache,
  );
}
