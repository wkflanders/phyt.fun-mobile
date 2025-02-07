import * as Notifications from 'expo-notifications';
import type { HKWorkout } from '@kingstinct/react-native-healthkit';
import type { EnergyUnit, LengthUnit } from '@kingstinct/react-native-healthkit';
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: true,
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
    data = {}
}: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
}) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data,
        },
        trigger: null,
    });
}

export async function sendWorkoutSuccessNotification(workout: HKWorkout<EnergyUnit, LengthUnit>) {
    const distance = workout.totalDistance
        ? `${workout.totalDistance.quantity.toFixed(2)} ${workout.totalDistance.unit}`
        : 'distance not recorded';

    await scheduleNotification({
        title: 'Workout Synced Successfully',
        body: `Your run (${distance}) has been recorded`,
        data: { type: 'workout_success', workoutDetails: workout },
    });
}

export async function sendWorkoutErrorNotification(error?: string) {
    await scheduleNotification({
        title: 'Workout Sync Failed',
        body: error || 'Failed to sync your workout data. Please try again.',
        data: { type: 'workout_error' },
    });
}