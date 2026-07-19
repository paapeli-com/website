import napiHttpHandler from '../napiHttpHandler';
import { PaapeliMessage } from '../type';

export interface DeviceRpcRequest {
    action: string;
    deviceId: string;
    deviceName: string;
    params?: Record<string, unknown> | null;
    isOneWay?: boolean;
    queue?: boolean;
}

export const deviceRpcService = {
    async send(req: DeviceRpcRequest): Promise<PaapeliMessage> {
        const { data } = await napiHttpHandler.post<PaapeliMessage>(
            '/api/v1/aiot/rpc',
            req,
        );
        return data;
    },
};
