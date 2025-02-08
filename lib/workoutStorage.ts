import AsyncStorage from '@react-native-async-storage/async-storage';

const SENT_WORKOUT_IDS_KEY = 'sentWorkoutIds';

export async function getSentWorkoutIds() {
    const stored = await AsyncStorage.getItem(SENT_WORKOUT_IDS_KEY);
    return stored ? JSON.parse(stored) : [];
}

export async function addSentWorkoutIds(newIds: string[]) {
    const current = await getSentWorkoutIds();
    const updated = Array.from(new Set([...current, ...newIds]));
    await AsyncStorage.setItem(SENT_WORKOUT_IDS_KEY, JSON.stringify(updated));
}