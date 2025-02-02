import { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    Alert,
    StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Menu } from '@/components/ui/Menu';

import { FormField } from '@/components/FormField';
import { FunctionalButton } from '@/components/FunctionalButton';

const API_URL = process.env.PUBLIC_API_URL || "http://localhost:4000/api";
const DEFAULT_AVATAR_URL = 'https://ltmquqidkjjnkatjlejs.supabase.co/storage/v1/object/public/avatars/icon.png';
const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_DIMENSION = 1024;

interface FormErrors {
    email?: string;
    username?: string;
    avatar?: string;
}

interface OnboardingProps {
    privyId: string;
    email: string;
    walletAddress?: string;
}

const Onboarding = ({ privyId, email, walletAddress }: OnboardingProps) => {
    const [formData, setFormData] = useState({
        username: '',
        email: email,
        avatarUrl: DEFAULT_AVATAR_URL
    });
    const [avatarImage, setAvatarImage] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<Blob | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [showAvatarMenu, setShowAvatarMenu] = useState(false);

    const handleChange = (field: string) => (value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        if (errors[field as keyof FormErrors]) {
            setErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
    };

    const validateForm = () => {
        const newErrors: FormErrors = {};

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const compressImage = async (uri: string): Promise<ImageManipulator.ImageResult> => {
        try {
            const result = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: MAX_IMAGE_DIMENSION, height: MAX_IMAGE_DIMENSION } }],
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );

            const response = await fetch(result.uri);
            const blob = await response.blob();
            const size = blob.size / (1024 * 1024);

            if (size > MAX_IMAGE_SIZE_MB) {
                return ImageManipulator.manipulateAsync(
                    result.uri,
                    [],
                    { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
                );
            }

            return result;
        } catch (error) {
            console.error('Error compressing image:', error);
            throw new Error('Failed to compress image');
        }
    };

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
                setIsUploadingAvatar(true);
                try {
                    const compressed = await compressImage(result.assets[0].uri);
                    setAvatarImage(compressed.uri);

                    // Convert the compressed image to a blob for form data
                    const response = await fetch(compressed.uri);
                    const blob = await response.blob();
                    setAvatarFile(blob);

                    setFormData(prev => ({
                        ...prev,
                        avatarUrl: compressed.uri
                    }));
                } catch (error) {
                    Alert.alert(
                        'Error',
                        'Could not process image. Please try again.'
                    );
                }
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
        } finally {
            setIsUploadingAvatar(false);
            setShowAvatarMenu(false);
        }
    };

    const resetToDefaultAvatar = async () => {
        setAvatarImage(null);
        setAvatarFile(null);
        setFormData(prev => ({
            ...prev,
            avatarUrl: DEFAULT_AVATAR_URL
        }));
        setShowAvatarMenu(false);
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('email', formData.email);
            formDataToSend.append('username', formData.username);
            formDataToSend.append('privy_id', privyId);

            if (walletAddress) {
                formDataToSend.append('wallet_address', walletAddress);
            }

            if (avatarFile && formData.avatarUrl !== DEFAULT_AVATAR_URL) {
                formDataToSend.append('avatar', avatarFile, 'avatar.jpg');
            }

            const response = await fetch(`${API_URL}/createUser`, {
                method: 'POST',
                body: formDataToSend,
                headers: {
                    'Accept': 'application/json',
                }
            });

            const data = await response.json();

            if (response.ok) {
                router.push('/home');
            } else {
                if (data.error) {
                    // Handle specific field errors
                    if (data.error.includes('Email')) {
                        setErrors(prev => ({ ...prev, email: data.error }));
                    } else if (data.error.includes('Username')) {
                        setErrors(prev => ({ ...prev, username: data.error }));
                    } else {
                        Alert.alert('Error', data.error);
                    }
                } else {
                    Alert.alert('Error', 'Failed to create profile. Please try again.');
                }
            }
        } catch (err) {
            console.error('Error creating profile:', err);
            Alert.alert(
                'Error',
                'Failed to create profile. Please try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <View style={styles.contentContainer}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.title}>
                            Complete Your Profile
                        </Text>
                        <Text style={styles.subtitle}>
                            Let's set up your profile so others can find you
                        </Text>
                    </View>

                    <View style={styles.avatarContainer}>
                        <TouchableOpacity
                            onPress={() => setShowAvatarMenu(true)}
                            style={styles.avatarButton}
                        >
                            <Image
                                source={{ uri: avatarImage || formData.avatarUrl }}
                                style={styles.avatarImage}
                            />
                            {isUploadingAvatar && (
                                <View style={styles.uploadingOverlay}>
                                    <Text style={styles.uploadingText}>Uploading...</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <Text style={styles.avatarHelperText}>
                            Tap to change avatar
                        </Text>
                        {errors.avatar && (
                            <Text style={styles.errorText}>
                                {errors.avatar}
                            </Text>
                        )}

                        <Menu
                            open={showAvatarMenu}
                            onOpenChange={setShowAvatarMenu}
                            items={[
                                {
                                    label: 'Choose New Photo',
                                    onPress: handlePickImage
                                },
                                {
                                    label: 'Reset to Default',
                                    onPress: resetToDefaultAvatar,
                                    disabled: formData.avatarUrl === DEFAULT_AVATAR_URL
                                }
                            ]}
                        />
                    </View>

                    <View style={styles.formContainer}>
                        <FormField
                            title="Email"
                            value={formData.email}
                            handleChangeText={handleChange('email')}
                            placeholder="EMAIL"
                            error={errors.email}
                            style={styles.formField}
                            editable={false}
                        />

                        <FormField
                            title="Username"
                            value={formData.username}
                            handleChangeText={handleChange('username')}
                            placeholder="USERNAME"
                            error={errors.username}
                            style={styles.formField}
                        />

                        <FunctionalButton
                            title="Complete Profile"
                            handlePress={handleSubmit}
                            containerStyle={styles.submitButton}
                            textStyle={styles.submitButtonText}
                            isLoading={isSubmitting}
                        />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000'
    },
    contentContainer: {
        justifyContent: 'center',
        minHeight: '70%',
        paddingHorizontal: 16
    },
    headerContainer: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32
    },
    title: {
        fontFamily: 'InterSemiBold',
        color: '#FFFFFF',
        fontSize: 30
    },
    subtitle: {
        fontFamily: 'InterSemiBold',
        fontSize: 20,
        color: '#666666',
        textAlign: 'center',
        marginTop: 16
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 24
    },
    avatarButton: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#1A1A1A',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    },
    avatarImage: {
        width: '100%',
        height: '100%'
    },
    uploadingOverlay: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    uploadingText: {
        color: '#FFFFFF'
    },
    avatarHelperText: {
        color: '#666666',
        fontSize: 14,
        marginTop: 8
    },
    errorText: {
        color: '#FF4444',
        fontSize: 14,
        marginTop: 4
    },
    formContainer: {
        gap: 24
    },
    formField: {
        marginBottom: 16
    },
    submitButton: {
        marginTop: 24,
        width: '100%',
        paddingVertical: 24,
        borderRadius: 12,
        backgroundColor: '#007AFF'
    },
    submitButtonText: {
        fontFamily: 'InterSemiBold',
        color: '#FFFFFF',
        fontSize: 16
    }
});

export default Onboarding;