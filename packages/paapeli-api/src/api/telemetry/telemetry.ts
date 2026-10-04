import napiHttpHandler from '../napiHttpHandler';

/** One reading. `value` is whatever JSON the device sent (number, bool, string…). */
export interface TelemetryPoint {
    ts: number;
    value: unknown;
}

/** Key → readings. */
export type TelemetryResponse = Record<string, TelemetryPoint[]>;

export type TelemetryAggregation = 'NONE' | 'MIN' | 'MAX' | 'AVG' | 'SUM' | 'COUNT';

export interface TelemetryHistoryParams {
    keys: string[];
    startTs: number;
    endTs: number;
    /** Aggregation bucket in ms; only meaningful with an aggregation other than NONE. */
    interval?: number;
    limit?: number;
    aggregation?: TelemetryAggregation;
    order?: 'ASC' | 'DESC';
}

const base = (workspaceId: string, productKey: string, deviceId: string) =>
    `/api/v1/aiot/telemetry/${workspaceId}/${productKey}/devices/${deviceId}`;

export const telemetryService = {
    /** The time-series keys this device has ever reported. */
    async getKeys(workspaceId: string, productKey: string, deviceId: string): Promise<string[]> {
        const { data } = await napiHttpHandler.get<string[]>(`${base(workspaceId, productKey, deviceId)}/keys`);
        return data;
    },

    async getLatest(
        workspaceId: string,
        productKey: string,
        deviceId: string,
        keys: string[],
    ): Promise<TelemetryResponse> {
        const { data } = await napiHttpHandler.get<TelemetryResponse>(
            `${base(workspaceId, productKey, deviceId)}/latest`,
            { keys: keys.join(',') },
        );
        return data;
    },

    async getHistory(
        workspaceId: string,
        productKey: string,
        deviceId: string,
        { keys, ...params }: TelemetryHistoryParams,
    ): Promise<TelemetryResponse> {
        const { data } = await napiHttpHandler.get<TelemetryResponse>(
            `${base(workspaceId, productKey, deviceId)}/timeseries`,
            { keys: keys.join(','), ...params },
        );
        return data;
    },
};
