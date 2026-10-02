import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    CreateDashboardCategoryRequest,
    CreateDashboardRequest,
    DashboardPermission,
    dashboardService,
    UpdateDashboardRequest,
} from './dashboards';
import { dashboardKeys } from './queries';

type Scope = { workspaceId: string; productKey: string };

export function useCreateDashboardMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['createDashboard'],
        mutationFn: ({ workspaceId, productKey, ...req }: CreateDashboardRequest & Scope) =>
            dashboardService.createDashboard(workspaceId, productKey, req),
        onSuccess: (created, { workspaceId, productKey }) => {
            queryClient.setQueryData(dashboardKeys.detail(workspaceId, productKey, created.id), created);
            queryClient.invalidateQueries({ queryKey: dashboardKeys.all(workspaceId, productKey) });
        },
    });
}

export function useUpdateDashboardMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['updateDashboard'],
        mutationFn: ({
            workspaceId,
            productKey,
            dashboardId,
            ...req
        }: UpdateDashboardRequest & Scope & { dashboardId: string }) =>
            dashboardService.updateDashboard(workspaceId, productKey, dashboardId, req),
        onSuccess: (updated, { workspaceId, productKey }) => {
            // Seed the detail cache with the new recordVersion, so the next
            // save from the same page doesn't 409 against its own write.
            queryClient.setQueryData(dashboardKeys.detail(workspaceId, productKey, updated.id), updated);
            queryClient.invalidateQueries({
                queryKey: [...dashboardKeys.all(workspaceId, productKey), 'list'],
            });
        },
    });
}

export function useDeleteDashboardMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['deleteDashboard'],
        mutationFn: ({ workspaceId, productKey, dashboardId }: Scope & { dashboardId: string }) =>
            dashboardService.deleteDashboard(workspaceId, productKey, dashboardId),
        onSuccess: (_data, { workspaceId, productKey, dashboardId }) => {
            queryClient.removeQueries({ queryKey: dashboardKeys.detail(workspaceId, productKey, dashboardId) });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.all(workspaceId, productKey) });
        },
    });
}

export function useCreateDashboardCategoryMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['createDashboardCategory'],
        mutationFn: ({ workspaceId, productKey, ...req }: CreateDashboardCategoryRequest & Scope) =>
            dashboardService.createCategory(workspaceId, productKey, req),
        onSuccess: (_data, { workspaceId, productKey }) => {
            queryClient.invalidateQueries({ queryKey: dashboardKeys.categories(workspaceId, productKey) });
        },
    });
}

export function usePutDashboardGrantMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['putDashboardGrant'],
        mutationFn: ({
            workspaceId,
            productKey,
            dashboardId,
            workspaceMembershipId,
            permission,
        }: Scope & { dashboardId: string; workspaceMembershipId: string; permission: DashboardPermission }) =>
            dashboardService.putGrant(workspaceId, productKey, dashboardId, workspaceMembershipId, permission),
        onSuccess: (_data, { workspaceId, productKey, dashboardId }) => {
            queryClient.invalidateQueries({ queryKey: dashboardKeys.grants(workspaceId, productKey, dashboardId) });
        },
    });
}

export function useDeleteDashboardGrantMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['deleteDashboardGrant'],
        mutationFn: ({
            workspaceId,
            productKey,
            dashboardId,
            workspaceMembershipId,
        }: Scope & { dashboardId: string; workspaceMembershipId: string }) =>
            dashboardService.deleteGrant(workspaceId, productKey, dashboardId, workspaceMembershipId),
        onSuccess: (_data, { workspaceId, productKey, dashboardId }) => {
            queryClient.invalidateQueries({ queryKey: dashboardKeys.grants(workspaceId, productKey, dashboardId) });
        },
    });
}
