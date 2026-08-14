import { useMutation } from '@tanstack/react-query';
import { deviceRpcService, DeviceRpcRequest } from './deviceRpc';

export function useSendDeviceRpcMutation() {
    return useMutation({
        mutationKey: ['sendDeviceRpc'],
        mutationFn: ({
            workspaceId,
            productKey,
            ...req
        }: DeviceRpcRequest & { workspaceId: string; productKey: string }) =>
            deviceRpcService.send(workspaceId, productKey, req),
    });
}
