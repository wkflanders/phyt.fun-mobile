import { useEffect, useState } from 'react';
import { HKWorkoutActivityType, queryWorkoutSamples } from '@kingstinct/react-native-healthkit';
import type { HKWorkout, LengthUnit, EnergyUnit } from '@kingstinct/react-native-healthkit';

interface PastWorkoutsReturn {
    workouts: HKWorkout<EnergyUnit, LengthUnit>[];
    loading: boolean;
    error: Error | null;
}

/**
 * Get prior prob. distribution here
 */

export function usePastWorkouts({ enabled }: { enabled: boolean; }): PastWorkoutsReturn {
    const [workouts, setWorkouts] = useState<HKWorkout[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchWorkouts() {
            try {
                setLoading(true);
                const data = await queryWorkoutSamples(
                    {
                        limit: 20,
                        ascending: false,
                        energyUnit: 'kcal' as EnergyUnit,
                        distanceUnit: 'mi' as LengthUnit
                    }
                );
                const runningWorkouts = data.filter(
                    (w) => w.workoutActivityType === HKWorkoutActivityType.running
                );
                return runningWorkouts;
            } catch (err) {
                console.error('Error fetching workouts:', err);
                setError(err as Error);
            }
        }
        if (enabled) {
            void fetchWorkouts();
        } else {
            setLoading(false);
            setWorkouts([]);
        }
    }, [enabled]);

    return {
        workouts,
        loading,
        error
    };
}