type UserRole = 'admin' | 'user' | 'runner';

export type RunnerStatus = 'pending' | 'active' | 'inactive';

type RunnerAppCase = 'success' | 'already_runner' | 'already_submitted';

export class ApiError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number, public originalError?: any) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
    }
}

export interface WorkoutBatch {
    workouts: any[];
}

export interface RunnerAppResponse {
    message: RunnerAppCase;
}

export interface User {
    id: number;
    updated_at: Date;
    created_at: Date;
    email: string;
    username: string;
    role: UserRole;
    privy_id: string;
    avatar_url: string;
    wallet_address: string | null;
    phytness_points: number;
    status?: RunnerStatus | null;
}
