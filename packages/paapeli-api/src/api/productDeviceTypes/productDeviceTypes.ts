import napiHttpHandler from '../napiHttpHandler';
import { PaapeliMessage } from '../type';

export interface PaapeliProductDeviceType {
    /** Product key this device type belongs to. */
    productKey: string;
    /** Stable device type key used when registering devices. */
    deviceType: string;
    /** Human-readable label for the device type. */
    label: string;
    description?: string;
    /** Whether this type may be selected for new devices. */
    enabled: boolean;
}

export interface CreateProductDeviceTypeRequest {
    deviceType: string;
    label: string;
    description?: string;
    /**
     * Internal provisioning profile used when registering devices of this
     * type. Set by the platform, not exposed on the read model.
     */
    deviceProfileName: string;
    /** Defaults to true server-side. */
    enabled?: boolean;
}

/** The `deviceType` key is immutable, so it is a path parameter, not a field. */
export interface UpdateProductDeviceTypeRequest {
    label: string;
    description?: string;
    enabled: boolean;
}

export const productDeviceTypesService = {
    async getProductDeviceTypes(
        productKey: string,
    ): Promise<PaapeliProductDeviceType[]> {
        const { data } = await napiHttpHandler.get<{
            data: PaapeliProductDeviceType[];
        }>(`/api/v1/aiot/products/${productKey}/device-types`);
        return data.data;
    },
    async createProductDeviceType(
        productKey: string,
        req: CreateProductDeviceTypeRequest,
    ): Promise<PaapeliProductDeviceType> {
        const { data } = await napiHttpHandler.post<PaapeliProductDeviceType>(
            `/api/v1/aiot/products/${productKey}/device-types`,
            req,
        );
        return data;
    },
    async editProductDeviceType(
        productKey: string,
        deviceType: string,
        req: UpdateProductDeviceTypeRequest,
    ): Promise<PaapeliProductDeviceType> {
        const { data } = await napiHttpHandler.put<PaapeliProductDeviceType>(
            `/api/v1/aiot/products/${productKey}/device-types/${deviceType}`,
            req,
        );
        return data;
    },
    async deleteProductDeviceType(
        productKey: string,
        deviceType: string,
    ): Promise<PaapeliMessage> {
        const { data } = await napiHttpHandler.del<PaapeliMessage>(
            `/api/v1/aiot/products/${productKey}/device-types/${deviceType}`,
        );
        return data;
    },
};
