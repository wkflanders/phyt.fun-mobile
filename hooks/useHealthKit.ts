import { useState, useEffect, useCallback } from 'react';
import {
    useHealthkitAuthorization,
    queryWorkoutSamples,
    HKWorkoutActivityType,
    HKWorkoutTypeIdentifier,
    HKQuantityTypeIdentifier,
    HKAuthorizationRequestStatus,
    HKWorkoutRouteTypeIdentifier,
    queryWorkoutSamplesWithAnchor,
    type HKWorkout,
    getWorkoutRoutes,
} from '@kingstinct/react-native-healthkit';
import type { EnergyUnit, LengthUnit } from '@kingstinct/react-native-healthkit';

const REQUIRED_TYPES = [
    HKQuantityTypeIdentifier.heartRate,
    HKQuantityTypeIdentifier.distanceWalkingRunning,
    HKWorkoutRouteTypeIdentifier,
    HKWorkoutTypeIdentifier,
];

interface UseHealthKitResult {
    authorizationStatuS: HKAuthorizationRequestStatus;
    requestAuthorization: () => Promise<void>;
    isAuthorized: boolean;
    isError: boolean;
    error: Error | null;
    getRunningWorkouts: (limit?: number, ascending?: boolean) => Promise<HKWorkout[]>;
    getWorkoutWithAnchor: (anchor: string, limit?: number) => Promise<{
        samples: HKWorkout[];
        deletedSamples: HKWorkout[];
        newAnchor: string;
    }>;
    mapWorkoutToPayload: (workout: HKWorkout) => Promise<any>;
}

export function useHealthKit(): UseHealthKitResult {
    const [authorizationStatus, requestAuth] = useHealthkitAuthorization(REQUIRED_TYPES);
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
            return await queryWorkoutSamplesWithAnchor({
                anchor,
                limit,
                energyUnit: 'kcal' as EnergyUnit,
                distanceUnit: 'm' as LengthUnit,
            });
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
        try {
            const routes = await getWorkoutRoutes(workout.uuid);
            return {
                ...workout,
                routes,
            };
        } catch (error) {
            setError(error as Error);
            return null;
        }
    }, []);

    return {
        authorizationStatus,
        requestAuthorization,
        isAuthorized,
        error,
        isError: error !== null,
        getRunningWorkouts,
        getWorkoutWithAnchor,
        mapWorkoutToPayload,
    };

}