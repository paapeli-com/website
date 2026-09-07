import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deviceCommandsService, SendDeviceCommandRequest } from './deviceCommands';

export function useSendDeviceCommandMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['sendDeviceCommand'],
        mutationFn: ({
            workspaceId,
            productKey,
            deviceId,
            ...req
        }: SendDeviceCommandRequest & {
            workspaceId: string;
            productKey: string;
            deviceId: string;
        }) =>
            deviceCommandsService.sendCommand(
                workspaceId,
                productKey,
                deviceId,
                req,
            ),
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
