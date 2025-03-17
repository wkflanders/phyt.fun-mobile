import { User, ApiError, RunnerAppResponse, WorkoutBatch } from '@/types';

const API_URL = process.env.API_URL || 'http://10.0.0.211:4000/api';

export const getUser = async (privyId: string, token: string | null): Promise<User> => {
    const response = await fetch(`${API_URL}/users/status/${privyId}`, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new ApiError('Failed to fetch user data', response.status);
    }

    return data;
};

export const applyForRunner = async ({ workouts }: WorkoutBatch, privyId: string, token: string | null): Promise<RunnerAppResponse> => {
    const response = await fetch(`${API_URL}/workouts/runs/apply/${privyId}`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(workouts),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new ApiError('Failed to fetch user data', response.status);
    }

    return data;
};