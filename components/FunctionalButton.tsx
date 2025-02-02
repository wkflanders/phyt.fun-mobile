import React from 'react';
import {
    Text,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    StyleProp,
    ViewStyle,
    TextStyle
} from 'react-native';

interface FunctionalButtonProps {
    title: string;
    handlePress: () => void;
    containerStyle?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    isLoading?: boolean;
}

export const FunctionalButton = ({
    title,
    handlePress,
    containerStyle,
    textStyle,
    isLoading = false,
}: FunctionalButtonProps) => {
    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.7}
            style={[
                styles.button,
                isLoading && styles.disabled,
                containerStyle
            ]}
            disabled={isLoading}
        >
            <Text style={[styles.text, textStyle]}>{title}</Text>

            {isLoading && (
                <ActivityIndicator
                    animating={true}
                    color="#FFFFFF"
                    size="small"
                    style={styles.loader}
                />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#FE205D',
        minHeight: 60,
        width: '90%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 8
    },
    disabled: {
        opacity: 0.5
    },
    text: {
        color: '#FFFFFF',
        fontFamily: 'InterSemiBold',
        fontSize: 20
    },
    loader: {
        marginLeft: 8
    }
});

export default FunctionalButton;