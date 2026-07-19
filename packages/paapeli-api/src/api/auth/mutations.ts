import { useMutation } from '@tanstack/react-query';
import { authService, LoginRequest } from './auth';

export function useLoginMutation() {
    return useMutation({
        mutationKey: ['login'],
        mutationFn: (req: LoginRequest) => authService.login(req),
    });
}
