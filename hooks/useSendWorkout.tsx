import { useMutation } from '@tanstack/react-query';
import { HKWorkout } from '@kingstinct/react-native-healthkit';

const API_URL = process.env.API_URL || 'https://localhost:4000/api';

export function useSendWorkout() {
    return useMutation({
        mutationFn: async (workouts: HKWorkout) => {
            const response = await fetch(`${API_URL}/:privyId/workouts`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(workouts),
            });

            if (!response.ok) {
                throw new Error('Failed to send workouts');
            }

            return response.json();
        },
    });
}