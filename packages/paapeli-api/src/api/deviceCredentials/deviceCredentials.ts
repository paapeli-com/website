import napiHttpHandler from '../napiHttpHandler';
import { DeviceCredentialType } from '../devices/devices';

export interface PaapeliCredentials {
    /** Credentials record ID (required on update). */
    id: string;
    /** Device ID these credentials belong to. */
    deviceId: string;
    /** Created timestamp (server generated). */
    createdTime?: number;
    /** Version (server managed; send the current value on update when available). */
    version?: number;
    credentialType: DeviceCredentialType;
    /**
     * For ACCESS_TOKEN this is typically the access token string.
     * For MQTT_BASIC this may be omitted depending on the payload.
     */
    credentialsId?: string;
    /**
     * Required for X509_CERTIFICATE, MQTT_BASIC, and LWM2M_CREDENTIALS.
     * For MQTT_BASIC this is a JSON string with clientId, userName, and password.
     * Often null for ACCESS_TOKEN (token is carried in credentialsId).
     */
    credentialsValue?: string;
}

export interface UpdateDeviceCredentialsRequest {
    credentialType: DeviceCredentialType;
    credentialsId?: string;
    credentialsValue?: string;
}

export const deviceCredentialsService = {
    async getDeviceCredentials(
        workspaceId: string,
        productKey: string,
        deviceId: string,
    ): Promise<PaapeliCredentials> {
        const { data } = await napiHttpHandler.get<PaapeliCredentials>(
            `/api/v1/aiot/credentials/${workspaceId}/${productKey}/${deviceId}`,
        );
        return data;
    },
    /** After a successful update, the gateway also refreshes the local device protocol projection. */
    async updateDeviceCredentials(
        workspaceId: string,
        productKey: string,
        deviceId: string,
        req: UpdateDeviceCredentialsRequest,
    ): Promise<PaapeliCredentials> {
        const { data } = await napiHttpHandler.put<PaapeliCredentials>(
            `/api/v1/aiot/credentials/${workspaceId}/${productKey}/${deviceId}`,
            req,
        );
        return data;
    },
};
