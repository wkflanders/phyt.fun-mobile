import React from 'react';
import { usePrivy } from '@privy-io/expo';
import { useIsFocused } from '@react-navigation/native';
import { StyleSheet, View, Image } from 'react-native';
import { EchoLogo } from '@/components/EchoLogo';

export default function Home() {
    const { user, isReady } = usePrivy();
    const isFocused = useIsFocused();

    return (
        <View style={styles.container}>
            <EchoLogo active={isFocused} style={styles.logo} />
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 200,
        height: 200,
    },
});