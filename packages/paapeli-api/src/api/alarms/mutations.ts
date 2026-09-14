import { useMutation, useQueryClient } from '@tanstack/react-query';
import { alarmService, CreateAlarmRuleRequest } from './alarms';

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
