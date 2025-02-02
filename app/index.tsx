import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePrivy, useLoginWithOAuth } from '@privy-io/expo';
import { router } from 'expo-router';
import { FunctionalButton } from '@/components/FunctionalButton';

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
            console.error('Login failed:', error);
        }
    };

    return (
        <SafeAreaView className="bg-black h-full">
            <ScrollView>
                <View className="justify-center min-h-[80vh]">
                    <View className="w-full justify-center items-center px-2">
                        <FunctionalButton
                            title="Login"
                            handlePress={() => login({ provider: 'google' })}
                            containerStyles="mt-14 w-full py-6 rounded-xl"
                            textStyles="font-intersemibold"
                            isLoading={!isReady}
                        />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView >
    );
};


const styles = StyleSheet.create({});