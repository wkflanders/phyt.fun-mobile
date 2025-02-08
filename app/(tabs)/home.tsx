// app/(tabs)/home.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Alert,
    ScrollView,
} from 'react-native';
import {
    useHealthkitAuthorization,
    queryWorkoutSamplesWithAnchor,
    subscribeToChanges,
    HKWorkoutTypeIdentifier,
    HKWorkoutActivityType,
    HKQuantityTypeIdentifier,
    HKAuthorizationRequestStatus,
    HKWorkoutRouteTypeIdentifier,
    HKUnit,
} from '@kingstinct/react-native-healthkit';
import { type EnergyUnit, LengthUnit } from '@kingstinct/react-native-healthkit';
import { usePrivy } from '@privy-io/expo';
import { useIsFocused } from '@react-navigation/native';
import { usePastWorkouts } from '@/hooks/usePastWorkouts';
import { useSendWorkout, useSendWorkoutsBatch } from '@/hooks/useSendWorkout';
import { EchoLogo } from '@/components/EchoLogo';
import { WarningBanner } from '@/components/WarningBanner';
import { Loading } from '@/components/Loading';
import {
    requestNotificationPermissions,
    sendWorkoutSuccessNotification,
    sendWorkoutErrorNotification,
} from '@/lib/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WORKOUT_ANCHOR_KEY = 'workoutAnchor';

export default function Home() {
    const { user, isReady } = usePrivy();
    const [authorizationStatus, requestAuthorization] = useHealthkitAuthorization([
        HKQuantityTypeIdentifier.heartRate,
        HKQuantityTypeIdentifier.distanceWalkingRunning,
        HKWorkoutRouteTypeIdentifier,
        HKWorkoutTypeIdentifier,
    ]);
    const [sendingData, setSendingData] = useState(false);
    const [batchSent, setBatchSent] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [notificationsPermission, setNotificationsPermission] = useState(false);

    const { workouts, loading, error } = usePastWorkouts({
        enabled: authorizationStatus === HKAuthorizationRequestStatus.unnecessary,
    });
    const sendWorkout = useSendWorkout();
    const sendBatch = useSendWorkoutsBatch();
    const [workoutAnchor, setWorkoutAnchor] = useState<string>('');
    const isFocused = useIsFocused();

    useEffect(() => {
        async function setupNotifications() {
            const hasPermission = await requestNotificationPermissions();
            setNotificationsPermission(hasPermission);
            if (!hasPermission) {
                Alert.alert(
                    'Notifications Disabled',
                    'Enable notifications to receive workout sync updates.',
                    [{ text: 'OK' }]
                );
            }
        }
        setupNotifications();
    }, []);

    const toggleDataSending = useCallback(() => {
        if (sendWorkout.isError) {
            sendWorkout.reset();
        }
        setSendingData(prev => !prev);
        setBatchSent(false);
        setErrorMessage(null);
    }, [sendWorkout]);

    useEffect(() => {
        (async () => {
            if (
                authorizationStatus === HKAuthorizationRequestStatus.shouldRequest ||
                authorizationStatus === HKAuthorizationRequestStatus.unknown
            ) {
                try {
                    await requestAuthorization();
                } catch (err) {
                    console.error('Error requesting HealthKit authorization:', err);
                }
            }
        })();
    }, [authorizationStatus, requestAuthorization]);

    useEffect(() => {
        if (
            authorizationStatus !== null &&
            workouts.length > 0 &&
            sendingData &&
            !batchSent
        ) {
            sendBatch.mutate(workouts, {
                onSuccess: () => {
                    setBatchSent(true);
                    // Optionally you can notify the user of success.
                },
                onError: (err) => {
                    setErrorMessage(err instanceof Error ? err.message : 'Batch send failed');
                    setSendingData(false);
                    if (notificationsPermission) {
                        void sendWorkoutErrorNotification(err instanceof Error ? err.message : undefined);
                    }
                },
            });
        }
    }, [authorizationStatus, workouts, sendingData, batchSent, sendBatch, notificationsPermission]);

    useEffect(() => {
        let unsubscribe: (() => Promise<boolean>) | undefined;
        async function subscribeWorkouts() {
            unsubscribe = await subscribeToChanges(HKWorkoutTypeIdentifier, async () => {
                try {
                    const res = await queryWorkoutSamplesWithAnchor({
                        limit: 10,
                        anchor: workoutAnchor,
                        energyUnit: 'kcal' as EnergyUnit,
                        distanceUnit: 'm' as LengthUnit,
                    });
                    setWorkoutAnchor(res.newAnchor);
                    const newRunningWorkouts = res.samples.filter(
                        (w) => w.workoutActivityType === HKWorkoutActivityType.running
                    );
                    for (const workout of newRunningWorkouts) {
                        await sendWorkout.mutateAsync(workout);
                        if (notificationsPermission) {
                            await sendWorkoutSuccessNotification(workout);
                        }
                    }
                } catch (err) {
                    setErrorMessage(err instanceof Error ? err.message : 'Failed to send new workouts');
                    setSendingData(false);
                    if (notificationsPermission) {
                        await sendWorkoutErrorNotification(err instanceof Error ? err.message : undefined);
                    }
                }
            });
        }
        if (sendingData) {
            subscribeWorkouts();
        }
        return () => {
            if (unsubscribe) void unsubscribe();
        };
    }, [sendingData, workoutAnchor, notificationsPermission, sendWorkout]);

    useEffect(() => {
        if (sendWorkout.isError) {
            setErrorMessage(
                sendWorkout.error instanceof Error ? sendWorkout.error.message : 'Unknown error'
            );
            setSendingData(false);
            if (notificationsPermission) {
                void sendWorkoutErrorNotification(
                    sendWorkout.error instanceof Error ? sendWorkout.error.message : undefined
                );
            }
        }
    }, [sendWorkout.isError, notificationsPermission, sendWorkout.error]);

    if (!isReady || loading) {
        return <Loading />;
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error: {error.message}</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {errorMessage && (
                <WarningBanner
                    visible={true}
                    message={`Failed to send workout data: ${errorMessage}. Data tracking has stopped.`}
                    type="error"
                    duration={5000}
                    onDismiss={() => setErrorMessage(null)}
                />
            )}
            {!errorMessage && sendingData && (
                <WarningBanner
                    visible={true}
                    message="Your run workouts are now being tracked"
                    type="warning"
                />
            )}
            <View style={styles.content}>
                <TouchableOpacity onPress={toggleDataSending}>
                    <EchoLogo active={isFocused && sendingData} style={styles.logo} />
                </TouchableOpacity>
                <Text style={styles.infoText}>
                    {sendingData ? 'Sending workouts' : 'Not sending workouts'}
                </Text>
            </View>
        </ScrollView>
    );
}

const phytColors = {
    primary: '#00F6FB',
    accent: '#FE205D',
    background: '#101010',
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: phytColors.background,
        flexGrow: 1,
    },
    content: {
        flex: 1,
        paddingTop: 60,
        alignItems: 'center',
    },
    logo: {
        width: 200,
        height: 200,
    },
    errorContainer: {
        padding: 16,
        backgroundColor: phytColors.background,
    },
    errorText: {
        color: '#ff4444',
    },
    infoText: {
        color: '#fff',
        marginTop: 16,
    },
});
