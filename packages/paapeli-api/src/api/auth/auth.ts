import napiHttpHandler from '../napiHttpHandler';
import { PaapeliMessage } from '../type';

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

export interface GoogleSignInRequest {
    /** The ID token from Google Identity Services (`response.credential`). */
    idToken: string;
}

export interface RequestPasswordResetRequest {
    email: string;
}

export interface ResetPasswordRequest {
    /** The one-time code from the reset email. Consumed on submission. */
    code: string;
    password: string;
    passwordConfirm: string;
}

export const authService = {
    /** Revoke every refresh-token family belonging to the signed-in user, so
     *  every other browser and device is signed out too. 204, no body. */
    async logoutAll(): Promise<void> {
        await napiHttpHandler.post('/api/v1/aiot/auth/logout-all');
    },
    /** Revoke only this session's refresh-token family. 204, no body. */
    async logout(): Promise<void> {
        await napiHttpHandler.post('/api/v1/aiot/auth/logout');
    },
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
    /**
     * Exchanges a Google ID token for a Paapeli bearer token. This is both
     * sign-in and sign-up: an unknown verified Google email creates a new
     * active account, and one matching an existing password account links
     * that account to the Google identity.
     */
    async googleSignIn(req: GoogleSignInRequest): Promise<LoginResponse> {
        const { data } = await napiHttpHandler.post<LoginResponse>(
            '/api/v1/aiot/auth/google',
            req,
        );
        return data;
    },
    /**
     * Asks for a one-time reset code. The response is deliberately identical
     * whether or not the account exists, so it says nothing about the email.
     */
    async requestPasswordReset(
        req: RequestPasswordResetRequest,
    ): Promise<PaapeliMessage> {
        const { data } = await napiHttpHandler.post<PaapeliMessage>(
            '/api/v1/aiot/user/request-reset-password',
            req,
        );
        return data;
    },
    /**
     * Spends a reset code on a new password. The code is consumed even when
     * the update fails, so a failed attempt needs a fresh one. Success also
     * revokes the account's previously issued access tokens.
     */
    async resetPassword(req: ResetPasswordRequest): Promise<PaapeliMessage> {
        const { data } = await napiHttpHandler.post<PaapeliMessage>(
            '/api/v1/aiot/user/reset-password',
            req,
        );
        return data;
    },
};
