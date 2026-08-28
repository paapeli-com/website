import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deviceRpcService, DeviceRpcRequest } from './deviceRpc';

export function useSendDeviceRpcMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['sendDeviceRpc'],
        mutationFn: ({
            workspaceId,
            productKey,
            ...req
        }: DeviceRpcRequest & { workspaceId: string; productKey: string }) =>
            deviceRpcService.send(workspaceId, productKey, req),
        onSuccess: (_data, { workspaceId, productKey, deviceId }) => {
            // The gateway records each command in the device's activity feed
            // (COMMAND_SENT / COMMAND_SUCCEEDED / COMMAND_FAILED), which is
            // what the command history reads — refresh it.
            queryClient.invalidateQueries({
                queryKey: ['deviceActivities', workspaceId, productKey, deviceId],
            });
        },
    });
}
