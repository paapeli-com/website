import napiHttpHandler from '../napiHttpHandler';
import { PaapeliMessage } from '../type';

export interface DeviceRpcRequest {
    action: string;
    deviceId: string;
    deviceName?: string;
    params?: Record<string, unknown> | null;
    isOneWay?: boolean;
    queue?: boolean;
}

export const deviceRpcService = {
    async send(
        workspaceId: string,
        productKey: string,
        req: DeviceRpcRequest,
    ): Promise<PaapeliMessage> {
        const { data } = await napiHttpHandler.post<PaapeliMessage>(
            `/api/v1/aiot/rpc/${workspaceId}/${productKey}`,
            req,
        );
        return data;
    },
};
