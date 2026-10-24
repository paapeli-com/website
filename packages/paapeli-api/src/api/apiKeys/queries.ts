import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiKeysService, type CreateApiKeyRequest } from './apiKeys';

const key = (workspaceId: string) => ['apiKeys', workspaceId];

export function useListApiKeysQuery(workspaceId: string, enabled = true) {
    return useQuery({
        queryKey: key(workspaceId),
        queryFn: () => apiKeysService.list(workspaceId),
        enabled: enabled && !!workspaceId,
    });
}

export function useCreateApiKeyMutation(workspaceId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['createApiKey'],
        mutationFn: (req: CreateApiKeyRequest) => apiKeysService.create(workspaceId, req),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: key(workspaceId) }),
    });
}

export function useRevokeApiKeysMutation(workspaceId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['revokeApiKeys'],
        // One request per key; a partial failure still refreshes the list.
        mutationFn: (apiKeyIds: string[]) =>
            Promise.all(apiKeyIds.map((id) => apiKeysService.revoke(workspaceId, id))),
        onSettled: () => queryClient.invalidateQueries({ queryKey: key(workspaceId) }),
    });
}

export function useRemoveApiKeyGrantMutation(workspaceId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['removeApiKeyGrant'],
        mutationFn: ({ apiKeyId, productKey }: { apiKeyId: string; productKey: string }) =>
            apiKeysService.removeGrant(workspaceId, apiKeyId, productKey),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: key(workspaceId) }),
    });
}
