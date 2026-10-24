import napiHttpHandler from '../napiHttpHandler';

/* A workspace's application API keys (GET/POST/DELETE
   /workspaces/{workspaceId}/api-keys). A key belongs to one workspace, acts as
   the member who created it, and reaches only its granted products, each up to
   an access level. Its secret is returned once, at creation. */

/** The highest product action a key reaches in one product. */
export type ApiKeyAccess = 'READ' | 'OPERATE' | 'ADMINISTER';

export type ApiKeyStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export interface ApiKeyGrant {
    productKey: string;
    access: ApiKeyAccess;
}

export interface ApiKey {
    id: string;
    name: string;
    /** pp_live_…abcd — enough to tell keys apart, never the secret. */
    prefix: string;
    status: ApiKeyStatus;
    createdBy: string;
    createdByEmail: string | null;
    /** ISO-8601 instants. */
    createdAt: string;
    lastUsedAt: string | null;
    expiresAt: string | null;
    revokedAt: string | null;
    grants: ApiKeyGrant[];
}

export interface CreateApiKeyRequest {
    name: string;
    /** ISO-8601; null for a key that does not expire. */
    expiresAt: string | null;
    grants: ApiKeyGrant[];
}

export interface CreatedApiKey {
    key: ApiKey;
    /** Shown once; the gateway keeps only its hash. */
    secret: string;
}

const base = (workspaceId: string) => `/api/v1/aiot/workspaces/${workspaceId}/api-keys`;

export const apiKeysService = {
    async list(workspaceId: string): Promise<ApiKey[]> {
        const { data } = await napiHttpHandler.get<ApiKey[]>(base(workspaceId));
        return data;
    },
    async create(workspaceId: string, req: CreateApiKeyRequest): Promise<CreatedApiKey> {
        const { data } = await napiHttpHandler.post<CreatedApiKey>(base(workspaceId), req);
        return data;
    },
    async revoke(workspaceId: string, apiKeyId: string): Promise<ApiKey> {
        const { data } = await napiHttpHandler.del<ApiKey>(`${base(workspaceId)}/${apiKeyId}`);
        return data;
    },
    async removeGrant(workspaceId: string, apiKeyId: string, productKey: string): Promise<ApiKey> {
        const { data } = await napiHttpHandler.del<ApiKey>(
            `${base(workspaceId)}/${apiKeyId}/grants/${encodeURIComponent(productKey)}`,
        );
        return data;
    },
};
