import { useState } from "react";
import { useAckAlarmMutation, useClearAlarmMutation } from "@paapeli/api";

export type AlarmAction = "ack" | "clear";

/* Acknowledge and clear, the same way from every page that offers them:
   POST /alarms/{ws}/{pk}/{ack|clear}/{alarmId}/device/{deviceId}. Both
   mutations invalidate the workspace and device alarm lists, so every reader
   updates from the server rather than being patched locally.
 *
 * `busyId` is the alarm with a request in flight, so only that row's buttons
 * wait. Errors are thrown back to the caller, which owns the toast and its
 * wording. */
export function useAlarmActions(workspaceId: string | null | undefined, productKey: string) {
  const ack = useAckAlarmMutation();
  const clear = useClearAlarmMutation();
  const [busyId, setBusyId] = useState<string | null>(null);

  const run = async (action: AlarmAction, alarmId: string, deviceId: string) => {
    if (!workspaceId) throw new Error("No workspace selected");
    setBusyId(alarmId);
    try {
      await (action === "ack" ? ack : clear).mutateAsync({ workspaceId, productKey, alarmId, deviceId });
    } finally {
      setBusyId(null);
    }
  };

  return { run, busyId };
}
