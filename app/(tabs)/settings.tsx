import React, { useState } from 'react';
import { StyleSheet, View, Image, Modal, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { images } from '@/constants';
import {
    useHealthkitAuthorization,
    queryWorkoutSamplesWithAnchor,
    subscribeToChanges,
    HKWorkoutTypeIdentifier,
    HKWorkoutActivityType,
    HKQuantityTypeIdentifier,
    HKAuthorizationRequestStatus,
    HKWorkoutRouteTypeIdentifier
} from '@kingstinct/react-native-healthkit'; import { usePrivy } from '@privy-io/expo';

export default function Settings() {
    const { logout } = usePrivy();
    const [isModalVisible, setModalVisible] = useState(true);
    const [authorizationStatus, requestAuthorization] = useHealthkitAuthorization([
        HKQuantityTypeIdentifier.heartRate,
        HKQuantityTypeIdentifier.distanceWalkingRunning,
        HKWorkoutRouteTypeIdentifier,
        HKWorkoutTypeIdentifier
    ]);
    const router = useRouter();

    useFocusEffect(
        React.useCallback(() => {
            setModalVisible(true);
        }, [])
    );

    const handleClose = () => {
        setModalVisible(false);
        router.replace('/(tabs)/home');
    };

    const handleLogout = () => {
        setModalVisible(false);
        logout();
    };

    return (
        <View style={styles.container}>
            <Image source={images.P_logo} style={styles.logo} resizeMode="contain" />
            <Modal visible={isModalVisible} transparent animationType="slide">
                <View style={styles.fullScreenModal}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.modalTitleTop}>Settings</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>X</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scrollView}>
                        <View style={styles.settingsItem}>
                            <Text style={styles.settingsText}>Your HealthKit Authorization:</Text>
                            <Text style={styles.settingsText}>{authorizationStatus}</Text>
                        </View>
                    </ScrollView>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutButtonText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
}

const phytColors = {
    primary: '#00F6FB', // phyt_blue
    accent: '#FE205D',  // phyt_red
    background: '#101010', // phyt_bg
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
    fullScreenModal: {
        flex: 1,
        backgroundColor: '#101010',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitleTop: {
        color: '#fff',
        fontSize: 22,
        fontFamily: 'Inter-SemiBold',
        textAlign: 'left',
    },
    closeButton: {
        backgroundColor: phytColors.accent,
        padding: 10,
        borderRadius: 20,
    },
    closeButtonText: {
        color: '#fff',
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    settingsItem: {
        width: 200,
    },
    settingsText: {
        color: '#fff',
        fontSize: 16,
    },
    logoutButton: {
        backgroundColor: phytColors.accent,
        padding: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    logoutButtonText: {
        fontFamily: 'Inter-SemiBold',
        color: '#fff',
        fontSize: 16,
    },
});