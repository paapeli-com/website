import napiHttpHandler from '../napiHttpHandler';
import { PaapeliMessage } from '../type';

/* Over-the-air firmware updates: /api/v1/aiot/ota/{workspaceId}/{productKey}.
   A firmware's file becomes a ThingsBoard OTA package; rollouts hand it to
   devices batch by batch and follow what each device reports. */

export type OtaTargetKind = 'DEVICE' | 'GATEWAY';
/** DRAFT before any rollout; ACTIVE while one is under way; else how the newest ended. */
export type OtaFirmwareStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
export type OtaDeploymentStatus =
    | 'AWAITING_APPROVAL'
    | 'SCHEDULED'
    | 'IN_PROGRESS'
    | 'PAUSED'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELLED';
export type OtaTargetGroup = 'ALL' | 'LOCATION' | 'DEVICES';
export type OtaRolloutMode = 'ALL' | 'BATCH';
/** How far a device got in a rollout: PENDING, SENT, then what the device reports. */
export type OtaDeviceState =
    | 'PENDING'
    | 'SENT'
    | 'DOWNLOADING'
    | 'DOWNLOADED'
    | 'VERIFIED'
    | 'UPDATING'
    | 'UPDATED'
    | 'FAILED'
    | 'CANCELLED';
export type OtaDeviceStatus =
    | 'UP_TO_DATE'
    | 'UPDATE_AVAILABLE'
    | 'PENDING'
    | 'UPDATING'
    | 'FAILED'
    | 'UNKNOWN';
export type OtaEventType =
    | 'CREATED'
    | 'APPROVED'
    | 'SCHEDULED'
    | 'STARTED'
    | 'BATCH_SENT'
    | 'DEVICE_UPDATED'
    | 'DEVICE_FAILED'
    | 'DEVICE_RETRIED'
    | 'PAUSED'
    | 'RESUMED'
    | 'RETRIED'
    | 'THRESHOLD_EXCEEDED'
    | 'CANCELLED'
    | 'COMPLETED'
    | 'FAILED';

export interface OtaFirmware {
    id: string;
    name: string;
    version: string;
    deviceType: string;
    targetKind: OtaTargetKind;
    releaseNotes?: string | null;
    isDefault: boolean;
    fileName: string;
    fileSize: number;
    /** SHA-256, hex, computed by the gateway. */
    checksum: string;
    status: OtaFirmwareStatus;
    /** Devices whose newest finished update was to it. */
    installedDevices: number;
    deploymentCount: number;
    /** False once a rollout used it: its file, version and type are fixed. */
    fileReplaceable: boolean;
    createdByUserId?: string | null;
    createdByName?: string | null;
    createdAt: string;
    updatedAt: string;
}

/** Sent as the "metadata" part beside the file. */
export interface OtaFirmwareRequest {
    name: string;
    version: string;
    deviceType: string;
    targetKind: OtaTargetKind;
    releaseNotes?: string | null;
    /** Optional SHA-256 the file must match. */
    checksum?: string | null;
    isDefault: boolean;
}

export interface OtaDeployment {
    id: string;
    /** The firmware's name and version. */
    name: string;
    /** null once the firmware is deleted. */
    firmwareId?: string | null;
    firmwareName: string;
    firmwareVersion: string;
    deviceType: string;
    status: OtaDeploymentStatus;
    targetGroup: OtaTargetGroup;
    assetId?: string | null;
    rolloutMode: OtaRolloutMode;
    batchSize?: number | null;
    failureThresholdPct?: number | null;
    scheduledAt?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
    totalDevices: number;
    updated: number;
    failed: number;
    pending: number;
    /** Sent the firmware and not finished. */
    inFlight: number;
    cancelled: number;
    /** Finished devices (updated or failed) of all of them. */
    progressPct: number;
    approvedByUserId?: string | null;
    createdByUserId?: string | null;
    createdByName?: string | null;
    createdAt: string;
}

export interface OtaCreateDeploymentRequest {
    firmwareId: string;
    targetGroup: OtaTargetGroup;
    /** For LOCATION: its devices and those below it. */
    assetId?: string | null;
    /** For DEVICES: Paapeli device IDs. */
    deviceIds?: string[];
    rolloutMode: OtaRolloutMode;
    batchSize?: number | null;
    failureThresholdPct?: number | null;
    /** ISO time to start; omitted to start now. */
    scheduledAt?: string | null;
}

export interface OtaDeploymentCandidate {
    id: string;
    name: string;
    assetId?: string | null;
    active: boolean;
}

export interface OtaDeploymentDevice {
    id: string;
    name: string;
    state: OtaDeviceState;
    attempts: number;
    lastError?: string | null;
    sentAt?: string | null;
    finishedAt?: string | null;
}

export interface OtaEvent {
    id: string;
    deploymentId: string;
    type: OtaEventType;
    deviceName?: string | null;
    /** For BATCH_SENT. */
    deviceCount?: number | null;
    /** A device's error, or "failed/finished" for THRESHOLD_EXCEEDED. */
    detail?: string | null;
    actorUserId?: string | null;
    /** In a device's history: the rollout's firmware. */
    firmwareName?: string | null;
    firmwareVersion?: string | null;
    createdAt: string;
}

export interface OtaDevice {
    /** The Paapeli device ID. */
    id: string;
    name: string;
    deviceType: string;
    assetId?: string | null;
    active: boolean;
    /** What the device last reported running. */
    currentVersion?: string | null;
    /** Its newest rollout's version, or its type's default. */
    targetVersion?: string | null;
    targetFirmwareId?: string | null;
    status: OtaDeviceStatus;
    state?: OtaDeviceState | null;
    lastError?: string | null;
    deploymentId?: string | null;
    lastUpdated?: string | null;
}

export interface OtaSettings {
    /** New devices start on their type's default firmware. */
    allowAuto: boolean;
    /** A rollout waits for a product admin to approve it. */
    requireApproval: boolean;
    retryFailed: boolean;
    maxRetry: number;
    /** "HH:mm", both null for any time. */
    maintenanceStart?: string | null;
    maintenanceEnd?: string | null;
    /** IANA time zone the window is in. */
    timeZone: string;
    notifySuccess: boolean;
    notifyFailure: boolean;
}

const base = (workspaceId: string, productKey: string) => `/api/v1/aiot/ota/${workspaceId}/${productKey}`;

const firmwareForm = (request: OtaFirmwareRequest, file?: File | null) => {
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (file) form.append('file', file, file.name);
    return form;
};

export const otaService = {
    async listFirmware(workspaceId: string, productKey: string): Promise<OtaFirmware[]> {
        const { data } = await napiHttpHandler.get<OtaFirmware[]>(`${base(workspaceId, productKey)}/firmware`);
        return data;
    },

    async getFirmware(workspaceId: string, productKey: string, firmwareId: string): Promise<OtaFirmware> {
        const { data } = await napiHttpHandler.get<OtaFirmware>(
            `${base(workspaceId, productKey)}/firmware/${firmwareId}`,
        );
        return data;
    },

    async createFirmware(
        workspaceId: string,
        productKey: string,
        request: OtaFirmwareRequest,
        file: File,
    ): Promise<OtaFirmware> {
        const { data } = await napiHttpHandler.post<OtaFirmware>(
            `${base(workspaceId, productKey)}/firmware`,
            firmwareForm(request, file),
        );
        return data;
    },

    /** The file is optional; a new version or type needs one. */
    async updateFirmware(
        workspaceId: string,
        productKey: string,
        firmwareId: string,
        request: OtaFirmwareRequest,
        file?: File | null,
    ): Promise<OtaFirmware> {
        const { data } = await napiHttpHandler.put<OtaFirmware>(
            `${base(workspaceId, productKey)}/firmware/${firmwareId}`,
            firmwareForm(request, file),
        );
        return data;
    },

    async deleteFirmware(workspaceId: string, productKey: string, firmwareId: string): Promise<PaapeliMessage> {
        const { data } = await napiHttpHandler.del<PaapeliMessage>(
            `${base(workspaceId, productKey)}/firmware/${firmwareId}`,
        );
        return data;
    },

    async listDeployments(workspaceId: string, productKey: string): Promise<OtaDeployment[]> {
        const { data } = await napiHttpHandler.get<OtaDeployment[]>(`${base(workspaceId, productKey)}/deployments`);
        return data;
    },

    async previewDeployment(
        workspaceId: string,
        productKey: string,
        request: Pick<OtaCreateDeploymentRequest, 'firmwareId' | 'targetGroup' | 'assetId' | 'deviceIds'>,
    ): Promise<OtaDeploymentCandidate[]> {
        const { data } = await napiHttpHandler.post<OtaDeploymentCandidate[]>(
            `${base(workspaceId, productKey)}/deployments/preview`,
            request,
            { quiet: true },
        );
        return data;
    },

    async createDeployment(
        workspaceId: string,
        productKey: string,
        request: OtaCreateDeploymentRequest,
    ): Promise<OtaDeployment> {
        const { data } = await napiHttpHandler.post<OtaDeployment>(
            `${base(workspaceId, productKey)}/deployments`,
            request,
        );
        return data;
    },

    async deploymentEvents(workspaceId: string, productKey: string, deploymentId: string): Promise<OtaEvent[]> {
        const { data } = await napiHttpHandler.get<OtaEvent[]>(
            `${base(workspaceId, productKey)}/deployments/${deploymentId}/events`,
        );
        return data;
    },

    async deploymentDevices(
        workspaceId: string,
        productKey: string,
        deploymentId: string,
    ): Promise<OtaDeploymentDevice[]> {
        const { data } = await napiHttpHandler.get<OtaDeploymentDevice[]>(
            `${base(workspaceId, productKey)}/deployments/${deploymentId}/devices`,
        );
        return data;
    },

    /** approve needs product admin rights. */
    async deploymentAction(
        workspaceId: string,
        productKey: string,
        deploymentId: string,
        action: 'approve' | 'pause' | 'resume' | 'cancel' | 'retry-failed',
    ): Promise<OtaDeployment> {
        const { data } = await napiHttpHandler.post<OtaDeployment>(
            `${base(workspaceId, productKey)}/deployments/${deploymentId}/${action}`,
        );
        return data;
    },

    async listDevices(workspaceId: string, productKey: string): Promise<OtaDevice[]> {
        const { data } = await napiHttpHandler.get<OtaDevice[]>(`${base(workspaceId, productKey)}/devices`);
        return data;
    },

    /** Rolls a firmware, the type's default unless named, out to one device. */
    async updateDevice(
        workspaceId: string,
        productKey: string,
        deviceId: string,
        firmwareId?: string,
    ): Promise<OtaDeployment> {
        const { data } = await napiHttpHandler.post<OtaDeployment>(
            `${base(workspaceId, productKey)}/devices/${deviceId}/update`,
            firmwareId ? { firmwareId } : {},
        );
        return data;
    },

    async retryDevice(workspaceId: string, productKey: string, deviceId: string): Promise<OtaDeployment> {
        const { data } = await napiHttpHandler.post<OtaDeployment>(
            `${base(workspaceId, productKey)}/devices/${deviceId}/retry`,
        );
        return data;
    },

    /** Newest first. */
    async deviceHistory(workspaceId: string, productKey: string, deviceId: string): Promise<OtaEvent[]> {
        const { data } = await napiHttpHandler.get<OtaEvent[]>(
            `${base(workspaceId, productKey)}/devices/${deviceId}/history`,
        );
        return data;
    },

    async getSettings(workspaceId: string, productKey: string): Promise<OtaSettings> {
        const { data } = await napiHttpHandler.get<OtaSettings>(`${base(workspaceId, productKey)}/settings`);
        return data;
    },

    /** Needs product admin rights. */
    async saveSettings(workspaceId: string, productKey: string, settings: OtaSettings): Promise<OtaSettings> {
        const { data } = await napiHttpHandler.put<OtaSettings>(`${base(workspaceId, productKey)}/settings`, {
            ...settings,
            maintenanceStart: settings.maintenanceStart ?? '',
            maintenanceEnd: settings.maintenanceEnd ?? '',
        });
        return data;
    },
};
