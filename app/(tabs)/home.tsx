import React, { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/expo';
import { useIsFocused } from '@react-navigation/native';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { EchoLogo } from '@/components/EchoLogo';
import { WarningBanner } from '@/components/WarningBanner';

export default function Home() {
    const { user, isReady } = usePrivy();
    const [sendingData, setSendingData] = useState(false);
    const [workoutAnchor, setWorkoutAnchor] = useState(false);
    const isFocused = useIsFocused();

    const toggleDataSending = useCallback(() => {
        setSendingData(prev => !prev);
    }, [sendingData]);

    return (
        <View style={styles.container}>
            {/* The banner is rendered above your main content */}
            <WarningBanner visible={sendingData} />

            {/* Rest of your home screen */}
            <View style={styles.content}>
                <TouchableOpacity onPress={toggleDataSending}>
                    <EchoLogo active={sendingData} style={styles.logo} />
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