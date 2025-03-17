import { useState, useEffect, useCallback } from 'react';
import type { HKWorkout, LengthUnit, EnergyUnit } from '@kingstinct/react-native-healthkit';
import { useHealthKit } from './useHealthKit';

interface PastWorkoutsReturn {
    workouts: HKWorkout<EnergyUnit, LengthUnit>[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * Get prior prob. distribution here - nah calc it on the server where it can't be tampered dumbass
 */

export function usePastWorkouts({ enabled = true }: { enabled: boolean; }): PastWorkoutsReturn {
    const [workouts, setWorkouts] = useState<HKWorkout[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    const { getRunningWorkouts } = useHealthKit();

    const fetchWorkouts = useCallback(async () => {
        if (!enabled) {
            setLoading(false);
            setWorkouts([]);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const runningWorkouts = await getRunningWorkouts(0, false);
            setWorkouts(runningWorkouts);
        } catch (error) {
            console.error('Error fetching workouts', error);
            setError(error instanceof Error ? error : new Error('Unknown error fetching workouts'));
        } finally {
            setLoading(false);
        }
    }, [enabled, getRunningWorkouts]);

    useEffect(() => {
        fetchWorkouts();
    }, [fetchWorkouts]);

    return {
        workouts,
        loading,
        error,
        refetch: fetchWorkouts
    };
}