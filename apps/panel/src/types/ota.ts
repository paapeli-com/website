export type FirmwareStatus = "draft" | "testing" | "released" | "deprecated";
export type RolloutStrategy = "immediate" | "staged" | "canary" | "scheduled";
export type RolloutStatus = "scheduled" | "in_progress" | "paused" | "completed" | "failed" | "rolled_back";
export type DeviceUpdateStatus = "pending" | "downloading" | "installing" | "success" | "failed" | "skipped";

export interface FirmwareVersion {
  id: string;
  name: string;
  version: string;
  deviceType: string;
  size: string; // e.g. "2.4 MB"
  sizeBytes: number;
  releaseDate: string; // ISO
  status: FirmwareStatus;
  signed: boolean;
  checksum: string;
  changelog: string[];
  author: string;
  installedCount: number;
  successRate: number; // 0..100
  // performance benchmarks gathered post-deployment
  metrics: {
    avgLatencyMs: number;
    avgPowerMw: number;
    crashRatePct: number;
    uptimePct: number;
    dataAccuracyPct: number;
  };
}

export interface OtaDevice {
  id: string;
  name: string;
  deviceType: string;
  locationName: string;
  currentVersion: string;
  targetVersion?: string;
  status: DeviceUpdateStatus | "up_to_date";
  lastUpdate: string;
  battery?: number;
  online: boolean;
}

export interface Rollout {
  id: string;
  name: string;
  firmwareId: string;
  firmwareVersion: string;
  deviceType: string;
  strategy: RolloutStrategy;
  status: RolloutStatus;
  createdAt: string;
  scheduledAt?: string;
  completedAt?: string;
  totalDevices: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  progressPct: number;
  author: string;
  targetLocations: string[];
  batchSize?: number;
  canaryPct?: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  action: string; // released / rollout_started / rollout_completed / rolled_back / deprecated
  firmwareVersion: string;
  deviceType: string;
  affectedDevices: number;
  author: string;
  notes?: string;
}
