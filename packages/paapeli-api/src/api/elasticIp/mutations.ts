import { useMutation } from '@tanstack/vue-query';
import { AssociateElasticIP, CreateElasticIP, DisassociateElasticIP, elasticIpService } from './elasticip';

export function useCreateElasticIpMutation() {
    // const queryClient = useQueryClient()
    return useMutation({
        mutationKey: ['createElasticIp'],
        mutationFn: (req: CreateElasticIP) => elasticIpService.create(req),
        onSettled() {
            // setTimeout(() => {
            //   return queryClient.invalidateQueries({
            //     queryKey: ['sinks']
            //   })
            // }, 500)
        },
    });
}
export function useAssociateElasticIpMutation() {
    // const queryClient = useQueryClient()
    return useMutation({
        mutationKey: ['associateIp'],
        mutationFn: (req: AssociateElasticIP) => elasticIpService.associate(req),
        onSettled() {
            // setTimeout(() => {
            //   return queryClient.invalidateQueries({
            //     queryKey: ['sinks']
            //   })
            // }, 500)
        },
    });
}
export function useDisassociatelasticIpMutation() {
    // const queryClient = useQueryClient()
    return useMutation({
        mutationKey: ['disassociate'],
        mutationFn: (req: DisassociateElasticIP) => elasticIpService.disassociate(req),
        onSettled() {
            // setTimeout(() => {
            //   return queryClient.invalidateQueries({
            //     queryKey: ['sinks']
            //   })
            // }, 500)
        },
    });
}

export function useReleaseElasticIpMutation() {
    // const queryClient = useQueryClient()
    return useMutation({
        mutationKey: ['releaseElasticIp'],
        mutationFn: (allocationId: string) =>
            elasticIpService.delete(allocationId),
        onSettled() {
            // setTimeout(() => {
            //   return queryClient.invalidateQueries({
            //     queryKey: ['sinks']
            //   })
            // }, 500)
        },
    });
}
