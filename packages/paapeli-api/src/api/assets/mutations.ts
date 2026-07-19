import { useMutation } from '@tanstack/react-query';
import { assetsService, CreateAssetRequest } from './assets';

export function useCreateAssetMutation() {
    return useMutation({
        mutationKey: ['createAsset'],
        mutationFn: (req: CreateAssetRequest) => assetsService.create(req),
    });
}
