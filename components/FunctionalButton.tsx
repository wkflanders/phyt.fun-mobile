import React from 'react';
import { Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';

interface FunctionalButtonProps {
    title: string;
    handlePress: () => void;
    containerStyles?: object;
    textStyles?: object;
    isLoading: boolean;
}

export const FunctionalButton = ({
    title,
    handlePress,
    containerStyles = {},
    textStyles = {},
    isLoading,
}: FunctionalButtonProps) => {
    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.7}
            style={[
                styles.button,
                isLoading && styles.disabled,
                containerStyles
            ]}
            disabled={isLoading}
        >
            <Text style={[styles.text, textStyles]}>{title}</Text>

            {isLoading && (
                <ActivityIndicator animating={isLoading} color="#fff" size="small" style={styles.loader} />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#FE205D',
        minHeight: 40,
        width: '50%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    disabled: {
        opacity: 0.5,
    },
    text: {
        color: 'white',
        fontFamily: 'Inter-SemiBold',
        fontSize: 20,
    },
    loader: {
        marginLeft: 8,
    },
});

export default FunctionalButton;
