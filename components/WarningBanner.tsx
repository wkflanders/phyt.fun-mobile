import { StyleSheet, Text, Animated } from 'react-native';
import React, { useRef, useEffect } from 'react';

interface WarningBannerProps {
    visible: boolean;
}

const bannerHeight = 50;

export const WarningBanner: React.FC<WarningBannerProps> = ({ visible }: WarningBannerProps) => {
    const translateY = useRef(new Animated.Value(-bannerHeight)).current;

    useEffect(() => {
        Animated.timing(translateY, {
            toValue: visible ? 0 : -bannerHeight,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [visible, translateY]);

    return (
        <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}>
            <Text style={styles.text}>Data Sending Enabled</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: bannerHeight,
        backgroundColor: '#ff4444', // destructive red
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000, // Make sure it appears above other elements
    },
    text: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
