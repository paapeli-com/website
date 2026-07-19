import { useMutation } from '@tanstack/react-query';
import { deviceRpcService, DeviceRpcRequest } from './deviceRpc';

export function useSendDeviceRpcMutation() {
    return useMutation({
        mutationKey: ['sendDeviceRpc'],
        mutationFn: (req: DeviceRpcRequest) => deviceRpcService.send(req),
    });
}
