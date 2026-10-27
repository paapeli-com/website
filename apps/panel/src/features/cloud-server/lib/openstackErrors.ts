import { toast } from "@/shared/lib/toast";

/* What the cloud says when it refuses, in words people can act on.
 *
 * OpenStack answers a refusal in a few shapes, one per service:
 *
 *   Neutron   { "NeutronError": { "type": "IpAddressInUse", "message": "…", "detail": "" } }
 *   Nova      { "conflictingRequest": { "code": 409, "message": "Key pair 'a' already exists." } }
 *             (also badRequest, itemNotFound, forbidden, overLimit, computeFault)
 *   Cinder    the same shape as Nova
 *   Keystone  { "error": { "code": 401, "title": "Unauthorized", "message": "…" } }
 *
 * and the gateway may wrap any of them in its problem details, with the
 * service's text in `detail` and its type in `code`. Each refusal is read
 * for a known fault type first (Neutron's type, or the tell-tale words of a
 * Nova or Cinder message), then by HTTP status, so every refusal has a
 * sentence in the person's language and none shows raw English from the
 * cloud. The mock stores throw the same faults, so the pages handle them
 * the same way now as with the API.
 */

/** A refusal, as the stores throw it and as an API response is read into. */
export class ApiError extends Error {
  constructor(
    public status: number,
    /** The fault type: Neutron's, or one named here for Nova and Cinder. */
    public type: string,
    message: string,
    public vars: Record<string, string | number> = {},
    /** Thrown by a store here: the message is a sentence of ours. */
    public local = false,
  ) {
    super(message);
  }
}

type Translate = (text: string, vars?: Record<string, string | number>) => string;

/* Fault types, Neutron's own names where it has one. */
const BY_TYPE: Record<string, string> = {
  // Quotas
  OverQuota: "Your account has reached its limit for this resource. Delete one you no longer need, or ask support to raise the limit.",
  QuotaExceeded: "Your account has reached its limit for this resource. Delete one you no longer need, or ask support to raise the limit.",
  // Networks and subnets
  NetworkInUse: "This network still has servers connected. Disconnect them first.",
  SubnetInUse: "This subnet still has servers connected. Disconnect them first.",
  NetworkNotFound: "This network no longer exists. Refresh the list.",
  SubnetNotFound: "This subnet no longer exists. Refresh the list.",
  PortNotFound: "This connection no longer exists. Refresh the list.",
  IpAddressInUse: "The address {ip} is already used on this network.",
  IpAddressGenerationFailure: "No free address is left in the network's address range.",
  InvalidIpForSubnet: "The address {ip} is not in this network's subnet.",
  GatewayConflictWithAllocationPools: "The gateway address falls inside the DHCP range. Move one of them.",
  GatewayIpInUse: "The gateway address is already used by a server on this network.",
  OverlappingAllocationPools: "Two address ranges overlap.",
  OutOfBoundsAllocationPool: "An address range is outside the subnet.",
  InvalidAllocationPool: "An address range is not valid.",
  HostRoutesExhausted: "A subnet can have at most {n} static routes.",
  DNSNameServersExhausted: "A subnet can have at most {n} DNS servers.",
  DuplicateHostRoute: "Two static routes go to the same destination.",
  InvalidCIDR: "The subnet address is not a valid range.",
  SubnetOverlap: "This range overlaps the subnet of another of your networks. Choose a different range.",
  NotRecommendedCIDR: "Write the subnet as its network address: {suggest}.",
  InvalidMTU: "The MTU must be between {min} and {max}.",
  PortSecurityAndIPRequiredForSecurityGroups: "Port security cannot be turned off while firewalls apply to this connection.",
  // Security groups
  SecurityGroupInUse: "This firewall is still applied to servers. Take it off them first.",
  SecurityGroupCannotRemoveDefault: "The default firewall cannot be deleted.",
  SecurityGroupRuleExists: "This rule already exists.",
  AlreadyConnected: "This server is already connected to this network.",
  // Nova
  KeyPairExists: "A key with this name already exists.",
  InvalidKeypair: "This key was not accepted. Check that it is a whole public key.",
  InstanceInvalidState: "The server is busy with another task. Try again in a moment.",
  InstanceNotFound: "This server no longer exists. Refresh the list.",
  FlavorNotFound: "This plan is not available any more. Choose another one.",
  NoValidHost: "There is no room for this server in the chosen zone right now. Try another plan or zone.",
  // Cinder
  VolumeAttached: "The disk is attached to a server. Detach it first.",
  VolumeInvalidState: "The disk is busy with another task. Try again in a moment.",
  VolumeSizeExceedsQuota: "Your account has reached its storage limit. Delete a disk you no longer need, or ask support to raise the limit.",
  SnapshotInUse: "This snapshot is in use. Delete what was made from it first.",
};

/* Nova and Cinder say what went wrong in the message only. */
const BY_MESSAGE: [RegExp, string][] = [
  [/key ?pair .* already exists/i, "KeyPairExists"],
  [/keypair data is invalid|public key is invalid/i, "InvalidKeypair"],
  [/quota exceeded|exceeded .*quota|over ?quota/i, "OverQuota"],
  [/no valid host/i, "NoValidHost"],
  [/cannot .* while it is in (task_state|vm_state)|instance .* in (task_state|vm_state)/i, "InstanceInvalidState"],
  [/instance .* could not be found/i, "InstanceNotFound"],
  [/flavor .* could not be found/i, "FlavorNotFound"],
  [/volume .* (is )?(still )?attached|status must be available/i, "VolumeAttached"],
  [/invalid volume.*status/i, "VolumeInvalidState"],
  [/security group .* in use/i, "SecurityGroupInUse"],
  /* Neutron: "Invalid input for operation: Requested subnet with cidr: … overlaps with another subnet." */
  [/overlaps with (another subnet|cidr)|cidr .* overlaps/i, "SubnetOverlap"],
];

const BY_STATUS: Record<number, string> = {
  400: "Some values were not accepted. Check the form and try again.",
  401: "Your session has ended. Log in again.",
  403: "You do not have permission to do this.",
  404: "It no longer exists. Refresh the list.",
  409: "This conflicts with what is there now. Refresh the page and try again.",
  413: "Too many requests at once. Wait a moment and try again.",
  429: "Too many requests at once. Wait a moment and try again.",
  500: "Something went wrong on our side. Try again in a few minutes.",
  502: "The cloud service is not responding right now. Try again in a few minutes.",
  503: "The cloud service is not responding right now. Try again in a few minutes.",
  504: "The cloud service took too long to answer. Check the list before trying again.",
};

const OFFLINE = "Could not reach the panel. Check your connection and try again.";

/** Reads any refusal (thrown by a store, or an axios or fetch failure) into
    one ApiError. */
export function readApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  const response = (error as { response?: { status?: number; data?: unknown } })?.response;
  if (!response) {
    /* No answer at all: offline, or the request never left. */
    return new ApiError(0, "Offline", String((error as Error)?.message ?? ""));
  }
  const status = response.status ?? 500;
  let data = response.data as Record<string, unknown> | string | undefined;
  /* The gateway's problem details may carry the service's body as text. */
  if (data && typeof data === "object" && typeof data.detail === "string" && data.detail.trim().startsWith("{")) {
    try {
      data = JSON.parse(data.detail) as Record<string, unknown>;
    } catch {
      /* not JSON after all: read it as words below */
    }
  }
  let type = "";
  let message = "";
  if (typeof data === "string") message = data;
  else if (data) {
    const neutron = data.NeutronError as { type?: string; message?: string } | undefined;
    if (neutron) {
      type = neutron.type ?? "";
      message = neutron.message ?? "";
    } else {
      /* Nova, Cinder, Keystone: one key holding { code, message }. */
      const inner = Object.values(data).find((v) => v && typeof v === "object" && "message" in (v as object)) as
        | { message?: string }
        | undefined;
      message = inner?.message ?? (typeof data.detail === "string" ? data.detail : "") ?? "";
      if (typeof data.code === "string" && BY_TYPE[data.code]) type = data.code;
    }
  }
  if (!BY_TYPE[type]) type = BY_MESSAGE.find(([re]) => re.test(message))?.[1] ?? type;
  /* Neutron puts the address in its message; the sentence wants it. */
  const ip = message.match(/\b\d{1,3}(\.\d{1,3}){3}\b/)?.[0];
  return new ApiError(status, type, message, ip ? { ip } : {});
}

/** The refusal as one sentence in the person's language. */
export function apiErrorText(error: unknown, t: Translate): string {
  const e = readApiError(error);
  if (e.status === 0) return t(OFFLINE);
  const known = BY_TYPE[e.type];
  if (known) return t(known, e.vars);
  if (e.local && e.message) return t(e.message, e.vars);
  return t(BY_STATUS[e.status] ?? (e.status >= 500 ? BY_STATUS[500] : BY_STATUS[400]));
}

/** Runs a call, toasting the refusal if there is one. Resolves to the
    result, or undefined when it was refused. */
export async function apiCall<T>(fn: () => T | Promise<T>, t: Translate): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    toast.error(apiErrorText(error, t));
    return undefined;
  }
}
