import { useQueries } from '@tanstack/react-query';
import { notificationService } from './notifications';

/** How often an open panel asks whether anything new has arrived. */
const REFRESH_MS = 60_000;

export const notificationsQueryKey = (workspaceId: string, productKey?: string) =>
    productKey ? ['notifications', workspaceId, productKey] : ['notifications', workspaceId];

/**
 * The signed-in user's latest notifications in each given product of a
 * workspace, one query per product, refreshed while the panel is open.
 */
export function useGetNotificationsQueries(
    workspaceId: string,
    productKeys: string[],
    size = 20,
    enabled = true,
) {
    return useQueries({
        queries: productKeys.map((productKey) => ({
            queryKey: notificationsQueryKey(workspaceId, productKey),
            queryFn: async () => {
                const page = await notificationService.list(workspaceId, productKey, false, 1, size);
                return page.data.map((notification) => ({ ...notification, productKey }));
            },
            enabled: enabled && !!workspaceId && !!productKey,
            refetchInterval: REFRESH_MS,
        })),
    });
}
