import type { CurrencyCode } from "@/shared/lib/billingCurrency";

/* What the create wizard offers, until Cloud Server has a backend.
 *
 * None of this comes from an API: the regions, images, plans, keys and
 * firewalls below are the shape the wizard needs, filled with sample values.
 * When the endpoints exist, this file is what they replace.
 *
 * Prices are written per currency rather than converted: the panel never
 * converts money in the client (see shared/lib/billingCurrency.ts), so each
 * plan states what it costs in each currency an account can be billed in.
 */

export type Money = Record<CurrencyCode, number>;

export interface Region {
  id: string;
  /** ISO country code, for the card's outline and flag. */
  country: string;
  /** English names; the page translates them. */
  countryName: string;
  city: string;
  /** What the region is good for, as short tags. */
  tags: string[];
  zones: string[];
}

export const REGIONS: Region[] = [
  { id: "thr-1", country: "IR", countryName: "Iran", city: "Tehran", tags: ["Low latency in Iran"], zones: ["AZ-1"] },
];

export interface OsImage {
  id: string;
  name: string;
  versions: string[];
  /** The distribution's own colour, for its monogram tile. */
  color: string;
  /** Decides how disks are named inside the server and who signs in. */
  family: "linux" | "windows";
}

export const IMAGES: OsImage[] = [
  { id: "ubuntu", name: "Ubuntu", versions: ["24.04 LTS", "22.04 LTS"], color: "#E95420", family: "linux" },
  { id: "debian", name: "Debian", versions: ["13", "12"], color: "#D70A53", family: "linux" },
  { id: "almalinux", name: "AlmaLinux", versions: ["10", "9"], color: "#0F4266", family: "linux" },
  { id: "rocky", name: "Rocky Linux", versions: ["10", "9"], color: "#10B981", family: "linux" },
  { id: "centos", name: "CentOS Stream", versions: ["10", "9"], color: "#932279", family: "linux" },
  { id: "fedora", name: "Fedora", versions: ["43", "42"], color: "#294172", family: "linux" },
  { id: "opensuse", name: "openSUSE Leap", versions: ["16.0", "15.6"], color: "#73BA25", family: "linux" },
  { id: "windows-server", name: "Windows Server", versions: ["2026"], color: "#0078D4", family: "windows" },
  { id: "windows-11", name: "Windows 11", versions: ["Pro"], color: "#0078D4", family: "windows" },
];

/** The account a new server is signed in with. */
export const adminUser = (family: OsImage["family"]) => (family === "windows" ? "Administrator" : "root");

export const DEFAULT_IMAGE = { imageId: "ubuntu", version: "24.04 LTS" };

/** Shared vCPUs, dedicated vCPUs, a GPU attached, or a size carved out of
    one of the account's own dedicated servers ("host": no PLANS of its own,
    it borrows the shared sizes and pays nothing for them). */
export type PlanFamily = "shared" | "dedicated" | "gpu" | "host";

export interface Plan {
  id: string;
  family: PlanFamily;
  vcpu: number;
  ramGb: number;
  /** The boot disk the plan includes; a larger one is billed per extra GB. */
  diskGb: number;
  trafficTb: number;
  /** "1 × NVIDIA RTX 4080": the whole GPU line, for summaries and lists. */
  gpu?: string;
  gpuModel?: string;
  gpuCount?: number;
  /** Memory on each GPU. */
  vramGb?: number;
  /** GPUs are scarce; a plan says whether it can be had right now. */
  availability?: GpuAvailability;
  monthly: Money;
}

export type GpuAvailability = "available" | "limited" | "soldOut";

/* GPU plans: one or more whole NVIDIA cards passed through to the VM, the
   boot disk sized for the drivers, CUDA and a model or two. */
const gpuPlan = (
  id: string,
  gpuModel: string,
  gpuCount: number,
  vramGb: number,
  vcpu: number,
  ramGb: number,
  diskGb: number,
  availability: GpuAvailability,
  monthly: Money,
): Plan => ({
  id,
  family: "gpu",
  vcpu,
  ramGb,
  diskGb,
  trafficTb: 10,
  gpu: `${gpuCount} × NVIDIA ${gpuModel}`,
  gpuModel,
  gpuCount,
  vramGb,
  availability,
  monthly,
});

export const PLANS: Plan[] = [
  { id: "s-1", family: "shared", vcpu: 1, ramGb: 2, diskGb: 25, trafficTb: 1, monthly: { TOMAN: 390_000, USD: 6, QAR: 22 } },
  { id: "s-2", family: "shared", vcpu: 2, ramGb: 4, diskGb: 40, trafficTb: 2, monthly: { TOMAN: 720_000, USD: 12, QAR: 44 } },
  { id: "s-4", family: "shared", vcpu: 4, ramGb: 8, diskGb: 80, trafficTb: 4, monthly: { TOMAN: 1_390_000, USD: 24, QAR: 87 } },
  { id: "s-8", family: "shared", vcpu: 8, ramGb: 16, diskGb: 160, trafficTb: 6, monthly: { TOMAN: 2_690_000, USD: 46, QAR: 168 } },
  { id: "d-2", family: "dedicated", vcpu: 2, ramGb: 8, diskGb: 80, trafficTb: 4, monthly: { TOMAN: 1_850_000, USD: 32, QAR: 117 } },
  { id: "d-4", family: "dedicated", vcpu: 4, ramGb: 16, diskGb: 160, trafficTb: 6, monthly: { TOMAN: 3_590_000, USD: 62, QAR: 226 } },
  { id: "d-8", family: "dedicated", vcpu: 8, ramGb: 32, diskGb: 320, trafficTb: 8, monthly: { TOMAN: 6_990_000, USD: 120, QAR: 437 } },
  gpuPlan("g-4060", "RTX 4060", 1, 8, 8, 32, 100, "available", { TOMAN: 9_900_000, USD: 170, QAR: 620 }),
  gpuPlan("g-4080", "RTX 4080", 1, 16, 12, 48, 150, "available", { TOMAN: 17_900_000, USD: 310, QAR: 1_130 }),
  gpuPlan("g-v100", "V100", 1, 32, 8, 64, 200, "limited", { TOMAN: 21_900_000, USD: 380, QAR: 1_385 }),
  gpuPlan("g-a100", "A100", 1, 80, 16, 128, 300, "limited", { TOMAN: 44_900_000, USD: 780, QAR: 2_840 }),
  gpuPlan("g-a100x2", "A100", 2, 80, 32, 256, 500, "soldOut", { TOMAN: 88_900_000, USD: 1_540, QAR: 5_600 }),
];

export const DEFAULT_PLAN_ID = "s-2";
export const DEFAULT_GPU_PLAN_ID = "g-4060";

/* Dedicated servers: whole physical machines rented by the month, which the
   account then runs its own cloud servers on. Our own sample hardware. */
export interface HostPlan {
  id: string;
  model: string;
  cpu: string;
  cores: number;
  ramGb: number;
  disk: string;
  network: string;
  /** How many cloud servers it can run. */
  maxVms: number;
  availability: GpuAvailability;
  monthly: Money;
}

export const HOST_PLANS: HostPlan[] = [
  {
    id: "h-r650",
    model: "Dell PowerEdge R650",
    cpu: "2 × Xeon Silver 4314",
    cores: 32,
    ramGb: 256,
    disk: "2 × 960 GB NVMe",
    network: "2 × 10 Gbps",
    maxVms: 30,
    availability: "available",
    monthly: { TOMAN: 38_000_000, USD: 650, QAR: 2_370 },
  },
  {
    id: "h-dl380",
    model: "HPE ProLiant DL380 Gen10 Plus",
    cpu: "2 × Xeon Gold 6338",
    cores: 64,
    ramGb: 512,
    disk: "4 × 1.92 TB NVMe",
    network: "2 × 25 Gbps",
    maxVms: 60,
    availability: "available",
    monthly: { TOMAN: 72_000_000, USD: 1_240, QAR: 4_520 },
  },
  {
    id: "h-sr665",
    model: "Lenovo ThinkSystem SR665",
    cpu: "2 × AMD EPYC 7543",
    cores: 64,
    ramGb: 1024,
    disk: "4 × 3.84 TB NVMe",
    network: "2 × 25 Gbps",
    maxVms: 100,
    availability: "limited",
    monthly: { TOMAN: 115_000_000, USD: 1_980, QAR: 7_220 },
  },
];

/** Billing periods, in months, and what each takes off the monthly price. */
export const HOST_PERIODS: { months: 1 | 6 | 12; discount: number }[] = [
  { months: 1, discount: 0 },
  { months: 6, discount: 0.1 },
  { months: 12, discount: 0.2 },
];

/* The price list: every per-unit price the console shows, in one place.
 *
 * Pages never write a price of their own; they read it from here, by key or
 * through the names below. When the billing API exists, it fills this one
 * object (the same keys, a Money per key) and every page follows. Plans and
 * dedicated machines carry their own monthly price above, as catalog items.
 */
export const PRICE_LIST = {
  /** Cloud disks, per GB a month. SSD is also what a server's extra boot
      disk space and its additional disks cost. */
  "disk.ssd.gb": { TOMAN: 3_000, USD: 0.05, QAR: 0.18 },
  "disk.hdd.gb": { TOMAN: 1_200, USD: 0.02, QAR: 0.07 },
  "disk.local.gb": { TOMAN: 2_000, USD: 0.035, QAR: 0.13 },
  /** An additional public IPv4 made with a server, a month. */
  "ip.extra": { TOMAN: 150_000, USD: 3, QAR: 11 },
  /** A floating IP a month, its router's public address included. */
  "ip.floating": { TOMAN: 300_000, USD: 6, QAR: 22 },
  /** Keeping a custom image, per GB a month. */
  "image.gb": { TOMAN: 2_000, USD: 0.03, QAR: 0.11 },
  /** A backup, per GB kept a month. Only the boot disk is backed up, so a
      full backup costs the boot disk's size times its capacity at most. */
  "backup.gb": { TOMAN: 1_500, USD: 0.025, QAR: 0.09 },
  /** A snapshot, per GB a month; it copies the boot disk only. */
  "snapshot.gb": { TOMAN: 1_500, USD: 0.025, QAR: 0.09 },
} satisfies Record<string, Money>;

export type PriceKey = keyof typeof PRICE_LIST;

export const FLOATING_IP_MONTHLY: Money = PRICE_LIST["ip.floating"];
export const EXTRA_IP_MONTHLY: Money = PRICE_LIST["ip.extra"];
export const IMAGE_GB_MONTHLY: Money = PRICE_LIST["image.gb"];
/** Per extra GB of SSD a month, beyond what the plan includes. */
export const DISK_GB_MONTHLY: Money = PRICE_LIST["disk.ssd.gb"];
export const BACKUP_GB_MONTHLY: Money = PRICE_LIST["backup.gb"];
export const SNAPSHOT_GB_MONTHLY: Money = PRICE_LIST["snapshot.gb"];

/** Money as the console shows it: whole thousands of toman, cents otherwise. */
export const roundMoney = (raw: number, currency: CurrencyCode) =>
  currency === "TOMAN" ? Math.round(raw / 1000) * 1000 : Math.round(raw * 100) / 100;

export const BOOT_DISK_MAX_GB = 1_000;
/** A server's additional disks are SSD cloud disks, so they share its limit. */
export const ADDITIONAL_DISK_MAX_GB = 1_000;

/* Cloud disk types. Local is a disk on one of the account's own dedicated
   servers, so it needs one, and attaches only to servers running on it. */
export type DiskTypeId = "ssd" | "hdd" | "local";

export interface DiskType {
  id: DiskTypeId;
  name: string;
  description: string;
  /** A short tag on the type's card. */
  badge: string;
  badgeTone: "ok" | "gray" | "brand";
  minGb: number;
  maxGb: number;
  price: PriceKey;
  /** Whole drives in fixed sizes, offered as cards only, with no slider. */
  fixedSizes?: number[];
  /** What the type delivers: its latency in words, and IOPS and throughput
      that grow with the size up to a ceiling. */
  latency: string;
  iopsPerGb: number;
  maxIops: number;
  mbpsPerGb: number;
  maxMbps: number;
}

export const DISK_TYPES: DiskType[] = [
  {
    id: "ssd",
    name: "SSD",
    description: "Balanced, for most services",
    badge: "Recommended",
    badgeTone: "ok",
    minGb: 10,
    maxGb: 1_000,
    price: "disk.ssd.gb",
    latency: "Low (~1 ms)",
    iopsPerGb: 30,
    maxIops: 20_000,
    mbpsPerGb: 1.5,
    maxMbps: 500,
  },
  {
    id: "hdd",
    name: "HDD",
    description: "Large and economical, for archives and backups",
    badge: "Economical",
    badgeTone: "gray",
    minGb: 50,
    maxGb: 2_000,
    price: "disk.hdd.gb",
    latency: "Medium (~8 ms)",
    iopsPerGb: 3,
    maxIops: 3_000,
    mbpsPerGb: 0.4,
    maxMbps: 180,
  },
  {
    id: "local",
    name: "Local NVMe",
    description: "The fastest, for databases, on your dedicated server",
    badge: "New",
    badgeTone: "brand",
    minGb: 960,
    maxGb: 3_840,
    price: "disk.local.gb",
    fixedSizes: [960, 1_800, 3_840],
    latency: "Very low (<0.2 ms)",
    iopsPerGb: 120,
    maxIops: 150_000,
    mbpsPerGb: 6,
    maxMbps: 3_000,
  },
];

/** What a disk of this type and size delivers. Writes run at four fifths of reads. */
export const diskPerformance = (type: DiskType, gb: number) => {
  const read = Math.min(type.maxMbps, gb * type.mbpsPerGb);
  return { iops: Math.round(Math.min(type.maxIops, gb * type.iopsPerGb)), readMbps: Math.round(read), writeMbps: Math.round(read * 0.8) };
};

/** The sizes offered as one click; each type shows the ones in its range.
    Any other size is on the slider. */
export const DISK_SIZE_PRESETS = [20, 50, 100, 200, 500, 1_000, 2_000];

/** The next sizes up offered when a disk is made larger. */
export const DISK_GROW_SIZES = [50, 100, 200, 500, 1_000, 2_000];

/** A size as people say it: 960 GB, 1 TB, 1.8 TB, 3.8 TB. */
export const sizeParts = (gb: number): { value: number; unit: "GB" | "TB" } =>
  gb >= 1000 ? { value: Math.round(gb / 100) / 10, unit: "TB" } : { value: gb, unit: "GB" };

/** Hours in the month the hourly figure is worked out against. */
export const HOURS_PER_MONTH = 730;

/* SSH keys live in lib/sshKeyStore.ts: the wizards pick from the account's own. */

/* Firewalls live in lib/firewallStore.ts: the wizards pick from the account's own. */

/** No floating IP exists yet in the sample account. */
export const FLOATING_IPS: { id: string; address: string }[] = [];
