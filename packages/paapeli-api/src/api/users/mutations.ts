import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPhoneRequest, usersService } from './users';

export function useSetMyPhoneMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['setMyPhone'],
        mutationFn: (req: UserPhoneRequest) => usersService.setPhone(req),
        onSuccess: (data) => {
            queryClient.setQueryData(['myPhone'], data);
        },
    });
}
