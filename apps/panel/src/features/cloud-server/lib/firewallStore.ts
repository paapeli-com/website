import { useSyncExternalStore } from "react";
import { ApiError } from "./openstackErrors";

/* Firewalls, until Cloud Server has an API.
 *
 * What Neutron's security groups give: inbound and outbound rules, each a
 * protocol, a port or range and the addresses it applies to; traffic that
 * matches no inbound rule is dropped, and with no outbound rule the server
 * may reach anywhere. A group is applied to servers, and a server can have
 * several. A group still applied to a server is not deleted (Neutron answers
 * "in use"), and the default group is never deleted or renamed.
 *
 * The server wizard and Auto Scale pick from this list; a new server is
 * applied to the group chosen there. Deleting a server takes it off its
 * groups.
 */

export type RuleProtocol = "tcp" | "udp" | "icmp" | "any";

export const ANY_IPV4 = "0.0.0.0/0";
export const ANY_IPV6 = "::/0";

export interface FirewallRule {
  id: string;
  /** A well-known service (SSH, DNS…) the rule was made from; it sets the
      protocol and the usual port, which can still be changed. */
  service?: string;
  protocol: RuleProtocol;
  /** For TCP and UDP: one port, or the first of a range. */
  portFrom?: number;
  portTo?: number;
  /** Addresses or ranges (CIDR) the rule allows: sources for inbound rules,
      destinations for outbound ones. */
  addresses: string[];
  description?: string;
}

export interface FirewallGroup {
  id: string;
  name: string;
  description?: string;
  inbound: FirewallRule[];
  outbound: FirewallRule[];
  serverIds: string[];
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
}

export const DEFAULT_FIREWALL_ID = "fw-ssh";

let seq = 0;
export const newRuleId = () => `rule-${Date.now().toString(36)}-${++seq}`;
const rule = (protocol: RuleProtocol, port?: number, description?: string): FirewallRule => ({
  id: newRuleId(),
  service: description && description !== "Ping" ? description.toLowerCase() : undefined,
  protocol,
  portFrom: port,
  addresses: [ANY_IPV4, ANY_IPV6],
  description,
});

/* The two the server wizard has always offered, now real groups. */
function seed(): FirewallGroup[] {
  const at = Date.now();
  return [
    {
      id: DEFAULT_FIREWALL_ID,
      name: "default-allow-ssh",
      description: "SSH and ping from anywhere",
      inbound: [rule("tcp", 22, "SSH"), rule("icmp", undefined, "Ping")],
      outbound: [],
      serverIds: [],
      isDefault: true,
      createdAt: at,
      updatedAt: at,
    },
    {
      id: "fw-web",
      name: "web-allow-http-https-ssh",
      description: "Web traffic and SSH",
      inbound: [rule("tcp", 22, "SSH"), rule("tcp", 80, "HTTP"), rule("tcp", 443, "HTTPS")],
      outbound: [],
      serverIds: [],
      createdAt: at,
      updatedAt: at,
    },
  ];
}

const STORAGE_KEY = "paapeli.cloudServer.firewalls";
const listeners = new Set<() => void>();

function read(): FirewallGroup[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return seed();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FirewallGroup[]) : seed();
  } catch {
    return seed();
  }
}

let cache: FirewallGroup[] = read();

function write(next: FirewallGroup[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked: the list still holds for this visit */
  }
  listeners.forEach((l) => l());
}

const patch = (id: string, fn: (g: FirewallGroup) => FirewallGroup) =>
  write(cache.map((g) => (g.id === id ? { ...fn(g), updatedAt: Date.now() } : g)));

export function createFirewall(input: Pick<FirewallGroup, "name" | "description" | "inbound" | "outbound" | "serverIds">): FirewallGroup {
  const at = Date.now();
  const group: FirewallGroup = { id: `fw-${at.toString(36)}`, createdAt: at, updatedAt: at, ...input };
  write([group, ...cache]);
  return group;
}

export const updateFirewall = (id: string, input: Partial<Pick<FirewallGroup, "name" | "description" | "inbound" | "outbound" | "serverIds">>) =>
  patch(id, (g) => ({ ...g, ...input, name: g.isDefault ? g.name : (input.name ?? g.name) }));

/** A copy with the same rules, applied to no server. */
export function duplicateFirewall(id: string, name: string): FirewallGroup | undefined {
  const g = cache.find((x) => x.id === id);
  if (!g) return undefined;
  const fresh = (rules: FirewallRule[]) => rules.map((r) => ({ ...r, id: newRuleId() }));
  return createFirewall({ name, description: g.description, inbound: fresh(g.inbound), outbound: fresh(g.outbound), serverIds: [] });
}

export const attachServer = (groupId: string, serverId: string) =>
  patch(groupId, (g) => ({ ...g, serverIds: g.serverIds.includes(serverId) ? g.serverIds : [...g.serverIds, serverId] }));
export const detachServer = (groupId: string, serverId: string) =>
  patch(groupId, (g) => ({ ...g, serverIds: g.serverIds.filter((s) => s !== serverId) }));
export const setFirewallServers = (groupId: string, serverIds: string[]) => patch(groupId, (g) => ({ ...g, serverIds }));

/** Only groups that are applied to no server, and never the default. */
export function deleteFirewalls(ids: string[]) {
  const doomed = cache.filter((g) => ids.includes(g.id));
  if (doomed.some((g) => g.isDefault)) throw new ApiError(409, "SecurityGroupCannotRemoveDefault", "", {}, true);
  if (doomed.some((g) => g.serverIds.length > 0)) throw new ApiError(409, "SecurityGroupInUse", "", {}, true);
  write(cache.filter((g) => !ids.includes(g.id)));
}

/** The servers are deleted: they come off every group. */
export const releaseServersFromFirewalls = (serverIds: string[]) =>
  write(cache.map((g) => (g.serverIds.some((s) => serverIds.includes(s)) ? { ...g, serverIds: g.serverIds.filter((s) => !serverIds.includes(s)) } : g)));

/** How many groups a server is in; one with none takes no inbound traffic. */
export const groupsOf = (groups: FirewallGroup[], serverId: string) => groups.filter((g) => g.serverIds.includes(serverId));

/** "22, 80, 443/tcp": the inbound ports in a line, for selects. */
export function inboundSummary(g: FirewallGroup) {
  const byProto = new Map<string, string[]>();
  for (const r of g.inbound) {
    if (r.protocol === "icmp" || r.protocol === "any") {
      byProto.set(r.protocol, []);
      continue;
    }
    const port = r.portTo && r.portTo !== r.portFrom ? `${r.portFrom}-${r.portTo}` : String(r.portFrom ?? "");
    byProto.set(r.protocol, [...(byProto.get(r.protocol) ?? []), port]);
  }
  return [...byProto.entries()].map(([p, ports]) => (ports.length ? `${ports.join(", ")}/${p}` : p)).join(" · ");
}

export function useFirewalls(): FirewallGroup[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => cache,
    () => cache,
  );
}
