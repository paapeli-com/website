import napiHttpHandler from '../napiHttpHandler';

export interface EntityFieldItem {
    ts: number;
    value: string;
}

export type DeviceTimeSeriesResponse = Record<string, EntityFieldItem[]>;

export const timeseriesService = {
    async getDeviceTimeSeries(
        workspaceId: string,
        productKey: string,
        deviceId: string,
        from: number,
    ): Promise<DeviceTimeSeriesResponse> {
        const { data } = await napiHttpHandler.get<DeviceTimeSeriesResponse>(
            `/api/v1/aiot/timeseries/${workspaceId}/${productKey}/history/${deviceId}`,
            { from },
        );
        return data;
    },
};
