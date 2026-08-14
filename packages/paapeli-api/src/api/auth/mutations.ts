import { useMutation } from '@tanstack/react-query';
import { authService, LoginRequest, SignupRequest } from './auth';

export function useLoginMutation() {
    return useMutation({
        mutationKey: ['login'],
        mutationFn: (req: LoginRequest) => authService.login(req),
    });
}

export function useSignupMutation() {
    return useMutation({
        mutationKey: ['signup'],
        mutationFn: (req: SignupRequest) => authService.signup(req),
    });
}
