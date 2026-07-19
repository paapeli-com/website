import napiHttpHandler from '../napiHttpHandler';
import { EntityId, PageResponse, PaapeliMessage } from '../type';

export type DeviceCredentialType =
    | 'ACCESS_TOKEN'
    | 'X509_CERTIFICATE'
    | 'MQTT_BASIC'
    | 'LWM2M_CREDENTIALS';

export type DeviceActivityType =
    | 'DEVICE_REGISTERED'
    | 'DEVICE_UPDATED'
    | 'DEVICE_ASSIGNED'
    | 'DEVICE_UNASSIGNED'
    | 'DEVICE_DELETED'
    | 'DEVICE_ACTIVATED'
    | 'DEVICE_INACTIVATED'
    | 'COMMAND_SENT'
    | 'COMMAND_SUCCEEDED'
    | 'COMMAND_FAILED'
    | 'ALARM_TRIGGERED'
    | 'ALARM_ACKNOWLEDGED'
    | 'ALARM_CLEARED'
    | 'FIRMWARE_UPDATE_STARTED'
    | 'FIRMWARE_UPDATED'
    | 'FIRMWARE_UPDATE_FAILED';

export type DeviceActivityActorType = 'USER' | 'DEVICE' | 'RULE_ENGINE' | 'SYSTEM';

export interface EditDeviceRequest {
    id: string;
    name?: string;
    label?: string;
    description?: string;
}

export interface EditDeviceResponse {
    id: EntityId;
    profileId: EntityId;
    tenantId: EntityId;
    customerId: EntityId;
    name: string;
    label: string;
    type: string;
    description: string;
}

export interface CreateDeviceRequest {
    label: string;
    type: string;
    name: string;
    description?: string;
    isGateway?: boolean;
    customerId?: string;
    profileId?: string;
    credentialType: DeviceCredentialType;
    /**
     * Required for X509_CERTIFICATE, MQTT_BASIC, LWM2M_CREDENTIALS.
     * Not required for ACCESS_TOKEN (backend auto-generates it).
     */
    credentialValue?: string;
    assetId: string;
}

export interface CreateDeviceResponse {
    id: EntityId;
    profileId: EntityId;
    tenantId: EntityId;
    customerId: EntityId;
    name: string;
    label: string;
    type: string;
    credentialType: DeviceCredentialType;
}

export interface DeviceAssetProjection {
    deviceId: string;
    tenantId: string;
    customerId: string;
    deviceName: string;
    deviceType: string;
    deviceLabel: string;
    deviceProtocol: string;
    isActive: boolean;
    assetId: string;
    assetName: string;
    createdAt: string;
    updatedAt: string;
}

export interface DeviceActivityResponse {
    id: string;
    type: DeviceActivityType;
    description: string;
    actorType: DeviceActivityActorType;
    actorName: string;
    occurredAt: string;
    details: string;
}

export const deviceService = {
    async editDevice(req: EditDeviceRequest): Promise<EditDeviceResponse> {
        const { data } = await napiHttpHandler.put<EditDeviceResponse>(
            '/api/v1/aiot/devices',
            req,
        );
        return data;
    },
    async createDevice(req: CreateDeviceRequest): Promise<CreateDeviceResponse> {
        const { data } = await napiHttpHandler.post<CreateDeviceResponse>(
            '/api/v1/aiot/devices',
            req,
        );
        return data;
    },
    async getDeviceById(deviceId: string): Promise<DeviceAssetProjection> {
        const { data } = await napiHttpHandler.get<DeviceAssetProjection>(
            `/api/v1/aiot/devices/${deviceId}`,
        );
        return data;
    },
    async deleteDevice(deviceId: string): Promise<PaapeliMessage> {
        const { data } = await napiHttpHandler.del<PaapeliMessage>(
            `/api/v1/aiot/devices/${deviceId}`,
        );
        return data;
    },
    async getDeviceActivities(
        deviceId: string,
        page: number,
        size: number,
    ): Promise<PageResponse<DeviceActivityResponse>> {
        const { data } = await napiHttpHandler.get<
            PageResponse<DeviceActivityResponse>
        >(`/api/v1/aiot/devices/${deviceId}/activities`, { page, size });
        return data;
    },
    async getTenantDevices(
        page: number,
        size: number,
    ): Promise<PageResponse<DeviceAssetProjection>> {
        const { data } = await napiHttpHandler.get<
            PageResponse<DeviceAssetProjection>
        >('/api/v1/aiot/devices/tenant', { page, size });
        return data;
    },
    async getAssetDevices(
        assetId: string,
        page: number,
        size: number,
    ): Promise<PageResponse<DeviceAssetProjection>> {
        const { data } = await napiHttpHandler.get<
            PageResponse<DeviceAssetProjection>
        >(`/api/v1/aiot/devices/asset/${assetId}`, { page, size });
        return data;
    },
};
