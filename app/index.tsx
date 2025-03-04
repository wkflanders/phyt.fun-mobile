import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePrivy, useLoginWithOAuth } from '@privy-io/expo';
import { router } from 'expo-router';
import { FunctionalButton } from '@/components/FunctionalButton';
import { Onboard } from '@/components/Onboard';
import { images } from '@/constants';

// User status enum
enum UserStatus {
    LOADING = 'loading',
    UNAUTHENTICATED = 'unauthenticated',
    AUTHENTICATED = 'authenticated',
    PENDING_RUNNER = 'pending_runner',
    ACTIVE_RUNNER = 'active_runner',
}

const API_URL = process.env.API_URL || 'http://10.0.0.211:4000/api';

export default function Index() {
    const { isReady, user, getAccessToken } = usePrivy();
    const [userStatus, setUserStatus] = useState<UserStatus>(UserStatus.LOADING);

    const { login } = useLoginWithOAuth({
        onSuccess() {
            // Login successful, will check user status in useEffect
        },
        onError: (err: any) => {
            if (err.message.contains('was cancelled')) {
                return;
            } else {
                console.error('Login error:', err);
            }
        }
    });

    useEffect(() => {
        if (!isReady) {
            setUserStatus(UserStatus.LOADING);
            return;
        }

        if (!user) {
            setUserStatus(UserStatus.UNAUTHENTICATED);
            return;
        }

        // User is authenticated, now check their runner status
        checkUserStatus();
    }, [isReady, user]);

    const checkUserStatus = async () => {
        if (!user) return;
        const token = await getAccessToken();

        try {
            // Fetch user data from API
            const response = await fetch(`${API_URL}/users/${user.id}`, {
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            const userData = await response.json();

            if (userData.role === 'runner') {
                setUserStatus(UserStatus.ACTIVE_RUNNER);
                router.replace('/(tabs)/home');
            } else {
                // Check if there's a pending runner application
                const runnerResponse = await fetch(`${API_URL}/runners/${user.id}/status`, {
                    method: 'GET',
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (runnerResponse.ok) {
                    const runnerData = await runnerResponse.json();

                    if (runnerData.status === 'pending') {
                        setUserStatus(UserStatus.PENDING_RUNNER);
                    } else {
                        setUserStatus(UserStatus.AUTHENTICATED);
                    }
                } else {
                    setUserStatus(UserStatus.AUTHENTICATED);
                }
            }
        } catch (error) {
            console.error('Error checking user status:', error);
            setUserStatus(UserStatus.AUTHENTICATED);
        }
    };

    const handleRunnerOnboardingComplete = () => {
        setUserStatus(UserStatus.PENDING_RUNNER);
    };

    // Loading state
    if (userStatus === UserStatus.LOADING) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00F6FB" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    // Unauthenticated state - show login screen
    if (userStatus === UserStatus.UNAUTHENTICATED) {
        return (
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollView}>
                    <View style={styles.headerContainer}>
                        <View style={styles.logoWrapper}>
                            <Image
                                source={images.P_logo}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.title}>Welcome to Phyt</Text>
                        <Text style={styles.subtitle}>
                            The fitness trading card game.
                        </Text>
                    </View>
                    <View style={styles.innerContainer}>
                        <View style={styles.buttonContainer}>
                            <FunctionalButton
                                title="Login"
                                handlePress={() => login({
                                    provider: 'google',
                                    disableSignup: true,
                                })}
                                containerStyle={styles.button}
                                textStyle={styles.buttonText}
                                isLoading={!isReady}
                            />
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // Authenticated but not a runner - show runner onboarding
    if (userStatus === UserStatus.AUTHENTICATED) {
        return <Onboard onComplete={handleRunnerOnboardingComplete} />;
    }

    // Pending runner state
    if (userStatus === UserStatus.PENDING_RUNNER) {
        return (
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.pendingContainer}>
                    <Image
                        source={images.P_logo}
                        style={styles.pendingLogo}
                        resizeMode="contain"
                    />
                    <Text style={styles.pendingTitle}>Application Pending</Text>
                    <Text style={styles.pendingText}>
                        Your application to become a runner is being reviewed by our team.
                        You'll receive access as soon as it's approved.
                    </Text>
                    <Text style={styles.pendingSubtext}>
                        Thank you for your patience!
                    </Text>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // Active runner state - should redirect to home in useEffect
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00F6FB" />
            <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#101010', // phyt_bg
    },
    scrollView: {
        flexGrow: 1,
    },
    headerContainer: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '75%',
        paddingHorizontal: 24, // px-6
    },
    logoWrapper: {
        paddingLeft: 40, // pl-10
    },
    logo: {
        width: 125,
        height: 250,
    },
    title: {
        fontFamily: 'Inter-SemiBold',
        color: 'white',
        fontSize: 32, // text-4xl
        marginTop: 16, // mt-4
    },
    subtitle: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 20, // text-xl
        color: '#777798', // phyt_text_secondary
        textAlign: 'center',
        marginTop: 16, // mt-4
    },
    innerContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContainer: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        marginTop: 56,
        width: '100%',
        paddingVertical: 20,
        borderRadius: 12,
    },
    buttonText: {
        fontFamily: 'Inter-SemiBold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#101010',
    },
    loadingText: {
        fontFamily: 'Inter-Regular',
        color: 'white',
        fontSize: 16,
        marginTop: 16,
    },
    pendingContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    pendingLogo: {
        width: 120,
        height: 120,
        marginBottom: 24,
    },
    pendingTitle: {
        fontFamily: 'Inter-Bold',
        color: 'white',
        fontSize: 28,
        marginBottom: 16,
        textAlign: 'center',
    },
    pendingText: {
        fontFamily: 'Inter-Regular',
        color: 'white',
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 24,
    },
    pendingSubtext: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: '#777798', // phyt_text_secondary
        textAlign: 'center',
    },
});