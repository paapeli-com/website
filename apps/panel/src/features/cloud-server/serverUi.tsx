import { Lock } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useT } from "./i18n";
import { serverPhase, type ServerPhase, type ServerRecord, type ServerTask, CREATING_MS } from "./lib/serverStore";
import { GPU_SERVERS_PATH, ProgressStatus, SERVERS_PATH } from "./ui";

/* How a server's state reads, the same in the server list and on the
 * server's own page: its phase as a dot and a word, or the work under way as
 * a progress bar. */

/** A server's own page, under Cloud Server or GPU Servers. */
export const serverPath = (s: Pick<ServerRecord, "id" | "kind">) => `${s.kind === "gpu" ? GPU_SERVERS_PATH : SERVERS_PATH}/${s.id}`;

export function useServerText() {
  const t = useT();
  const phase: Record<ServerPhase, string> = {
    creating: t("Creating"),
    busy: t("Working"),
    verifyResize: t("Waiting for confirmation"),
    rescue: t("Rescue mode"),
    shelved: t("Shelved"),
    running: t("Running"),
    stopped: t("Powered off"),
  };
  const task: Record<ServerTask, string> = {
    powerOn: t("Powering on"),
    powerOff: t("Shutting down"),
    reboot: t("Rebooting"),
    hardReboot: t("Rebooting"),
    shelve: t("Shelving"),
    unshelve: t("Unshelving"),
    resize: t("Changing plan"),
    revertResize: t("Reverting plan change"),
    rebuild: t("Rebuilding"),
    rescue: t("Starting rescue"),
    unrescue: t("Ending rescue"),
    restore: t("Restoring"),
  };
  return { phase, task };
}

const TONE: Record<ServerPhase, string> = {
  creating: "bg-sky-500",
  busy: "bg-sky-500",
  verifyResize: "bg-amber-500",
  rescue: "bg-amber-500",
  shelved: "bg-muted-foreground/50",
  running: "bg-emerald-500",
  stopped: "bg-muted-foreground/50",
};

/** The status cell: progress while something is under way, else a dot. */
export function ServerState({ server, now, className }: { server: ServerRecord; now: number; className?: string }) {
  const text = useServerText();
  const phase = serverPhase(server, now);
  if (phase === "creating") return <ProgressStatus label={text.phase.creating} startedAt={server.createdAt} durationMs={CREATING_MS} now={now} />;
  if (phase === "busy" && server.task)
    return (
      <ProgressStatus
        label={text.task[server.task.kind]}
        startedAt={server.task.startedAt}
        durationMs={server.task.until - server.task.startedAt}
        now={now}
        tone={server.task.kind === "rebuild" || server.task.kind === "restore" ? "amber" : "sky"}
      />
    );
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <span className={cn("h-2 w-2 shrink-0 rounded-full", TONE[phase])} />
      {text.phase[phase]}
      {server.locked && <Lock className="size-3.5 text-muted-foreground" aria-hidden />}
    </span>
  );
}
