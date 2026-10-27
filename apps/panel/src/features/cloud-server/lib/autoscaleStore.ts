import { useSyncExternalStore } from "react";
import { sampleAddresses } from "./serverStore";
import { intToIp, isCidr, parseCidr } from "./ipv4";

/* Auto Scale groups, until Cloud Server has an API.
 *
 * Shaped on what OpenStack does underneath, and nothing it does not: a Heat
 * AutoScalingGroup holds min, desired and max; each rule is a ScalingPolicy
 * fired by an Aodh alarm on a Gnocchi metric (average CPU or memory over a
 * window) with a cooldown; the load balancer is an Octavia pool the group's
 * members join; a failed instance is replaced on an Aodh alarm, from the
 * instance's own status or from the load balancer's member health check.
 * A rule at a set time is a Mistral cron trigger that changes the group's
 * capacity when it fires.
 *
 * Kept in this browser. Instances are derived from the desired capacity, and
 * the activity log records what happens through the panel.
 */

export type ScalingMode = "automatic" | "manual";
export type Metric = "cpu" | "memory";
export type HealthSource = "infra" | "lb";

/** The load balancer's health check, Octavia's health monitor field for
    field: what it asks, and when an answer counts as healthy. */
export interface HealthCheck {
  protocol: "HTTP" | "HTTPS" | "TCP";
  port: number;
  /** HTTP and HTTPS only. */
  path: string;
  /** Answers that count as healthy, HTTP and HTTPS only: "200" or "200-299". */
  codes: string;
  intervalSec: number;
  timeoutSec: number;
  /** Failures in a row before the instance counts as failed. */
  unhealthyAfter: number;
  /** Successes in a row before it counts as healthy again. */
  healthyAfter: number;
}

export const DEFAULT_CHECK: HealthCheck = {
  protocol: "HTTP",
  port: 80,
  path: "/health",
  codes: "200",
  intervalSec: 10,
  timeoutSec: 5,
  unhealthyAfter: 3,
  healthyAfter: 2,
};

export interface ScalingRule {
  id: string;
  /** At a set time, or on a metric: out above the threshold, in below. */
  direction: "schedule" | "out" | "in";
  /** For a scheduled rule: when, "HH:MM", and on which days. */
  time?: string;
  repeat?: "daily" | "once";
  /** For a one-off scheduled rule, "YYYY-MM-DD". */
  date?: string;
  /** For a scheduled rule: add or remove the step. */
  scheduleAction?: "add" | "remove";
  metric: Metric;
  /** Percent. Out fires above it, in below it. */
  threshold: number;
  /** Minutes the condition has to hold. */
  durationMin: number;
  /** Instances added or removed. */
  step: number;
}

export type EventType = "created" | "scaleOut" | "scaleIn" | "manual" | "edited" | "repair";

export interface GroupEvent {
  id: string;
  at: number;
  type: EventType;
  /** English source strings; the page translates. */
  trigger: string;
  details: string;
  /** Values for the details' {placeholders}. */
  vars?: Record<string, string | number>;
  ok: boolean;
}

export interface AutoScaleGroup {
  id: string;
  name: string;
  region: string;
  zone: string;
  mode: ScalingMode;
  imageId: string;
  image: string;
  planId: string;
  vcpu: number;
  ramGb: number;
  diskGb: number;
  firewall: string;
  min: number;
  desired: number;
  max: number;
  cooldownMin: number;
  rules: ScalingRule[];
  /** An Octavia load balancer's name, or none. */
  loadBalancer?: string;
  /** The load balancer and the traffic rule (its listener and pool) the
      instances join as members. Groups made before load balancers were
      real carry the name only. */
  lb?: { id: string; ruleId: string };
  /** The private network the instances are on, as it was when chosen. */
  network?: { id: string; name: string; cidr: string };
  health: { source: HealthSource; autoReplace: boolean; graceMin: number; check?: HealthCheck };
  /** Text these workspace members when the group scales out or in. Sent by
      the gateway's SMS channel, to verified phones only. */
  notify?: { sms: boolean; userIds: string[] };
  paused: boolean;
  createdAt: number;
  /** When the desired capacity last changed; new instances read as being
      created for a few seconds after. */
  changedAt: number;
  events: GroupEvent[];
}

export interface Instance {
  id: string;
  name: string;
  status: "creating" | "running";
  privateIp: string;
  publicIp: string;
  createdAt: number;
}

export type GroupHealth = "healthy" | "scaling";

/** How long a new instance reads as being created. */
export const INSTANCE_CREATING_MS = 6000;

export const DEFAULT_RULES: ScalingRule[] = [
  { id: "r-out", direction: "out", metric: "cpu", threshold: 70, durationMin: 5, step: 1 },
  { id: "r-in", direction: "in", metric: "cpu", threshold: 30, durationMin: 10, step: 1 },
];

/** The group's instances: one per unit of desired capacity. Those added by
    the latest change are still being created for a few seconds. */
export function groupInstances(g: AutoScaleGroup, now = Date.now()): Instance[] {
  const fresh = now - g.changedAt < INSTANCE_CREATING_MS;
  return Array.from({ length: g.desired }, (_, i) => {
    const id = `${g.id}-i${i + 1}`;
    const addr = sampleAddresses(id);
    const isNew = fresh && i >= g.desired - newCount(g);
    return {
      id,
      name: `${g.name}-${String(i + 1).padStart(2, "0")}`,
      status: isNew ? ("creating" as const) : ("running" as const),
      privateIp: instanceIp(g, i),
      publicIp: addr.ipv4,
      createdAt: isNew ? g.changedAt : g.createdAt,
    };
  });
}

/** An instance's address: from its private network's range when it has
    one, counting down from the top, away from the servers DHCP gives the
    first addresses to. */
function instanceIp(g: AutoScaleGroup, i: number) {
  const c = g.network ? parseCidr(g.network.cidr) : null;
  return c && isCidr(c) ? intToIp(c.broadcast - 1 - i) : `10.0.1.${11 + i}`;
}

/** How many instances the latest change added (0 when it removed some). */
function newCount(g: AutoScaleGroup) {
  const last = g.events.find((e) => e.type === "scaleOut" || e.type === "manual" || e.type === "created");
  const added = Number(last?.vars?.added ?? 0);
  return Math.max(0, added);
}

export const runningCount = (g: AutoScaleGroup, now = Date.now()) =>
  groupInstances(g, now).filter((i) => i.status === "running").length;

export const groupHealth = (g: AutoScaleGroup, now = Date.now()): GroupHealth =>
  runningCount(g, now) < g.desired ? "scaling" : "healthy";

const STORAGE_KEY = "paapeli.cloudServer.autoscale";
const listeners = new Set<() => void>();

function read(): AutoScaleGroup[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as AutoScaleGroup[]) : [];
  } catch {
    return [];
  }
}

let cache: AutoScaleGroup[] = read();

function write(next: AutoScaleGroup[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked: the list still holds for this visit */
  }
  listeners.forEach((l) => l());
}

const eventId = () => `ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export function addGroup(g: Omit<AutoScaleGroup, "id" | "createdAt" | "changedAt" | "events" | "paused">) {
  const now = Date.now();
  const group: AutoScaleGroup = {
    ...g,
    id: `asg-${now.toString(36)}`,
    paused: false,
    createdAt: now,
    changedAt: now,
    events: [
      {
        id: eventId(),
        at: now,
        type: "created",
        trigger: "Created in the panel",
        details: "Started {added} instances",
        vars: { added: g.desired },
        ok: true,
      },
    ],
  };
  write([group, ...cache]);
  return group;
}

const patch = (id: string, fn: (g: AutoScaleGroup) => AutoScaleGroup) => write(cache.map((g) => (g.id === id ? fn(g) : g)));

/** Set the desired capacity by hand, within min and max. */
export function setDesired(id: string, desired: number) {
  patch(id, (g) => {
    const next = Math.min(g.max, Math.max(g.min, desired));
    if (next === g.desired) return g;
    const now = Date.now();
    const added = next - g.desired;
    return {
      ...g,
      desired: next,
      changedAt: now,
      events: [
        {
          id: eventId(),
          at: now,
          type: added > 0 ? "manual" : "scaleIn",
          trigger: "Manual change",
          details: added > 0 ? "Added {n} instances, {from} to {to}" : "Removed {n} instances, {from} to {to}",
          vars: { n: Math.abs(added), from: g.desired, to: next, added: Math.max(0, added) },
          ok: true,
        },
        ...g.events,
      ],
    };
  });
}

/** Any change of settings, logged once. */
export function updateGroup(id: string, changes: Partial<AutoScaleGroup>, details: string, vars?: Record<string, string | number>) {
  patch(id, (g) => {
    const next = { ...g, ...changes };
    /* Capacity bounds pull the desired count inside them. */
    next.desired = Math.min(next.max, Math.max(next.min, next.desired));
    const now = Date.now();
    const added = next.desired - g.desired;
    return {
      ...next,
      changedAt: added !== 0 ? now : g.changedAt,
      events: [
        { id: eventId(), at: now, type: "edited", trigger: "Changed in the panel", details, vars: { ...vars, added: Math.max(0, added) }, ok: true },
        ...g.events,
      ],
    };
  });
}

/** Read outside React, for the checks other stores make. */
export const getGroups = () => cache;

export const removeGroups = (ids: string[]) => write(cache.filter((g) => !ids.includes(g.id)));

export function useGroups(): AutoScaleGroup[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => cache,
    () => cache,
  );
}
