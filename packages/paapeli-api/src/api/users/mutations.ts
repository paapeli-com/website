import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChangePasswordRequest, UserPhoneRequest, usersService } from './users';

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

/** Saves the name shown for the user; the member lists that show it refresh. */
export function useUpdateMyProfileMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['updateMyProfile'],
        mutationFn: (req: { displayName: string | null }) => usersService.updateProfile(req),
        onSuccess: (data) => {
            queryClient.setQueryData(['myProfile'], data);
            queryClient.invalidateQueries({ queryKey: ['workspaceMembers'] });
        },
    });
}

/** Texts a verification code to the saved phone. */
export function useSendPhoneVerificationMutation() {
    return useMutation({
        mutationKey: ['sendPhoneVerification'],
        mutationFn: () => usersService.sendPhoneVerification(),
    });
}

/** Checks the texted code; on success the stored phone reads verified. */
export function useConfirmPhoneVerificationMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['confirmPhoneVerification'],
        mutationFn: (code: string) => usersService.confirmPhoneVerification(code),
        onSuccess: (data) => {
            queryClient.setQueryData(['myPhone'], data);
        },
    });
}

/* The account's own security. Each that changes what GET /users/me reports
   refreshes it, so the account settings page shows the new state. */

/** Stores the panel colour on the account. */
export function useSavePreferencesMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['savePreferences'],
        mutationFn: (req: { panelAccent: string | null }) => usersService.savePreferences(req),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myProfile'] }),
    });
}

/** Changes the password; every session is signed out after, this one included. */
export function useChangePasswordMutation() {
    return useMutation({
        mutationKey: ['changePassword'],
        mutationFn: (req: ChangePasswordRequest) => usersService.changePassword(req),
    });
}

export function useSetupTwoFactorMutation() {
    return useMutation({
        mutationKey: ['setupTwoFactor'],
        mutationFn: () => usersService.setupTwoFactor(),
    });
}

export function useEnableTwoFactorMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['enableTwoFactor'],
        mutationFn: (code: string) => usersService.enableTwoFactor(code),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myProfile'] }),
    });
}

export function useDisableTwoFactorMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['disableTwoFactor'],
        mutationFn: (code: string) => usersService.disableTwoFactor(code),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myProfile'] }),
    });
}

export function useRegenerateRecoveryCodesMutation() {
    return useMutation({
        mutationKey: ['regenerateRecoveryCodes'],
        mutationFn: (code: string) => usersService.regenerateRecoveryCodes(code),
    });
}

export function useSetRecoveryEmailMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['setRecoveryEmail'],
        mutationFn: (email: string) => usersService.setRecoveryEmail(email),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myProfile'] }),
    });
}

export function useConfirmRecoveryEmailMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['confirmRecoveryEmail'],
        mutationFn: (code: string) => usersService.confirmRecoveryEmail(code),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myProfile'] }),
    });
}

export function useRemoveRecoveryEmailMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['removeRecoveryEmail'],
        mutationFn: () => usersService.removeRecoveryEmail(),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myProfile'] }),
    });
}
