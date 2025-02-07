import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import {
    useHealthkitAuthorization,
    queryWorkoutSamplesWithAnchor,
    subscribeToChanges,
    HKWorkoutTypeIdentifier,
    HKWorkoutActivityType,
    HKQuantityTypeIdentifier,
    HKAuthorizationRequestStatus,
    HKWorkoutRouteTypeIdentifier
} from '@kingstinct/react-native-healthkit';
import { type EnergyUnit, LengthUnit } from '@kingstinct/react-native-healthkit';
import { usePrivy } from '@privy-io/expo';
import { useIsFocused } from '@react-navigation/native';
import { usePastWorkouts } from '@/hooks/usePastWorkouts';
import { useSendWorkout } from '@/hooks/useSendWorkout';
import { EchoLogo } from '@/components/EchoLogo';
import { WarningBanner } from '@/components/WarningBanner';
import { Loading } from '@/components/Loading';
import {
    requestNotificationPermissions,
    sendWorkoutSuccessNotification,
    sendWorkoutErrorNotification
} from '@/lib/notifications';

export default function Home() {
    const { user, isReady } = usePrivy();
    const [authorizationStatus, requestAuthorization] = useHealthkitAuthorization([
        HKQuantityTypeIdentifier.heartRate,
        HKQuantityTypeIdentifier.distanceWalkingRunning,
        HKWorkoutRouteTypeIdentifier,
        HKWorkoutTypeIdentifier
    ]);
    const [sendingData, setSendingData] = useState(false);
    const [initialDataSent, setInitialDataSent] = useState(false);
    const [requestSend, setRequestSend] = useState(false);
    const [showErrorBanner, setShowErrorBanner] = useState(false);
    const [notificationsPermission, setNotificationsPermission] = useState(false);
    const shouldQueryWorkouts = authorizationStatus === HKAuthorizationRequestStatus.unnecessary;
    const { workouts, loading, error } = usePastWorkouts({
        enabled: shouldQueryWorkouts,
    });
    const sendWorkout = useSendWorkout();
    const [workoutAnchor, setWorkoutAnchor] = useState<string>('');
    const isFocused = useIsFocused();

    // Request notification permissions on mount
    useEffect(() => {
        async function setupNotifications() {
            const hasPermission = await requestNotificationPermissions();
            setNotificationsPermission(hasPermission);

            if (!hasPermission) {
                Alert.alert(
                    'Notifications Disabled',
                    'Enable notifications to receive updates about your workout syncs.',
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
    }, [sendWorkout]);

    useEffect(() => {
        (async () => {
            if (authorizationStatus === 0 || authorizationStatus === 1) {
                try {
                    await requestAuthorization();
                } catch (error) {
                    console.error('Error requesting HealthKit authorization:', error);
                }
            }
        })();
    }, [authorizationStatus]);

    useEffect(() => {
        async function sendInitialWorkouts() {
            if (workouts.length > 0) {
                for (const workout of workouts) {
                    try {
                        await sendWorkout.mutateAsync(workout);
                        if (notificationsPermission) {
                            await sendWorkoutSuccessNotification(workout);
                        }
                    } catch (error) {
                        if (notificationsPermission) {
                            await sendWorkoutErrorNotification(error instanceof Error ? error.message : undefined);
                        }
                    }
                }
                setInitialDataSent(true);
            }
        }

        if (
            (authorizationStatus &&
                authorizationStatus !== null &&
                workouts.length > 0) && (!initialDataSent || requestSend)
        ) {
            void sendInitialWorkouts();
        }
    }, [authorizationStatus, workouts, initialDataSent, requestSend, notificationsPermission]);

    useEffect(() => {
        let unsubscribe: (() => Promise<boolean>) | undefined;

        async function subscribeToWorkoutChanges() {
            unsubscribe = await subscribeToChanges(HKWorkoutTypeIdentifier, async () => {
                try {
                    const res = await queryWorkoutSamplesWithAnchor({
                        limit: 10,
                        anchor: workoutAnchor,
                        energyUnit: 'kcal' as EnergyUnit,
                        distanceUnit: 'mi' as LengthUnit,
                    });
                    setWorkoutAnchor(res.newAnchor);
                    const newRunningWorkouts = res.samples.filter(
                        (w) => w.workoutActivityType === HKWorkoutActivityType.running
                    );

                    // Send workouts and notify
                    for (const workout of newRunningWorkouts) {
                        try {
                            await sendWorkout.mutateAsync(workout);
                            if (notificationsPermission) {
                                await sendWorkoutSuccessNotification(workout);
                            }
                        } catch (error) {
                            if (notificationsPermission) {
                                await sendWorkoutErrorNotification(error instanceof Error ? error.message : undefined);
                            }
                        }
                    }
                } catch (err) {
                    console.error('Error querying new workout samples:', err);
                    if (notificationsPermission) {
                        await sendWorkoutErrorNotification('Failed to query new workouts');
                    }
                }
            });
        }

        if (sendingData) {
            subscribeToWorkoutChanges();
        }

        return () => {
            if (unsubscribe) {
                void unsubscribe();
            }
        };
    }, [sendingData, workoutAnchor, notificationsPermission]);

    useEffect(() => {
        if (sendWorkout.isError) {
            setSendingData(false);
            setShowErrorBanner(true);
            if (notificationsPermission) {
                void sendWorkoutErrorNotification(
                    sendWorkout.error instanceof Error ? sendWorkout.error.message : undefined
                );
            }
        }
    }, [sendWorkout.isError, notificationsPermission]);

    if (!isReady || loading) {
        return <Loading />;
    }

    if (error) {
        return (
            <View style={{ padding: 16, backgroundColor: phytColors.background }}>
                <Text style={{ color: '#ff4444' }}>Error: {error.message}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <WarningBanner
                visible={sendingData}
                message="Your run workouts are now being tracked"
                type="warning"
            />
            <WarningBanner
                visible={showErrorBanner}
                message={`Failed to send workout data: ${sendWorkout.error instanceof Error ? sendWorkout.error.message : 'Unknown error'
                    }. Data tracking has stopped.`}
                type="error"
                duration={5000}
                onDismiss={() => setShowErrorBanner(false)}
            />

            <View style={styles.content}>
                <TouchableOpacity onPress={toggleDataSending}>
                    <EchoLogo active={isFocused && sendingData} style={styles.logo} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const phytColors = {
    primary: '#00F6FB', // phyt_blue
    accent: '#FE205D', // phyt_red
    background: '#101010', // phyt_bg
    textSecondary: '#777798', // phyt_text_secondary
    formBg: '#13122A', // phyt_form
    formPlaceholder: '#58587B', // phyt_form_placeholder
    formBorder: '#5454BF', // phyt_form_border
    formText: '#ff00f7', // phyt_form_text
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: phytColors.background,
    },
    content: {
        flex: 1,
        paddingTop: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 200,
        height: 200,
    },
});