/* IPv4 addresses and ranges, read strictly, the way Neutron reads them.
 *
 * Addresses are kept as unsigned 32-bit numbers so ranges compare with < and
 * >. "010.0.0.1" and "10.0.0" are refused rather than guessed at.
 */

export function ipToInt(text: string): number | null {
  const parts = text.trim().split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^(0|[1-9]\d{0,2})$/.test(p)) return null;
    const v = Number(p);
    if (v > 255) return null;
    n = n * 256 + v;
  }
  return n >>> 0;
}

export const intToIp = (n: number) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");

export const isIp = (text: string) => ipToInt(text) !== null;

export interface Cidr {
  network: number;
  prefix: number;
  /** The last address, the broadcast one. */
  broadcast: number;
  size: number;
  text: string;
}

/** A CIDR, or why not: "invalid", or the network address it should be
    written as ("10.0.0.5/24" is "10.0.0.0/24"), as Neutron answers. */
export function parseCidr(text: string): Cidr | { invalid: true } | { suggest: string } {
  const m = text.trim().match(/^([\d.]+)\/(\d{1,2})$/);
  if (!m) return { invalid: true };
  const ip = ipToInt(m[1]);
  const prefix = Number(m[2]);
  if (ip === null || prefix > 32) return { invalid: true };
  const size = 2 ** (32 - prefix);
  const network = prefix === 0 ? 0 : (ip & (~0 << (32 - prefix))) >>> 0;
  if (network !== ip) return { suggest: `${intToIp(network)}/${prefix}` };
  return { network, prefix, broadcast: network + size - 1, size, text: `${intToIp(network)}/${prefix}` };
}

export const isCidr = (c: ReturnType<typeof parseCidr>): c is Cidr => "network" in c;

export const inCidr = (c: Cidr, ip: number) => ip >= c.network && ip <= c.broadcast;

export const cidrsOverlap = (a: Cidr, b: Cidr) => a.network <= b.broadcast && b.network <= a.broadcast;

const PRIVATE = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"].map((t) => parseCidr(t) as Cidr);

/** Inside one of the RFC 1918 ranges. */
export const isPrivateCidr = (c: Cidr) => PRIVATE.some((p) => c.network >= p.network && c.broadcast <= p.broadcast);

/** The addresses a server can have: all but the network and broadcast ones. */
export const usableHosts = (c: Cidr) => Math.max(0, c.size - 2);
