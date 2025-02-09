// lib/notifications.ts
import * as Notifications from 'expo-notifications';
import type { HKWorkout } from '@kingstinct/react-native-healthkit';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

export async function requestNotificationPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    return finalStatus === 'granted';
}

export async function scheduleNotification({
    title,
    body,
    data = {},
    showBanner = true
}: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
    showBanner?: boolean;
}) {
    if (showBanner) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
            },
            trigger: null,
        });
    }
}

export async function sendInitialSyncNotification(workoutCount: number) {
    await scheduleNotification({
        title: 'Workouts Synced Successfully',
        body: `${workoutCount} workouts have been synced to your account`,
        data: { type: 'initial_sync' },
        showBanner: false // Don't show push notification for initial sync
    });
}

export async function sendWorkoutSuccessNotification(workout: HKWorkout) {
    const distance = workout.totalDistance
        ? `${(workout.totalDistance.quantity / 1000).toFixed(2)}km`
        : 'distance not recorded';

    await scheduleNotification({
        title: 'Workout Synced Successfully',
        body: `Your run (${distance}) has been recorded`,
        data: { type: 'workout_success', workoutDetails: workout },
        showBanner: true
    });
}

export async function sendWorkoutErrorNotification(error?: string) {
    await scheduleNotification({
        title: 'Workout Sync Failed',
        body: error || 'Failed to sync your workout data. Please try again.',
        data: { type: 'workout_error' },
        showBanner: true
    });
}