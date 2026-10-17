import napiHttpHandler from '../napiHttpHandler';

/** E.164, leading + included — the format the API validates against. */
export const E164_PHONE_PATTERN = /^\+[1-9][0-9]{7,14}$/;

/** The numbers text messages go to: Iranian mobiles, +989 and nine digits. */
export const IRANIAN_MOBILE_PATTERN = /^\+989[0-9]{9}$/;

export interface UserPhoneRequest {
    /** E.164, e.g. "+989121234567". */
    phone: string;
}

export interface UserPhoneResponse {
    phone: string;
    enabled: boolean;
    /** ISO date-time. */
    updatedAt: string;
    /** Proved by a texted code; only a verified number is ever texted an alarm. */
    verified?: boolean;
    /** ISO date-time, or null. */
    verifiedAt?: string | null;
}

/** A verification code is on its way. */
export interface PhoneVerificationResponse {
    phone: string;
    /** ISO date-time the code stops working. */
    expiresAt: string;
    /** ISO date-time a new code may be asked for. */
    resendAvailableAt: string;
    /** The code itself, only while the gateway runs on an sms.ir Sandbox key. */
    sandboxCode: string | null;
}

/**
 * Why a verification step was refused: the `code` of the problem response.
 * RESEND_TOO_SOON and HOURLY_LIMIT carry `retryAfterSeconds`; CODE_INVALID
 * carries `attemptsLeft`.
 */
export type PhoneVerificationRefusal =
    | 'PHONE_NOT_SET'
    | 'ALREADY_VERIFIED'
    | 'UNSUPPORTED_NUMBER'
    | 'RESEND_TOO_SOON'
    | 'HOURLY_LIMIT'
    | 'NO_PENDING_CODE'
    | 'CODE_EXPIRED'
    | 'CODE_INVALID'
    | 'TOO_MANY_ATTEMPTS'
    | 'SMS_UNAVAILABLE';

/** The signed-in user as others see them, and the state of their own settings. */
export interface UserProfileResponse {
    userId: string;
    email: string;
    /** Null when unset; the email stands in. */
    displayName: string | null;
    /** The panel colour, "paapeli" or "green"; null for the brand's own. */
    panelAccent?: string | null;
    /** False for an account made by Google sign-in that never set a password. */
    hasPassword?: boolean;
    twoFactorEnabled?: boolean;
    /** Where password reset codes also go, or null. */
    recoveryEmail?: string | null;
    recoveryEmailVerified?: boolean;
}

/** Why an account security change was refused: the problem response's `code`. */
export type AccountSecurityRefusal =
    | 'WRONG_PASSWORD'
    | 'WEAK_PASSWORD'
    | 'PASSWORDS_DIFFER'
    | 'INVALID_ACCENT'
    | 'TWO_FACTOR_ALREADY_ON'
    | 'TWO_FACTOR_NOT_SET_UP'
    | 'TWO_FACTOR_OFF'
    | 'CODE_INVALID'
    | 'CHALLENGE_EXPIRED'
    | 'TOO_MANY_ATTEMPTS'
    | 'SAME_AS_ACCOUNT_EMAIL'
    | 'RESEND_TOO_SOON'
    | 'NO_PENDING_CODE'
    | 'CODE_EXPIRED'
    | 'EMAIL_UNAVAILABLE';

export interface ChangePasswordRequest {
    /** Omitted when the account has no password yet (hasPassword false). */
    currentPassword?: string;
    newPassword: string;
    confirmPassword: string;
}

/** What an authenticator app needs: the QR code's URI, or the key typed in. */
export interface TwoFactorSetup {
    secret: string;
    otpauthUri: string;
}

/** Shown once; each signs in a single time when the authenticator is lost. */
export interface RecoveryCodes {
    recoveryCodes: string[];
}

export interface RecoveryEmailCode {
    email: string;
    expiresAt: string;
    resendAvailableAt: string;
}

/** A workspace's security at a glance, for its settings page. */
export interface WorkspaceSecuritySummary {
    members: number;
    membersWithTwoFactor: number;
    passwordMinLength: number;
    passwordMaxBytes: number;
}

/* The signed-in user's own profile (/users/me), security (/users/me/...) and
   contact methods (/users/me/contact-methods). */
export const usersService = {
    /** Stores the panel colour on the account, so it follows the user. */
    async savePreferences(req: { panelAccent: string | null }): Promise<void> {
        await napiHttpHandler.put('/api/v1/aiot/users/me/preferences', req);
    },
    /** Changes the password; every session, this one included, is signed out after. */
    async changePassword(req: ChangePasswordRequest): Promise<void> {
        await napiHttpHandler.put('/api/v1/aiot/users/me/password', req);
    },
    async setupTwoFactor(): Promise<TwoFactorSetup> {
        const { data } = await napiHttpHandler.post<TwoFactorSetup>('/api/v1/aiot/users/me/two-factor/setup');
        return data;
    },
    async enableTwoFactor(code: string): Promise<RecoveryCodes> {
        const { data } = await napiHttpHandler.post<RecoveryCodes>('/api/v1/aiot/users/me/two-factor/enable', { code });
        return data;
    },
    async disableTwoFactor(code: string): Promise<void> {
        await napiHttpHandler.post('/api/v1/aiot/users/me/two-factor/disable', { code });
    },
    async regenerateRecoveryCodes(code: string): Promise<RecoveryCodes> {
        const { data } = await napiHttpHandler.post<RecoveryCodes>(
            '/api/v1/aiot/users/me/two-factor/recovery-codes',
            { code },
        );
        return data;
    },
    async setRecoveryEmail(email: string): Promise<RecoveryEmailCode> {
        const { data } = await napiHttpHandler.put<RecoveryEmailCode>('/api/v1/aiot/users/me/recovery-email', { email });
        return data;
    },
    async confirmRecoveryEmail(code: string): Promise<void> {
        await napiHttpHandler.post('/api/v1/aiot/users/me/recovery-email/confirm', { code });
    },
    async removeRecoveryEmail(): Promise<void> {
        await napiHttpHandler.del('/api/v1/aiot/users/me/recovery-email');
    },
    async getWorkspaceSecuritySummary(workspaceId: string): Promise<WorkspaceSecuritySummary> {
        const { data } = await napiHttpHandler.get<WorkspaceSecuritySummary>(
            `/api/v1/aiot/workspaces/${workspaceId}/security-summary`,
        );
        return data;
    },
    async getProfile(): Promise<UserProfileResponse> {
        const { data } = await napiHttpHandler.get<UserProfileResponse>('/api/v1/aiot/users/me');
        return data;
    },
    /** Sets the name shown for the user; at most 100 characters, blank clears it. */
    async updateProfile(req: { displayName: string | null }): Promise<UserProfileResponse> {
        const { data } = await napiHttpHandler.put<UserProfileResponse>('/api/v1/aiot/users/me', req);
        return data;
    },
    /** The user's phone contact. 404 when no enabled phone contact exists. */
    async getPhone(): Promise<UserPhoneResponse> {
        const { data } = await napiHttpHandler.get<UserPhoneResponse>(
            '/api/v1/aiot/users/me/contact-methods/phone',
        );
        return data;
    },
    /** Creates or replaces the user's phone contact. 400 when not E.164. A new number is unverified. */
    async setPhone(req: UserPhoneRequest): Promise<UserPhoneResponse> {
        const { data } = await napiHttpHandler.put<UserPhoneResponse>(
            '/api/v1/aiot/users/me/contact-methods/phone',
            req,
        );
        return data;
    },
    /** Texts a six-digit code to the saved phone; good for two minutes. */
    async sendPhoneVerification(): Promise<PhoneVerificationResponse> {
        const { data } = await napiHttpHandler.post<PhoneVerificationResponse>(
            '/api/v1/aiot/users/me/contact-methods/phone/verification',
        );
        return data;
    },
    /** Checks the code; a right one marks the phone verified. */
    async confirmPhoneVerification(code: string): Promise<UserPhoneResponse> {
        const { data } = await napiHttpHandler.post<UserPhoneResponse>(
            '/api/v1/aiot/users/me/contact-methods/phone/verification/confirm',
            { code },
        );
        return data;
    },
};
