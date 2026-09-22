import { useMutation } from '@tanstack/react-query';
import {
    authService,
    GoogleSignInRequest,
    LoginRequest,
    RequestPasswordResetRequest,
    ResetPasswordRequest,
    SignupRequest,
} from './auth';

export function useLoginMutation() {
    return useMutation({
        mutationKey: ['login'],
        mutationFn: (req: LoginRequest) => authService.login(req),
    });
}

export function useGoogleSignInMutation() {
    return useMutation({
        mutationKey: ['googleSignIn'],
        mutationFn: (req: GoogleSignInRequest) => authService.googleSignIn(req),
    });
}

export function useSignupMutation() {
    return useMutation({
        mutationKey: ['signup'],
        mutationFn: (req: SignupRequest) => authService.signup(req),
    });
}

export function useRequestPasswordResetMutation() {
    return useMutation({
        mutationKey: ['requestPasswordReset'],
        mutationFn: (req: RequestPasswordResetRequest) =>
            authService.requestPasswordReset(req),
    });
}

export function useResetPasswordMutation() {
    return useMutation({
        mutationKey: ['resetPassword'],
        mutationFn: (req: ResetPasswordRequest) => authService.resetPassword(req),
    });
}

export function useLogoutMutation() {
    return useMutation({
        mutationKey: ['logout'],
        mutationFn: () => authService.logout(),
    });
}

export function useLogoutAllMutation() {
    return useMutation({
        mutationKey: ['logoutAll'],
        mutationFn: () => authService.logoutAll(),
    });
}
