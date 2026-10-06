import napiHttpHandler from '../napiHttpHandler';
import type { DashboardDefinition } from './dashboards';

/** A link that shows one dashboard, read-only, to someone without an account. */
export interface DashboardShareLink {
    id: string;
    dashboardId: string;
    /**
     * The secret that opens the dashboard. Present only in the answer to
     * creating the link: the gateway does not keep it, so it cannot be read again.
     */
    token?: string | null;
    createdByUserId: string;
    createdAt: string;
    expiresAt: string;
    revokedAt?: string | null;
    /** Whether the link opens the dashboard right now. */
    active: boolean;
}

/** A dashboard as the holder of a share link sees it. */
export interface SharedDashboard {
    name: string;
    description?: string | null;
    definition: DashboardDefinition;
    /** When the link stops working. */
    expiresAt: string;
}

const links = (workspaceId: string, productKey: string, dashboardId: string) =>
    `/api/v1/aiot/dashboards/${workspaceId}/${productKey}/${dashboardId}/share-links`;

/** Making and revoking share links: workspace owners and admins only. */
export const dashboardShareService = {
    /** `expiresInHours` defaults to 48 on the gateway; at most 720. */
    async create(
        workspaceId: string,
        productKey: string,
        dashboardId: string,
        expiresInHours?: number,
    ): Promise<DashboardShareLink> {
        const { data } = await napiHttpHandler.post<DashboardShareLink>(
            links(workspaceId, productKey, dashboardId),
            expiresInHours ? { expiresInHours } : {},
        );
        return data;
    },

    /** Newest first, expired and revoked ones included. */
    async list(workspaceId: string, productKey: string, dashboardId: string): Promise<DashboardShareLink[]> {
        const { data } = await napiHttpHandler.get<DashboardShareLink[]>(links(workspaceId, productKey, dashboardId));
        return data;
    },

    async revoke(
        workspaceId: string,
        productKey: string,
        dashboardId: string,
        shareLinkId: string,
    ): Promise<DashboardShareLink> {
        const { data } = await napiHttpHandler.del<DashboardShareLink>(
            `${links(workspaceId, productKey, dashboardId)}/${shareLinkId}`,
        );
        return data;
    },
};

/** What a share link opens. Needs no session: the token is the credential. */
export const sharedDashboardService = {
    async open(token: string): Promise<SharedDashboard> {
        const { data } = await napiHttpHandler.get<SharedDashboard>(
            `/api/v1/public/shared-dashboards/${encodeURIComponent(token)}`,
        );
        return data;
    },
};
