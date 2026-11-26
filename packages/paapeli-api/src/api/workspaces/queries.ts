import { useQuery } from '@tanstack/react-query';
import { workspacesService } from './workspaces';

export function useBillingAccountQuery(workspaceId: string) {
    return useQuery({
        queryKey: ['billingAccount', workspaceId],
        queryFn: ({ signal }) => workspacesService.readBillingAccount(workspaceId, signal),
        enabled: !!workspaceId,
        gcTime: 0,
        staleTime: 0,
        refetchOnMount: 'always',
        retry: false,
    });
}

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

export function useListWorkspaceMembersQuery(
    workspaceId: string,
    search = '',
    page = 1,
    size = 25,
    enabled = true,
) {
    return useQuery({
        queryKey: ['workspaceMembers', workspaceId, search, page, size],
        queryFn: () => workspacesService.listMembers(workspaceId, page, size, search || undefined),
        enabled: enabled && !!workspaceId,
    });
}
