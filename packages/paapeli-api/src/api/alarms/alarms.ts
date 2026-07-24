import napiHttpHandler from '../napiHttpHandler';
import { PageResponse } from '../type';

export interface PaapeliAlarmListItem {
    id: string;
    name: string;
    severity: string;
    status: string;
    creationTime: number;
}

export const alarmService = {
    async getDeviceAlarms(
        deviceId: string,
        page: number,
        size: number,
    ): Promise<PageResponse<PaapeliAlarmListItem>> {
        const { data } = await napiHttpHandler.get<
            PageResponse<PaapeliAlarmListItem>
        >(`/api/v1/aiot/alarms/${deviceId}`, { page, size });
        return data;
    },
};
