import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    WorkspaceInvitationRequest,
    WorkspaceProductRequest,
    WorkspaceRequest,
    workspacesService,
} from './workspaces';

export function useCreateWorkspaceMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['createWorkspace'],
        mutationFn: (req: WorkspaceRequest) => workspacesService.createWorkspace(req),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        },
    });
}

export function useRenameWorkspaceMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['renameWorkspace'],
        mutationFn: ({ workspaceId, ...req }: WorkspaceRequest & { workspaceId: string }) =>
            workspacesService.renameWorkspace(workspaceId, req),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        },
    });
}

export function useDeleteWorkspaceMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['deleteWorkspace'],
        mutationFn: (workspaceId: string) => workspacesService.deleteWorkspace(workspaceId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        },
    });
}

export function useSubscribeWorkspaceProductMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['subscribeWorkspaceProduct'],
        mutationFn: ({
            workspaceId,
            ...req
        }: WorkspaceProductRequest & { workspaceId: string }) =>
            workspacesService.subscribeWorkspaceProduct(workspaceId, req),
        onSuccess: (_data, { workspaceId }) => {
            queryClient.invalidateQueries({ queryKey: ['workspaceProducts', workspaceId] });
        },
    });
}

export function useInviteWorkspaceMemberMutation() {
    return useMutation({
        mutationKey: ['inviteWorkspaceMember'],
        mutationFn: ({
            workspaceId,
            ...req
        }: WorkspaceInvitationRequest & { workspaceId: string }) =>
            workspacesService.inviteMember(workspaceId, req),
    });
}

export function useRejectWorkspaceInvitationMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['rejectWorkspaceInvitation'],
        mutationFn: (workspaceId: string) => workspacesService.rejectInvitation(workspaceId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaceInvitations'] });
        },
    });
}

export function useAcceptWorkspaceInvitationMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['acceptWorkspaceInvitation'],
        mutationFn: (workspaceId: string) => workspacesService.acceptInvitation(workspaceId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaceInvitations'] });
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        },
    });
}
