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
    type HKWorkout,
} from '@kingstinct/react-native-healthkit';
import { type EnergyUnit, type LengthUnit } from '@kingstinct/react-native-healthkit';
import { usePrivy } from '@privy-io/expo';
import { useIsFocused } from '@react-navigation/native';
import { usePastWorkouts } from '@/hooks/usePastWorkouts';
import { useSendWorkout, useSendWorkoutsBatch } from '@/hooks/useSendWorkout';
import { EchoLogo } from '@/components/EchoLogo';
import { WarningBanner } from '@/components/WarningBanner';
import { Loading } from '@/components/Loading';
import {
    filterUnsyncedWorkouts,
    addSentWorkoutIds,
    setInitialSyncDone,
    isInitialSyncDone,
} from '@/lib/workoutStorage';
import {
    requestNotificationPermissions,
    sendInitialSyncNotification,
    sendWorkoutSuccessNotification,
    sendWorkoutErrorNotification,
} from '@/lib/notifications';
import { router } from 'expo-router';

export default function Home() {
    const { user, isReady } = usePrivy();
    const [authorizationStatus, requestAuthorization] = useHealthkitAuthorization([
        HKQuantityTypeIdentifier.heartRate,
        HKQuantityTypeIdentifier.distanceWalkingRunning,
        HKWorkoutRouteTypeIdentifier,
        HKWorkoutTypeIdentifier,
    ]);
    const [sendingData, setSendingData] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [notificationsPermission, setNotificationsPermission] = useState(false);
    const [workoutAnchor, setWorkoutAnchor] = useState<string>('');
    const [initialSyncStatus, setInitialSyncStatus] = useState<'pending' | 'success' | 'error' | null>(null);

    const { workouts, loading, error } = usePastWorkouts({
        enabled: authorizationStatus === HKAuthorizationRequestStatus.unnecessary,
    });
    const sendWorkout = useSendWorkout();
    const sendBatch = useSendWorkoutsBatch();
    const isFocused = useIsFocused();

    // All hooks must be defined before any conditional logic

    // Request permissions on mount
    useEffect(() => {
        async function setupPermissions() {
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
        setupPermissions();
    }, []);

    // Handle HealthKit authorization
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
                    setErrorMessage('Failed to get HealthKit authorization');
                }
            }
        })();
    }, [authorizationStatus, requestAuthorization]);

    // Initial batch sync of past workouts
    useEffect(() => {
        if (
            authorizationStatus === HKAuthorizationRequestStatus.unnecessary &&
            workouts.length > 0 &&
            sendingData &&
            initialSyncStatus === 'pending' &&
            user // Check for user here instead of returning early
        ) {
            (async () => {
                try {
                    // Filter out already sent workouts
                    const unsyncedWorkouts = await filterUnsyncedWorkouts(workouts);

                    if (unsyncedWorkouts.length === 0) {
                        setInitialSyncStatus('success');
                        return;
                    }

                    // Send workouts
                    await sendBatch.mutateAsync({ workouts: unsyncedWorkouts, userId: user.id });

                    // Record sent workout IDs
                    await addSentWorkoutIds(unsyncedWorkouts.map(w => w.uuid));

                    // Check if this was initial sync
                    const wasInitialSync = !(await isInitialSyncDone());
                    if (wasInitialSync) {
                        await setInitialSyncDone(true);
                        await sendInitialSyncNotification(unsyncedWorkouts.length);
                    }

                    setInitialSyncStatus('success');
                } catch (err) {
                    setErrorMessage(err instanceof Error ? err.message : 'Initial sync failed');
                    setInitialSyncStatus('error');
                    setSendingData(false);
                    if (notificationsPermission) {
                        await sendWorkoutErrorNotification(err instanceof Error ? err.message : undefined);
                    }
                }
            })();
        }
    }, [authorizationStatus, workouts, sendingData, initialSyncStatus, user, sendBatch, notificationsPermission]);

    // Subscribe to new workouts
    useEffect(() => {
        let unsubscribe: (() => Promise<boolean>) | undefined;

        async function subscribeWorkouts() {
            if (!user) return; // Check for user here instead of returning early

            unsubscribe = await subscribeToChanges(HKWorkoutTypeIdentifier, async () => {
                try {
                    const res = await queryWorkoutSamplesWithAnchor({
                        limit: 10,
                        anchor: workoutAnchor,
                        energyUnit: 'kcal' as EnergyUnit,
                        distanceUnit: 'm' as LengthUnit,
                    });

                    setWorkoutAnchor(res.newAnchor);

                    // Filter new running workouts
                    const newRunningWorkouts = res.samples.filter(
                        (w: HKWorkout) => w.workoutActivityType === HKWorkoutActivityType.running
                    );

                    // Filter out already sent workouts
                    const unsyncedWorkouts = await filterUnsyncedWorkouts(newRunningWorkouts);

                    for (const workout of unsyncedWorkouts) {
                        await sendWorkout.mutateAsync({ workout, userId: user.id });
                        await addSentWorkoutIds([workout.uuid]);
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

        if (sendingData && initialSyncStatus === 'success') {
            subscribeWorkouts();
        }

        return () => {
            if (unsubscribe) void unsubscribe();
        };
    }, [sendingData, workoutAnchor, notificationsPermission, initialSyncStatus, user, sendWorkout]);

    const toggleDataSending = useCallback(() => {
        if (sendWorkout.isError) {
            sendWorkout.reset();
        }
        setErrorMessage(null);
        setSendingData(prev => !prev);
        setInitialSyncStatus(prev => prev === null ? 'pending' : prev);
    }, [sendWorkout]);

    // Render different UI states based on conditions
    if (!isReady || loading) {
        return <Loading />;
    }

    if (isReady && !user) {
        router.push('/');
        return <Loading />; // Return a placeholder while navigation happens
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
            {!errorMessage && sendingData && initialSyncStatus === 'success' && (
                <WarningBanner
                    visible={true}
                    message="Your run workouts are now being tracked"
                    type="warning"
                />
            )}
            {!errorMessage && sendingData && initialSyncStatus === 'pending' && (
                <WarningBanner
                    visible={true}
                    message="Syncing your existing workouts..."
                    type="warning"
                />
            )}
            <View style={styles.content}>
                <TouchableOpacity onPress={toggleDataSending}>
                    <EchoLogo active={isFocused && sendingData} style={styles.logo} />
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#101010', // phyt_bg
        flexGrow: 1,
    },
    content: {
        flex: 1,
        paddingTop: 60,
        alignItems: 'center',
        justifyContent: 'center'
    },
    logo: {
        width: 200,
        height: 200,
    },
    errorContainer: {
        padding: 16,
        backgroundColor: '#101010',
    },
    errorText: {
        color: '#ff4444',
    },
    infoText: {
        color: '#fff',
        marginTop: 16,
    },
});