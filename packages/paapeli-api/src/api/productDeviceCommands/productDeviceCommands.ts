import napiHttpHandler from '../napiHttpHandler';
import { PaapeliMessage } from '../type';

/** A JSON Schema document describing a command's accepted parameters. */
export type CommandParameterSchema = Record<string, unknown>;

/**
 * The catalog entry as read back. Dispatch settings (`dispatchMethod`,
 * `oneWay`, `queueIfOffline`, `timeoutMs`, `retries`) are write-only: they
 * configure the transport and are not returned.
 */
export interface PaapeliProductDeviceCommand {
    productKey: string;
    deviceType: string;
    /** Stable command key sent when dispatching to a device. */
    commandKey: string;
    label: string;
    description?: string;
    parameterSchema?: CommandParameterSchema;
    /** Whether the command may currently be dispatched. */
    enabled: boolean;
}

export interface CreateProductDeviceCommandRequest {
    commandKey: string;
    label: string;
    description?: string;
    /** Internal method used by the device transport. */
    dispatchMethod: string;
    parameterSchema: CommandParameterSchema;
    /** Defaults to true server-side. */
    oneWay?: boolean;
    /** Defaults to false server-side. */
    queueIfOffline?: boolean;
    /** Dispatch timeout in ms, 1–300000. Defaults to 10000. */
    timeoutMs?: number;
    /** Maximum dispatch retries, 0–10. Defaults to 3. */
    retries?: number;
    /** Defaults to true server-side. */
    enabled?: boolean;
}

/** The `commandKey` is immutable, so it is a path parameter, not a field. */
export interface UpdateProductDeviceCommandRequest {
    label: string;
    description?: string;
    dispatchMethod: string;
    parameterSchema: CommandParameterSchema;
    oneWay: boolean;
    queueIfOffline: boolean;
    timeoutMs: number;
    retries: number;
    enabled: boolean;
}

export const productDeviceCommandsService = {
    async getProductDeviceCommands(
        productKey: string,
        deviceType: string,
    ): Promise<PaapeliProductDeviceCommand[]> {
        const { data } = await napiHttpHandler.get<{
            data: PaapeliProductDeviceCommand[];
        }>(
            `/api/v1/aiot/products/${productKey}/device-types/${deviceType}/commands`,
        );
        return data.data;
    },
    async createProductDeviceCommand(
        productKey: string,
        deviceType: string,
        req: CreateProductDeviceCommandRequest,
    ): Promise<PaapeliProductDeviceCommand> {
        const { data } = await napiHttpHandler.post<PaapeliProductDeviceCommand>(
            `/api/v1/aiot/products/${productKey}/device-types/${deviceType}/commands`,
            req,
        );
        return data;
    },
    async editProductDeviceCommand(
        productKey: string,
        deviceType: string,
        commandKey: string,
        req: UpdateProductDeviceCommandRequest,
    ): Promise<PaapeliProductDeviceCommand> {
        const { data } = await napiHttpHandler.put<PaapeliProductDeviceCommand>(
            `/api/v1/aiot/products/${productKey}/device-types/${deviceType}/commands/${commandKey}`,
            req,
        );
        return data;
    },
    async deleteProductDeviceCommand(
        productKey: string,
        deviceType: string,
        commandKey: string,
    ): Promise<PaapeliMessage> {
        const { data } = await napiHttpHandler.del<PaapeliMessage>(
            `/api/v1/aiot/products/${productKey}/device-types/${deviceType}/commands/${commandKey}`,
        );
        return data;
    },
};
