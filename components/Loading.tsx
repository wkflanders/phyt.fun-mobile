import { StyleSheet, ActivityIndicator, View } from 'react-native';
import React from 'react';

export const Loading = () => {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
        </View>
    );
};

const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#101010' }
});