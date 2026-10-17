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

/* Contact methods owned by the signed-in user (/users/me/contact-methods). */
export const usersService = {
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
