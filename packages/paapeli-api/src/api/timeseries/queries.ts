import { useQuery } from '@tanstack/react-query';
import { timeseriesService } from './timeseries';

export function useGetDeviceTimeSeriesQuery(
    deviceId: string,
    from: number,
    enabled = true,
) {
    return useQuery({
        queryKey: ['deviceTimeSeries', deviceId, from],
        queryFn: () => timeseriesService.getDeviceTimeSeries(deviceId, from),
        enabled: enabled && !!deviceId,
    });
}
