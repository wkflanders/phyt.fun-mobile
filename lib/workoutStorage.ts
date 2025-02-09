// lib/workoutStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HKWorkout } from '@kingstinct/react-native-healthkit';

const SENT_WORKOUT_IDS_KEY = 'sentWorkoutIds';
const LAST_SYNC_TIME_KEY = 'lastSyncTime';
const INITIAL_SYNC_DONE_KEY = 'initialSyncDone';

export async function getSentWorkoutIds(): Promise<string[]> {
    try {
        const stored = await AsyncStorage.getItem(SENT_WORKOUT_IDS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error getting sent workout IDs:', error);
        return [];
    }
}

export async function addSentWorkoutIds(newIds: string[]) {
    try {
        const current = await getSentWorkoutIds();
        const updated = Array.from(new Set([...current, ...newIds]));
        await AsyncStorage.setItem(SENT_WORKOUT_IDS_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('Error adding sent workout IDs:', error);
        throw error;
    }
}

export async function filterUnsyncedWorkouts(workouts: HKWorkout[]): Promise<HKWorkout[]> {
    const sentIds = await getSentWorkoutIds();
    return workouts.filter(workout => !sentIds.includes(workout.uuid));
}

export async function setInitialSyncDone(done: boolean) {
    try {
        await AsyncStorage.setItem(INITIAL_SYNC_DONE_KEY, JSON.stringify(done));
    } catch (error) {
        console.error('Error setting initial sync status:', error);
    }
}

export async function isInitialSyncDone(): Promise<boolean> {
    try {
        const done = await AsyncStorage.getItem(INITIAL_SYNC_DONE_KEY);
        return done ? JSON.parse(done) : false;
    } catch (error) {
        console.error('Error getting initial sync status:', error);
        return false;
    }
}

export async function updateLastSyncTime() {
    try {
        await AsyncStorage.setItem(LAST_SYNC_TIME_KEY, new Date().toISOString());
    } catch (error) {
        console.error('Error updating last sync time:', error);
    }
}

export async function getLastSyncTime(): Promise<Date | null> {
    try {
        const time = await AsyncStorage.getItem(LAST_SYNC_TIME_KEY);
        return time ? new Date(time) : null;
    } catch (error) {
        console.error('Error getting last sync time:', error);
        return null;
    }
}