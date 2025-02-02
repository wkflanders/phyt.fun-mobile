import { useState } from "react";
import {
    View,
    TextInput,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    StyleProp,
    ViewStyle,
    KeyboardTypeOptions
} from 'react-native';
import React from 'react';
import { icons } from "@/constants";

interface FormFieldProps {
    title: string;
    value: string;
    placeholder?: string;
    handleChangeText: (e: string) => void;
    style?: StyleProp<ViewStyle>;
    keyboardType?: KeyboardTypeOptions;
    error?: string;
    secureTextEntry?: boolean;
    editable?: boolean;
}

export const FormField = ({
    title,
    value,
    placeholder,
    handleChangeText,
    style,
    keyboardType,
    error,
    secureTextEntry,
    editable = true
}: FormFieldProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordField = secureTextEntry || title.toLowerCase().includes('password');

    return (
        <View style={[styles.container, style]}>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={value}
                    placeholder={placeholder}
                    placeholderTextColor="#666666"
                    onChangeText={handleChangeText}
                    secureTextEntry={isPasswordField && !showPassword}
                    keyboardType={keyboardType}
                    editable={editable}
                />
                {isPasswordField && (
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeButton}
                    >
                        <Image
                            source={!showPassword ? icons.eye : icons.eyehide}
                            style={styles.eyeIcon}
                            resizeMode='contain'
                        />
                    </TouchableOpacity>
                )}
            </View>
            {error && (
                <Text style={styles.errorText}>
                    {error}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 8
    },
    inputContainer: {
        width: '100%',
        height: 64,
        backgroundColor: '#1A1A1A',
        paddingHorizontal: 16,
        paddingBottom: 8,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#333333',
        flexDirection: 'row',
        borderRadius: 16
    },
    input: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 20,
        fontFamily: 'InterSemiBold',
        height: '100%'
    },
    eyeButton: {
        padding: 4
    },
    eyeIcon: {
        width: 32,
        height: 32,
        marginTop: 8
    },
    errorText: {
        color: '#FF4444',
        fontSize: 14
    }
});

export default FormField;