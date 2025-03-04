import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    SafeAreaView
} from 'react-native';
import {
    useHealthkitAuthorization,
    queryWorkoutSamples,
    HKWorkoutActivityType,
    HKWorkoutTypeIdentifier,
    HKQuantityTypeIdentifier,
    HKAuthorizationRequestStatus,
    HKWorkoutRouteTypeIdentifier,
    type HKWorkout,
} from '@kingstinct/react-native-healthkit';
import { type EnergyUnit, type LengthUnit } from '@kingstinct/react-native-healthkit';
import { usePrivy } from '@privy-io/expo';
import { images } from '@/constants';
import { WarningBanner } from '@/components/WarningBanner';

enum ApplicationStatus {
    INITIAL = 'initial',
    PENDING = 'pending',
    APPLIED = 'applied',
}

interface OnboardProps {
    onComplete: () => void;
}

const API_URL = process.env.API_URL || 'http://10.0.0.211:4000/api';

export const Onboard = ({ onComplete }: OnboardProps) => {
    const { user, getAccessToken } = usePrivy();
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>(ApplicationStatus.INITIAL);
    const [authorizationStatus, requestAuthorization] = useHealthkitAuthorization([
        HKQuantityTypeIdentifier.heartRate,
        HKQuantityTypeIdentifier.distanceWalkingRunning,
        HKWorkoutRouteTypeIdentifier,
        HKWorkoutTypeIdentifier,
    ]);

    useEffect(() => {
        if (authorizationStatus === HKAuthorizationRequestStatus.shouldRequest) {
            requestAuthorization().catch(err => {
                console.error('Failed to request HealthKit authorization:', err);
                setError('Failed to get HealthKit authorization');
            });
        }
    }, [authorizationStatus, requestAuthorization]);

    // Check if the user has already applied to be a runner
    useEffect(() => {
        if (!user?.id) return;

        const checkRunnerStatus = async () => {
            const token = await getAccessToken();
            try {
                const response = await fetch(`${API_URL}/runners/${user.id}/status`, {
                    method: 'GET',
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'pending') {
                        setApplicationStatus(ApplicationStatus.PENDING);
                    }
                }
            } catch (error) {
                console.error('Error checking runner status:', error);
                // Silently fail - will show the application form by default
            }
        };

        checkRunnerStatus();
    }, [user]);

    const handleApply = async () => {
        if (!user?.id) {
            setError('User not found');
            return;
        }

        const token = await getAccessToken();

        try {
            setIsLoading(true);
            setStatusMessage('Retrieving your run data...');
            setError(null);

            // Fetch workout data from HealthKit
            const workouts = await queryWorkoutSamples({
                limit: 0, // Get all workouts
                ascending: false,
                energyUnit: 'kcal' as EnergyUnit,
                distanceUnit: 'm' as LengthUnit,
            });

            // Filter for running workouts only
            const runningWorkouts = workouts.filter(
                (w: HKWorkout) => w.workoutActivityType === HKWorkoutActivityType.running
            );

            if (runningWorkouts.length === 0) {
                setError('No running workouts found. Please complete at least one run before applying.');
                setIsLoading(false);
                return;
            }

            setStatusMessage(`Submitting ${runningWorkouts.length} workouts...`);

            // Submit application to the server
            const response = await fetch(`${API_URL}/workouts/runs/apply/${user.id}`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`

                },
                body: JSON.stringify(runningWorkouts),
            });

            const data = await response.text();

            if (response.ok) {
                setStatusMessage('Application submitted! An admin will review your data.');
                setApplicationStatus(ApplicationStatus.APPLIED);
                // Wait 2 seconds to show success message before completing
                setTimeout(() => {
                    onComplete();
                }, 2000);
            } else {
                throw new Error(data || 'Failed to submit application');
            }
        } catch (err) {
            console.error('Error applying to be a runner:', err);
            setError(err instanceof Error ? err.message : 'Failed to apply');
        } finally {
            setIsLoading(false);
        }
    };

    const renderContent = () => {
        // If application is already pending, show pending screen
        if (applicationStatus === ApplicationStatus.PENDING) {
            return (
                <View style={styles.contentContainer}>
                    <Text style={styles.title}>Application Pending</Text>
                    <Text style={styles.description}>
                        Your application to become a runner is being reviewed by our team.
                        You'll receive access as soon as it's approved.
                    </Text>
                    <Text style={styles.secondaryText}>
                        Thank you for your patience!
                    </Text>
                </View>
            );
        }

        // If application was just submitted successfully
        if (applicationStatus === ApplicationStatus.APPLIED) {
            return (
                <View style={styles.contentContainer}>
                    <Text style={styles.title}>Application Submitted</Text>
                    <Text style={styles.description}>
                        Thanks for applying! Your running data has been sent to our team for review.
                    </Text>
                    <Text style={styles.secondaryText}>
                        You'll receive full access once approved.
                    </Text>
                    <ActivityIndicator size="large" color="#00F6FB" style={{ marginTop: 24 }} />
                </View>
            );
        }

        // If HealthKit permissions are not granted
        if (authorizationStatus !== HKAuthorizationRequestStatus.unnecessary) {
            return (
                <View style={styles.contentContainer}>
                    <Text style={styles.title}>HealthKit Access Required</Text>
                    <Text style={styles.description}>
                        To apply as a runner, we need access to your workout data.
                        Please grant HealthKit permissions when prompted.
                    </Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => requestAuthorization()}
                    >
                        <Text style={styles.buttonText}>Grant Access</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        // Default state - initial application
        return (
            <View style={styles.contentContainer}>
                <Text style={styles.title}>Become a Runner</Text>
                <Text style={styles.description}>
                    Apply to become a Phyt runner and turn your workouts into tradable cards!
                    We'll send your run history to our admins for review.
                </Text>
                <Text style={styles.secondaryText}>
                    Once approved, you'll be able to send new workouts and earn rewards.
                </Text>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#00F6FB" />
                        <Text style={styles.loadingText}>{statusMessage}</Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleApply}
                        disabled={isLoading}
                    >
                        <Text style={styles.buttonText}>Apply Now</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {error && (
                <WarningBanner
                    visible={true}
                    message={error}
                    type="error"
                    onDismiss={() => setError(null)}
                />
            )}
            <View style={styles.header}>
                <Image
                    source={images.P_logo}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>
            {renderContent()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#101010', // phyt_bg
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
    },
    logo: {
        width: 100,
        height: 100,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        fontFamily: 'Inter-Bold',
        fontSize: 28,
        color: '#fff',
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontFamily: 'Inter-Regular',
        fontSize: 18,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 24,
    },
    secondaryText: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: '#777798', // phyt_text_secondary
        textAlign: 'center',
        marginBottom: 32,
    },
    button: {
        backgroundColor: '#FE205D', // phyt_red
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 8,
        marginTop: 16,
        width: '80%',
        alignItems: 'center',
    },
    buttonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 18,
        color: '#fff',
    },
    loadingContainer: {
        alignItems: 'center',
        marginTop: 24,
    },
    loadingText: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: '#fff',
        marginTop: 16,
        textAlign: 'center',
    },
});