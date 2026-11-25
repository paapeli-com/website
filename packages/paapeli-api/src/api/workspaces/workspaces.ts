import napiHttpHandler from '../napiHttpHandler';
import { PageResponse } from '../type';

export type WorkspaceMembershipStatus =
    | 'INVITED'
    | 'ACTIVE'
    | 'SUSPENDED'
    | 'REJECTED'
    | 'EXPIRED';

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export type WorkspaceStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export type WorkspaceProductStatus = 'PROVISIONING' | 'ACTIVE' | 'FAILED' | 'SUSPENDED';

export interface WorkspaceRequest {
    name: string;
}

export interface WorkspaceResponse {
    id: string;
    name: string;
    status: WorkspaceStatus;
    createdAt: number;
}

/** A workspace as seen from the current user's membership. */
export interface UserWorkspace {
    workspaceId: string;
    workspaceName: string;
    membershipStatus: WorkspaceMembershipStatus;
    role: WorkspaceRole;
    /** The products this membership may use; null means every product. */
    productKeys?: string[] | null;
    /** For an invitation: when it was sent (epoch seconds) and by whom.
     *  Null for one sent before the sender was recorded. */
    invitedAt?: number | null;
    invitedByName?: string | null;
    invitedByEmail?: string | null;
}

/** An invitation the workspace has sent, and what became of it. */
export interface SentInvitation {
    workspaceMembershipId: string;
    userId: string;
    email: string;
    displayName?: string | null;
    role: WorkspaceRole;
    /** INVITED pending, ACTIVE accepted, REJECTED declined, EXPIRED, SUSPENDED. */
    status: WorkspaceMembershipStatus;
    /** Null means every product. */
    productKeys?: string[] | null;
    /** Epoch seconds. */
    invitedAt?: number | null;
    invitedByName?: string | null;
    invitedByEmail?: string | null;
}

export interface WorkspaceProductRequest {
    productKey: string;
}

export interface WorkspaceProductResponse {
    workspaceProductId: string;
    workspaceId: string;
    productKey: string;
    status: WorkspaceProductStatus;
    createdAt: number;
}

export interface WorkspaceInvitationRequest {
    email: string;
    role: WorkspaceRole;
    /** The products a MEMBER or VIEWER may use; omitted or empty means every
     *  product. Ignored for an ADMIN. */
    productKeys?: string[];
}

export interface WorkspaceMembershipResponse {
    workspaceId: string;
    userId: string;
    role: WorkspaceRole;
    status: WorkspaceMembershipStatus;
    createdAt: number;
}

/** A row of GET /workspaces/{workspaceId}/members. */
export interface WorkspaceMember {
    workspaceMembershipId: string;
    userId: string;
    displayName?: string | null;
    email?: string | null;
    role: WorkspaceRole;
    status: WorkspaceMembershipStatus;
    createdAt: string;
}

export const workspacesService = {
    /** Members of a workspace, searchable by display name or email. */
    async listMembers(
        workspaceId: string,
        page = 1,
        size = 25,
        search?: string,
    ): Promise<PageResponse<WorkspaceMember>> {
        const { data } = await napiHttpHandler.get<PageResponse<WorkspaceMember>>(
            `/api/v1/aiot/workspaces/${workspaceId}/members`,
            { page, size, ...(search ? { search } : {}) },
        );
        return data;
    },
    /** List workspaces the current user is an active member of. */
    async listActiveWorkspaces(): Promise<UserWorkspace[]> {
        const { data } = await napiHttpHandler.get<UserWorkspace[]>(
            '/api/v1/aiot/workspaces',
        );
        return data;
    },
    async createWorkspace(req: WorkspaceRequest): Promise<WorkspaceResponse> {
        const { data } = await napiHttpHandler.post<WorkspaceResponse>(
            '/api/v1/aiot/workspaces',
            req,
        );
        return data;
    },
    /** Owner only. */
    async renameWorkspace(workspaceId: string, req: WorkspaceRequest): Promise<WorkspaceResponse> {
        const { data } = await napiHttpHandler.put<WorkspaceResponse>(
            `/api/v1/aiot/workspaces/${workspaceId}`,
            req,
        );
        return data;
    },
    /** Owner only. The workspace stops being listed or reachable; its data is kept. */
    async deleteWorkspace(workspaceId: string): Promise<WorkspaceResponse> {
        const { data } = await napiHttpHandler.del<WorkspaceResponse>(
            `/api/v1/aiot/workspaces/${workspaceId}`,
        );
        return data;
    },
    async listWorkspaceProducts(workspaceId: string): Promise<WorkspaceProductResponse[]> {
        const { data } = await napiHttpHandler.get<WorkspaceProductResponse[]>(
            `/api/v1/aiot/workspaces/${workspaceId}/products`,
        );
        return data;
    },
    async subscribeWorkspaceProduct(
        workspaceId: string,
        req: WorkspaceProductRequest,
    ): Promise<WorkspaceProductResponse> {
        const { data } = await napiHttpHandler.post<WorkspaceProductResponse>(
            `/api/v1/aiot/workspaces/${workspaceId}/products`,
            req,
        );
        return data;
    },
    async inviteMember(
        workspaceId: string,
        req: WorkspaceInvitationRequest,
    ): Promise<WorkspaceMembershipResponse> {
        const { data } = await napiHttpHandler.post<WorkspaceMembershipResponse>(
            `/api/v1/aiot/workspaces/${workspaceId}/invitations`,
            req,
        );
        return data;
    },
    async rejectInvitation(workspaceId: string): Promise<string> {
        const { data } = await napiHttpHandler.post<{ data: string }>(
            `/api/v1/aiot/workspaces/${workspaceId}/invitations/reject`,
        );
        return data.data;
    },
    async acceptInvitation(workspaceId: string): Promise<WorkspaceMembershipResponse> {
        const { data } = await napiHttpHandler.post<WorkspaceMembershipResponse>(
            `/api/v1/aiot/workspaces/${workspaceId}/invitations/accept`,
        );
        return data;
    },
    /** The invitations this workspace has sent, newest first, with their status. */
    async listSentInvitations(workspaceId: string): Promise<SentInvitation[]> {
        const { data } = await napiHttpHandler.get<SentInvitation[]>(
            `/api/v1/aiot/workspaces/${workspaceId}/invitations`,
        );
        return data;
    },
    /** List the current user's pending invitations (across all workspaces). */
    async listInvitations(): Promise<UserWorkspace[]> {
        const { data } = await napiHttpHandler.get<UserWorkspace[]>(
            '/api/v1/aiot/workspaces/invitations',
        );
        return data;
    },
};
