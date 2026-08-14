import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    deviceCredentialsService,
    UpdateDeviceCredentialsRequest,
} from './deviceCredentials';

export function useUpdateDeviceCredentialsMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['updateDeviceCredentials'],
        mutationFn: ({
            workspaceId,
            productKey,
            deviceId,
            ...req
        }: UpdateDeviceCredentialsRequest & {
            workspaceId: string;
            productKey: string;
            deviceId: string;
        }) =>
            deviceCredentialsService.updateDeviceCredentials(
                workspaceId,
                productKey,
                deviceId,
                req,
            ),
        onSuccess: (_data, { workspaceId, productKey, deviceId }) => {
            queryClient.invalidateQueries({
                queryKey: ['deviceCredentials', workspaceId, productKey, deviceId],
            });
        },
    });
}
