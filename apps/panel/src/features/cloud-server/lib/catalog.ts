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

/** A floating IP a month, its router's public address included. */
export const FLOATING_IP_MONTHLY: Money = { TOMAN: 300_000, USD: 6, QAR: 22 };

/** An additional public IPv4 made with a server, a month. */
export const EXTRA_IP_MONTHLY: Money = { TOMAN: 150_000, USD: 3, QAR: 11 };

/** Keeping a custom image, per GB a month. */
export const IMAGE_GB_MONTHLY: Money = { TOMAN: 2_000, USD: 0.03, QAR: 0.11 };

/** Per extra GB of SSD a month, beyond what the plan includes. */
export const DISK_GB_MONTHLY: Money = { TOMAN: 3_000, USD: 0.05, QAR: 0.18 };

export const BOOT_DISK_MAX_GB = 1_000;

/** Daily backup, as a share of the server's monthly price with its disks. */
export const BACKUP_RATE = 0.2;
export const ADDITIONAL_DISK_MAX_GB = 4_000;

/** Hours in the month the hourly figure is worked out against. */
export const HOURS_PER_MONTH = 730;

export interface SshKey {
  id: string;
  name: string;
  fingerprint: string;
}

export const SSH_KEYS: SshKey[] = [
  { id: "key-laptop", name: "laptop-key", fingerprint: "SHA256:3f9c…a1e2" },
  { id: "key-ci", name: "ci-deploy", fingerprint: "SHA256:7b02…d4c8" },
];

export interface Firewall {
  id: string;
  name: string;
  /** One line on what it lets through. */
  rules: string;
}

export const FIREWALLS: Firewall[] = [
  { id: "fw-ssh", name: "default-allow-ssh", rules: "22/tcp" },
  { id: "fw-web", name: "web-allow-http-https-ssh", rules: "22, 80, 443/tcp" },
];

export const DEFAULT_FIREWALL_ID = "fw-ssh";

/** No floating IP exists yet in the sample account. */
export const FLOATING_IPS: { id: string; address: string }[] = [];
