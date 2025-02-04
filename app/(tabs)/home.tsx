import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

import {
    useHealthkitAuthorization,
    queryWorkoutSamplesWithAnchor,
    subscribeToChanges,
    HKWorkoutTypeIdentifier,
    HKWorkoutActivityType,
    HKQuantityTypeIdentifier,
} from '@kingstinct/react-native-healthkit';
import { type EnergyUnit, LengthUnit } from '@kingstinct/react-native-healthkit';
import { usePrivy } from '@privy-io/expo';
import { useIsFocused } from '@react-navigation/native';
import { usePastWorkouts } from '@/hooks/usePastWorkouts';
import { EchoLogo } from '@/components/EchoLogo';
import { WarningBanner } from '@/components/WarningBanner';
import { Loading } from '@/components/Loading';

export default function Home() {
    const { user, isReady } = usePrivy();
    const [authorizationStatus, requestAuthorization] = useHealthkitAuthorization([
        HKQuantityTypeIdentifier.heartRate,
        HKQuantityTypeIdentifier.distanceWalkingRunning,
        HKWorkoutTypeIdentifier
    ]);
    const [sendingData, setSendingData] = useState(false);
    const [initialDataSent, setInitialDataSent] = useState(false);
    const { workouts, loading, error } = usePastWorkouts();
    const [workoutAnchor, setWorkoutAnchor] = useState<string>('');
    const isFocused = useIsFocused();

    const toggleDataSending = useCallback(() => {
        setSendingData(prev => !prev);
    }, []);

    useEffect(() => {
        if (authorizationStatus === null) {
            void requestAuthorization();
        }
    }, [authorizationStatus, requestAuthorization]);

    useEffect(() => {
        async function sendInitialWorkouts() {
            if (workouts.length > 0) {
                // Replace this with your actual API call:
                console.log('Sending previous workouts:', workouts);
                // e.g., await fetch(API_URL + '/sendWorkouts', { method: 'POST', body: JSON.stringify(workouts) });
                setInitialDataSent(true);
            }
        }
        if (
            authorizationStatus &&
            authorizationStatus !== null &&
            !initialDataSent &&
            workouts.length > 0
        ) {
            void sendInitialWorkouts();
        }
    }, [authorizationStatus, workouts, initialDataSent]);

    useEffect(() => {
        let unsubscribe: (() => Promise<boolean>) | undefined;

        async function subscribeToWorkoutChanges() {
            unsubscribe = await subscribeToChanges(HKWorkoutTypeIdentifier, async () => {
                try {
                    // Call queryWorkoutSamplesWithAnchor with a single options object
                    const res = await queryWorkoutSamplesWithAnchor({
                        limit: 10,
                        anchor: workoutAnchor,
                        energyUnit: 'kcal' as EnergyUnit,
                        distanceUnit: 'mi' as LengthUnit,
                    });
                    // Update anchor for next call
                    setWorkoutAnchor(res.newAnchor);
                    const newRunningWorkouts = res.samples.filter(
                        (w) => w.workoutActivityType === HKWorkoutActivityType.running
                    );
                    // Send these new workouts to your backend...
                    console.log('New workouts to send:', newRunningWorkouts);
                } catch (err) {
                    console.error('Error querying new workout samples:', err);
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
    }, [sendingData, workoutAnchor]);

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
            <WarningBanner visible={sendingData} />

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
        // Add paddingTop to avoid overlap with the banner if necessary
        paddingTop: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 200,
        height: 200,
    },
});