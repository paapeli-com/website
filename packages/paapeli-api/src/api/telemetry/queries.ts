import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { TelemetryHistoryParams, telemetryService } from './telemetry';

export function useDeviceTelemetryKeysQuery(
    workspaceId: string,
    productKey: string,
    deviceId: string,
    enabled = true,
) {
    return useQuery({
        queryKey: ['telemetryKeys', workspaceId, productKey, deviceId],
        queryFn: () => telemetryService.getKeys(workspaceId, productKey, deviceId),
        enabled: enabled && !!workspaceId && !!productKey && !!deviceId,
    });
}

export function useDeviceLatestTelemetryQuery(
    workspaceId: string,
    productKey: string,
    deviceId: string,
    keys: string[],
    enabled = true,
) {
    return useQuery({
        queryKey: ['telemetryLatest', workspaceId, productKey, deviceId, [...keys].sort().join(',')],
        queryFn: () => telemetryService.getLatest(workspaceId, productKey, deviceId, keys),
        enabled: enabled && !!workspaceId && !!productKey && !!deviceId && keys.length > 0,
    });
}

export function useDeviceTelemetryHistoryQuery(
    workspaceId: string,
    productKey: string,
    deviceId: string,
    params: TelemetryHistoryParams,
    enabled = true,
) {
    return useQuery({
        queryKey: [
            'telemetryHistory',
            workspaceId,
            productKey,
            deviceId,
            [...params.keys].sort().join(','),
            params.startTs,
            params.endTs,
            params.interval,
            params.limit,
            params.aggregation,
            params.order,
        ],
        queryFn: () => telemetryService.getHistory(workspaceId, productKey, deviceId, params),
        enabled: enabled && !!workspaceId && !!productKey && !!deviceId && params.keys.length > 0,
        // Keep the old chart on screen while a refresh or a new window loads.
        placeholderData: keepPreviousData,
    });
}
