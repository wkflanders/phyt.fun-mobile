import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Image, Animated, StyleProp, ImageStyle } from 'react-native';
import { images } from '@/constants';

interface EchoLogoProps {
    active: boolean;
    style?: StyleProp<ImageStyle>;
}

export const EchoLogo = ({ active, style }: EchoLogoProps) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        let animation: Animated.CompositeAnimation | undefined;
        if (active) {
            animation = Animated.loop(
                Animated.parallel([
                    Animated.timing(scaleAnim, {
                        toValue: 1.5, // scale to twice the size
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 0, // fade out
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            );
            animation.start();
        } else {
            // Reset values if inactive.
            scaleAnim.setValue(1);
            opacityAnim.setValue(1);
        }
        return () => {
            if (animation) animation.stop();
        };
    }, [active]);

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            {active && (
                <Animated.Image
                    source={images.P_logo}
                    style={[
                        style,
                        { position: 'absolute', transform: [{ scale: scaleAnim }], opacity: opacityAnim },
                    ]}
                    resizeMode="contain"
                />
            )}
            <Image source={images.P_logo} style={style} resizeMode="contain" />
        </View>
    );
};