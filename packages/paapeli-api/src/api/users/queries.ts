import { useQuery } from '@tanstack/react-query';
import { usersService } from './users';

/** The signed-in user's phone contact; the query errors with 404 when none is set. */
export function useGetMyPhoneQuery(enabled = true) {
    return useQuery({
        queryKey: ['myPhone'],
        queryFn: () => usersService.getPhone(),
        enabled,
        // 404 is "no phone yet" — an answer, not a failure worth retrying.
        retry: (count, error) =>
            (error as { response?: { status?: number } })?.response?.status !== 404 && count < 2,
    });
}
