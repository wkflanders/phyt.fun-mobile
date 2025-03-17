import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/expo';
import {
    getUser,
    applyForRunner
} from '@/queries/user';
import { User, RunnerAppResponse, WorkoutBatch, ApiError } from '@/types';

export function useUser() {
    const { getAccessToken, user } = usePrivy();

    return useQuery<User, ApiError>({
        queryKey: ['user', user?.id],
        queryFn: async () => {
            if (!user?.id) {
                throw new Error('No authenticated user');
            }
            const token = await getAccessToken();

            const userData = await getUser(user.id, token);
            return userData;
        },
        enabled: !!user?.id
    });
}

export function useRunnerApplication() {
    const { getAccessToken, user } = usePrivy();
    const queryClient = useQueryClient();

    return useMutation<RunnerAppResponse, ApiError, WorkoutBatch>({
        mutationFn: async ({ workouts }) => {
            if (!user?.id) {
                throw new Error('No authenticated user');
            }
            const privyId = user?.id;
            const token = await getAccessToken();

            return applyForRunner({ workouts }, privyId, token);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error) => {
            console.error('Error creating runner application', error);
        }
    });
}