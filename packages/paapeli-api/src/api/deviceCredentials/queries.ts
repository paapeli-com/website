import { useQuery } from '@tanstack/react-query';
import { deviceCredentialsService } from './deviceCredentials';

export function useGetDeviceCredentialsQuery(
    deviceId: string,
    enabled = true,
) {
    return useQuery({
        queryKey: ['deviceCredentials', deviceId],
        queryFn: () => deviceCredentialsService.getDeviceCredentials(deviceId),
        enabled: enabled && !!deviceId,
    });
}
