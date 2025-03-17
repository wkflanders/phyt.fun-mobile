import { useState, useCallback } from 'react';
import {
    useHealthkitAuthorization,
    queryWorkoutSamples,
    HKWorkoutActivityType,
    HKAuthorizationRequestStatus,
    queryWorkoutSamplesWithAnchor,
    HKQuantityTypeIdentifier,
    HKWorkoutRouteTypeIdentifier,
    HKWorkoutTypeIdentifier,
    type HKWorkout,
    getWorkoutRoutes,
    DeletedWorkoutSampleRaw,
} from '@kingstinct/react-native-healthkit';
import type { EnergyUnit, LengthUnit } from '@kingstinct/react-native-healthkit';

const HK_AUTH_TYPES = [
    HKQuantityTypeIdentifier.heartRate,
    HKQuantityTypeIdentifier.distanceWalkingRunning,
    HKWorkoutRouteTypeIdentifier,
    HKWorkoutTypeIdentifier
];

interface UseHealthKitResult {
    authorizationStatus: HKAuthorizationRequestStatus;
    requestAuthorization: () => Promise<void>;
    isAuthorized: boolean;
    isError: boolean;
    error: Error | null;
    getRunningWorkouts: (limit?: number, ascending?: boolean) => Promise<HKWorkout[]>;
    getWorkoutWithAnchor: (anchor: string, limit?: number) => Promise<{
        samples: HKWorkout<EnergyUnit, LengthUnit>[];
        deletedSamples: readonly DeletedWorkoutSampleRaw[];
        newAnchor: string;
    }>;
    mapWorkoutToPayload: (workout: HKWorkout) => Promise<any>;
}

export function useHealthKit(): UseHealthKitResult {
    const [authorizationStatus, requestAuth] = useHealthkitAuthorization(HK_AUTH_TYPES);
    const [error, setError] = useState<Error | null>(null);

    const isAuthorized = authorizationStatus === HKAuthorizationRequestStatus.unknown || authorizationStatus === HKAuthorizationRequestStatus.shouldRequest;

    const requestAuthorization = async () => {
        try {
            await requestAuth();
        } catch (error: any) {
            setError(error as Error);
        }
    };

    const getRunningWorkouts = useCallback(async (limit = 10, ascending = false) => {
        try {
            const workouts = await queryWorkoutSamples({
                limit,
                ascending,
                energyUnit: 'kcal' as EnergyUnit,
                distanceUnit: 'm' as LengthUnit,
            });
            return workouts.filter(
                workout => workout.workoutActivityType === HKWorkoutActivityType.running
            );
        } catch (error) {
            setError(error as Error);
            return [];
        }
    }, []);

    const getWorkoutWithAnchor = useCallback(async (anchor: string, limit = 10) => {
        try {
            const result = await queryWorkoutSamplesWithAnchor({
                anchor,
                limit,
                energyUnit: 'kcal' as EnergyUnit,
                distanceUnit: 'm' as LengthUnit,
            });

            const runningWorkouts = result.samples.filter(
                workout => workout.workoutActivityType === HKWorkoutActivityType.running
            );

            return {
                ...result,
                samples: runningWorkouts
            };
        } catch (error) {
            setError(error as Error);
            return {
                samples: [],
                deletedSamples: [],
                newAnchor: anchor,
            };
        }
    }, []);

    const mapWorkoutToPayload = useCallback(async (workout: HKWorkout) => {
        let gpsRouteData;
        try {
            gpsRouteData = await getWorkoutRoutes(workout.uuid);
        } catch (error) {
            setError(error as Error);
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
    }, []);

    return {
        authorizationStatus: authorizationStatus || HKAuthorizationRequestStatus.unknown,
        requestAuthorization,
        isAuthorized,
        error,
        isError: error !== null,
        getRunningWorkouts,
        getWorkoutWithAnchor,
        mapWorkoutToPayload,
    };

}