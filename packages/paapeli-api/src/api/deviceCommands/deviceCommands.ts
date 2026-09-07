import napiHttpHandler from '../napiHttpHandler';

export interface SendDeviceCommandRequest {
    /**
     * Public command key from the device's command catalog — see
     * `productDeviceCommandsService.getProductDeviceCommands`.
     */
    command: string;
    /** Parameters defined by the command's `parameterSchema`. */
    params?: Record<string, unknown> | null;
}

export interface DeviceCommandResponse {
    /**
     * Whether dispatch completed successfully. It does not mean the physical
     * device executed the command.
     */
    success: boolean;
}

export const deviceCommandsService = {
    async sendCommand(
        workspaceId: string,
        productKey: string,
        deviceId: string,
        req: SendDeviceCommandRequest,
    ): Promise<DeviceCommandResponse> {
        const { data } = await napiHttpHandler.post<DeviceCommandResponse>(
            `/api/v1/aiot/devices/${workspaceId}/${productKey}/${deviceId}/commands`,
            req,
        );
        return data;
    },
};
