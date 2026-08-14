import { useQuery } from '@tanstack/react-query';
import { deviceCredentialsService } from './deviceCredentials';

export function useGetDeviceCredentialsQuery(
    workspaceId: string,
    productKey: string,
    deviceId: string,
    enabled = true,
) {
    return useQuery({
        queryKey: ['deviceCredentials', workspaceId, productKey, deviceId],
        queryFn: () =>
            deviceCredentialsService.getDeviceCredentials(workspaceId, productKey, deviceId),
        enabled: enabled && !!workspaceId && !!productKey && !!deviceId,
    });
}
