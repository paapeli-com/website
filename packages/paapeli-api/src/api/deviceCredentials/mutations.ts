import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    deviceCredentialsService,
    UpdateDeviceCredentialsRequest,
} from './deviceCredentials';

export function useUpdateDeviceCredentialsMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['updateDeviceCredentials'],
        mutationFn: (req: UpdateDeviceCredentialsRequest) =>
            deviceCredentialsService.updateDeviceCredentials(req),
        onSuccess: (_data, req) => {
            queryClient.invalidateQueries({
                queryKey: ['deviceCredentials', req.deviceId],
            });
        },
    });
}
