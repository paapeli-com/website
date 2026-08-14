import napiHttpHandler from '../napiHttpHandler';

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    tokenType?: string;
}

export interface SignupRequest {
    email: string;
    displayName?: string;
    password: string;
    confirmedPassword: string;
}

export interface SignupResponse {
    id: string;
    displayName: string;
    email: string;
    isActive: boolean;
    emailVerified: boolean;
    createdAt: number;
    authentication?: LoginResponse;
}

export const authService = {
    async login(req: LoginRequest): Promise<LoginResponse> {
        const { data } = await napiHttpHandler.post<LoginResponse>(
            '/api/v1/aiot/auth/login',
            req,
        );
        return data;
    },
    async signup(req: SignupRequest): Promise<SignupResponse> {
        const { data } = await napiHttpHandler.post<{ data: SignupResponse }>(
            '/api/v1/aiot/user/signup',
            req,
        );
        return data.data;
    },
};
