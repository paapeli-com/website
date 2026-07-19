import napiHttpHandler from '../napiHttpHandler';

export interface EntityFieldItem {
    ts: number;
    value: string;
}

export type DeviceTimeSeriesResponse = Record<string, EntityFieldItem[]>;

export const timeseriesService = {
    async getDeviceTimeSeries(
        deviceId: string,
        from: number,
    ): Promise<DeviceTimeSeriesResponse> {
        const { data } = await napiHttpHandler.get<DeviceTimeSeriesResponse>(
            `/api/v1/aiot/timeseries/history/${deviceId}`,
            { from },
        );
        return data;
    },
};
