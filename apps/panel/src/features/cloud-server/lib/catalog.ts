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
  name: string;
  zones: string[];
}

export const REGIONS: Region[] = [{ id: "thr-1", name: "Tehran-1", zones: ["AZ-1"] }];

export interface OsImage {
  id: string;
  name: string;
  versions: string[];
  /** The distribution's own colour, for its monogram tile. */
  color: string;
}

export const IMAGES: OsImage[] = [
  { id: "ubuntu", name: "Ubuntu", versions: ["24.04 LTS", "22.04 LTS"], color: "#E95420" },
  { id: "debian", name: "Debian", versions: ["13", "12"], color: "#A80030" },
  { id: "almalinux", name: "AlmaLinux", versions: ["10", "9"], color: "#0F4266" },
  { id: "rocky", name: "Rocky Linux", versions: ["10", "9"], color: "#10B981" },
  { id: "centos", name: "CentOS Stream", versions: ["10", "9"], color: "#932279" },
  { id: "fedora", name: "Fedora", versions: ["43", "42"], color: "#51A2DA" },
  { id: "opensuse", name: "openSUSE Leap", versions: ["16.0", "15.6"], color: "#73BA25" },
];

export const DEFAULT_IMAGE = { imageId: "ubuntu", version: "24.04 LTS" };

/** Shared vCPUs, dedicated vCPUs, or a GPU attached. */
export type PlanFamily = "shared" | "dedicated" | "gpu";

export interface Plan {
  id: string;
  family: PlanFamily;
  vcpu: number;
  ramGb: number;
  /** The boot disk the plan includes; a larger one is billed per extra GB. */
  diskGb: number;
  trafficTb: number;
  gpu?: string;
  monthly: Money;
}

export const PLANS: Plan[] = [
  { id: "s-1", family: "shared", vcpu: 1, ramGb: 2, diskGb: 25, trafficTb: 1, monthly: { TOMAN: 390_000, USD: 6, QAR: 22 } },
  { id: "s-2", family: "shared", vcpu: 2, ramGb: 4, diskGb: 40, trafficTb: 2, monthly: { TOMAN: 720_000, USD: 12, QAR: 44 } },
  { id: "s-4", family: "shared", vcpu: 4, ramGb: 8, diskGb: 80, trafficTb: 4, monthly: { TOMAN: 1_390_000, USD: 24, QAR: 87 } },
  { id: "s-8", family: "shared", vcpu: 8, ramGb: 16, diskGb: 160, trafficTb: 6, monthly: { TOMAN: 2_690_000, USD: 46, QAR: 168 } },
  { id: "d-2", family: "dedicated", vcpu: 2, ramGb: 8, diskGb: 80, trafficTb: 4, monthly: { TOMAN: 1_850_000, USD: 32, QAR: 117 } },
  { id: "d-4", family: "dedicated", vcpu: 4, ramGb: 16, diskGb: 160, trafficTb: 6, monthly: { TOMAN: 3_590_000, USD: 62, QAR: 226 } },
  { id: "d-8", family: "dedicated", vcpu: 8, ramGb: 32, diskGb: 320, trafficTb: 8, monthly: { TOMAN: 6_990_000, USD: 120, QAR: 437 } },
  { id: "g-1", family: "gpu", vcpu: 8, ramGb: 32, diskGb: 200, trafficTb: 8, gpu: "1 × NVIDIA L4", monthly: { TOMAN: 24_900_000, USD: 430, QAR: 1_565 } },
  { id: "g-2", family: "gpu", vcpu: 16, ramGb: 64, diskGb: 400, trafficTb: 10, gpu: "2 × NVIDIA L4", monthly: { TOMAN: 48_900_000, USD: 845, QAR: 3_075 } },
];

export const DEFAULT_PLAN_ID = "s-2";

/** Per extra GB of SSD a month, beyond what the plan includes. */
export const DISK_GB_MONTHLY: Money = { TOMAN: 3_000, USD: 0.05, QAR: 0.18 };

export const BOOT_DISK_MAX_GB = 1_000;
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
