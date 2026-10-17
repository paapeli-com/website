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
