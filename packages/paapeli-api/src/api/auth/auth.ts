import napiHttpHandler from '../napiHttpHandler';
import { PaapeliMessage } from '../type';

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    /** Absent when twoFactorRequired: the sign-in still owes its second factor. */
    token: string;
    tokenType?: string;
    /** The account has two-factor on: finish with loginTwoFactor(challengeToken, code). */
    twoFactorRequired?: boolean;
    challengeToken?: string;
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
    /** The 6-digit code from the reset email. Five wrong tries cancel it. */
    code: string;
    password: string;
    passwordConfirm: string;
    /** The account's email, which the code is checked against. */
    email?: string;
}

export const authService = {
    /* Login, signup and Google sign-in send credentials so the browser keeps
       the HttpOnly refresh-token cookie their responses set — without it,
       `refresh` below has nothing to present. */
    async login(req: LoginRequest): Promise<LoginResponse> {
        const { data } = await napiHttpHandler.post<LoginResponse>(
            '/api/v1/aiot/auth/login',
            req,
            { withCredentials: true },
        );
        return data;
    },
    /**
     * The second step of a sign-in with two-factor on: the challenge from
     * login (or Google) and a code from the authenticator or a recovery code.
     */
    async loginTwoFactor(challengeToken: string, code: string): Promise<LoginResponse> {
        const { data } = await napiHttpHandler.post<LoginResponse>(
            '/api/v1/aiot/auth/login/two-factor',
            { challengeToken, code },
            { withCredentials: true },
        );
        return data;
    },
    async signup(req: SignupRequest): Promise<SignupResponse> {
        const { data } = await napiHttpHandler.post<{ data: SignupResponse }>(
            '/api/v1/aiot/user/signup',
            req,
            { withCredentials: true },
        );
        return data.data;
    },
    /**
     * Exchanges a Google ID token for a Paapeli bearer token. This is both
     * sign-in and sign-up: an unknown verified Google email creates a new
     * active account, and one matching an existing password account links
     * that account to the Google identity.
     */
    /**
     * Rotates the HttpOnly refresh-token cookie and returns a new access
     * token. The cookie is the credential, so it is sent cross-origin.
     */
    async refresh(): Promise<LoginResponse> {
        const { data } = await napiHttpHandler.post<LoginResponse>(
            '/api/v1/aiot/auth/refresh',
            undefined,
            { withCredentials: true },
        );
        return data;
    },
    /** Revokes this session's refresh-token family and clears its cookie (204). */
    async logout(): Promise<void> {
        await napiHttpHandler.post('/api/v1/aiot/auth/logout', undefined, {
            withCredentials: true,
        });
    },
    /** Revokes every refresh-token family of the signed-in user (204). */
    async logoutAll(): Promise<void> {
        await napiHttpHandler.post('/api/v1/aiot/auth/logout-all', undefined, {
            withCredentials: true,
        });
    },
    async googleSignIn(req: GoogleSignInRequest): Promise<LoginResponse> {
        const { data } = await napiHttpHandler.post<LoginResponse>(
            '/api/v1/aiot/auth/google',
            req,
            { withCredentials: true },
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

/**
 * Ends the server side of the session: revokes this browser's refresh-token
 * family and clears its cookie. Best-effort and never throws — signing out
 * locally must not wait on, or fail with, the network. Call before clearing
 * the local session; the access token is still needed to reach the endpoint.
 */
export async function endServerSession(): Promise<void> {
    try {
        await authService.logout();
    } catch {
        /* offline, or already signed out server-side — nothing to undo */
    }
}
