import { useSyncExternalStore } from "react";
import { ApiError } from "./openstackErrors";
import { cidrsOverlap, inCidr, intToIp, ipToInt, isCidr, isPrivateCidr, parseCidr, type Cidr } from "./ipv4";

/* Private networks, until Cloud Server has an API.
 *
 * One private network is a Neutron network with one IPv4 subnet:
 *
 *   subnet        a private range (RFC 1918), /16 to /29; fixed once made
 *   gateway       an address in it, or none (gateway_ip null) when one of
 *                 the servers routes for the others
 *   DHCP          enable_dhcp, and the allocation pools servers get their
 *                 address from; the gateway stays outside them
 *   DNS           up to 5 dns_nameservers
 *   static routes up to 20 host_routes, each a destination and a next hop
 *                 inside the subnet
 *   MTU           68 to 1450 (the overlay takes 50 of the 1500)
 *
 * A server joins through a port with an address from the pools, or one
 * chosen, and port security on or off. A network with ports is not deleted
 * (NetworkInUse). Every check is made twice: in the form as it is typed,
 * and here, throwing the fault Neutron would, so a refusal reads the same
 * now as it will from the API.
 */

export const MAX_DNS = 5;
export const MAX_ROUTES = 20;
export const MTU_MIN = 68;
export const MTU_MAX = 1450;
export const PREFIX_MIN = 16;
export const PREFIX_MAX = 29;
export const NETWORK_QUOTA = 10;

export interface AddressRange {
  start: string;
  end: string;
}

export interface HostRoute {
  destination: string;
  nexthop: string;
}

export interface NetworkPort {
  id: string;
  serverId: string;
  ip: string;
  /** Firewalls apply to this connection, and only its own address leaves it. */
  portSecurity: boolean;
}

export interface NetworkInput {
  name: string;
  region: string;
  cidr: string;
  /** Null: no gateway. */
  gatewayIp: string | null;
  dhcp: boolean;
  pools: AddressRange[];
  dns: string[];
  routes: HostRoute[];
  mtu: number;
}

export interface PrivateNetwork extends NetworkInput {
  id: string;
  ports: NetworkPort[];
  createdAt: number;
  updatedAt: number;
}

// ---- Checks ---------------------------------------------------------------------

/** One thing wrong, as a sentence to translate and the fault Neutron names. */
export interface Problem {
  type: string;
  text: string;
  vars?: Record<string, string | number>;
}

export interface NetworkErrors {
  name?: Problem;
  cidr?: Problem;
  gateway?: Problem;
  pools: (Problem | undefined)[];
  poolsAll?: Problem;
  dns: (Problem | undefined)[];
  dnsAll?: Problem;
  routes: { destination?: Problem; nexthop?: Problem }[];
  routesAll?: Problem;
  mtu?: Problem;
}

const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,62}$/;
const BAD_IP: Problem = { type: "InvalidInput", text: "Enter an IPv4 address like 10.0.0.1." };
const EDGE: Problem = { type: "InvalidInput", text: "The network and broadcast addresses cannot be used." };

function readCidr(text: string): Cidr | Problem {
  const c = parseCidr(text);
  if ("suggest" in c) return { type: "NotRecommendedCIDR", text: "Write the subnet as its network address: {suggest}.", vars: { suggest: c.suggest } };
  if (!isCidr(c)) return { type: "InvalidCIDR", text: "Enter a range like 10.0.0.0/24." };
  return c;
}

export function validateNetwork(input: NetworkInput, others: PrivateNetwork[], ports: NetworkPort[] = []): NetworkErrors {
  const e: NetworkErrors = { pools: [], dns: [], routes: [] };

  const name = input.name.trim();
  if (!name) e.name = { type: "InvalidInput", text: "Enter a name." };
  else if (!NAME_RE.test(name))
    e.name = { type: "InvalidInput", text: "Use letters, digits, dots, hyphens or underscores, starting with a letter or digit." };
  else if (others.some((n) => n.name === name && n.region === input.region))
    e.name = { type: "InvalidInput", text: "A network with this name already exists." };

  const c = readCidr(input.cidr);
  let subnet: Cidr | null = null;
  if (!("network" in c)) e.cidr = c;
  else if (!isPrivateCidr(c)) e.cidr = { type: "InvalidInput", text: "Use a private range: 10.0.0.0/8, 172.16.0.0/12 or 192.168.0.0/16." };
  else if (c.prefix < PREFIX_MIN || c.prefix > PREFIX_MAX)
    e.cidr = { type: "InvalidInput", text: "The subnet size must be between /{min} and /{max}.", vars: { min: PREFIX_MIN, max: PREFIX_MAX } };
  else {
    const clash = others.find((n) => n.region === input.region && isCidr(parseCidr(n.cidr)) && cidrsOverlap(c, parseCidr(n.cidr) as Cidr));
    if (clash) e.cidr = { type: "SubnetOverlap", text: "This overlaps {name} ({cidr}). Choose a range that does not.", vars: { name: clash.name, cidr: clash.cidr } };
    else subnet = c;
  }
  /* The rest is checked against the subnet; without one, only its form. */
  const edge = (ip: number) => !!subnet && (ip === subnet.network || ip === subnet.broadcast);

  const ranges: [number, number][] = [];
  input.pools.forEach((p, i) => {
    const s = ipToInt(p.start);
    const en = ipToInt(p.end);
    if (s === null || en === null) e.pools[i] = BAD_IP;
    else if (subnet && (!inCidr(subnet, s) || !inCidr(subnet, en)))
      e.pools[i] = { type: "OutOfBoundsAllocationPool", text: "This range is outside the subnet {cidr}.", vars: { cidr: subnet.text } };
    else if (s > en) e.pools[i] = { type: "InvalidAllocationPool", text: "The first address must come before the last." };
    else if (edge(s) || edge(en)) e.pools[i] = EDGE;
    else if (ranges.some(([a, b]) => s <= b && a <= en)) e.pools[i] = { type: "OverlappingAllocationPools", text: "This range overlaps another one." };
    else ranges.push([s, en]);
  });
  if (input.dhcp && input.pools.length === 0) e.poolsAll = { type: "InvalidAllocationPool", text: "Add at least one address range." };

  if (input.gatewayIp !== null) {
    const g = ipToInt(input.gatewayIp);
    if (g === null) e.gateway = BAD_IP;
    else if (subnet && !inCidr(subnet, g))
      e.gateway = { type: "InvalidIpForSubnet", text: "The address {ip} is not in this network's subnet.", vars: { ip: input.gatewayIp } };
    else if (edge(g)) e.gateway = EDGE;
    else if (ranges.some(([a, b]) => g >= a && g <= b))
      e.gateway = { type: "GatewayConflictWithAllocationPools", text: "The gateway address falls inside the DHCP range. Move one of them." };
    else if (ports.some((p) => p.ip === input.gatewayIp))
      e.gateway = { type: "GatewayIpInUse", text: "The gateway address is already used by a server on this network." };
  }

  const seen = new Set<string>();
  input.dns.forEach((d, i) => {
    if (ipToInt(d) === null) e.dns[i] = BAD_IP;
    else if (seen.has(d)) e.dns[i] = { type: "InvalidInput", text: "This DNS server is listed twice." };
    seen.add(d);
  });
  if (input.dns.length > MAX_DNS) e.dnsAll = { type: "DNSNameServersExhausted", text: "A subnet can have at most {n} DNS servers.", vars: { n: MAX_DNS } };

  const dests = new Set<string>();
  input.routes.forEach((r, i) => {
    const row: { destination?: Problem; nexthop?: Problem } = {};
    const d = readCidr(r.destination);
    if (!("network" in d)) row.destination = d.type === "InvalidCIDR" ? { ...d, text: "Enter a range like 192.168.10.0/24." } : d;
    else if (subnet && d.text === subnet.text) row.destination = { type: "InvalidInput", text: "A route cannot point to this network's own subnet." };
    else if (dests.has(d.text)) row.destination = { type: "DuplicateHostRoute", text: "Two static routes go to the same destination." };
    else dests.add(d.text);
    const h = ipToInt(r.nexthop);
    if (h === null) row.nexthop = BAD_IP;
    else if (subnet && (!inCidr(subnet, h) || edge(h))) row.nexthop = { type: "InvalidInput", text: "The next hop must be an address in this subnet." };
    e.routes[i] = row;
  });
  if (input.routes.length > MAX_ROUTES)
    e.routesAll = { type: "HostRoutesExhausted", text: "A subnet can have at most {n} static routes.", vars: { n: MAX_ROUTES } };

  if (!Number.isInteger(input.mtu) || input.mtu < MTU_MIN || input.mtu > MTU_MAX)
    e.mtu = { type: "InvalidMTU", text: "The MTU must be between {min} and {max}.", vars: { min: MTU_MIN, max: MTU_MAX } };

  return e;
}

/** Every problem, in the order of the form. */
export function problemsOf(e: NetworkErrors): Problem[] {
  return [
    e.name,
    e.cidr,
    e.gateway,
    ...e.pools,
    e.poolsAll,
    ...e.dns,
    e.dnsAll,
    ...e.routes.flatMap((r) => [r.destination, r.nexthop]),
    e.routesAll,
    e.mtu,
  ].filter((p): p is Problem => !!p);
}

/** Whether only the advanced settings (all but name and subnet) are wrong. */
export const advancedProblems = (e: NetworkErrors) => problemsOf({ ...e, name: undefined, cidr: undefined }).length > 0;

// ---- Defaults -------------------------------------------------------------------

/** The gateway, DHCP range and the rest a subnet starts with: the first
    address as gateway, the range from the tenth (on small subnets, the
    second) to the last before broadcast. */
export function defaultsFor(cidr: string): Pick<NetworkInput, "gatewayIp" | "pools"> | null {
  const c = parseCidr(cidr);
  if (!isCidr(c) || c.size < 8) return null;
  const startAt = c.size >= 64 ? 10 : 2;
  return {
    gatewayIp: intToIp(c.network + 1),
    pools: [{ start: intToIp(c.network + startAt), end: intToIp(c.broadcast - 1) }],
  };
}

/** A new network that can be created as it is: the next free name and the
    next 10.x.0.0/24 no other network in the region uses. */
export function newNetworkInput(region: string, existing: PrivateNetwork[]): NetworkInput {
  const here = existing.filter((n) => n.region === region);
  let i = 1;
  while (existing.some((n) => n.name === `network-${String(i).padStart(2, "0")}`)) i++;
  let cidr = "10.0.0.0/24";
  for (let x = 0; x < 256; x++) {
    const candidate = parseCidr(`10.${x}.0.0/24`) as Cidr;
    if (!here.some((n) => isCidr(parseCidr(n.cidr)) && cidrsOverlap(candidate, parseCidr(n.cidr) as Cidr))) {
      cidr = candidate.text;
      break;
    }
  }
  return {
    name: `network-${String(i).padStart(2, "0")}`,
    region,
    cidr,
    dhcp: true,
    dns: ["8.8.8.8", "1.1.1.1"],
    routes: [],
    mtu: MTU_MAX,
    ...defaultsFor(cidr)!,
  };
}

// ---- Store ----------------------------------------------------------------------

const STORAGE_KEY = "paapeli.cloudServer.networks";
const listeners = new Set<() => void>();

function read(): PrivateNetwork[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as PrivateNetwork[]) : [];
  } catch {
    return [];
  }
}

let cache: PrivateNetwork[] = read();

function write(next: PrivateNetwork[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked: the list still holds for this visit */
  }
  listeners.forEach((l) => l());
}

const refuse = (status: number, p: Problem) => {
  throw new ApiError(status, p.type, p.text, p.vars, true);
};

const find = (id: string) => cache.find((n) => n.id === id) ?? refuse(404, { type: "NetworkNotFound", text: "" });

function clean(input: NetworkInput): NetworkInput {
  return {
    ...input,
    name: input.name.trim(),
    cidr: input.cidr.trim(),
    gatewayIp: input.gatewayIp === null ? null : input.gatewayIp.trim(),
    pools: input.pools.map((p) => ({ start: p.start.trim(), end: p.end.trim() })),
    dns: input.dns.map((d) => d.trim()).filter(Boolean),
    routes: input.routes.map((r) => ({ destination: r.destination.trim(), nexthop: r.nexthop.trim() })),
  };
}

export function createNetwork(raw: NetworkInput): PrivateNetwork {
  const input = clean(raw);
  if (cache.length >= NETWORK_QUOTA) refuse(409, { type: "OverQuota", text: "" });
  const first = problemsOf(validateNetwork(input, cache))[0];
  if (first) refuse(400, first);
  const at = Date.now();
  const network: PrivateNetwork = { ...input, id: `net-${at.toString(36)}`, ports: [], createdAt: at, updatedAt: at };
  write([network, ...cache]);
  return network;
}

/** The subnet and region stay as made; the rest may change. */
export function updateNetwork(id: string, raw: NetworkInput) {
  const current = find(id);
  const input = { ...clean(raw), cidr: current.cidr, region: current.region };
  const first = problemsOf(validateNetwork(input, cache.filter((n) => n.id !== id), current.ports))[0];
  if (first) refuse(400, first);
  write(cache.map((n) => (n.id === id ? { ...n, ...input, updatedAt: Date.now() } : n)));
}

export function deleteNetworks(ids: string[]) {
  const busy = cache.find((n) => ids.includes(n.id) && n.ports.length > 0);
  if (busy) refuse(409, { type: "NetworkInUse", text: "" });
  write(cache.filter((n) => !ids.includes(n.id)));
}

/** The next free address in the pools, as Neutron's IPAM gives it. */
function allocate(n: PrivateNetwork): string | null {
  const used = new Set(n.ports.map((p) => p.ip));
  for (const pool of n.pools) {
    const s = ipToInt(pool.start);
    const e = ipToInt(pool.end);
    if (s === null || e === null) continue;
    for (let ip = s; ip <= e; ip++) if (!used.has(intToIp(ip)) && intToIp(ip) !== n.gatewayIp) return intToIp(ip);
  }
  return null;
}

/** Why this address cannot be a server's on this network, or nothing. */
export function fixedIpProblem(n: PrivateNetwork, ip: string): Problem | undefined {
  const v = ipToInt(ip);
  const c = parseCidr(n.cidr) as Cidr;
  if (v === null) return BAD_IP;
  if (!inCidr(c, v)) return { type: "InvalidIpForSubnet", text: "The address {ip} is not in this network's subnet.", vars: { ip } };
  if (v === c.network || v === c.broadcast) return EDGE;
  if (ip === n.gatewayIp) return { type: "IpAddressInUse", text: "This is the network's gateway address." };
  if (n.ports.some((p) => p.ip === ip)) return { type: "IpAddressInUse", text: "The address {ip} is already used on this network.", vars: { ip } };
  return undefined;
}

export function connectServer(networkId: string, serverId: string, fixedIp?: string): NetworkPort {
  const n = find(networkId);
  if (n.ports.some((p) => p.serverId === serverId))
    refuse(409, { type: "AlreadyConnected", text: "This server is already connected to this network." });
  let ip = fixedIp?.trim();
  if (ip) {
    const problem = fixedIpProblem(n, ip);
    if (problem) refuse(problem.type === "IpAddressInUse" ? 409 : 400, problem);
  } else {
    ip = allocate(n) ?? refuse(409, { type: "IpAddressGenerationFailure", text: "" });
  }
  const port: NetworkPort = { id: `port-${Date.now().toString(36)}-${serverId}`, serverId, ip: ip!, portSecurity: true };
  write(cache.map((x) => (x.id === networkId ? { ...x, ports: [...x.ports, port], updatedAt: Date.now() } : x)));
  return port;
}

export function disconnectServer(networkId: string, serverId: string) {
  find(networkId);
  write(cache.map((x) => (x.id === networkId ? { ...x, ports: x.ports.filter((p) => p.serverId !== serverId), updatedAt: Date.now() } : x)));
}

export function setPortSecurity(networkId: string, serverId: string, on: boolean) {
  find(networkId);
  write(
    cache.map((x) =>
      x.id === networkId ? { ...x, ports: x.ports.map((p) => (p.serverId === serverId ? { ...p, portSecurity: on } : p)) } : x,
    ),
  );
}

/** The servers are deleted: their ports go with them. */
export const releaseServersFromNetworks = (serverIds: string[]) =>
  write(cache.map((n) => (n.ports.some((p) => serverIds.includes(p.serverId)) ? { ...n, ports: n.ports.filter((p) => !serverIds.includes(p.serverId)) } : n)));

/** The private networks a server is on, with its address on each. */
export const networksOf = (networks: PrivateNetwork[], serverId: string) =>
  networks.flatMap((n) => n.ports.filter((p) => p.serverId === serverId).map((p) => ({ network: n, port: p })));

/** How many addresses are still free in the pools. */
export function freeAddresses(n: PrivateNetwork) {
  const total = n.pools.reduce((sum, p) => {
    const s = ipToInt(p.start);
    const e = ipToInt(p.end);
    return s === null || e === null ? sum : sum + (e - s + 1);
  }, 0);
  return Math.max(0, total - n.ports.length);
}

export function useNetworks(): PrivateNetwork[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => cache,
    () => cache,
  );
}
