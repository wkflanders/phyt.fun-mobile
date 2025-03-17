import { useMutation } from '@tanstack/react-query';
import type { HKWorkout } from '@kingstinct/react-native-healthkit';
import { usePrivy } from '@privy-io/expo';
import { useHealthKit } from './useHealthKit';

const API_URL = process.env.API_URL || 'http://10.0.0.211:4000/api';

export function useSendWorkout() {
    const { getAccessToken } = usePrivy();
    const { mapWorkoutToPayload } = useHealthKit();

    return useMutation({
        mutationFn: async ({ workout, userId }: { workout: HKWorkout; userId: string; }) => {
            const token = await getAccessToken();
            const payload = await mapWorkoutToPayload(workout);

            const response = await fetch(`${API_URL}/workouts/runs/single/${userId}`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                throw new Error('Failed to send workout data');
            }
            return response.json();
        },
    });
}

export function useSendWorkoutsBatch() {
    const { getAccessToken } = usePrivy();
    const { mapWorkoutToPayload } = useHealthKit();

    return useMutation({
        mutationFn: async ({ workouts, userId }: { workouts: HKWorkout[]; userId: string; }) => {
            const token = await getAccessToken();
            const payloads = await Promise.all(workouts.map(mapWorkoutToPayload));

            const response = await fetch(`${API_URL}/workouts/runs/batch/${userId}`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payloads),
            });
            if (!response.ok) {
                throw new Error('Failed to send batch workout data');
            }
            return response.json();
        },
    });
}
