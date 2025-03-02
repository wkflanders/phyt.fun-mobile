import { useMutation } from '@tanstack/react-query';
import type { HKWorkout } from '@kingstinct/react-native-healthkit';
import { getWorkoutRoutes } from '@kingstinct/react-native-healthkit';

const API_URL = process.env.API_URL || 'https://10.0.0.211/api';

async function mapWorkoutToPayload(workout: HKWorkout) {
    let gpsRouteData;
    try {
        gpsRouteData = await getWorkoutRoutes(workout.uuid);
    } catch {
        gpsRouteData = undefined;
    }
    return {
        start_time: workout.startDate.toISOString(),
        end_time: workout.endDate.toISOString(),
        duration_seconds:
            (workout.endDate.getTime() - workout.startDate.getTime()) / 1000,
        distance_m: workout.totalDistance ? workout.totalDistance.quantity : 0,
        average_pace_sec:
            workout.totalDistance && workout.totalDistance.quantity > 0
                ? (workout.endDate.getTime() - workout.startDate.getTime()) / 1000 / workout.totalDistance.quantity
                : undefined,
        calories_burned: workout.totalEnergyBurned ? workout.totalEnergyBurned.quantity : undefined,
        step_count: workout.metadata?.stepCount,
        elevation_gain_m: workout.metadata?.elevationGain,
        average_heart_rate: workout.metadata?.averageHeartRate,
        max_heart_rate: workout.metadata?.maxHeartRate,
        device_id: workout.sourceRevision ? workout.sourceRevision.source.bundleIdentifier : undefined,
        gps_route_data: gpsRouteData ? JSON.stringify(gpsRouteData) : undefined,
        raw_data_json: {},
    };
}

export function useSendWorkout() {
    return useMutation({
        mutationFn: async ({ workout, userId }: { workout: HKWorkout; userId: string; }) => {
            const payload = await mapWorkoutToPayload(workout);
            const response = await fetch(`${API_URL}/workouts/runs/single/${userId}`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
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
    return useMutation({
        mutationFn: async ({ workouts, userId }: { workouts: HKWorkout[]; userId: string; }) => {
            const payloads = await Promise.all(workouts.map(mapWorkoutToPayload));
            const response = await fetch(`${API_URL}/workouts/runs/batch/${userId}`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloads),
            });
            if (!response.ok) {
                throw new Error('Failed to send batch workout data');
            }
            return response.json();
        },
    });
}
