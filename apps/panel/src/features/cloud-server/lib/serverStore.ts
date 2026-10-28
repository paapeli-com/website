import { useSyncExternalStore } from "react";
import { ApiError } from "./openstackErrors";

/* The servers this account has, until Cloud Server has an API.
 *
 * The list starts empty (the empty page is a real state, not a mock-up) and
 * each server the create wizard makes is added here, kept in this browser.
 * When the endpoint exists, this module is what it replaces: list, add,
 * update and remove keep the same shape.
 *
 * What a server's own page does is what Nova does to an instance, and the
 * store refuses it the way Nova would:
 *
 *   power       start, stop (soft or hard), reboot (soft or hard)
 *   shelve      the server is put away and its CPU and RAM freed; unshelve
 *               brings it back
 *   resize      to another plan, the boot disk grown to it but never shrunk;
 *               then confirmed, or reverted to the old plan
 *   rebuild     reinstalled from an image; the boot disk is erased
 *   rescue      booted from a rescue image with a one-time root password;
 *               unrescue boots it from its own disk again
 *   password    a new root password, set through the guest agent: only on a
 *               running server
 *   lock        a locked server refuses everything above, and deletion
 *   tags        Nova's tags: up to 50, each 1 to 60 characters, no / or ,
 *   reverse DNS a PTR name for each public address (Designate)
 *
 * Work takes a while: the server is busy until it is done, and Nova answers
 * any other request then with 409 (task_state set). A resized server waits in
 * VERIFY_RESIZE for a confirm or a revert and takes nothing else; a rescued
 * one takes only unrescue; a shelved one only unshelve. Every action is
 * written to the server's activity, as Nova's instance actions are.
 */

export interface ServerEvent {
  id: string;
  at: number;
  /** English source strings; the page translates. */
  action: string;
  details?: string;
  vars?: Record<string, string | number>;
}

export type ServerTask =
  | "powerOn"
  | "powerOff"
  | "reboot"
  | "hardReboot"
  | "shelve"
  | "unshelve"
  | "resize"
  | "revertResize"
  | "rebuild"
  | "rescue"
  | "unrescue"
  | "restore";

export interface ServerRecord {
  id: string;
  /** Which section the server lives in. Both are the same kind of VM
      underneath; a GPU server is listed only under GPU Servers and a cloud
      server only under Cloud Server, so the backend has to tag them. Records
      saved before the tag existed read as "cloud". */
  kind?: "cloud" | "gpu";
  /** "1 × NVIDIA RTX 4080", for a GPU server. */
  gpu?: string;
  /** The account's dedicated server this runs on, if not the shared cloud. */
  hostId?: string;
  hostName?: string;
  /** An instance of an Auto Scale group, listed with the servers but managed
      by its group: never stored here, derived from the group. */
  groupId?: string;
  groupName?: string;
  /** Public addresses beyond the primary: a new one made with the server,
      or a reserved one attached to it (reservedId), which outlives it. */
  extraIps?: { address: string; reservedId?: string }[];
  /** The server's disks, boot first, with where each shows inside it. */
  disks?: { label: string; sizeGb: number; path: string }[];
  /** The SSH key written into it when it was made, if one was. */
  sshKeyId?: string;
  name: string;
  imageId: string;
  /** "Ubuntu 24.04 LTS" */
  image: string;
  planId: string;
  vcpu: number;
  ramGb: number;
  diskGb: number;
  region: string;
  zone: string;
  ipv4: string;
  ipv6?: string;
  powerOn: boolean;
  createdAt: number;
  /** Work under way, and when it is done. */
  task?: { kind: ServerTask; startedAt: number; until: number };
  /** Resized and waiting for a confirm or a revert: the plan it came from. */
  resizedFrom?: { planId: string; vcpu: number; ramGb: number; diskGb: number; gpu?: string };
  /** Booted from a rescue image. */
  rescue?: { image: string; password: string; since: number };
  shelved?: boolean;
  locked?: boolean;
  tags?: string[];
  /** Reverse DNS (PTR) names, by address. */
  ptr?: Record<string, string>;
  /** Newest first. */
  events?: ServerEvent[];
}

export type ServerStatus = "creating" | "running" | "stopped";

/** Where a server stands, finer than its status: what it can be asked now. */
export type ServerPhase = "creating" | "busy" | "verifyResize" | "rescue" | "shelved" | "running" | "stopped";

/** How long a new server reads as being created. */
export const CREATING_MS = 6000;

/** How long each kind of work takes here. */
export const TASK_MS: Record<ServerTask, number> = {
  powerOn: 3000,
  powerOff: 3000,
  reboot: 4000,
  hardReboot: 3000,
  shelve: 6000,
  unshelve: 6000,
  resize: 8000,
  revertResize: 6000,
  rebuild: 8000,
  rescue: 5000,
  unrescue: 4000,
  restore: 8000,
};

export const serverStatus = (s: ServerRecord, now = Date.now()): ServerStatus =>
  now - s.createdAt < CREATING_MS ? "creating" : s.powerOn ? "running" : "stopped";

export const activeTask = (s: ServerRecord, now = Date.now()) => (s.task && now < s.task.until ? s.task : undefined);

export function serverPhase(s: ServerRecord, now = Date.now()): ServerPhase {
  if (now - s.createdAt < CREATING_MS) return "creating";
  if (activeTask(s, now)) return "busy";
  if (s.resizedFrom) return "verifyResize";
  if (s.rescue) return "rescue";
  if (s.shelved) return "shelved";
  return s.powerOn ? "running" : "stopped";
}

export const bootDiskGb = (s: ServerRecord) => s.disks?.[0]?.sizeGb ?? s.diskGb;

const STORAGE_KEY = "paapeli.cloudServer.servers";
const listeners = new Set<() => void>();

function read(): ServerRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ServerRecord[]) : [];
  } catch {
    return [];
  }
}

let cache: ServerRecord[] = read();

function write(next: ServerRecord[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked: the list still holds for this visit */
  }
  listeners.forEach((l) => l());
}

export const addServer = (s: ServerRecord) =>
  write([{ ...s, events: [{ id: eventId(), at: s.createdAt, action: "Server created" }, ...(s.events ?? [])] }, ...cache]);
export const updateServer = (id: string, patch: Partial<ServerRecord>) =>
  write(cache.map((s) => (s.id === id ? { ...s, ...patch } : s)));
export const removeServers = (ids: string[]) => write(cache.filter((s) => !ids.includes(s.id)));
export const getServers = () => cache;

export function useServers(): ServerRecord[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => cache,
    () => cache,
  );
}

/** Addresses from the documentation ranges, so nothing points at a real host. */
export function sampleAddresses(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return {
    ipv4: `203.0.113.${(h % 200) + 20}`,
    ipv6: `2001:db8:${(h % 0xffff).toString(16)}::1`,
  };
}

// ---- Actions ----------------------------------------------------------------------

let seq = 0;
const eventId = () => `sev-${Date.now().toString(36)}-${++seq}`;
/** Activity kept per server. */
const MAX_EVENTS = 100;

const refuse = (status: number, type: string, text = "", vars: Record<string, string | number> = {}): never => {
  throw new ApiError(status, type, text, vars, true);
};

const find = (id: string) => cache.find((s) => s.id === id) ?? refuse(404, "InstanceNotFound");

function patchServer(id: string, fn: (s: ServerRecord) => ServerRecord) {
  write(cache.map((s) => (s.id === id ? fn(s) : s)));
}

/** Writes one line to the server's activity. */
export function logServerEvent(id: string, action: string, details?: string, vars?: Record<string, string | number>) {
  patchServer(id, (s) => ({ ...s, events: [{ id: eventId(), at: Date.now(), action, details, vars }, ...(s.events ?? [])].slice(0, MAX_EVENTS) }));
}

/** Nova's checks before an action: what a locked, busy, resized, rescued or
    shelved server still takes. */
function ready(s: ServerRecord, allowed: ServerPhase[], opts: { ignoreLock?: boolean } = {}) {
  if (s.locked && !opts.ignoreLock) refuse(409, "InstanceIsLocked");
  const phase = serverPhase(s);
  if (!allowed.includes(phase)) refuse(409, "InstanceInvalidState");
}

function start(s: ServerRecord, kind: ServerTask, changes: Partial<ServerRecord>, action: string, details?: string, vars?: Record<string, string | number>) {
  const at = Date.now();
  patchServer(s.id, (x) => ({
    ...x,
    ...changes,
    task: { kind, startedAt: at, until: at + TASK_MS[kind] },
    events: [{ id: eventId(), at, action, details, vars }, ...(x.events ?? [])].slice(0, MAX_EVENTS),
  }));
}

export function powerServer(id: string, on: boolean, hard = false) {
  const s = find(id);
  ready(s, on ? ["stopped"] : ["running"]);
  start(s, on ? "powerOn" : "powerOff", { powerOn: on }, on ? "Powered on" : hard ? "Forced power off" : "Shut down");
}

export function rebootServer(id: string, hard = false) {
  const s = find(id);
  ready(s, hard ? ["running", "stopped"] : ["running"]);
  start(s, hard ? "hardReboot" : "reboot", { powerOn: true }, hard ? "Hard reboot" : "Rebooted");
}

export function shelveServer(id: string) {
  const s = find(id);
  ready(s, ["running", "stopped"]);
  start(s, "shelve", { shelved: true, powerOn: false }, "Shelved");
}

export function unshelveServer(id: string) {
  const s = find(id);
  ready(s, ["shelved"]);
  start(s, "unshelve", { shelved: false, powerOn: true }, "Unshelved");
}

export interface PlanSize {
  id: string;
  vcpu: number;
  ramGb: number;
  diskGb: number;
  gpu?: string;
}

/** To another plan. The boot disk grows to the plan's if that is larger and
    is never shrunk, so a plan with a smaller disk than the server's is
    refused, as Nova refuses it. */
export function resizeServer(id: string, plan: PlanSize) {
  const s = find(id);
  ready(s, ["running", "stopped"]);
  if (plan.id === s.planId) refuse(400, "CannotResizeToSameFlavor");
  const boot = bootDiskGb(s);
  if (plan.diskGb < s.diskGb) refuse(400, "CannotResizeDisk");
  const newBoot = Math.max(boot, plan.diskGb);
  start(
    s,
    "resize",
    {
      resizedFrom: { planId: s.planId, vcpu: s.vcpu, ramGb: s.ramGb, diskGb: s.diskGb, gpu: s.gpu },
      planId: plan.id,
      vcpu: plan.vcpu,
      ramGb: plan.ramGb,
      diskGb: plan.diskGb,
      gpu: plan.gpu ?? s.gpu,
      disks: s.disks ? s.disks.map((d, i) => (i === 0 ? { ...d, sizeGb: newBoot } : d)) : undefined,
      powerOn: true,
    },
    "Plan changed",
    "{from} to {to}",
    { from: s.planId.toUpperCase(), to: plan.id.toUpperCase() },
  );
}

export function confirmResize(id: string) {
  const s = find(id);
  ready(s, ["verifyResize"]);
  patchServer(id, (x) => ({ ...x, resizedFrom: undefined }));
  logServerEvent(id, "Plan change confirmed");
}

/** Back to the old plan. A disk that grew stays grown: Nova cannot shrink it. */
export function revertResize(id: string) {
  const s = find(id);
  ready(s, ["verifyResize"]);
  const from = s.resizedFrom!;
  start(s, "revertResize", { ...from, planId: from.planId, resizedFrom: undefined, powerOn: true }, "Plan change reverted", "back to {plan}", {
    plan: from.planId.toUpperCase(),
  });
}

export function rebuildServer(id: string, image: { imageId: string; label: string }) {
  const s = find(id);
  ready(s, ["running", "stopped"]);
  start(s, "rebuild", { imageId: image.imageId, image: image.label, powerOn: true }, "Rebuilt", "from {image}", { image: image.label });
}

/** Back to a backup or snapshot: a rebuild from its image. */
export function restoreServer(id: string, from: string) {
  const s = find(id);
  ready(s, ["running", "stopped"]);
  start(s, "restore", { powerOn: true }, "Restored", "from {name}", { name: from });
}

/** A root password: 16 characters a person can read back. */
function newPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint32Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export function rescueServer(id: string, image: string): string {
  const s = find(id);
  ready(s, ["running", "stopped"]);
  const password = newPassword();
  start(s, "rescue", { rescue: { image, password, since: Date.now() }, powerOn: true }, "Rescue started", "from {image}", { image });
  return password;
}

export function unrescueServer(id: string) {
  const s = find(id);
  ready(s, ["rescue"]);
  start(s, "unrescue", { rescue: undefined, powerOn: true }, "Rescue ended");
}

/** Through the guest agent, so only on a running server. */
export function changePassword(id: string): string {
  const s = find(id);
  ready(s, ["running"]);
  logServerEvent(id, "Root password reset");
  return newPassword();
}

export function setLocked(id: string, locked: boolean) {
  find(id);
  patchServer(id, (s) => ({ ...s, locked }));
  logServerEvent(id, locked ? "Locked" : "Unlocked");
}

export const SERVER_NAME_RE = /^[a-z][a-z0-9-]{1,61}[a-z0-9]$/;

export function renameServer(id: string, name: string) {
  const s = find(id);
  if (!SERVER_NAME_RE.test(name)) refuse(400, "InvalidInput", "Lowercase letters, digits and hyphens; 3 to 63 characters.");
  if (name === s.name) return;
  patchServer(id, (x) => ({ ...x, name }));
  logServerEvent(id, "Renamed", "{from} to {to}", { from: s.name, to: name });
}

// ---- Tags -------------------------------------------------------------------------

export const MAX_TAGS = 50;
export const MAX_TAG_LENGTH = 60;

/** Why a tag is refused, or nothing: Nova's rules. */
export function tagProblem(tag: string, others: string[]): string | undefined {
  const t = tag.trim();
  if (!t) return "Enter a label.";
  if (t.length > MAX_TAG_LENGTH) return "A label is at most {n} characters.";
  if (/[/,]/.test(t)) return "A label cannot contain / or a comma.";
  if (others.includes(t)) return "This label is already on the server.";
  return undefined;
}

export function setTags(id: string, tags: string[]) {
  find(id);
  if (tags.length > MAX_TAGS) refuse(400, "TooManyTags", "", { n: MAX_TAGS });
  tags.forEach((tag, i) => {
    const problem = tagProblem(tag, tags.slice(0, i));
    if (problem) refuse(400, "InvalidTag", problem, { n: MAX_TAG_LENGTH });
  });
  patchServer(id, (s) => ({ ...s, tags }));
}

// ---- Reverse DNS ------------------------------------------------------------------

const LABEL_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/i;

/** Why a PTR name is refused, or nothing: a full domain name. */
export function ptrProblem(name: string): string | undefined {
  const n = name.trim().replace(/\.$/, "");
  if (!n) return undefined;
  if (n.length > 253) return "A domain name is at most 253 characters.";
  const labels = n.split(".");
  if (labels.length < 2 || !labels.every((l) => LABEL_RE.test(l)) || /^\d+$/.test(labels[labels.length - 1]))
    return "Enter a full domain name, like mail.example.com.";
  return undefined;
}

/** The name a public address answers to; empty puts the default back. */
export function setReverseDns(id: string, address: string, name: string) {
  const s = find(id);
  const n = name.trim().replace(/\.$/, "").toLowerCase();
  const problem = ptrProblem(n);
  if (problem) refuse(400, "InvalidPTR", problem);
  const ptr = { ...(s.ptr ?? {}) };
  if (n) ptr[address] = n;
  else delete ptr[address];
  patchServer(id, (x) => ({ ...x, ptr }));
  logServerEvent(id, "Reverse DNS changed", "{ip} to {name}", { ip: address, name: n || defaultPtr(address) });
}

/** What an address answers to when nothing is set. */
export const defaultPtr = (address: string) =>
  address.includes(":") ? `static.${address.replace(/:+/g, "-")}.clients.paapeli.cloud` : `static.${address.split(".").reverse().join(".")}.clients.paapeli.cloud`;
