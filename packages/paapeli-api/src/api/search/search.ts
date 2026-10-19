import napiHttpHandler from '../napiHttpHandler';

/** What a hit is; decides which page it opens. */
export type SearchHitType = 'DEVICE' | 'LOCATION' | 'ALARM_RULE' | 'WORK_ORDER' | 'DASHBOARD';

export interface SearchHit {
    type: SearchHitType;
    /** The thing's Paapeli id: device, asset, alarm rule, work order or dashboard. */
    id: string;
    title: string;
    /** A label, status or device name; may be null. */
    subtitle: string | null;
}

/** Hits grouped by type: devices, locations, alarm rules, work orders, dashboards. */
export interface SearchResponse {
    query: string;
    hits: SearchHit[];
}

export const searchService = {
    /**
     * Name search over one workspace product. Under 2 characters returns no
     * hits; alarm rules only come back for a product admin.
     */
    async search(
        workspaceId: string,
        productKey: string,
        q: string,
        limit?: number,
    ): Promise<SearchResponse> {
        const { data } = await napiHttpHandler.get<SearchResponse>(
            `/api/v1/aiot/search/${workspaceId}/${productKey}`,
            { q, ...(limit ? { limit } : {}) },
        );
        return data;
    },
};
