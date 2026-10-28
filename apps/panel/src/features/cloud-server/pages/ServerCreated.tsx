import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  Camera,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  HardDrive,
  Loader2,
  Microchip,
  Repeat,
  Server,
  ShieldCheck,
  Split,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/features/factory/components/ui/button";
import { Card } from "@/features/factory/components/ui/card";
import { Skeleton } from "@/features/factory/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/factory/components/ui/table";
import { cn } from "@/shared/lib/utils";
import { CLOUD_SERVER_BASE } from "@/shell/nav/cloudServerNav";
import { useT } from "../i18n";
import type { CreatedServer } from "../lib/quickCreate";
import {
  CREATE_GPU_SERVER_PATH,
  CREATE_SERVER_PATH,
  CreateHeader,
  CreatePage,
  GPU_SERVERS_PATH,
  NEW_SERVER_PATH,
  SERVERS_PATH,
  CopyButton, TruncatedText,
} from "../ui";

/* The page a create lands on: the server while it is being built, then the
 * way into it.
 *
 * The addresses and the password fill in as the server comes up, each cell
 * holding a loading bar until its value exists, so the page is useful the
 * moment it opens and needs no refresh. Below it, the other things a server
 * usually wants next, each a door into its own section.
 *
 * There is no provisioning backend yet, so the arrival of each value is timed
 * here. When the endpoint exists, these timers become its polling.
 */

type Phase = "creating" | "ready";

/** When each value turns up, in ms after the page opens. */
const ARRIVALS = { ipv4: 2500, ipv6: 3500, password: 4500, ready: 6000 };

const NEXT_STEPS: { icon: LucideIcon; title: string; description: string; path: string; tone: string }[] = [
  {
    icon: HardDrive,
    title: "Cloud Disks",
    description: "More space for data, databases and backups.",
    path: "/volumes",
    tone: "bg-sky-500/10 text-sky-600",
  },
  {
    icon: Camera,
    title: "Snapshots",
    description: "A point-in-time copy to roll back to or clone from.",
    path: "/snapshots",
    tone: "bg-violet-500/10 text-violet-600",
  },
  {
    icon: ShieldCheck,
    title: "Firewall",
    description: "Choose exactly which traffic can reach the server.",
    path: "/security-groups",
    tone: "bg-emerald-500/10 text-emerald-600",
  },
  {
    icon: Repeat,
    title: "Floating IPs",
    description: "A fixed address you can move between servers.",
    path: "/floating-ips",
    tone: "bg-primary/10 text-primary",
  },
  {
    icon: Split,
    title: "Load Balancer",
    description: "Spread traffic across several servers.",
    path: "/load-balancers",
    tone: "bg-sky-500/10 text-sky-600",
  },
  {
    icon: Activity,
    title: "Resource Monitoring",
    description: "CPU, memory, disk and network over time.",
    path: "/monitoring",
    tone: "bg-violet-500/10 text-violet-600",
  },
];

function useArrived(ms: number) {
  const [arrived, setArrived] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setArrived(true), ms);
    return () => window.clearTimeout(timer);
  }, [ms]);
  return arrived;
}


export default function ServerCreated() {
  const location = useLocation();
  const server = location.state as CreatedServer | null;
  /* Opened without coming from the wizard (a refresh, a pasted link): there
     is nothing to show, so go to the servers page. */
  if (!server?.name) return <Navigate to={SERVERS_PATH} replace />;
  return <Created server={server} />;
}

function Created({ server }: { server: CreatedServer }) {
  const t = useT();
  const isGpu = server.kind === "gpu";
  const navigate = useNavigate();

  const ipv4 = useArrived(ARRIVALS.ipv4);
  const ipv6 = useArrived(ARRIVALS.ipv6);
  const secret = useArrived(ARRIVALS.password);
  const ready = useArrived(ARRIVALS.ready);
  const phase: Phase = ready ? "ready" : "creating";
  const [showPassword, setShowPassword] = useState(false);


  return (
    <CreatePage>
      <CreateHeader
        gpu={isGpu}
        title={server.name}
        description={
          phase === "ready"
            ? t("The server is ready. Use the details below to connect to it.")
            : t("The server is being created. Its addresses and access appear here as soon as they are ready.")
        }
      />

      <div className="space-y-6">
        <Card className="p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Server className="size-[18px]" />
              </span>
              <h2 className="text-base font-semibold text-foreground">{t("Server details")}</h2>
            </div>
            <StatusBadge phase={phase} powerOn={server.powerOn} />
          </div>

          {/* The device list's table treatment. Fixed columns, so a value
              changing width (the password shown or hidden, an address
              arriving) never shifts the others; on a narrow screen the table
              scrolls sideways instead of squeezing, and anything cut short
              shows in full on hover. */}
          <div className="overflow-hidden rounded-lg border text-sm [&_td]:p-3 [&_td]:text-sm [&_th]:h-10 [&_th]:text-xs">
            <Table className="min-w-[820px] table-fixed">
              <colgroup>
                <col className="w-[26%]" />
                <col className="w-[17%]" />
                <col className="w-[21%]" />
                <col className="w-[13%]" />
                <col className="w-[23%]" />
              </colgroup>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>{t("Server")}</TableHead>
                  <TableHead>{t("IPv4 address")}</TableHead>
                  <TableHead>{t("IPv6 address")}</TableHead>
                  <TableHead>{t("Username")}</TableHead>
                  <TableHead>{t("Access")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-transparent">
                  <TableCell>
                    <TruncatedText text={server.name} ltr className="font-medium text-foreground" />
                    <TruncatedText text={`${server.image} · ${server.spec}`} ltr className="text-xs text-muted-foreground" />
                  </TableCell>
                  <TableCell>
                    <Pending ready={ipv4}>
                      <CopyValue value={server.ipv4Address} />
                    </Pending>
                  </TableCell>
                  <TableCell>
                    {server.ipv6 ? (
                      <Pending ready={ipv6}>
                        <CopyValue value={server.ipv6Address} />
                      </Pending>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <CopyValue value={server.username ?? "root"} />
                  </TableCell>
                  <TableCell>
                    {server.access === "password" && server.password ? (
                      <Pending ready={secret}>
                        <div className="flex min-w-0 items-center gap-1">
                          {/* As many dots as characters, so showing it does not
                              change its width. */}
                          <TruncatedText
                            text={showPassword ? server.password : "•".repeat(server.password.length)}
                            ltr
                            mono
                            className="text-foreground"
                          />
                          <IconButton
                            label={showPassword ? t("Hide password") : t("Show password")}
                            onClick={() => setShowPassword((s) => !s)}
                          >
                            {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                          </IconButton>
                          <CopyButton text={server.password!} />
                        </div>
                      </Pending>
                    ) : (
                      <TruncatedText text={`${t("SSH key")} (${server.sshKeyName ?? ""})`} className="text-foreground" />
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {server.access === "password" && (
            <p className="mt-3 text-xs text-muted-foreground">
              {t("Keep the password somewhere safe. You can reset it later from the server's page.")}
            </p>
          )}

          {/* For a GPU server, the one check worth doing first. */}
          {isGpu && (
            <div className="mt-3 flex items-start gap-2.5 rounded-lg bg-muted/50 px-3.5 py-2.5 text-xs text-muted-foreground">
              <Microchip className="mt-px size-4 shrink-0" />
              <span>
                {server.osFamily === "windows" ? (
                  t("Once it is running, the GPU appears in Device Manager under Display adapters.")
                ) : (
                  /* One sentence split where {cmd} falls: the command sits in
                     a different place in each language. */
                  t("Once it is running, sign in and run {cmd} to see the GPU.")
                    .split("{cmd}")
                    .map((part, i) =>
                      i === 0 ? (
                        <span key={i}>{part}</span>
                      ) : (
                        <span key={i}>
                          <code dir="ltr" className="rounded bg-background px-1.5 py-0.5 font-mono text-foreground">
                            nvidia-smi
                          </code>
                          {part}
                        </span>
                      ),
                    )
                )}
              </span>
            </div>
          )}

          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={() => navigate(isGpu ? CREATE_GPU_SERVER_PATH : CREATE_SERVER_PATH)}>
              {t("Create another server")}
            </Button>
            <Button
              onClick={() => navigate(isGpu ? GPU_SERVERS_PATH : SERVERS_PATH)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t("Go to servers")}
            </Button>
          </div>
        </Card>

        <section>
          <h2 className="text-base font-semibold text-foreground">{t("Set up more for your server")}</h2>
          <p className="mb-3 mt-1 text-sm text-muted-foreground">
            {t("You can add these while the server is being created, or come back to them later.")}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {NEXT_STEPS.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(`${CLOUD_SERVER_BASE}${item.path}`)}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-start shadow-sm outline-none transition-colors hover:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", item.tone)}>
                  <item.icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">{t(item.title)}</span>
                  <span className="block text-xs text-muted-foreground">{t(item.description)}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </CreatePage>
  );
}

function StatusBadge({ phase, powerOn }: { phase: Phase; powerOn: boolean }) {
  const t = useT();
  if (phase === "creating") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-500/10 px-2 py-1 text-xs font-medium text-sky-700 dark:text-sky-400">
        <Loader2 className="size-3.5 animate-spin" />
        {t("Creating")}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
        powerOn ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground",
      )}
    >
      <CheckCircle2 className="size-3.5" />
      {powerOn ? t("Running") : t("Powered off")}
    </span>
  );
}

/** A loading bar until the value exists. */
function Pending({ ready, children }: { ready: boolean; children: ReactNode }) {
  return ready ? <>{children}</> : <Skeleton className="h-4 w-28" />;
}

function CopyValue({ value }: { value: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1">
      <TruncatedText text={value} ltr className="text-foreground" />
      <CopyButton text={value} />
    </span>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}
