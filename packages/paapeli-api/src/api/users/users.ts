import napiHttpHandler from '../napiHttpHandler';

/** E.164, leading + included — the format the API validates against. */
export const E164_PHONE_PATTERN = /^\+[1-9][0-9]{7,14}$/;

export interface UserPhoneRequest {
    /** E.164, e.g. "+989121234567". */
    phone: string;
}

export interface UserPhoneResponse {
    phone: string;
    enabled: boolean;
    /** ISO date-time. */
    updatedAt: string;
}

/* Contact methods owned by the signed-in user (/users/me/contact-methods). */
export const usersService = {
    /** The user's phone contact. 404 when no enabled phone contact exists. */
    async getPhone(): Promise<UserPhoneResponse> {
        const { data } = await napiHttpHandler.get<UserPhoneResponse>(
            '/api/v1/aiot/users/me/contact-methods/phone',
        );
        return data;
    },
    /** Creates or replaces the user's phone contact. 400 when not E.164. */
    async setPhone(req: UserPhoneRequest): Promise<UserPhoneResponse> {
        const { data } = await napiHttpHandler.put<UserPhoneResponse>(
            '/api/v1/aiot/users/me/contact-methods/phone',
            req,
        );
        return data;
    },
};
