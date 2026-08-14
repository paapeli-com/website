import { useQuery } from '@tanstack/react-query';
import { workspacesService } from './workspaces';

export function useListActiveWorkspacesQuery(enabled = true) {
    return useQuery({
        queryKey: ['workspaces'],
        queryFn: () => workspacesService.listActiveWorkspaces(),
        enabled,
    });
}

export function useListWorkspaceProductsQuery(workspaceId: string, enabled = true) {
    return useQuery({
        queryKey: ['workspaceProducts', workspaceId],
        queryFn: () => workspacesService.listWorkspaceProducts(workspaceId),
        enabled: enabled && !!workspaceId,
    });
}

export function useListWorkspaceInvitationsQuery(enabled = true) {
    return useQuery({
        queryKey: ['workspaceInvitations'],
        queryFn: () => workspacesService.listInvitations(),
        enabled,
    });
}
