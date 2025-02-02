import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePrivy, useLoginWithOAuth } from '@privy-io/expo';
import { router } from 'expo-router';
import { FormField } from '@/components/FormField';
import { FunctionalButton } from '@/components/FunctionalButton';

export default function Index() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { isReady } = usePrivy();

    const { login } = useLoginWithOAuth({
        onSuccess(user, isNewUser) {
            try {
                setIsSubmitting(true);

                if (isNewUser) {
                    router.push('/onboard');
                } else if (user) {
                    router.push('/home');
                } else {
                    router.push('/');
                }
            } catch (error) {
                setError('Failed to catch user profile');
            }
        },
        onError: (err) => {
            console.log(err);
            setError(JSON.stringify(err.message));
        }
    });

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
                            isLoading={isSubmitting}
                        />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView >
    );
};


const styles = StyleSheet.create({});