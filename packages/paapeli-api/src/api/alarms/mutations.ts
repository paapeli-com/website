import { useMutation, useQueryClient } from '@tanstack/react-query';
import { alarmService, AlarmEscalationChainRequest, CreateAlarmRuleRequest } from './alarms';

export function useDeleteEscalationChainMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['deleteEscalationChain'],
        mutationFn: ({
            workspaceId,
            productKey,
            alarmRuleId,
        }: {
            workspaceId: string;
            productKey: string;
            alarmRuleId: string;
        }) => alarmService.deleteEscalationChain(workspaceId, productKey, alarmRuleId),
        onSuccess: (_data, { workspaceId, productKey, alarmRuleId }) => {
            queryClient.invalidateQueries({ queryKey: ['escalationChain', workspaceId, productKey, alarmRuleId] });
        },
    });
}

export function usePutEscalationChainMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['putEscalationChain'],
        mutationFn: ({
            workspaceId,
            productKey,
            alarmRuleId,
            ...req
        }: AlarmEscalationChainRequest & { workspaceId: string; productKey: string; alarmRuleId: string }) =>
            alarmService.putEscalationChain(workspaceId, productKey, alarmRuleId, req),
        onSuccess: (_data, { workspaceId, productKey, alarmRuleId }) => {
            queryClient.invalidateQueries({ queryKey: ['escalationChain', workspaceId, productKey, alarmRuleId] });
        },
    });
}

export function useAckAlarmMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['ackAlarm'],
        mutationFn: ({
            workspaceId,
            productKey,
            alarmId,
            deviceId,
        }: {
            workspaceId: string;
            productKey: string;
            alarmId: string;
            deviceId: string;
        }) => alarmService.ackAlarm(workspaceId, productKey, alarmId, deviceId),
        onSuccess: (_data, { workspaceId, productKey, deviceId }) => {
            queryClient.invalidateQueries({ queryKey: ['deviceAlarms', workspaceId, productKey, deviceId] });
            queryClient.invalidateQueries({ queryKey: ['workspaceAlarms', workspaceId, productKey] });
            queryClient.invalidateQueries({ queryKey: ['alarmAnalytics', workspaceId, productKey] });
        },
    });
}

export function useClearAlarmMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['clearAlarm'],
        mutationFn: ({
            workspaceId,
            productKey,
            alarmId,
            deviceId,
        }: {
            workspaceId: string;
            productKey: string;
            alarmId: string;
            deviceId: string;
        }) => alarmService.clearAlarm(workspaceId, productKey, alarmId, deviceId),
        onSuccess: (_data, { workspaceId, productKey, deviceId }) => {
            queryClient.invalidateQueries({ queryKey: ['deviceAlarms', workspaceId, productKey, deviceId] });
            queryClient.invalidateQueries({ queryKey: ['workspaceAlarms', workspaceId, productKey] });
            queryClient.invalidateQueries({ queryKey: ['alarmAnalytics', workspaceId, productKey] });
        },
    });
}

export function useCreateAlarmRuleMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['createAlarmRule'],
        mutationFn: ({
            workspaceId,
            productKey,
            deviceId,
            ...req
        }: CreateAlarmRuleRequest & { workspaceId: string; productKey: string; deviceId: string }) =>
            alarmService.createAlarmRule(workspaceId, productKey, deviceId, req),
        onSuccess: (_data, { workspaceId, productKey }) => {
            // Prefix match: refreshes both the per-device and the workspace lists.
            queryClient.invalidateQueries({ queryKey: ['alarmRules', workspaceId, productKey] });
        },
    });
}

export function useDeleteAlarmRuleMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ['deleteAlarmRule'],
        mutationFn: ({
            workspaceId,
            productKey,
            alarmRuleId,
            deviceId,
        }: {
            workspaceId: string;
            productKey: string;
            alarmRuleId: string;
            deviceId: string;
        }) => alarmService.deleteAlarmRule(workspaceId, productKey, alarmRuleId, deviceId),
        onSuccess: (_data, { workspaceId, productKey }) => {
            // Prefix match: refreshes both the per-device and the workspace lists.
            queryClient.invalidateQueries({ queryKey: ['alarmRules', workspaceId, productKey] });
        },
    });
}
