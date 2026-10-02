import napiHttpHandler from '../napiHttpHandler';
import { PageResponse } from '../type';

export type WorkspaceMembershipStatus =
    | 'INVITED'
    | 'ACTIVE'
    | 'SUSPENDED'
    | 'REJECTED'
    | 'EXPIRED';

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export type WorkspaceStatus = 'ACTIVE' | 'SUSPENDED';

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
    /** List the current user's pending invitations (across all workspaces). */
    async listInvitations(): Promise<UserWorkspace[]> {
        const { data } = await napiHttpHandler.get<UserWorkspace[]>(
            '/api/v1/aiot/workspaces/invitations',
        );
        return data;
    },
};
