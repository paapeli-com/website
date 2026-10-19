import { useQueries } from '@tanstack/react-query';
import { searchService, type SearchResponse } from './search';

/**
 * The same query run against several workspace products at once, one result
 * per product key, in the order given. A product that fails (not subscribed,
 * no access) reports its error without holding up the others.
 */
export function useSearchProductsQueries(workspaceId: string, productKeys: string[], q: string) {
    const enabled = !!workspaceId && q.trim().length >= 2;
    return useQueries({
        queries: productKeys.map((productKey) => ({
            queryKey: ['search', workspaceId, productKey, q],
            queryFn: (): Promise<SearchResponse> => searchService.search(workspaceId, productKey, q),
            enabled,
            staleTime: 30_000,
            retry: false,
            // Keep the last hits on screen while the next keystroke's load.
            placeholderData: (previous: SearchResponse | undefined) => previous,
        })),
    });
}
