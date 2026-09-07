import { useQuery } from '@tanstack/react-query';
import { productDeviceCommandsService } from './productDeviceCommands';

export function useGetProductDeviceCommandsQuery(
    productKey: string,
    deviceType: string,
    enabled = true,
) {
    return useQuery({
        queryKey: ['productDeviceCommands', productKey, deviceType],
        queryFn: () =>
            productDeviceCommandsService.getProductDeviceCommands(
                productKey,
                deviceType,
            ),
        enabled: enabled && !!productKey && !!deviceType,
    });
}
