import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePrivy, useLoginWithOAuth } from '@privy-io/expo';
import { router } from 'expo-router';
import { FunctionalButton } from '@/components/FunctionalButton';

import { images } from '@/constants';

export default function Index() {
    const { isReady } = usePrivy();

    const { login } = useLoginWithOAuth({
        onSuccess(user, isNewUser) {
            if (isNewUser) {
                router.push('/onboard');
            } else {
                router.push('/(tabs)/home');
            }
        },
        onError: (err) => {
            console.error('Login error:', err);
        }
    });

    const handleLogin = async () => {
        try {
            await login({ provider: 'google' });
        } catch (error) {
            if (error instanceof Error && error.message === "OAuth was cancelled") {
                return;
            }
            console.error("Login failed:", error);
        }
    };

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
                            handlePress={() => login({ provider: 'google' })}
                            containerStyles={styles.button}
                            textStyles={styles.buttonText}
                            isLoading={!isReady}
                        />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
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
});