import { useQuery } from '@tanstack/react-query';
import { timeseriesService } from './timeseries';

export function useGetDeviceTimeSeriesQuery(
    workspaceId: string,
    productKey: string,
    deviceId: string,
    from: number,
    enabled = true,
) {
    return useQuery({
        queryKey: ['deviceTimeSeries', workspaceId, productKey, deviceId, from],
        queryFn: () =>
            timeseriesService.getDeviceTimeSeries(workspaceId, productKey, deviceId, from),
        enabled: enabled && !!workspaceId && !!productKey && !!deviceId,
    });
}
