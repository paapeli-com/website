import { useMemo } from "react";
import { useGetWorkspaceAlarmsQuery, type WorkspaceAlarmItem } from "@paapeli/api";
import { useActiveWorkspaceId } from "@paapeli/brand/workspace";
import { queryLoad } from "@/shared/hooks/usePageLoad";
import { PRODUCT_KEY } from "@/features/track/lib/product";
import { alarmStateOf, isUnacknowledged, type AlarmState } from "@/shared/lib/alarmStatus";

/* The alarms of every tracker in the active workspace, straight from
 * GET /api/v1/aiot/alarms/{workspaceId}/gpsTracking — the same list and cache
 * key the factory alerts use, so ack/clear refresh every reader at once.
 *
 * States come from the panel-wide reading in shared/lib/alarmStatus. An
 * unacknowledged alarm is what this feature calls "unread". */

export type { AlarmState };

export type TrackerAlarm = WorkspaceAlarmItem & {
  state: AlarmState;
  /** Not yet acknowledged — drives the unread badge and "Mark all read". */
  unread: boolean;
};

const toAlarm = (a: WorkspaceAlarmItem): TrackerAlarm => ({
  ...a,
  state: alarmStateOf(a.status),
  unread: isUnacknowledged(a.status),
});

export function useTrackerAlarms() {
  // null until the shell has picked a workspace, which keeps the query disabled.
  const workspaceId = useActiveWorkspaceId();
  const query = useGetWorkspaceAlarmsQuery(workspaceId ?? "", PRODUCT_KEY);

  const alarms = useMemo(
    () =>
      (query.data ?? [])
        .map(toAlarm)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [query.data],
  );

  return {
    workspaceId,
    alarms,
    unread: alarms.filter((a) => a.unread).length,
    load: queryLoad(query),
    noWorkspace: !workspaceId,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
