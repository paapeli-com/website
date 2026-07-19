import napiHttpHandler from '../napiHttpHandler';

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    token: string;
}

export const authService = {
    async login(req: LoginRequest): Promise<LoginResponse> {
        const { data } = await napiHttpHandler.post<LoginResponse>(
            '/api/v1/aiot/auth/login',
            req,
        );
        return data;
    },
};
