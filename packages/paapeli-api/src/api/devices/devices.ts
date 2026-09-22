import napiHttpHandler from '../napiHttpHandler';
import { PageResponse, PaapeliMessage } from '../type';

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
    name: string;
    label?: string;
    description?: string;
}

export interface EditDeviceResponse {
    id: string;
    name: string;
    label: string;
    type: string;
    description: string;
}

export interface CreateDeviceRequest {
    /** Display label of the device. */
    label?: string;
    /**
     * Device-type key from the product's device-type catalog, e.g. "zx909" —
     * see `productDeviceTypesService.getProductDeviceTypes`. The catalog entry
     * carries the provisioning profile, so there is no profile field here.
     */
    type: string;
    /** Unique device name, such as the tracker IMEI. */
    name: string;
    /**
     * Tracker IMEI. Sent ahead of backend support — the endpoint currently
     * ignores it.
     */
    imei?: string;
    description?: string;
    /** Whether this device acts as a gateway. */
    isGateway?: boolean;
    credentialType: DeviceCredentialType;
    /**
     * Required for X509_CERTIFICATE, MQTT_BASIC, LWM2M_CREDENTIALS.
     * Not required for ACCESS_TOKEN (backend auto-generates it).
     */
    credentialValue?: string;
    /** Paapeli workspace-product asset ID the device is assigned to. */
    assetId: string;
}

export interface CreateDeviceResponse {
    id: string;
    name: string;
    label: string;
    type: string;
    credentialType: DeviceCredentialType;
}

export interface DeviceResponse {
    id: string;
    name: string;
    /** Tracker IMEI. Not returned yet — the backend doesn't store it. */
    imei?: string;
    type: string;
    /** The panel stores the device's tags here, comma-separated. */
    label: string;
    /** Not returned by the list/get endpoints yet; only the edit response has it. */
    description?: string;
    protocol: string;
    active: boolean;
    assetId: string;
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
    async editDevice(
        workspaceId: string,
        productKey: string,
        req: EditDeviceRequest,
    ): Promise<EditDeviceResponse> {
        const { data } = await napiHttpHandler.put<EditDeviceResponse>(
            `/api/v1/aiot/devices/${workspaceId}/${productKey}`,
            req,
        );
        return data;
    },
    async createDevice(
        workspaceId: string,
        productKey: string,
        req: CreateDeviceRequest,
    ): Promise<CreateDeviceResponse> {
        const { data } = await napiHttpHandler.post<CreateDeviceResponse>(
            `/api/v1/aiot/devices/${workspaceId}/${productKey}`,
            req,
        );
        return data;
    },
    async getDeviceById(
        workspaceId: string,
        productKey: string,
        deviceId: string,
    ): Promise<DeviceResponse> {
        const { data } = await napiHttpHandler.get<DeviceResponse>(
            `/api/v1/aiot/devices/${workspaceId}/${productKey}/device/${deviceId}`,
        );
        return data;
    },
    async deleteDevice(
        workspaceId: string,
        productKey: string,
        deviceId: string,
    ): Promise<PaapeliMessage> {
        const { data } = await napiHttpHandler.del<PaapeliMessage>(
            `/api/v1/aiot/devices/${workspaceId}/${productKey}/device/${deviceId}`,
        );
        return data;
    },
    async getDeviceActivities(
        workspaceId: string,
        productKey: string,
        deviceId: string,
        page: number,
        size: number,
    ): Promise<PageResponse<DeviceActivityResponse>> {
        const { data } = await napiHttpHandler.get<
            PageResponse<DeviceActivityResponse>
        >(`/api/v1/aiot/devices/${workspaceId}/${productKey}/activities/${deviceId}`, {
            page,
            size,
        });
        return data;
    },
    async getTenantDevices(
        workspaceId: string,
        productKey: string,
        page: number,
        size: number,
    ): Promise<PageResponse<DeviceResponse>> {
        const { data } = await napiHttpHandler.get<PageResponse<DeviceResponse>>(
            `/api/v1/aiot/devices/${workspaceId}/${productKey}/tenant`,
            { page, size },
        );
        return data;
    },
    async getAssetDevices(
        workspaceId: string,
        productKey: string,
        assetId: string,
        page: number,
        size: number,
    ): Promise<PageResponse<DeviceResponse>> {
        const { data } = await napiHttpHandler.get<PageResponse<DeviceResponse>>(
            `/api/v1/aiot/devices/${workspaceId}/${productKey}/asset/${assetId}`,
            { page, size },
        );
        return data;
    },
};
