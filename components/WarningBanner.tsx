import { StyleSheet, Text, Animated } from 'react-native';
import React, { useRef, useEffect } from 'react';

interface WarningBannerProps {
    visible: boolean;
    message?: string;
    type?: 'warning' | 'error';
    duration?: number;
    onDismiss?: () => void;
}

const bannerHeight = 80;

export const WarningBanner: React.FC<WarningBannerProps> = ({
    visible,
    message,
    type = 'warning',
    duration,
    onDismiss
}: WarningBannerProps) => {
    const translateY = useRef(new Animated.Value(-bannerHeight)).current;
    const timeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (visible) {
            // Show banner
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();

            // If duration is provided, hide banner after duration
            if (duration) {
                timeoutRef.current = setTimeout(() => {
                    hideBanner();
                }, duration);
            }
        } else {
            hideBanner();
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [visible, duration]);

    const hideBanner = () => {
        Animated.timing(translateY, {
            toValue: -bannerHeight,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            if (onDismiss) {
                onDismiss();
            }
        });
    };

    const getBannerColor = () => {
        switch (type) {
            case 'error':
                return '#ef4444'; // Red color for errors
            case 'warning':
            default:
                return '#f59e0b'; // Amber color for warnings
        }
    };

    return (
        <Animated.View style={[
            styles.banner,
            { transform: [{ translateY }], backgroundColor: getBannerColor() }
        ]}>
            <Text style={styles.text}>
                {message || 'Your run workouts are now being tracked'}
            </Text>
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
        paddingTop: 30,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    text: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});