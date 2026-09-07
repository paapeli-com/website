import napiHttpHandler from '../napiHttpHandler';
import { PaapeliMessage } from '../type';

export interface Coordinate {
    /** -90 … 90 */
    latitude: number;
    /** -180 … 180 */
    longitude: number;
}

export interface Circle {
    center: Coordinate;
    radiusMeters?: number;
}

export interface Polygon {
    /** 3–1000 vertices. */
    vertices: Coordinate[];
}

export interface Rectangle {
    corner1: Coordinate;
    corner2: Coordinate;
}

export type ZoneType = 'CIRCLE' | 'POLYGON' | 'RECTANGLE';

/** `type` discriminates which shape `area` carries. */
export type Zone =
    | { type: 'CIRCLE'; area: Circle }
    | { type: 'POLYGON'; area: Polygon }
    | { type: 'RECTANGLE'; area: Rectangle };

export const deviceZonesService = {
    async getZone(
        workspaceId: string,
        productKey: string,
        deviceId: string,
    ): Promise<Zone> {
        const { data } = await napiHttpHandler.get<Zone>(
            `/api/v1/aiot/devices/${workspaceId}/${productKey}/device/${deviceId}/zone`,
        );
        return data;
    },
    /** Creates the zone, or replaces it wholesale if one already exists. */
    async saveZone(
        workspaceId: string,
        productKey: string,
        deviceId: string,
        zone: Zone,
    ): Promise<Zone> {
        const { data } = await napiHttpHandler.put<Zone>(
            `/api/v1/aiot/devices/${workspaceId}/${productKey}/device/${deviceId}/zone`,
            zone,
        );
        return data;
    },
    async deleteZone(
        workspaceId: string,
        productKey: string,
        deviceId: string,
    ): Promise<PaapeliMessage> {
        const { data } = await napiHttpHandler.del<PaapeliMessage>(
            `/api/v1/aiot/devices/${workspaceId}/${productKey}/device/${deviceId}/zone`,
        );
        return data;
    },
};
