/* One reading of an alarm's status for the whole panel. The gateway passes
   ThingsBoard's statuses through: ACTIVE_UNACK, ACTIVE_ACK, CLEARED_UNACK,
   CLEARED_ACK. Every page sorts them into the same three states, so an alarm
   reads the same on the Alarms list, a device's tab, the overviews and the
   tracker.
 *
 * A cleared alarm is cleared whether or not anyone acknowledged it first, and
 * anything unrecognised counts as active rather than disappearing. */

export type AlarmState = "active" | "acknowledged" | "cleared";

export const alarmStateOf = (status: string | null | undefined): AlarmState => {
  const v = (status ?? "").toUpperCase();
  if (v.startsWith("CLEARED")) return "cleared";
  if (v.endsWith("_ACK") || v === "ACKNOWLEDGED") return "acknowledged";
  return "active";
};

/** Still waiting on someone: neither acknowledged nor cleared. */
export const needsAttention = (status: string | null | undefined) =>
  alarmStateOf(status) === "active";

/** Nobody has acknowledged it yet, cleared or not. */
export const isUnacknowledged = (status: string | null | undefined) =>
  (status ?? "").toUpperCase().endsWith("_UNACK");
