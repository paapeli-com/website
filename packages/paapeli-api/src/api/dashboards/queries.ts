import { useQuery } from '@tanstack/react-query';
import { dashboardService } from './dashboards';

export const dashboardKeys = {
    all: (workspaceId: string, productKey: string) => ['dashboards', workspaceId, productKey] as const,
    list: (workspaceId: string, productKey: string, page: number, size: number) =>
        ['dashboards', workspaceId, productKey, 'list', page, size] as const,
    detail: (workspaceId: string, productKey: string, dashboardId: string) =>
        ['dashboards', workspaceId, productKey, 'detail', dashboardId] as const,
    grants: (workspaceId: string, productKey: string, dashboardId: string) =>
        ['dashboards', workspaceId, productKey, 'grants', dashboardId] as const,
    categories: (workspaceId: string, productKey: string) =>
        ['dashboardCategories', workspaceId, productKey] as const,
    widgetDefinitions: (workspaceId: string, productKey: string) =>
        ['widgetDefinitions', workspaceId, productKey] as const,
};

export function useListDashboardsQuery(
    workspaceId: string,
    productKey: string,
    page = 1,
    size = 100,
    enabled = true,
) {
    return useQuery({
        queryKey: dashboardKeys.list(workspaceId, productKey, page, size),
        queryFn: () => dashboardService.listDashboards(workspaceId, productKey, page, size),
        enabled: enabled && !!workspaceId && !!productKey,
    });
}

export function useGetDashboardQuery(workspaceId: string, productKey: string, dashboardId: string, enabled = true) {
    return useQuery({
        queryKey: dashboardKeys.detail(workspaceId, productKey, dashboardId),
        queryFn: () => dashboardService.getDashboard(workspaceId, productKey, dashboardId),
        enabled: enabled && !!workspaceId && !!productKey && !!dashboardId,
    });
}

export function useListWidgetDefinitionsQuery(workspaceId: string, productKey: string, enabled = true) {
    return useQuery({
        queryKey: dashboardKeys.widgetDefinitions(workspaceId, productKey),
        queryFn: () => dashboardService.listWidgetDefinitions(workspaceId, productKey),
        enabled: enabled && !!workspaceId && !!productKey,
        // The catalog changes with deployments, not with user activity.
        staleTime: 10 * 60_000,
    });
}

export function useListDashboardCategoriesQuery(workspaceId: string, productKey: string, enabled = true) {
    return useQuery({
        queryKey: dashboardKeys.categories(workspaceId, productKey),
        queryFn: () => dashboardService.listCategories(workspaceId, productKey),
        enabled: enabled && !!workspaceId && !!productKey,
    });
}

export function useListDashboardGrantsQuery(
    workspaceId: string,
    productKey: string,
    dashboardId: string,
    enabled = true,
) {
    return useQuery({
        queryKey: dashboardKeys.grants(workspaceId, productKey, dashboardId),
        queryFn: () => dashboardService.listGrants(workspaceId, productKey, dashboardId),
        enabled: enabled && !!workspaceId && !!productKey && !!dashboardId,
    });
}
